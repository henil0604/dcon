import type { DConResponse } from '$lib/types';

export function createResponse<Data>(
	error: DConResponse<Data>['error'],
	code: DConResponse<Data>['code'],
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
