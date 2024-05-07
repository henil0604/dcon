import { browser } from '$app/environment';
import type { Router } from '$lib/server/trpc/router';
import { createTRPCClient, type TRPCClientInit } from 'trpc-sveltekit';

let browserClient: ReturnType<typeof createTRPCClient<Router>>;

export function trpc(init?: TRPCClientInit) {
	const isBrowser = browser;
	if (isBrowser && browserClient) return browserClient;
	const client = createTRPCClient<Router>({ init });
	if (isBrowser) browserClient = client;
	return client;
}
