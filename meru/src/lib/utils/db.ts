import { DB_NAME, STORE_NAME, KEY, CANVAS_SIZE } from '$lib/constants';

export async function getDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function saveCanvas(data: Uint8Array) {
	const db = await getDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	tx.objectStore(STORE_NAME).put(data, KEY);
}

export async function loadCanvas(): Promise<Uint8Array> {
	const db = await getDB();
	return new Promise((resolve) => {
		const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(KEY);
		request.onsuccess = () => {
			if (request.result instanceof Uint8Array) resolve(request.result);
			else resolve(new Uint8Array(CANVAS_SIZE * CANVAS_SIZE).fill(0));
		};
	});
}
