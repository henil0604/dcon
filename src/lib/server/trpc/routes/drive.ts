import fs from 'node:fs';
import { z } from 'zod';
import { privateProcedure, t } from '$lib/server/trpc';
import { getLocalUploadDirectoryPath } from '$lib/server/utils/getLocalUploadDirectoryPath';
import { Drive, type CreateFileOptions } from '$lib/server/utils/drive';
import { createResponse } from '$lib/server/utils/createResponse';
import { RESPONSE_CODES } from '$lib/const/http';
import store from '$lib/server/store';

export const driveRouter = t.router({
	upload: privateProcedure
		.input(
			z.object({
				fileId: z.string(),
				fileInfo: z.object({
					name: z.string(),
					mimeType: z.string().optional().default('application/octet-stream')
				}),
				parentDirectoryId: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { session, prisma } = ctx;

			const filePath = `${getLocalUploadDirectoryPath()}/${input.fileId}`;

			if (fs.existsSync(filePath) === false) {
				return createResponse(true, RESPONSE_CODES.NOT_FOUND, 'File does not exist');
			}

			const drive = await Drive.getInstance(session.user.id!);

			if (!drive) {
				return createResponse(
					true,
					RESPONSE_CODES.DRIVE_INIT_FAILED,
					'Failed to initialize drive instance'
				);
			}

			const handleOnChunking: CreateFileOptions['onChunking'] = async (data) => {
				store.set(input.fileId, {
					status: 'UPLOADING',
					percentage: 0,
					bytesUploaded: 0,
					totalBytes: data.size,
					totalChunks: data.totalChunks,
					chunks: {}
				});

				for (const chunk of data.chunks) {
					store.update(input.fileId, (store) => {
						store.chunks[chunk.index] = {
							status: 'WAITING',
							index: chunk.index,
							percentage: 0,
							bytesUploaded: 0,
							speed: 0,
							size: chunk.size
						};

						return store;
					});
				}
			};

			const handleChunkEvent: CreateFileOptions['onChunkEvent'] = async (event) => {
				// const hashId = `${input.fileId}:${event.chunkIndex}`;
				if (event.event === 'START_UPLOADING') {
					store.update(input.fileId, (store) => {
						store.chunks[event.chunkIndex].status = 'UPLOADING';
						return store;
					});
				}
				if (event.event === 'END_UPLOADING') {
					store.update(input.fileId, (store) => {
						store.chunks[event.chunkIndex].status = 'DONE';
						return store;
					});
				}
			};

			const handleFileUploadProgress: CreateFileOptions['onProgress'] = async (progress) => {
				store.update(input.fileId, (store) => {
					const deltaBytes =
						progress.transferred - store.chunks[progress.chunk.index].bytesUploaded;

					store.chunks[progress.chunk.index].percentage = progress.percentage;
					store.chunks[progress.chunk.index].speed = progress.speed;
					store.chunks[progress.chunk.index].bytesUploaded = progress.transferred;

					store.bytesUploaded += deltaBytes;
					store.percentage = (store.bytesUploaded / store.totalBytes) * 100;

					return store;
				});
			};

			const uploadResponse = await drive.createFile({
				path: filePath,
				name: input.fileId,
				// maxChunkSize: 5,
				onProgress: handleFileUploadProgress,
				onChunking: handleOnChunking,
				onChunkEvent: handleChunkEvent
			});

			if (uploadResponse.error || !uploadResponse.data) {
				store.update(input.fileId, (store) => {
					store.status = 'FAILED';
					return store;
				});
				return createResponse(true, uploadResponse.code, uploadResponse.message);
			}

			store.update(input.fileId, (store) => {
				store.status = 'DONE';
				return store;
			});

			const fileDoc = await prisma.file.create({
				data: {
					name: input.fileInfo.name,
					mimeType: input.fileInfo.mimeType,
					id: uploadResponse.data.id,
					user: {
						connect: {
							email: session.user.email!
						}
					},
					parentDirectory: input.parentDirectoryId
						? {
								connect: {
									id: input.parentDirectoryId
								}
							}
						: undefined
				}
			});

			for (const chunk of uploadResponse.data.chunks) {
				if (chunk.error || !chunk.driveId) continue;

				await prisma.fileChunk.create({
					data: {
						driveId: chunk.driveId,
						id: chunk.id,
						index: chunk.index,
						size: chunk.size,
						file: {
							connect: {
								id: fileDoc.id
							}
						}
					}
				});
			}

			return uploadResponse;
		})
});

export type DriveRouter = typeof driveRouter;
