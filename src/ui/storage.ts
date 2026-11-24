import { sanitizeProject } from '../core/share';
import type { Project } from '../core/types';

const KEY = 'uxp-playground:last';
const UI_KEY = 'uxp-playground:ui';
const DB = 'uxp-playground';

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function idbSet(key: string, value: string) {
  const db = await idb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function idbGet(key: string): Promise<string | null> {
  const db = await idb();
  const v = await new Promise<string | null>((resolve, reject) => {
    const r = db.transaction('kv').objectStore('kv').get(key);
    r.onsuccess = () => resolve((r.result as string) ?? null);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return v;
}

/** Synchronous read of the autosave when it fits in localStorage; 'idb' when it lives in IndexedDB. */
export function loadSavedSync(): Project | 'idb' | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (v && v.__idb) return 'idb';
    return sanitizeProject(v);
  } catch {
    return null;
  }
}

export async function loadSavedAsync(): Promise<Project | null> {
  try {
    const raw = await idbGet(KEY);
    return raw ? sanitizeProject(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Saves to localStorage, or to IndexedDB when the project is too big (imported plugins with images). */
export async function saveProject(p: Project): Promise<'local' | 'idb' | 'failed'> {
  const json = JSON.stringify(p);
  if (json.length < 2_000_000) {
    try {
      localStorage.setItem(KEY, json);
      return 'local';
    } catch {
      /* quota: fall through to IndexedDB */
    }
  }
  try {
    await idbSet(KEY, json);
    localStorage.setItem(KEY, JSON.stringify({ __idb: true, name: p.name }));
    return 'idb';
  } catch {
    return 'failed';
  }
}

export interface UiPrefs {
  sidebarWidth: number;
  previewWidth: number;
  bottomHeight: number;
  sidebarOpen: boolean;
  bottomOpen: boolean;
  appTheme: 'system' | 'dark' | 'light';
  seenWelcome: boolean;
  fontSize: number;
}

export const DEFAULT_PREFS: UiPrefs = { sidebarWidth: 236, previewWidth: 440, bottomHeight: 230, sidebarOpen: true, bottomOpen: true, appTheme: 'system', seenWelcome: false, fontSize: 13 };

export function loadPrefs(): UiPrefs {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(UI_KEY) || '{}') || {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(p: UiPrefs) {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
