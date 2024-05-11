import { DRIVE_QUEUE_CONCURRENCY } from '$lib/const/drive';
import { Store } from '$lib/server/modules/store';
import PQueue from 'p-queue';

const globalForQueue = globalThis as unknown as { driveQueue: PQueue };

export const driveQueue =
	globalForQueue.driveQueue || new PQueue({ concurrency: DRIVE_QUEUE_CONCURRENCY });
globalForQueue.driveQueue = driveQueue;
