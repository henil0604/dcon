import { RESPONSE_CODES } from '$lib/const/http';

export interface DConResponse<Data> {
	error: boolean;
	code: keyof typeof RESPONSE_CODES;
	message?: string;
	data: Data;
}
