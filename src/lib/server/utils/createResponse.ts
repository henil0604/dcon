import type { ServerResponse } from '$lib/types';

export function createResponse<Data>(
	error: ServerResponse<Data>['error'],
	code: ServerResponse<Data>['code'],
	message?: string,
	data?: Data
) {
	return {
		error,
		code,
		message,
		data
	};
}
