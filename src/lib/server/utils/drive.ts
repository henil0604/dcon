import { getGoogleAuth } from '$lib/server/utils/getGoogleAuth';
import { google } from 'googleapis';
import { getUserRefreshToken } from '$lib/server/utils/getUserRefreshToken';
import fs from 'node:fs';
import progress_stream from 'progress-stream';
import { RESPONSE_CODES } from '$lib/const/http';
import { createResponse } from '$lib/server/utils/createResponse';
import { DRIVE_UPLOAD_DIRECTORY_NAME } from '$lib/const/drive';
import { chunkString } from '$lib/utils/chunkString';
import { saveToLocalUploadDirectory } from './saveToLocalUploadDirectory';
import { throttleAll } from 'promise-throttle-all';
import { ascii } from '$lib/utils/ascii';

export interface CreateRawFileOptions {
	path: string;
	name: string;
	parentDirectoryId?: string;
	mimeType?: string;
	onProgress?: (progress: progress_stream.Progress) => Promise<any> | any;
}

export interface ChunkEntity {
	id: string;
	index: number;
	size: number;
	path: string;
	data: Uint8Array;
}

export interface CreateFileOptions {
	path: string;
	name: string;
	maxChunkSize?: number;
	onProgress?: (
		progress: progress_stream.Progress & {
			chunk: ChunkEntity;
			totalChunks: number;
		}
	) => Promise<any> | any;
	onChunking?: (data: {
		totalChunks: number;
		size: number;
		chunks: ChunkEntity[];
	}) => Promise<any> | any;
	onChunkEvent?: (data: {
		event: 'START_UPLOADING' | 'END_UPLOADING';
		chunkIndex: number;
		data?: {
			[key: string]: any;
		};
	}) => Promise<any> | any;
}

export interface CreateDirectoryOptions {
	name: string;
	parentDirectoryId?: string;
}

export class Drive {
	public userId: string;
	private refreshToken?: string;
	private auth?: ReturnType<typeof getGoogleAuth>;
	private drive?: ReturnType<(typeof google)['drive']>;

	constructor(userId: string) {
		this.userId = userId;
	}

	public async getRootDirectoryId() {
		const list = await this.drive!.files.list({
			q: `'root' in parents and name='${DRIVE_UPLOAD_DIRECTORY_NAME}' and trashed=false`
		});

		if (!list.data.files || list.data.files?.length === 0) {
			return await this.createDirectory({
				name: DRIVE_UPLOAD_DIRECTORY_NAME
			});
		}

		if (list.data.files.length > 1) {
			for (const entity of [...list.data.files].slice(1)) {
				if (!entity.id) continue;
				await this.drive!.files.delete({
					fileId: entity.id
				});
			}
		}

		return list.data.files[0].id!;
	}

	public async createDirectory(options: CreateDirectoryOptions) {
		const createResponse = await this.drive!.files.create({
			requestBody: {
				mimeType: 'application/vnd.google-apps.folder',
				name: options.name,
				parents: options.parentDirectoryId ? [options.parentDirectoryId] : []
			}
		});
		return createResponse.data.id!;
	}

	public async createRawFile(options: CreateRawFileOptions) {
		await this.init();

		options.mimeType = options.mimeType || 'application/octet-stream';
		const fileStream = fs.createReadStream(options.path);
		const fileStat = fs.statSync(options.path);

		let progressStream = progress_stream({
			length: fileStat.size,
			time: 100
		});

		progressStream.on('progress', async function (progress) {
			await options.onProgress?.(progress);
		});

		const readStream = fileStream.pipe(progressStream);

		const uploadResponse = await this.drive!.files.create({
			requestBody: {
				name: options.name,
				mimeType: options.mimeType,
				parents: options.parentDirectoryId ? [options.parentDirectoryId] : []
			},
			media: {
				body: readStream,
				mimeType: options.mimeType
			}
		});

		if (uploadResponse.status !== 200) {
			return createResponse(true, RESPONSE_CODES.UPLOAD_FAILED, 'API returned non 200 code', {
				response: uploadResponse
			});
		}

		return createResponse(false, RESPONSE_CODES.OK, 'Upload Successful', {
			driveId: uploadResponse.data.id!,
			kind: uploadResponse.data.kind!,
			name: uploadResponse.data.name!
		});
	}

	public async createFile(options: CreateFileOptions) {
		const rootDirectoryId = await this.getRootDirectoryId();
		const parentDirectoryId = await this.createDirectory({
			name: options.name,
			parentDirectoryId: rootDirectoryId
		});

		const fileData = await fs.promises.readFile(options.path, {
			encoding: 'utf8'
		});

		options.maxChunkSize = options.maxChunkSize || 1024 * 1024 * 1; // 10 MB

		const rawChunks = chunkString(fileData, options.maxChunkSize);

		const chunks = await Promise.all(
			rawChunks.map(async (chunk, index) => {
				const id = crypto.randomUUID();
				const file = new File([chunk], id);

				const path = await saveToLocalUploadDirectory(id, file);

				return {
					index,
					data: ascii.encode(chunk),
					size: chunk.length,
					id,
					path
				};
			})
		);

		await options.onChunking?.({
			totalChunks: chunks.length,
			size: fileData.length,
			chunks: chunks
		});

		const promisePool = chunks.map((chunk) => {
			return async () => {
				await options.onChunkEvent?.({
					chunkIndex: chunk.index,
					event: 'START_UPLOADING'
				});

				const chunkUploadResponse = await this.createRawFile({
					name: chunk.id,
					path: chunk.path,
					parentDirectoryId: parentDirectoryId,
					onProgress: (progress) => {
						options.onProgress?.({
							...progress,
							chunk,
							totalChunks: chunks.length
						});
					}
				});

				if (!chunkUploadResponse.data || 'driveId' in chunkUploadResponse.data === false) {
					return {
						error: true,
						code: chunkUploadResponse.code,
						info: chunk
					};
				}

				await options.onChunkEvent?.({
					chunkIndex: chunk.index,
					event: 'END_UPLOADING'
				});

				return {
					error: chunkUploadResponse.error,
					code: chunkUploadResponse.code,
					driveId: chunkUploadResponse.data?.driveId || null,
					info: chunk
				};
			};
		});

		const uploadResponse = await throttleAll(1, promisePool);

		for (const chunk of uploadResponse) {
			await fs.promises.unlink(chunk.info.path);
		}

		return createResponse(false, RESPONSE_CODES.OK, 'Upload successful', {
			driveFolderId: parentDirectoryId,
			id: options.name,
			chunks: uploadResponse.map((chunk) => ({
				error: chunk.error,
				code: chunk.code,
				driveId: chunk.driveId,
				index: chunk.info.index,
				size: chunk.info.size,
				data: chunk.info.data,
				id: chunk.info.id
			}))
		});
	}

	public async init() {
		if (this.drive) return true;

		this.refreshToken = (await getUserRefreshToken(this.userId)) || undefined;
		if (!this.refreshToken) {
			return false;
		}
		this.auth = getGoogleAuth(this.refreshToken!);
		this.drive = google.drive({
			version: 'v3',
			auth: this.auth
		});
		return true;
	}

	public getDrive() {
		return this.drive;
	}

	public static async getInstance(userId: string) {
		const drive = new Drive(userId);
		let success = await drive.init();
		if (!success) {
			return null;
		}
		return drive;
	}
}
