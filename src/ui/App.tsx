import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Editor, revealLine } from './Editor';
import { Preview, postToPreview } from './Preview';
import { TEMPLATES, templateById } from '../core/templates';
import { buildPreview, type RuntimeAssets } from '../core/buildPreview';
import { buildPluginZip } from '../core/exportZip';
import { panelSize, parseManifest, type Diagnostic } from '../core/manifest';
import { readHash, sanitizeProject, shareUrl } from '../core/share';
import { loadGist } from '../core/gist';
import { HOSTS, PS_UXP_TABLE, UXP_VERSIONS } from '../core/versions';
import type { LogEntry, Project, Theme } from '../core/types';
import { LintClient } from '../lint/client';
import type { LintResponse } from '../lint/adapter';
import runtimeSrc from '../runtime/runtime.js?raw';
import panelCss from '../runtime/panel.css?raw';
import shimCss from '../runtime/shim.css?raw';
import vendorSrc from '../generated/react-bundle.js?raw';

const ASSETS: RuntimeAssets = { runtime: runtimeSrc, panelCss, shimCss, vendor: vendorSrc };
const STORAGE_KEY = 'uxp-playground:last';
const THEMES: Theme[] = ['darkest', 'dark', 'medium', 'light', 'lightest'];
const SIZES = [
  { id: 'manifest', label: 'Manifest docked size' },
  { id: '230x300', label: '230 × 300 (narrow)' },
  { id: '320x480', label: '320 × 480' },
  { id: '400x640', label: '400 × 640' },
  { id: '600x400', label: '600 × 400 (wide)' }
];

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function initialProject(): { project: Project; source: string; gist?: string } {
  const h = readHash(location.hash);
  if (h && h.kind === 'state' && h.project) return { project: h.project, source: 'share link' };
  if (h && h.kind === 'gist') return { project: templateById('hello').build(), source: 'gist', gist: h.id };
  try {
    const saved = sanitizeProject(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    if (saved) return { project: saved, source: 'autosave' };
  } catch {
    /* ignore */
  }
  return { project: templateById('hello').build(), source: 'template' };
}

type Tab = 'console' | 'host' | 'problems' | 'about';

export function App() {
  const init = useMemo(initialProject, []);
  const [project, setProject] = useState<Project>(init.project);
  const [revision, setRevision] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [lintInfo, setLintInfo] = useState<LintResponse['engine'] | null>(null);
  const [tab, setTab] = useState<Tab>('console');
  const [sizeId, setSizeId] = useState<string>(project.size ? `${project.size.width}x${project.size.height}` : 'manifest');
  const [autoRun, setAutoRun] = useState(true);
  const [runId, setRunId] = useState(0);
  const [html, setHtml] = useState('');
  const [readyRun, setReadyRun] = useState(0);
  const [building, setBuilding] = useState(true);
  const [commands, setCommands] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [gistInput, setGistInput] = useState('');
  const [newFile, setNewFile] = useState<string | null>(null);
  const lint = useRef<LintClient | null>(null);

  const say = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 3500);
  }, []);

  const replaceProject = useCallback((p: Project, why: string) => {
    setProject(p);
    setRevision((r) => r + 1);
    setSizeId(p.size ? `${p.size.width}x${p.size.height}` : 'manifest');
    say(why);
  }, [say]);

  useEffect(() => {
    if (init.gist) {
      loadGist(init.gist)
        .then((p) => replaceProject(p, 'Loaded gist ' + init.gist))
        .catch((e) => say('Could not load gist: ' + e.message));
    } else if (init.source === 'share link') say('Loaded from share link');
    lint.current = new LintClient();
    return () => lint.current?.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const manifest = useMemo(() => parseManifest(project.files['manifest.json']).value, [project.files]);
  const size = useMemo(() => {
    if (sizeId === 'manifest') return panelSize(manifest);
    const [w, h] = sizeId.split('x').map(Number);
    return { width: w, height: h };
  }, [sizeId, manifest]);

  const rebuild = useCallback(() => {
    const b = buildPreview(project, ASSETS);
    setHtml(b.html);
    setLogs(b.compileErrors.map((e) => ({ kind: 'error', level: 'error', text: `${e.file}:${e.line}:${e.column} ${e.message}`, time: Date.now() })));
    setCommands([]);
    setRunId((r) => r + 1);
  }, [project]);
  const onReady = useCallback((id: number) => {
    setReadyRun(id);
    setBuilding(false);
  }, []);

  // Preview: debounced live rebuild.
  useEffect(() => {
    if (!autoRun && html) return;
    setBuilding(true);
    const t = window.setTimeout(rebuild, html ? 350 : 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.files, project.target, project.theme, autoRun]);

  // Lint: debounced.
  useEffect(() => {
    const t = window.setTimeout(() => {
      lint.current?.lint(project.files, project.target).then((r) => {
        setDiagnostics(r.diagnostics);
        setLintInfo(r.engine);
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [project.files, project.target]);

  // Autosave.
  useEffect(() => {
    const t = window.setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(project)), 500);
    return () => window.clearTimeout(t);
  }, [project]);

  const onEdit = useCallback((path: string, value: string) => {
    setProject((p) => (p.files[path] === value ? p : { ...p, files: { ...p.files, [path]: value } }));
  }, []);
  const onLog = useCallback((e: LogEntry) => setLogs((l) => (l.length > 500 ? l.slice(-400) : l).concat(e)), []);
  const onCommands = useCallback((c: { commands: string[] }) => setCommands(c.commands), []);

  const fileNames = Object.keys(project.files).sort((a, b) => (a === 'manifest.json' ? -1 : b === 'manifest.json' ? 1 : a.localeCompare(b)));
  const counts = { error: diagnostics.filter((d) => d.severity === 'error').length, warning: diagnostics.filter((d) => d.severity === 'warning').length };
  const consoleLogs = logs.filter((l) => l.kind !== 'host-call');
  const hostLogs = logs.filter((l) => l.kind === 'host-call');

  const doShare = () => {
    const url = shareUrl(location.href.split('#')[0], { ...project, size: sizeId === 'manifest' ? null : size });
    setShareLink(url);
    navigator.clipboard?.writeText(url).then(() => say('Share link copied'), () => undefined);
  };
  const doZip = () => {
    const r = buildPluginZip(project, ASSETS.vendor);
    download(r.fileName, r.zip as unknown as BlobPart, 'application/zip');
    say(`Downloaded ${r.fileName} (${r.files.length} files)` + (r.warnings.length ? ' — ' + r.warnings.join('; ') : ''));
  };
  const doJson = () => download('playground.json', JSON.stringify(project, null, 2), 'application/json');
  const doGist = () => {
    const m = /([0-9a-f]{20,})/i.exec(gistInput);
    if (!m) return say('Paste a gist URL or id');
    loadGist(m[1])
      .then((p) => {
        replaceProject(p, 'Loaded gist ' + m[1]);
        setImportOpen(false);
      })
      .catch((e) => say('Could not load gist: ' + e.message));
  };
  const onJsonFile = async (f: File | undefined) => {
    if (!f) return;
    const p = sanitizeProject(JSON.parse(await f.text()));
    if (!p) return say('That file is not a playground project');
    replaceProject(p, 'Imported ' + f.name);
    setImportOpen(false);
  };
  const addFile = () => {
    const name = (newFile || '').trim();
    setNewFile(null);
    if (!name) return;
    if (!/^[A-Za-z0-9_\-./]+$/.test(name) || name.includes('..')) return say('Use letters, numbers, - _ . / only');
    if (project.files[name] != null) return say(name + ' already exists');
    setProject((p) => ({ ...p, files: { ...p.files, [name]: '' }, active: name }));
  };
  const removeFile = (name: string) => {
    if (name === 'manifest.json') return;
    if (!window.confirm(`Delete ${name}?`)) return;
    setProject((p) => {
      const files = { ...p.files };
      delete files[name];
      return { ...p, files, active: p.active === name ? 'manifest.json' : p.active };
    });
  };

  return (
    <div className="app">
      <header className="toolbar">
        <div className="brand">
          <span className="logo">UXP</span> Playground
        </div>
        <label>
          Template
          <select data-testid="template" value="" onChange={(e) => e.target.value && replaceProject(templateById(e.target.value).build(), 'Loaded template: ' + templateById(e.target.value).label)}>
            <option value="">Load template…</option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id} title={t.description}>{t.label}</option>
            ))}
          </select>
        </label>
        <label>
          Host
          <select data-testid="host" value={project.target.app} onChange={(e) => setProject((p) => ({ ...p, target: { ...p.target, app: e.target.value as any } }))}>
            {HOSTS.map((h) => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>
        </label>
        <label>
          UXP
          <select data-testid="uxp" value={project.target.uxp} onChange={(e) => setProject((p) => ({ ...p, target: { ...p.target, uxp: e.target.value } }))}>
            {UXP_VERSIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Theme
          <select data-testid="theme" value={project.theme} onChange={(e) => setProject((p) => ({ ...p, theme: e.target.value as Theme }))}>
            {THEMES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Size
          <select data-testid="size" value={sizeId} onChange={(e) => setSizeId(e.target.value)}>
            {SIZES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <span className="spacer" />
        <label className="check">
          <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} data-testid="autorun" /> Live
        </label>
        <button onClick={rebuild} data-testid="run">Run</button>
        <button onClick={doShare} data-testid="share">Share</button>
        <button onClick={doZip} data-testid="download-zip" className="primary">Download plugin .zip</button>
        <button onClick={doJson} data-testid="download-json">Save .json</button>
        <button onClick={() => setImportOpen((o) => !o)} data-testid="import">Import</button>
      </header>

      {shareLink && (
        <div className="bar share-bar">
          <span>Share link (the code lives in the URL; nothing is uploaded):</span>
          <input readOnly value={shareLink} data-testid="share-url" onFocus={(e) => e.target.select()} />
          <span className="muted">{shareLink.length.toLocaleString()} chars</span>
          <button onClick={() => setShareLink(null)}>Close</button>
        </div>
      )}
      {importOpen && (
        <div className="bar import-bar">
          <span>Public gist URL or id:</span>
          <input value={gistInput} onChange={(e) => setGistInput(e.target.value)} placeholder="https://gist.github.com/user/0123abcd…" data-testid="gist-input" />
          <button onClick={doGist}>Load gist</button>
          <span className="muted">or</span>
          <label className="file-btn">
            Open playground.json
            <input type="file" accept=".json,application/json" onChange={(e) => onJsonFile(e.target.files?.[0])} data-testid="json-file" />
          </label>
          <button onClick={() => setImportOpen(false)}>Close</button>
        </div>
      )}

      <main className="workspace">
        <nav className="files" aria-label="Files">
          <div className="section-title">Files</div>
          <ul>
            {fileNames.map((f) => {
              const n = diagnostics.filter((d) => d.file === f && d.severity !== 'info').length;
              return (
                <li key={f} className={f === project.active ? 'active' : ''}>
                  <button className="file" data-testid={`file-${f}`} onClick={() => setProject((p) => ({ ...p, active: f }))}>
                    {f}
                    {n > 0 && <span className="pill">{n}</span>}
                  </button>
                  {f !== 'manifest.json' && (
                    <button className="del" title={`Delete ${f}`} onClick={() => removeFile(f)}>×</button>
                  )}
                </li>
              );
            })}
          </ul>
          {newFile === null ? (
            <button className="add" onClick={() => setNewFile('')} data-testid="add-file">+ New file</button>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); addFile(); }} className="new-file">
              <input autoFocus value={newFile} onChange={(e) => setNewFile(e.target.value)} placeholder="utils.js" onBlur={addFile} data-testid="new-file-name" />
            </form>
          )}
          <div className="section-title">Commands</div>
          {commands.length ? (
            commands.map((c) => (
              <button key={c} className="add" onClick={() => postToPreview({ type: 'invokeCommand', id: c })} data-testid={`command-${c}`}>
                ▶ {c}
              </button>
            ))
          ) : (
            <div className="muted small">Registered commands appear here after entrypoints.setup().</div>
          )}
        </nav>

        <section className="editor-col">
          <div className="tabs">
            <span className="tab active">{project.active}</span>
            <span className="muted small">Autocomplete uses @types/photoshop 27.11.0 and @adobe/cc-ext-uxp-types 7.3.1</span>
          </div>
          <Editor files={project.files} active={project.active} diagnostics={diagnostics} onChange={onEdit} revision={revision} />
        </section>

        <section className="preview-col" data-testid="preview-col" data-ready-run={readyRun} data-state={building ? 'building' : 'ready'}>
          <div className="notice" data-testid="fidelity-notice">
            <strong>Approximate preview.</strong> This runs in your browser, not the UXP engine. Spectrum widgets, CSS support and host APIs are simulated. Check the real result in UDT.
          </div>
          {html && <Preview html={html} project={project} manifest={manifest} size={size} onLog={onLog} onCommands={onCommands} onReady={onReady} runId={runId} />}
        </section>
      </main>

      <section className="bottom">
        <div className="tabs">
          {([
            ['console', `Console (${consoleLogs.length})`],
            ['host', `Host calls (${hostLogs.length})`],
            ['problems', `Problems (${counts.error} ${counts.error === 1 ? 'error' : 'errors'}, ${counts.warning} ${counts.warning === 1 ? 'warning' : 'warnings'})`],
            ['about', 'About fidelity']
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} className={'tab ' + (tab === id ? 'active' : '')} onClick={() => setTab(id)} data-testid={`tab-${id}`}>
              {label}
            </button>
          ))}
          <span className="spacer" />
          <button className="link" onClick={() => setLogs([])}>Clear</button>
        </div>
        <div className="bottom-body" data-testid={`panel-${tab}`}>
          {tab === 'console' && (
            <ul className="log">
              {consoleLogs.map((l, i) => (
                <li key={i} className={`lvl-${l.level || 'log'}`}>
                  <span className="kind">{l.kind === 'console' ? l.level : l.kind}</span> {l.text}
                </li>
              ))}
              {!consoleLogs.length && <li className="muted">No output yet.</li>}
            </ul>
          )}
          {tab === 'host' && (
            <ul className="log">
              {hostLogs.map((l, i) => (
                <li key={i} className={`lvl-${l.level}`}>
                  <span className="kind">host</span> {l.text}
                </li>
              ))}
              {!hostLogs.length && <li className="muted">Calls to the mocked photoshop / uxp modules are listed here.</li>}
            </ul>
          )}
          {tab === 'problems' && (
            <div>
              <div className="muted small" data-testid="lint-engine">
                {lintInfo
                  ? `${lintInfo.name} ${lintInfo.version} + ${lintInfo.plugin} ${lintInfo.pluginVersion}${lintInfo.fallback ? ' (eslint-plugin-uxp-lint not bundled in this build)' : ''} · plus manifest and CSS checks`
                  : 'Linting…'}
              </div>
              <ul className="log">
                {diagnostics.map((d, i) => (
                  <li key={i} className={`lvl-${d.severity}`}>
                    <button className="link" onClick={() => revealLine(d.file, d.line, d.column)}>
                      {d.file}:{d.line}:{d.column}
                    </button>{' '}
                    <span className={`sev ${d.severity}`}>{d.severity}</span> {d.message} <span className="muted">({d.ruleId})</span>
                  </li>
                ))}
                {!diagnostics.length && <li className="muted">No problems found.</li>}
              </ul>
            </div>
          )}
          {tab === 'about' && <About />}
        </div>
      </section>
      {toast && <div className="toast" role="status" data-testid="toast">{toast}</div>}
    </div>
  );
}

function About() {
  return (
    <div className="about">
      <p>
        <strong>What is real:</strong> your files, the manifest, the exported zip, ESLint, the TypeScript typings used for autocomplete, and the JavaScript itself
        (it runs in your browser's engine, not UXP's V8 build).
      </p>
      <p>
        <strong>What is approximated:</strong> the panel's look (Spectrum UXP widgets are re-created with web components; Adobe documents the real ones as not being web
        components), theme colours, the <code>photoshop</code>, <code>uxp</code>, <code>premierepro</code> and <code>indesign</code> modules (hand-written mocks with
        one sample document), permission checks, and the modal-scope rule.
      </p>
      <p>
        <strong>Not simulated:</strong> UXP's CSS/layout engine and its unsupported CSS, host fonts, real batchPlay results for most events, history, imaging, WebViews,
        dialogs, flyout menus, entrypoint timeouts, real file system and consent prompts.
      </p>
      <p>
        Photoshop → UXP versions known from Adobe's changelog:{' '}
        {PS_UXP_TABLE.map((r) => `PS ${r.ps} → UXP ${r.uxp}`).join(' · ')}.
      </p>
    </div>
  );
}
