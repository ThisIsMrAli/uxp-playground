import { useState } from 'react';
import { parseManifest, primaryHost } from '../../core/manifest';
import { Icon } from './Icon';

type M = any;

function setIn(obj: M, path: string[], value: any): M {
  const out = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  if (path.length === 1) {
    if (value === undefined) delete out[path[0]];
    else out[path[0]] = value;
    return out;
  }
  out[path[0]] = setIn(out[path[0]], path.slice(1), value);
  if (out[path[0]] && typeof out[path[0]] === 'object' && !Array.isArray(out[path[0]]) && !Object.keys(out[path[0]]).length) delete out[path[0]];
  return out;
}

function ListEditor({ items, onChange, placeholder, label, testId }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; label: string; testId?: string }) {
  const [v, setV] = useState('');
  const add = () => {
    const x = v.trim();
    if (!x || items.includes(x)) return;
    onChange([...items, x]);
    setV('');
  };
  return (
    <div className="list-editor">
      <ul>
        {items.map((d) => (
          <li key={d}>
            <code>{d}</code>
            <button className="icon-btn" aria-label={`Remove ${d}`} onClick={() => onChange(items.filter((x) => x !== d))}>
              <Icon name="close" size={12} />
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        <input value={v} placeholder={placeholder} aria-label={label} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} data-testid={testId} />
        <button className="btn sm" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

export function ManifestPanel({ text, onChange, onOpenManifest }: { text: string | undefined; onChange: (next: string) => void; onOpenManifest: () => void }) {
  const parsed = parseManifest(text);
  if (!parsed.ok) {
    return (
      <div className="manifest-panel empty-state">
        <Icon name="alert" size={20} />
        <div>
          <strong>manifest.json {text == null ? 'is missing' : 'has a JSON error'}</strong>
          <span>{parsed.error}</span>
          <button className="btn sm" onClick={onOpenManifest}>Open manifest.json</button>
        </div>
      </div>
    );
  }
  const m: M = parsed.value;
  const write = (next: M) => onChange(JSON.stringify(next, null, 2) + '\n');
  const set = (path: string[], value: any) => write(setIn(m, path, value));
  const perms = m.requiredPermissions || {};
  const host = primaryHost(m);
  const hostIsArray = Array.isArray(m.host);
  const setHost = (k: string, v: any) => {
    if (hostIsArray) {
      const arr = m.host.map((h: any) => (h === host ? { ...h, [k]: v } : h));
      write({ ...m, host: arr });
    } else set(['host', k], v);
  };
  const domains = perms.network?.domains;
  const netMode = domains === 'all' ? 'all' : Array.isArray(domains) ? 'list' : 'none';
  const eps: any[] = Array.isArray(m.entrypoints) ? m.entrypoints : [];
  const setEps = (next: any[]) => set(['entrypoints'], next);
  const apiVersion = host.data?.apiVersion ?? (host.minVersion && Number(String(host.minVersion).split('.')[0]) >= 23 ? 2 : 1);

  return (
    <div className="manifest-panel" data-testid="manifest-panel">
      <section>
        <h3>Plugin</h3>
        <div className="form-grid">
          <label>
            id <input value={m.id ?? ''} onChange={(e) => set(['id'], e.target.value)} />
          </label>
          <label>
            name <input value={typeof m.name === 'string' ? m.name : m.name?.default ?? ''} onChange={(e) => set(['name'], e.target.value)} />
          </label>
          <label>
            version <input value={m.version ?? ''} onChange={(e) => set(['version'], e.target.value)} />
          </label>
          <label>
            manifestVersion
            <select value={m.manifestVersion ?? 4} onChange={(e) => set(['manifestVersion'], Number(e.target.value))}>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </label>
          <label>
            host.app
            <select value={host.app ?? 'PS'} onChange={(e) => setHost('app', e.target.value)}>
              <option value="PS">PS</option>
              <option value="ID">ID</option>
              <option value="premierepro">premierepro</option>
              <option value="ame">ame</option>
            </select>
          </label>
          <label>
            host.minVersion <input value={host.minVersion ?? ''} onChange={(e) => setHost('minVersion', e.target.value)} placeholder="24.0.0" />
          </label>
        </div>
        {host.app === 'PS' && (
          <p className="muted small">
            Photoshop apiVersion: <strong>{apiVersion}</strong>
            {host.data?.apiVersion ? ' (set in host.data)' : ' (default from host.minVersion: 23.0.0+ gives 2)'}. With apiVersion 2, state changes must run inside executeAsModal.
          </p>
        )}
      </section>

      <section>
        <h3>Permissions <span className="muted small">(manifest v5 requiredPermissions)</span></h3>
        <div className="form-grid">
          <label>
            localFileSystem
            <select value={perms.localFileSystem ?? ''} onChange={(e) => set(['requiredPermissions', 'localFileSystem'], e.target.value || undefined)} data-testid="perm-fs">
              <option value="">(not set) plugin folders only</option>
              <option value="plugin">plugin: plugin folders only</option>
              <option value="request">request: file and folder pickers</option>
              <option value="fullAccess">fullAccess: any path</option>
            </select>
          </label>
          <label>
            clipboard
            <select value={perms.clipboard ?? ''} onChange={(e) => set(['requiredPermissions', 'clipboard'], e.target.value || undefined)}>
              <option value="">(not set)</option>
              <option value="read">read</option>
              <option value="readAndWrite">readAndWrite</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={!!perms.enableUserInfo} onChange={(e) => set(['requiredPermissions', 'enableUserInfo'], e.target.checked || undefined)} /> enableUserInfo
          </label>
          <label className="check">
            <input type="checkbox" checked={!!perms.allowCodeGenerationFromStrings} onChange={(e) => set(['requiredPermissions', 'allowCodeGenerationFromStrings'], e.target.checked || undefined)} /> allowCodeGenerationFromStrings
          </label>
        </div>
        <div className="perm-block">
          <div className="perm-title">network.domains</div>
          <div className="seg" role="radiogroup" aria-label="Network access">
            {(['none', 'list', 'all'] as const).map((mode) => (
              <button
                key={mode}
                role="radio"
                aria-checked={netMode === mode}
                className={netMode === mode ? 'on' : ''}
                onClick={() => set(['requiredPermissions', 'network'], mode === 'none' ? undefined : { domains: mode === 'all' ? 'all' : Array.isArray(domains) ? domains : [] })}
              >
                {mode === 'none' ? 'No network' : mode === 'list' ? 'Listed domains' : 'All domains'}
              </button>
            ))}
          </div>
          {netMode === 'list' && <ListEditor items={domains} onChange={(v) => set(['requiredPermissions', 'network'], { domains: v })} placeholder="https://api.example.com or https://*.example.com" label="Add domain" testId="add-domain" />}
        </div>
        <div className="perm-block">
          <div className="perm-title">launchProcess.schemes</div>
          <ListEditor items={perms.launchProcess?.schemes || []} onChange={(v) => set(['requiredPermissions', 'launchProcess'], v.length ? { ...(perms.launchProcess || {}), schemes: v } : undefined)} placeholder="https, mailto" label="Add scheme" />
        </div>
      </section>

      <section>
        <h3>Entrypoints</h3>
        <ul className="ep-list">
          {eps.map((ep, i) => (
            <li key={i}>
              <span className={`tag ${ep.type}`}>{ep.type}</span>
              <input aria-label="Entrypoint id" value={ep.id ?? ''} onChange={(e) => setEps(eps.map((x, k) => (k === i ? { ...x, id: e.target.value } : x)))} />
              <input aria-label="Entrypoint label" value={typeof ep.label === 'string' ? ep.label : ep.label?.default ?? ''} onChange={(e) => setEps(eps.map((x, k) => (k === i ? { ...x, label: typeof x.label === 'object' && x.label ? { ...x.label, default: e.target.value } : e.target.value } : x)))} />
              <button className="icon-btn" aria-label={`Remove entrypoint ${ep.id}`} onClick={() => setEps(eps.filter((_, k) => k !== i))}>
                <Icon name="trash" size={13} />
              </button>
            </li>
          ))}
        </ul>
        <div className="row">
          <button className="btn sm" onClick={() => setEps([...eps, { type: 'panel', id: `panel${eps.length + 1}`, label: { default: 'New Panel' }, minimumSize: { width: 230, height: 200 }, preferredDockedSize: { width: 300, height: 400 } }])} data-testid="add-panel">
            <Icon name="plus" size={13} /> Panel
          </button>
          <button className="btn sm" onClick={() => setEps([...eps, { type: 'command', id: `command${eps.length + 1}`, label: { default: 'New Command' } }])} data-testid="add-command">
            <Icon name="plus" size={13} /> Command
          </button>
          <span className="muted small">Register handlers with entrypoints.setup() using the same ids.</span>
        </div>
      </section>
    </div>
  );
}
