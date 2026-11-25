import { exportFiles, validatePluginFiles } from './exportZip';
import { fileBytes } from './files';
import { parseManifest } from './manifest';
import { validFileName } from './share';
import type { Project } from './types';

export interface SyncFolder extends FileSystemDirectoryHandle {
  keys(): AsyncIterableIterator<string>;
  requestPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
}

type DirectoryPicker = (options: { id: string; mode: 'readwrite' }) => Promise<SyncFolder>;
export function folderPicker(): DirectoryPicker | undefined {
  return (window as Window & { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker?.bind(window);
}

// Allow retry after an interrupted sync. A file may have its old or new contents until the whole write finishes.
interface SyncRecord {
  folder: SyncFolder;
  hashes: Record<string, string[]>;
  /** A previous write did not finish; missing files can be part of that partial write. */
  pending?: boolean;
  /** Paths that might legitimately be missing during that write. */
  pendingMissing?: string[];
}
const harmlessFiles = new Set(['.DS_Store', '.localized', 'desktop.ini', 'Thumbs.db']);

async function withRecords<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('uxp-playground-folder-sync', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('folders', { autoIncrement: true });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('folders', mode);
      const request = operation(tx.objectStore('folders'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? new Error('Could not remember this folder.'));
    });
  } finally {
    db.close();
  }
}

async function findRecord(folder: SyncFolder): Promise<{ id: IDBValidKey; record: SyncRecord } | undefined> {
  const [ids, records] = await Promise.all([
    withRecords('readonly', (store) => store.getAllKeys()),
    withRecords<SyncRecord[]>('readonly', (store) => store.getAll())
  ]);
  for (const [index, record] of records.entries()) {
    if (record.folder.name === folder.name && await folder.isSameEntry(record.folder)) return { id: ids[index], record };
  }
}

async function digest(bytes: BufferSource): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, '0')).join('');
}

async function getFile(folder: FileSystemDirectoryHandle, path: string, create = false) {
  const parts = path.split('/');
  const name = parts.pop()!;
  let dir = folder;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create });
  return { file: await dir.getFileHandle(name, { create }), dir, name };
}

async function getCurrentFile(folder: SyncFolder, path: string) {
  try {
    const entry = await getFile(folder, path);
    const file = await entry.file.getFile();
    return { ...entry, snapshot: file, hash: await digest(await file.arrayBuffer()) };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') return null;
    if (error instanceof DOMException && error.name === 'TypeMismatchError') {
      throw new Error(`${path} conflicts with an existing file or folder. Choose another output folder.`);
    }
    throw error;
  }
}

function checkPaths(names: string[]) {
  const prefixes = new Map<string, string>();
  const files = new Set(names);
  for (const path of names) {
    if (!validFileName(path)) throw new Error(`Invalid output path ${path}.`);
    let prefix = '';
    for (const part of path.split('/')) {
      if (/\.$|^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(part)) {
        throw new Error(`Output path ${path} uses a name that is reserved on Windows.`);
      }
      prefix += (prefix ? '/' : '') + part;
      const key = prefix.normalize('NFC').toLowerCase();
      if ((prefixes.has(key) && prefixes.get(key) !== prefix) || (prefix !== path && files.has(prefix))) {
        throw new Error(`Output path ${path} conflicts with ${prefixes.get(key) ?? prefix}. Use distinct file and folder names.`);
      }
      prefixes.set(key, prefix);
    }
  }
}

async function writeFile(file: FileSystemFileHandle, bytes: Uint8Array<ArrayBuffer>) {
  const stream = await file.createWritable();
  try {
    await stream.write(bytes);
    await stream.close();
  } catch (error) {
    await stream.abort().catch(() => {});
    throw error;
  }
}

const emptyFileHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export async function syncPluginFolder(folder: SyncFolder, project: Project, vendor: string | null, options: { reconnecting: boolean; signal: AbortSignal }) {
  const { reconnecting, signal } = options;
  const { files, warnings } = exportFiles(project, vendor);
  const problems = [...validatePluginFiles(files), ...warnings];
  if (problems.length) throw new Error(problems.join('\n'));
  const paths = Object.keys(files);
  checkPaths(paths);
  const entries = await Promise.all(paths.map(async (path) => {
    const bytes = new Uint8Array(fileBytes(files[path]));
    return { path, bytes, hash: await digest(bytes) };
  }));

  // Serialize writes from multiple tabs for the life of this sync. Picker-enabled browsers support Web Locks.
  return navigator.locks.request('uxp-playground-plugin-folder-sync', { signal }, async () => {
    signal.throwIfAborted();
    const existing = await findRecord(folder);
    if (!existing) {
      for await (const name of folder.keys()) {
        if (!harmlessFiles.has(name)) throw new Error('Choose an empty folder. A folder synced from this browser can also be selected again.');
      }
    }

    const previous = existing?.record.hashes ?? {};
    // Validate the combined tree before writing. A case-only rename or file-to-directory change needs
    // a fresh folder to avoid filesystem-specific aliases. Ordinary renames are handled below.
    const allPaths = [...new Set([...paths, ...Object.keys(previous)])];
    checkPaths(allPaths);
    const current = new Map(await Promise.all(allPaths.map(async (path) =>
      [path, await getCurrentFile(folder, path)] as const)));
    for (const [path, entry] of current) {
      const missingDuringInterruptedWrite = existing?.record.pending &&
        (!existing.record.pendingMissing || existing.record.pendingMissing.includes(path));
      if (!entry && Object.hasOwn(previous, path) && !missingDuringInterruptedWrite) {
        throw new Error(`${path} was deleted outside the playground. Restore it or sync to a different folder.`);
      }
      if (entry && !Object.hasOwn(previous, path)) {
        throw new Error(`${path} already exists. Move it or sync to an empty folder.`);
      }
      if (entry && !previous[path]?.includes(entry.hash)) {
        throw new Error(`${path} was changed outside the playground. Move it to keep a copy, then try again.`);
      }
    }
    const oldManifest = current.get('manifest.json');
    if (reconnecting && oldManifest && oldManifest.hash !== emptyFileHash) {
      const oldId = parseManifest(await oldManifest.snapshot.text()).value.id;
      if (oldId !== parseManifest(files['manifest.json']).value.id) {
        throw new Error('This folder belongs to a plugin with a different manifest ID. Choose an empty folder for this project.');
      }
    }
    const pending = Object.fromEntries(entries.map(({ path, hash }) => [
      path, [...new Set([current.get(path)?.hash || emptyFileHash, hash])]
    ]));
    const pendingMissing = allPaths.filter((path) => !current.get(path) || !Object.hasOwn(files, path));
    const record: SyncRecord = { folder, hashes: { ...previous, ...pending }, pending: true, pendingMissing };
    signal.throwIfAborted();
    const key = await withRecords('readwrite', (store) => existing ? store.put(record, existing.id) : store.add(record));
    // Write dependencies before the manifest and leave unchanged files alone to avoid redundant reloads.
    entries.sort((a, b) => Number(a.path === 'manifest.json') - Number(b.path === 'manifest.json'));
    for (const { path, bytes, hash } of entries) {
      signal.throwIfAborted();
      const entry = current.get(path);
      if (entry?.hash !== hash) {
        const target = await getCurrentFile(folder, path);
        if (target?.hash !== entry?.hash) throw new Error(`${path} was changed during sync. Try again.`);
        if (target) {
          await writeFile(target.file, bytes);
        } else {
          const { file } = await getFile(folder, path, true);
          if ((await file.getFile()).size) throw new Error(`${path} was added during sync. Try again.`);
          await writeFile(file, bytes);
        }
      }
    }
    for (const [path, entry] of current) {
      signal.throwIfAborted();
      if (entry && !Object.hasOwn(files, path)) {
        const target = await getCurrentFile(folder, path);
        if (target?.hash !== entry.hash) throw new Error(`${path} was changed during sync. Try again.`);
        await target.dir.removeEntry(target.name);
      }
    }
    await withRecords('readwrite', (store) => store.put({
      folder,
      hashes: Object.fromEntries(entries.map(({ path, hash }) => [path, [hash]]))
    } satisfies SyncRecord, key));
    return { fileCount: entries.length, manifestChanged: !!oldManifest && oldManifest.hash !== entries.at(-1)?.hash };
  });
}
