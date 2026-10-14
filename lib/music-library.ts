/**
 * Your own music, kept in this browser (IndexedDB). Files never leave
 * the device; Chrona just remembers them so they're here next time.
 */

export type Track = { id: string; name: string; size: number; added: number };
type Stored = Track & { blob: Blob };

const DB_NAME = "chrona-music";
const STORE = "tracks";

let opening: Promise<IDBDatabase> | null = null;

function database() {
  opening ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      opening = null;
      reject(request.error);
    };
  });

  return opening;
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>) {
  return database().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = work(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

/** "02 - Rainy Day (lofi).mp3" → "Rainy Day (lofi)". */
function titleOf(file: File) {
  return file.name
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/^\d{1,3}\s*[-._]\s*/, "")
    .replace(/[_]+/g, " ")
    .trim()
    .slice(0, 80) || "Untitled";
}

export async function listTracks(): Promise<Track[]> {
  const stored = await run<Stored[]>("readonly", (store) => store.getAll());

  return stored
    .map(({ id, name, size, added }) => ({ id, name, size, added }))
    .sort((a, b) => a.added - b.added);
}

export async function addTracks(files: File[]) {
  const audio = files.filter((file) => file.type.startsWith("audio/") || /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i.test(file.name));

  // Ask the browser not to clear these when space runs low.
  void navigator.storage?.persist?.();

  const now = Date.now();

  for (const [index, file] of audio.entries()) {
    const track: Stored = {
      id: `track-${now}-${index}`,
      name: titleOf(file),
      size: file.size,
      added: now + index,
      blob: file,
    };
    await run("readwrite", (store) => store.put(track));
  }

  return audio.length;
}

export function removeTrack(id: string) {
  return run("readwrite", (store) => store.delete(id));
}

export async function trackBlob(id: string) {
  const stored = await run<Stored | undefined>("readonly", (store) => store.get(id));
  return stored?.blob;
}
