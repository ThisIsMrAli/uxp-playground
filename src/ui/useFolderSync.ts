import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { folderPicker, syncPluginFolder, type SyncFolder } from '../core/folderSync';
import type { Project } from '../core/types';

export function useFolderSync(
  project: Project,
  session: number,
  getVendor: (project: Project) => Promise<string | null>,
  onAutoError: (message: string, kind: 'error') => void
) {
  const active = useRef<AbortController | null>(null);
  const [folder, setFolder] = useState<{ handle: SyncFolder; session: number } | null>(null);
  const [autosync, setAutosync] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [last, setLast] = useState<{ at: Date; fileCount: number; manifestChanged: boolean; project: Project } | null>(null);
  const currentFolder = folder?.session === session ? folder.handle : null;

  const disconnect = useCallback(() => {
    active.current?.abort();
    setFolder(null);
    setAutosync(false);
    setError('');
    setLast(null);
  }, []);

  useLayoutEffect(() => {
    // Loading another project must never send its files into the outgoing project's folder.
    return () => disconnect();
  }, [session, disconnect]);

  const run = useCallback(async (mode: 'choose' | 'manual' | 'auto') => {
    if (active.current) return;
    const picker = folderPicker();
    if (!picker || (mode !== 'choose' && !currentFolder)) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setError('');
    try {
      const handle = mode === 'choose'
        ? await picker({ id: 'uxp-plugin-output', mode: 'readwrite' })
        : currentFolder!;
      controller.signal.throwIfAborted();
      if (mode === 'manual' && await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
        throw new Error('Allow this site to edit the folder, then try again.');
      }
      const result = await syncPluginFolder(handle, project, await getVendor(project), {
        reconnecting: mode === 'choose',
        signal: controller.signal
      });
      controller.signal.throwIfAborted();
      setFolder({ handle, session });
      setLast((previous) => ({
        ...result,
        manifestChanged: result.manifestChanged || (mode !== 'choose' && !!previous?.manifestChanged),
        at: new Date(),
        project
      }));
    } catch (failure) {
      if (controller.signal.aborted || (failure instanceof DOMException && failure.name === 'AbortError')) return;
      const message = failure instanceof Error && failure.message ? failure.message : 'Folder sync failed. Try again.';
      setError(message);
      setAutosync(false);
      if (mode === 'auto') onAutoError('Folder sync paused. Open Run in host for details.', 'error');
    } finally {
      active.current = null;
      setBusy(false);
    }
  }, [currentFolder, getVendor, onAutoError, project, session]);

  useEffect(() => {
    if (!currentFolder || !autosync || busy || (last?.project.files === project.files && last.project.name === project.name)) return;
    const timer = window.setTimeout(() => void run('auto'), 1000);
    return () => window.clearTimeout(timer);
  }, [autosync, busy, currentFolder, last, project.files, project.name, run]);

  return {
    supported: window.isSecureContext && window.parent === window && !!folderPicker(),
    folderName: currentFolder?.name,
    autosync: !!currentFolder && autosync,
    setAutosync,
    busy,
    error,
    last: currentFolder ? last : null,
    run,
    disconnect,
    acknowledgeReload: () => setLast((result) => result && { ...result, manifestChanged: false })
  };
}

export type FolderSync = ReturnType<typeof useFolderSync>;
