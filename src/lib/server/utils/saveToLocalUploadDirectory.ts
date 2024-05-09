import fs from 'node:fs';
import { getLocalUploadDirectoryPath } from '$lib/server/utils/getLocalUploadDirectoryPath';

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
