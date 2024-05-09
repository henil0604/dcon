import fs from 'node:fs';
import { LOCAL_UPLOAD_DIRECTORY_NAME } from '$lib/const';

export function getLocalUploadDirectoryPath() {
	const path = `static/${LOCAL_UPLOAD_DIRECTORY_NAME}`;
	if (fs.existsSync(path) === false) {
		return fs.mkdirSync(path);
	}
	return path;
}
