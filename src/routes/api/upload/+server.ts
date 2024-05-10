import { RESPONSE_CODES } from '$lib/const/http';
import { createResponse } from '$lib/server/utils/createResponse';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { tryCatch } from '$lib/utils/tryCatch';
import fs from 'node:fs';
import { LOCAL_UPLOAD_DIRECTORY_NAME } from '$lib/const';
import { saveToLocalUploadDirectory } from '$lib/server/utils/saveToLocalUploadDirectory';
import { Drive } from '$lib/server/utils/drive';

if (fs.existsSync(`static/${LOCAL_UPLOAD_DIRECTORY_NAME}`) === false) {
	await fs.promises.mkdir(`static/${LOCAL_UPLOAD_DIRECTORY_NAME}`);
}

export const POST: RequestHandler = async (event) => {
	const { request, locals } = event;
	const session = await locals.auth();

	if (!session || !session.user) {
		return json(createResponse(true, RESPONSE_CODES.UNAUTHORIZED));
	}

	const drive = await Drive.getInstance(session.user.id!);

	if (!drive) {
		return json(createResponse(true, RESPONSE_CODES.DRIVE_INIT_FAILED));
	}

	const [form, error] = await tryCatch(() => request.formData());

	if (error) {
		return json(createResponse(true, RESPONSE_CODES.BAD_INPUT, 'Bad Input'));
	}

	const file = form.get('file') as File | null;

	if (!file) {
		return json(createResponse(true, RESPONSE_CODES.BAD_INPUT, 'Bad file input'));
	}

	const fileId = await drive.generateId();

	if (!fileId) {
		return json(createResponse(true, RESPONSE_CODES.DRIVE_ID_GENERATION_FAILED));
	}

	await saveToLocalUploadDirectory(fileId, file);

	return json(
		createResponse(false, RESPONSE_CODES.OK, 'File uploaded', {
			id: fileId
		})
	);
};
