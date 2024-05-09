interface GlobalStore {
	[key: string]: any;
}

const globalForStore = globalThis as unknown as { store: GlobalStore };

let store = globalForStore.store || {};

globalForStore.store = store;

function set(key: string, data: any) {
	store[key] = data;
	return data;
}

function get(key: string) {
	return store[key];
}

function has(key: string) {
	return get(key) !== undefined ? true : false;
}

function update(
	key: string,
	callback: (store: GlobalStore) => Promise<GlobalStore>
): Promise<GlobalStore>;
function update(key: string, callback: (store: GlobalStore) => GlobalStore): GlobalStore;
function update(key: string, callback: (store: GlobalStore) => Promise<GlobalStore> | GlobalStore) {
	const newStore = callback({ ...get(key) });

	if (newStore instanceof Promise) {
		return newStore.then(() => {
			store[key] = {
				...newStore
			};
		});
	}

	store[key] = { ...newStore };

	return store;
}

export default {
	set,
	get,
	has,
	update
};
