import { RESPONSE_CODES } from '$lib/const/http';
import type { DConResponse } from '$lib/types';
import axios, { type AxiosProgressEvent } from 'axios';
import { createResponse } from '$lib/utils/createResponse';
import { preparingDriveUploadingFilesQueue, uploadingFilesQueue } from '$lib/store/upload';
import { trpc } from '$lib/trpc/client';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import bytes from 'bytes';

// TODO: accept directoryId in API
export function handleFileUpload(file: File) {
	let fileId: string;

	async function handleFail(
		code: keyof typeof RESPONSE_CODES = RESPONSE_CODES.UNKNOWN_ERROR,
		message: string = 'Something went wrong'
	) {
		// TODO: handle fail
		return createResponse(true, code, message, null);
	}

	// TODO: accept onProgress function in API
	async function uploadFileToDCon(onProgress?: (progress: AxiosProgressEvent) => any) {
		const form = new FormData();
		form.set('file', file);

		const response = await axios.postForm<DConResponse<{ id: string }>>(`/api/upload`, form, {
			onUploadProgress(progress) {
				onProgress?.(progress);
			}
		});

		if (response.status !== 200 || response.data.code !== RESPONSE_CODES.OK) {
			return handleFail(response.data.code, response.data.message);
		}

		return createResponse(false, response.data.code, 'File Uploaded', {
			id: response.data.data.id
		});
	}

	async function uploadFileToDrive() {
		const response = await trpc().drive.upload.mutate({
			fileId,
			fileInfo: {
				name: file.name,
				mimeType: file.type
			},
			maxChunkSize: bytes.parse('100 KB')
		});

		return response;
	}

	function subscribeToFileUploadProgressSource(callbacks: {
		onProgress: (progress: any) => any;
		onOpen?: (response: Response) => any;
		onClose?: () => any;
	}) {
		let aborter = new AbortController();
		fetchEventSource(`/api/upload/progress?fileId=${fileId}`, {
			method: 'GET',
			signal: aborter.signal,
			async onopen(response) {
				callbacks.onOpen?.(response);
			},
			async onmessage(event) {
				callbacks.onProgress(JSON.parse(event.data));
			},
			onclose() {
				callbacks.onClose?.();
			}
		});

		return {
			unsubscribe() {
				aborter.abort();
			}
		};
	}

	async function start() {
		const tempId = crypto.randomUUID();

		preparingDriveUploadingFilesQueue.update((map) => {
			map[tempId] = {
				file,
				progress: {
					percentage: 0,
					status: 'WAITING',
					bytesUploaded: 0,
					totalBytes: file.size
				}
			};

			return map;
		});

		let fileToDConResponse = await uploadFileToDCon((progress) => {
			preparingDriveUploadingFilesQueue.update((map) => {
				map[tempId].progress.status = 'UPLOADING';
				map[tempId].progress.bytesUploaded = progress.loaded;
				map[tempId].progress.percentage = Math.ceil(
					Math.min(100, (progress.loaded / file.size) * 100)
				);
				return map;
			});
		});

		if (fileToDConResponse.error || !fileToDConResponse.data || !fileToDConResponse.data.id) {
			preparingDriveUploadingFilesQueue.update((map) => {
				map[tempId].progress.status = 'FAILED';
				map[tempId].progress.bytesUploaded = file.size;
				map[tempId].progress.percentage = 100;
				return map;
			});

			return fileToDConResponse;
		}

		fileId = fileToDConResponse.data.id;

		console.log(fileId);

		preparingDriveUploadingFilesQueue.update((map) => {
			delete map[tempId];
			return map;
		});

		uploadingFilesQueue.update((map) => {
			map[fileId] = {
				file,
				progress: {
					status: 'WAITING',
					bytesUploaded: 0,
					percentage: 0,
					totalBytes: file.size,
					totalChunks: 0,
					chunks: {}
				}
			};
			return map;
		});

		let { unsubscribe } = subscribeToFileUploadProgressSource({
			onProgress(progress) {
				if (progress.status === 'DONE') {
					unsubscribe();
				}

				uploadingFilesQueue.update((map) => {
					map[fileId].progress.status = progress.status;
					map[fileId].progress.percentage = Math.ceil(Math.min(100, progress.percentage));
					map[fileId].progress.bytesUploaded = progress.bytesUploaded;
					map[fileId].progress.totalBytes = progress.totalBytes;
					map[fileId].progress.totalChunks = progress.totalChunks;
					map[fileId].progress.chunks = progress.chunks;

					return map;
				});
			},
			onOpen: console.log,
			onClose: console.log
		});

		let response = await uploadFileToDrive();

		console.log('response?', response);
	}

	return {
		start
	};
}
