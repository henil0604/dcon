import { Store } from './store';

const globalForStore = globalThis as unknown as { store: Store };

export const store = globalForStore.store || new Store();
