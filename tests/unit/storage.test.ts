import { afterEach, describe, expect, it, vi } from 'vitest';
import { templateById } from '../../src/core/templates';
import { loadSavedSync, saveProject } from '../../src/ui/storage';

describe('autosave ordering', () => {
  afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

  it('does not let a slow database save replace a newer local save', async () => {
    let finishWrite: (() => void) | undefined;
    const db = {
      close() {},
      transaction() {
        const tx: { objectStore: () => { put: () => void }; oncomplete?: () => void } = {
          objectStore: () => ({ put() {} })
        };
        finishWrite = () => tx.oncomplete?.();
        return tx;
      }
    };
    vi.stubGlobal('indexedDB', {
      open() {
        const request: { result: typeof db; onsuccess?: () => void } = { result: db };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      }
    });
    const p = templateById('hello').build();
    const old = saveProject({ ...p, name: 'old', files: { ...p.files, 'large.js': 'x'.repeat(2_000_000) } });
    await vi.waitFor(() => expect(finishWrite).toBeDefined());
    expect(await saveProject({ ...p, name: 'new' })).toBe('local');
    finishWrite!();
    await old;
    expect(loadSavedSync()).toMatchObject({ name: 'new' });
  });

  it('serializes large saves and publishes only the newest pointer', async () => {
    const writes: { value: string; finish: () => void }[] = [];
    const db = {
      close() {},
      transaction() {
        const tx: { objectStore: () => { put: (value: string) => void }; oncomplete?: () => void } = {
          objectStore: () => ({ put(value) { writes.push({ value, finish: () => tx.oncomplete?.() }); } })
        };
        return tx;
      }
    };
    vi.stubGlobal('indexedDB', {
      open() {
        const request: { result: typeof db; onsuccess?: () => void } = { result: db };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      }
    });
    const p = templateById('hello').build();
    const large = { ...p.files, 'large.js': 'x'.repeat(2_000_000) };
    const first = saveProject({ ...p, name: 'first', files: large });
    await vi.waitFor(() => expect(writes).toHaveLength(1));
    const second = saveProject({ ...p, name: 'second', files: large });
    writes[0].finish();
    await first;
    expect(localStorage.getItem('uxp-playground:last')).toBeNull();
    await vi.waitFor(() => expect(writes).toHaveLength(2));
    expect(JSON.parse(writes[1].value).name).toBe('second');
    writes[1].finish();
    expect(await second).toBe('idb');
    expect(JSON.parse(localStorage.getItem('uxp-playground:last')!).name).toBe('second');
  });
});
