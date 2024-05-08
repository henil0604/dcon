import type { ServerResponse } from '$lib/types';

export function createResponse<Data extends ServerResponse['data']>(
	error: ServerResponse['error'],
	code: ServerResponse['code'],
	message?: string,
	data?: Data
): ServerResponse<Data & { [key: string]: any }> {
	return {
		error,
		code,
		message,
		data
	};
}
