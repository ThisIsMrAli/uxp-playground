import type { RawFiles } from '../core/importer';

/** Reads dropped files and folders (DataTransferItem.webkitGetAsEntry) into a raw path → bytes map. */
export async function readDrop(dt: DataTransfer): Promise<{ raw: RawFiles; single?: File }> {
  const items = Array.from(dt.items || []).filter((i) => i.kind === 'file');
  const entries = items.map((i) => (i as any).webkitGetAsEntry?.()).filter(Boolean);
  if (entries.length === 1 && entries[0].isFile) {
    const f = dt.files[0];
    if (f && /\.(zip|ccx|json)$/i.test(f.name)) return { raw: {}, single: f };
  }
  const raw: RawFiles = {};
  if (entries.length) {
    await Promise.all(entries.map((e: any) => walk(e, '', raw)));
    return { raw };
  }
  for (const f of Array.from(dt.files)) raw[f.name] = new Uint8Array(await f.arrayBuffer());
  return { raw };
}

function walk(entry: any, prefix: string, out: RawFiles): Promise<void> {
  if (entry.isFile)
    return new Promise((resolve) =>
      entry.file(
        async (f: File) => {
          out[prefix + entry.name] = new Uint8Array(await f.arrayBuffer());
          resolve();
        },
        () => resolve()
      )
    );
  if (/^(node_modules|\.git)$/.test(entry.name)) return Promise.resolve();
  const reader = entry.createReader();
  const all: any[] = [];
  return new Promise((resolve) => {
    const next = () =>
      reader.readEntries(
        async (batch: any[]) => {
          if (!batch.length) {
            await Promise.all(all.map((c) => walk(c, prefix + entry.name + '/', out)));
            resolve();
          } else {
            all.push(...batch);
            next();
          }
        },
        () => resolve()
      );
    next();
  });
}

/** <input webkitdirectory> FileList → raw map keyed by webkitRelativePath. */
export async function readFileList(list: FileList): Promise<RawFiles> {
  const raw: RawFiles = {};
  for (const f of Array.from(list)) {
    const p = (f as any).webkitRelativePath || f.name;
    if (/(^|\/)(node_modules|\.git)\//.test(p)) continue;
    raw[p] = new Uint8Array(await f.arrayBuffer());
  }
  return raw;
}
