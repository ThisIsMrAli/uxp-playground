import { hostInfo } from '../../core/hosts';
import { parseManifest } from '../../core/manifest';
import type { Project } from '../../core/types';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

export function HostDialog({ project, onClose, onDownload }: { project: Project; onClose: () => void; onDownload: () => void }) {
  const parsed = parseManifest(project.files['manifest.json']);
  const manifest = parsed.ok ? parsed.value : null;
  const hosts = (Array.isArray(manifest?.host) ? manifest.host : [manifest?.host]).filter((host: any) => host?.app);
  const entries = Array.isArray(manifest?.entrypoints) ? manifest.entrypoints : [];
  const hasMenuEntry = entries.some((e: any) => e?.type === 'panel' || e?.type === 'command');

  return (
    <Dialog title="Run in host" onClose={onClose} testId="run-host-dialog" footer={
      <button className="btn primary" onClick={onDownload} disabled={!hosts.length} data-testid="host-download-zip">
        <Icon name="download" size={14} /> Download plugin .zip
      </button>
    }>
      {hosts.length ? (
        <>
          <ol className="host-steps">
            <li>Download and unzip the plugin. Keep the extracted folder for reloading.</li>
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
            <li>In UXP Developer Tools, choose <strong>Add Plugin</strong>, select the extracted <code>manifest.json</code>, and click <strong>Load</strong>.</li>
          </ol>
          {!hasMenuEntry && <p className="muted">This manifest has no panel or command. Check the app logs in UXP Developer Tools after loading.</p>}
        </>
      ) : <p>Set a valid host in <code>manifest.json</code> to see where to load this plugin.</p>}
      <p><a href="https://developer.adobe.com/uxp/guides/how-to/udt-deep-dive/" target="_blank" rel="noreferrer">Adobe’s UXP Developer Tool guide</a></p>
    </Dialog>
  );
}
