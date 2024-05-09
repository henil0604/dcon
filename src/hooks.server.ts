import { authHandle } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import trpcHandle from '$lib/server/trpc/handler';

export const handle: Handle = sequence(authHandle, trpcHandle);
