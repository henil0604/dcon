import fs from 'node:fs';
import { z } from 'zod';
import { privateProcedure, t } from '$lib/server/trpc';
import { getLocalUploadDirectoryPath } from '$lib/server/utils/getLocalUploadDirectoryPath';
import { Drive, type CreateFileOptions } from '$lib/server/modules/drive';
import { createResponse } from '$lib/server/utils/createResponse';
import { RESPONSE_CODES } from '$lib/const/http';
import { store } from '$lib/server/store';
import { MIN_CHUNK_SIZE } from '$lib/const/drive';

export const driveRouter = t.router({
	upload: privateProcedure
		.input(
			z.object({
				fileId: z.string(),
				fileInfo: z.object({
					name: z.string(),
					mimeType: z.string().optional().default('application/octet-stream')
				}),
				parentDirectoryId: z.string().optional(),
				maxChunkSize: z.number().int().gte(MIN_CHUNK_SIZE).optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { session, prisma } = ctx;

			// grab file path
			const filePath = `${getLocalUploadDirectoryPath()}/${input.fileId}`;

			// if file does not exist
			if (fs.existsSync(filePath) === false) {
				return createResponse(true, RESPONSE_CODES.NOT_FOUND, 'File does not exist');
			}

			// get drive instance
			const drive = await Drive.getInstance(session.user.id!);

			// if fails
			if (!drive) {
				return createResponse(
					true,
					RESPONSE_CODES.DRIVE_INIT_FAILED,
					'Failed to initialize drive instance'
				);
			}

			// function that will be invoked, when file will be chunked, that data will be shared with this function to initialize memory store
			const handleOnChunking: CreateFileOptions['onChunking'] = async (data) => {
				// creating main object in memory store
				store.set(input.fileId, {
					status: 'WAITING',
					percentage: 0,
					bytesUploaded: 0,
					totalBytes: data.size,
					totalChunks: data.totalChunks,
					chunks: {}
				});

				// for every chunk
				for (const chunk of data.chunks) {
					// create object for that chunk
					store.update(input.fileId, (store) => {
						store.chunks[chunk.index] = {
							status: 'WAITING',
							index: chunk.index,
							percentage: 0,
							bytesUploaded: 0,
							speed: 0,
							size: chunk.size
						};

						return store;
					});
				}
			};

			// function that will be invoked when chunk events happen, eg. when chunk starts or end uploading
			const handleChunkEvent: CreateFileOptions['onChunkEvent'] = async (event) => {
				if (event.event === 'START_UPLOADING') {
					// updating chunk
					store.update(input.fileId, (store) => {
						// changing status of main object (in-case)
						store.status = 'UPLOADING';
						// changing status of chunk
						store.chunks[event.chunkIndex].status = 'UPLOADING';
						return store;
					});
				}
				if (event.event === 'END_UPLOADING') {
					store.update(input.fileId, (store) => {
						// changing status of chunk
						store.chunks[event.chunkIndex].status = 'DONE';
						return store;
					});
				}
			};

			// this function will be invoked every time drive request reads from readable stream inside Drive.createRawFile function
			// it will return progress event coming from `progress-stream` package
			const handleFileUploadProgress: CreateFileOptions['onProgress'] = (progress) => {
				// update chunk data
				store.update(input.fileId, (data) => {
					// update percentage, speed and bytesUploaded
					data.chunks[progress.chunk.index].percentage = progress.percentage;
					data.chunks[progress.chunk.index].speed = progress.speed;
					data.chunks[progress.chunk.index].bytesUploaded = progress.transferred;

					// add uploaded bytes to main object's `bytesUploaded`
					data.bytesUploaded += progress.delta;
					// recalculate percentage of main object
					data.percentage = (data.bytesUploaded / data.totalBytes) * 100;

					return data;
				});
			};

			// creating ile
			const uploadResponse = await drive.createFile({
				// path of file
				path: filePath,
				// name of the directory
				directoryName: input.fileId,
				directoryId: input.fileId,
				maxChunkSize: input.maxChunkSize,
				onProgress: handleFileUploadProgress,
				onChunking: handleOnChunking,
				onChunkEvent: handleChunkEvent
			});

			// if any error
			if (uploadResponse.error || !uploadResponse.data) {
				store.update(input.fileId, (store) => {
					// set status as failed
					store.status = 'FAILED';
					return store;
				});
				// delete key from memory store
				store.del(input.fileId);
				// delete the file, let user reupload if wants
				await fs.promises.unlink(filePath);
				// return response as error
				return createResponse(true, uploadResponse.code, uploadResponse.message);
			}

			store.update(input.fileId, (store) => {
				// set status as done
				store.status = 'DONE';
				return store;
			});

			// delete key from memory store
			store.del(input.fileId);
			// delete the file
			await fs.promises.unlink(filePath);

			// create file entry in db
			const fileDoc = await prisma.file.create({
				data: {
					name: input.fileInfo.name,
					mimeType: input.fileInfo.mimeType,
					id: uploadResponse.data.id,
					// link it to user
					user: {
						connect: {
							email: session.user.email!
						}
					},
					// if parent directory provided, link it
					parentDirectory: input.parentDirectoryId
						? {
								connect: {
									id: input.parentDirectoryId
								}
							}
						: undefined
				}
			});

			// for every chunk
			for (const chunk of uploadResponse.data.chunks) {
				if (chunk.error || !chunk.driveId) continue;

				// create chunk entry in db
				await prisma.fileChunk.create({
					data: {
						id: chunk.id,
						index: chunk.index,
						size: chunk.size,
						// link it to the file
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
