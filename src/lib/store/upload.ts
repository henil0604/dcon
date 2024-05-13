import { derived, writable } from 'svelte/store';

interface FileProgress {
	status: 'WAITING' | 'UPLOADING' | 'FAILED' | 'DONE';
	percentage: number;
	bytesUploaded: number;
	totalBytes: number;
	totalChunks: number;
	chunks: {
		[key: number]: {
			status: 'WAITING' | 'UPLOADING' | 'FAILED' | 'DONE';
			index: number;
			percentage: number;
			bytesUploaded: number;
			speed: number;
			size: number;
		};
	};
}

interface QueueItem {
	file: File;
	progress: FileProgress;
}

export const uploadingFilesQueue = writable<{
	[key: string]: QueueItem;
}>({});

const createFilteredFilesStore = (status: FileProgress['status']) =>
	derived(uploadingFilesQueue, ($uploadingFilesQueue) =>
		Object.fromEntries(
			Object.entries($uploadingFilesQueue).filter(([_, item]) => item.progress.status === status)
		)
	);

export const uploadingFilesWaiting = createFilteredFilesStore('WAITING');
export const uploadingFilesInProgress = createFilteredFilesStore('UPLOADING');
export const uploadingFilesDone = createFilteredFilesStore('DONE');

export const preparingDriveUploadingFilesQueue = writable<{
	[key: string]: {
		file: File;
		progress: {
			status: 'WAITING' | 'UPLOADING' | 'FAILED' | 'DONE';
			percentage: number;
			bytesUploaded: number;
			totalBytes: number;
		};
	};
}>({});
