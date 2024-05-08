// ORDER MATTERS HERE
export function tryCatch<T>(callback: () => Promise<T>): Promise<[T, null] | [null, Error]>;
export function tryCatch<T>(callback: () => T): [T, null] | [null, Error];
export function tryCatch<T>(callback: () => T | Promise<T>) {
	try {
		const result = callback();

		if (result instanceof Promise) {
			return result.then((res) => [res, null]).catch((error) => [null, error as Error]);
		}

		return [result, null];
	} catch (error) {
		console.log(error);
		return [null, error as Error];
	}
}
