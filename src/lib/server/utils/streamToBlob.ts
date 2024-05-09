import type { ReadStream } from 'fs';

export function streamToBlob(stream: ReadStream): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const chunks: Uint8Array[] = [];
		stream.on('data', (chunk: Uint8Array) => {
			chunks.push(chunk);
		});
		stream.on('end', () => {
			resolve(new Blob(chunks));
		});
		stream.on('error', reject);
	});
}
