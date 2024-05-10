import { EventEmitter } from 'node:events';

export class Store extends EventEmitter {
	public map: Map<
		string,
		{
			createdAt: number;
			ttl?: number;
			data: any;
		}
	>;

	constructor() {
		super();

		this.map = new Map();

		setInterval(() => {
			this.TTLchecker();
		}, 100);
	}

	private TTLchecker() {
		this.map.forEach((value, key) => {
			if (!value || !value.ttl) return;
			if (value.createdAt <= Date.now() + value.ttl) {
				this.map.delete(key);
				this.emit('ttlDelete', { key });
			}
		});
	}

	set<T = any>(
		key: string,
		data: T,
		options?: {
			ttl?: number;
		}
	) {
		this.map.set(key, {
			createdAt: Date.now(),
			ttl: options?.ttl,
			data
		});

		this.emit('set', { key, data, options, map: this.map });
		return this.get(key) as T;
	}

	get(key: string) {
		const data = this.map.get(key)?.data;
		this.emit('get', { key, data: data });
		return data;
	}

	getRaw(key: string) {
		const item = this.map.get(key);
		this.emit('getRaw', { key, item });
		return item;
	}

	update(key: string, callback: (data: any) => any) {
		const result = callback(this.get(key));
		return this.set(key, result);
	}

	del(key: string) {
		this.map.delete(key);
		this.emit('delete', { key });
	}
}
