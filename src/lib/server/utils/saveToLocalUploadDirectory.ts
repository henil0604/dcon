import { LOCAL_UPLOAD_DIRECTORY_NAME } from '$lib/const';
import fs from 'node:fs';

function getLocalUploadDirectoryPath() {
	const path = `static/${LOCAL_UPLOAD_DIRECTORY_NAME}`;
	if (fs.existsSync(path) === false) {
		return fs.mkdirSync(path);
	}
	return path;
}

export async function saveToLocalUploadDirectory(id: string, file: File) {
	const path = `${getLocalUploadDirectoryPath()}/${id}`;

	await fs.promises.writeFile(path, '');

	const fileStream = fs.createWriteStream(path);
	const reader = file.stream().getReader();

	while (true) {
		const data = await reader.read();

		if (data.done) {
			fileStream.end();
			break;
		}

		fileStream.write(data.value);
	}

	return path;
}
