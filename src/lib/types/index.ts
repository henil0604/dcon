import { RESPONSE_CODES } from '$lib/const/http';

export interface ServerResponse<Data> {
	error: boolean;
	code: keyof typeof RESPONSE_CODES;
	message?: string;
	data: Data;
}
