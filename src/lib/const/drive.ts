import bytes from 'bytes';

export const DRIVE_UPLOAD_DIRECTORY_NAME = '_DCON';

export const DEFAULT_MAX_CHUNK_SIZE = bytes('1 MB');

export const DEFAULT_STREAM_CHUNK_SIZE = bytes('1 KB');

export const MIN_CHUNK_SIZE = bytes('100 KB');

export const CONCURRENT_CHUNK_UPLOADING = 3;

export const DRIVE_QUEUE_CONCURRENCY = 3;
