import fs from 'node:fs';
import { z } from 'zod';
import { privateProcedure, t } from '$lib/server/trpc';
import { getLocalUploadDirectoryPath } from '$lib/server/utils/getLocalUploadDirectoryPath';
import { Drive } from '$lib/server/utils/drive';
import { createResponse } from '$lib/server/utils/createResponse';
import { RESPONSE_CODES } from '$lib/const/http';

export const driveRouter = t.router({
	upload: privateProcedure
		.input(
			z.object({
				fileId: z.string(),
				fileInfo: z.object({
					name: z.string(),
					mimeType: z.string().optional().default('application/octet-stream')
				}),
				parentDirectoryId: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { session, prisma } = ctx;

			const filePath = `${getLocalUploadDirectoryPath()}/${input.fileId}`;

			if (fs.existsSync(filePath) === false) {
				return createResponse(true, RESPONSE_CODES.NOT_FOUND, 'File does not exist');
			}

			const drive = await Drive.getInstance(session.user.id!);

			if (!drive) {
				return createResponse(
					true,
					RESPONSE_CODES.DRIVE_INIT_FAILED,
					'Failed to initialize drive instance'
				);
			}

			const uploadResponse = await drive.createFile({
				path: filePath,
				name: input.fileId,
				maxChunkSize: 5,
				// TODO: connect with redis
				onProgress: console.log
			});

			if (uploadResponse.error || !uploadResponse.data) {
				return createResponse(true, uploadResponse.code, uploadResponse.message);
			}

			const fileDoc = await prisma.file.create({
				data: {
					name: input.fileInfo.name,
					mimeType: input.fileInfo.mimeType,
					id: uploadResponse.data.id,
					user: {
						connect: {
							email: session.user.email!
						}
					},
					parentDirectory: input.parentDirectoryId
						? {
								connect: {
									id: input.parentDirectoryId
								}
							}
						: undefined
				}
			});

			for (const chunk of uploadResponse.data.chunks) {
				if (chunk.error || !chunk.driveId) continue;

				await prisma.fileChunk.create({
					data: {
						driveId: chunk.driveId,
						id: chunk.id,
						index: chunk.index,
						size: chunk.size,
						file: {
							connect: {
								id: fileDoc.id
							}
						}
					}
				});
			}

			return uploadResponse;
		})
});

export type DriveRouter = typeof driveRouter;
