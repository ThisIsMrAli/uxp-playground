import { useState } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

export type ImportSource = 'github' | 'zip' | 'folder' | 'gist' | 'json';

export interface ImportDialogProps {
  onClose: () => void;
  onGithub: (spec: string, root?: string) => Promise<void>;
  onZip: (file: File, root?: string) => Promise<void>;
  onFolder: (files: FileList) => Promise<void>;
  onGist: (id: string) => Promise<void>;
  onJson: (file: File) => Promise<void>;
  /** Set when a source contained several plugins; the user picks one. */
  candidates?: { source: 'github' | 'zip'; list: string[]; retry: (root: string) => void } | null;
  progress?: string | null;
  initialTab?: ImportSource;
}

export function ImportDialog({ onClose, onGithub, onZip, onFolder, onGist, onJson, candidates, progress, initialTab }: ImportDialogProps) {
  const [tab, setTab] = useState<ImportSource>(initialTab || 'github');
  const [gh, setGh] = useState('');
  const [gist, setGist] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };
  const tabs: [ImportSource, string, string][] = [
    ['github', 'GitHub', 'github'],
    ['zip', 'Zip / .ccx', 'zip'],
    ['folder', 'Folder', 'folder'],
    ['gist', 'Gist', 'code'],
    ['json', 'playground.json', 'file']
  ];
  return (
    <Dialog title="Import a plugin" onClose={onClose} testId="import-dialog" wide>
      <div className="tabs-line" role="tablist">
        {tabs.map(([id, label, icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={'tab ' + (tab === id ? 'active' : '')} onClick={() => setTab(id)} data-testid={`import-tab-${id}`}>
            <Icon name={icon} size={14} /> {label}
          </button>
        ))}
      </div>
      <div className="import-body">
        {tab === 'github' && (
          <form onSubmit={(e) => { e.preventDefault(); run(() => onGithub(gh)); }}>
            <p>Open any public UXP plugin repository. The playground finds manifest.json (also in sub-folders and monorepos) and downloads only that plugin.</p>
            <div className="row">
              <input data-initial-focus className="grow" value={gh} onChange={(e) => setGh(e.target.value)} placeholder="AdobeDocs/uxp-photoshop-plugin-samples/hello-world-panel-js-sample" aria-label="GitHub repository" data-testid="github-input" />
              <button className="btn primary" disabled={busy || !gh.trim()} data-testid="github-import">
                {busy ? 'Importing…' : 'Import'}
              </button>
            </div>
            <p className="muted small">Accepts owner/repo, owner/repo/sub/folder, owner/repo@branch:path or a github.com URL. Uses the public API without sign-in (60 requests per hour).</p>
          </form>
        )}
        {tab === 'zip' && (
          <div>
            <p>A zip of a plugin folder, a GitHub "Download ZIP" archive, or a packaged .ccx plugin.</p>
            <label className="drop" data-testid="zip-drop">
              <Icon name="upload" size={22} />
              <span>Choose a .zip or .ccx file</span>
              <input type="file" accept=".zip,.ccx,application/zip" onChange={(e) => e.target.files?.[0] && run(() => onZip(e.target.files![0]))} data-testid="zip-file" />
            </label>
          </div>
        )}
        {tab === 'folder' && (
          <div>
            <p>Pick the plugin folder (the one with manifest.json) or the repository folder. node_modules and .git are skipped.</p>
            <label className="drop">
              <Icon name="folder" size={22} />
              <span>Choose a folder</span>
              {/* @ts-expect-error webkitdirectory is supported by Chromium, Firefox and Safari */}
              <input type="file" webkitdirectory="" multiple onChange={(e) => e.target.files?.length && run(() => onFolder(e.target.files!))} data-testid="folder-input" />
            </label>
            <p className="muted small">You can also drop a folder or zip anywhere on the playground.</p>
          </div>
        )}
        {tab === 'gist' && (
          <form onSubmit={(e) => { e.preventDefault(); const m = /([0-9a-f]{20,})/i.exec(gist); if (!m) return setError('Paste a gist URL or id.'); run(() => onGist(m[1])); }}>
            <p>A public gist with plugin files or a playground.json. Gists are flat: name files like <code>icons__dark.png</code> to put them in folders.</p>
            <div className="row">
              <input className="grow" value={gist} onChange={(e) => setGist(e.target.value)} placeholder="https://gist.github.com/user/0123abcd…" aria-label="Gist URL or id" data-testid="gist-input" />
              <button className="btn primary" disabled={busy} data-testid="gist-import">Load gist</button>
            </div>
          </form>
        )}
        {tab === 'json' && (
          <div>
            <p>A project saved with "Save .json".</p>
            <label className="drop">
              <Icon name="file" size={22} />
              <span>Choose playground.json</span>
              <input type="file" accept=".json,application/json" onChange={(e) => e.target.files?.[0] && run(() => onJson(e.target.files![0]))} data-testid="json-file" />
            </label>
          </div>
        )}
        {progress && <div className="banner info" role="status">{progress}</div>}
        {candidates && (
          <div className="candidates" data-testid="import-candidates">
            <p><strong>{candidates.list.length} plugins found.</strong> Which one do you want to open?</p>
            <ul>
              {candidates.list.map((c) => (
                <li key={c}>
                  <button className="btn" onClick={() => candidates.retry(c)}>
                    <Icon name="folder" size={14} /> {c.replace(/\/$/, '') || '(root)'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && <div className="banner error" role="alert" data-testid="import-error">{error}</div>}
      </div>
    </Dialog>
  );
}
