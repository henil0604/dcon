import { SvelteKitAuth } from '@auth/sveltekit';

export const { handle: authHandle } = SvelteKitAuth({
	providers: []
});
