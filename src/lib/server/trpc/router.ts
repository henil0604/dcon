import { t } from '$lib/server/trpc';
import { driveRouter } from '$lib/server/trpc/routes/drive';

export const router = t.router({
	drive: driveRouter
});

export type Router = typeof router;
