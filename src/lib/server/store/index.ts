import { Store } from '$lib/server/modules/store';

const globalForStore = globalThis as unknown as { store: Store };

export const store = globalForStore.store || new Store();
