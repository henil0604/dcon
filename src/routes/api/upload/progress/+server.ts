import { RESPONSE_CODES } from '$lib/const/http.js';
import { store } from '$lib/server/global/store';
import { createResponse } from '$lib/server/utils/createResponse.js';
import { json } from '@sveltejs/kit';

const encoder = new TextEncoder();

export function GET({ url }) {
	const fileId = url.searchParams.get('fileId');

	// if file id is not there
	if (!fileId) {
		return json(createResponse(true, RESPONSE_CODES.BAD_INPUT, 'Invalid File Id'));
	}

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			let id = 0;
			// utility function
			function sendEvent(event: string, data: string) {
				controller.enqueue(encoder.encode(`id: ${id++}\nevent: ${event}\ndata: ${data}\n\n`));
			}

			// subscribe to store
			store.on('set', handle);

			// utility function
			function handleClose() {
				try {
					store.removeListener('set', handle);
					controller.close();
				} catch {}
			}

			function handle({ data, key }: { key: string; data: any }) {
				// if not fileId or not data
				if (key !== fileId || !data) return;

				try {
					// send data
					sendEvent('progress', JSON.stringify(data));
				} catch {
					// close stream
					handleClose();
				}

				// when status is done
				if (data.status === 'DONE') {
					// close stream
					handleClose();
				}
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}
