import { hostInfo } from '../../core/hosts';
import { parseManifest } from '../../core/manifest';
import type { Project } from '../../core/types';
import type { FolderSync } from '../useFolderSync';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

export function HostDialog({ project, sync, onClose, onDownload }: { project: Project; sync: FolderSync; onClose: () => void; onDownload: () => void }) {
  const parsed = parseManifest(project.files['manifest.json']);
  const manifest = parsed.ok ? parsed.value : null;
  const hosts = (Array.isArray(manifest?.host) ? manifest.host : [manifest?.host]).filter((host: any) => host?.app);
  const entries = Array.isArray(manifest?.entrypoints) ? manifest.entrypoints : [];
  const hasMenuEntry = entries.some((e: any) => e?.type === 'panel' || e?.type === 'command');

  return (
    <Dialog title="Run in host" onClose={onClose} testId="run-host-dialog" footer={
      <button className={sync.supported ? 'btn' : 'btn primary'} onClick={onDownload} disabled={!hosts.length} data-testid="host-download-zip">
        <Icon name="download" size={14} /> Download plugin .zip
      </button>
    }>
      {sync.supported && (
        <section className="host-sync" aria-labelledby="folder-sync-title">
          <h3 id="folder-sync-title">Sync to local folder</h3>
          {!sync.folderName && <p>Choose an empty folder for the generated plugin, or select a folder you previously synced in this browser.</p>}
          <div className="host-sync-actions">
            {sync.folderName ? (
              <>
                <button className="btn primary" onClick={() => void sync.run('manual')} disabled={sync.busy || !hosts.length}>Sync now</button>
                <button className="btn" onClick={sync.disconnect} disabled={sync.busy}>Disconnect</button>
              </>
            ) : (
              <button className="btn primary" onClick={() => void sync.run('choose')} disabled={sync.busy || !hosts.length}>Choose folder and sync</button>
            )}
          </div>
          {sync.folderName && (
            <label className="host-sync-toggle">
              <input type="checkbox" checked={sync.autosync} onChange={(e) => sync.setAutosync(e.target.checked)} disabled={!hosts.length && !sync.autosync} />
              Sync after edits while this project is open
            </label>
          )}
          <div className="host-sync-status" role="status">
            {sync.busy ? 'Syncing plugin files…' : sync.last && (
              <>Synced {sync.last.fileCount} files to <strong>{sync.folderName}</strong> at {sync.last.at.toLocaleTimeString()}</>
            )}
          </div>
          {sync.error && <p className="host-sync-error" role="alert">{sync.error}</p>}
          {sync.last?.manifestChanged && (
            <div className="host-sync-reload">
              <p>The manifest changed. In UXP Developer Tools, choose <strong>Unload</strong>, then <strong>Load &amp; Watch</strong>.</p>
              <button className="btn" onClick={sync.acknowledgeReload}>Mark reloaded</button>
            </div>
          )}
        </section>
      )}
      {hosts.length ? (
        <>
          <ol className="host-steps">
            <li>{sync.supported ? 'Sync to a local folder or download and unzip the plugin.' : 'Download and unzip the plugin. Open the playground in desktop Chrome or Edge to sync directly to a folder.'}</li>
            <li>Open UXP Developer Tools from Creative Cloud and enable Developer Mode.</li>
            <li>
              Start the app specified in <code>manifest.json</code> and look for it under <strong>Connected Apps</strong>.
              <ul className="host-targets">
                {hosts.map((host: any, index: number) => {
                  const info = hostInfo(host.app);
                  return (
                    <li key={index}>
                      <strong>{info?.label ?? host.app}{host.minVersion ? ` ${host.minVersion} or later` : ''}</strong>
                      {info?.setup && <div>{info.setup}</div>}
                      {info?.menu && hasMenuEntry && <div>Reopen the panel or command from <strong>{info.menu}</strong>.</div>}
                    </li>
                  );
                })}
              </ul>
            </li>
            <li>In UXP Developer Tools, choose <strong>Add Plugin</strong>, select <code>manifest.json</code> in your plugin folder, and click <strong>Load &amp; Watch</strong>. Set this up once per folder.</li>
          </ol>
          {!hasMenuEntry && <p className="muted">This manifest has no panel or command. Check the app logs in UXP Developer Tools after loading.</p>}
        </>
      ) : <p>Set a valid host in <code>manifest.json</code> to see where to load this plugin.</p>}
      <p><a href="https://developer.adobe.com/uxp/guides/how-to/udt-deep-dive/" target="_blank" rel="noreferrer">Adobe’s UXP Developer Tool guide</a></p>
    </Dialog>
  );
}
