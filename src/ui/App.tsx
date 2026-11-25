import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Preview, postToPreview, type EntrypointInfo } from './Preview';
import { buildTemplate, templateById, templateHash, TEMPLATES } from '../core/templates';
import { PREMIERE_SCENARIOS, type PreviewScenario } from '../core/scenarios';
import { buildPreview, type RuntimeAssets, type PreviewBuild } from '../core/buildPreview';
import { ArchiveLimitError, buildPluginZip, MAX_ARCHIVE_BYTES, readZip } from '../core/exportZip';
import { panelSize, parseManifest, primaryHost, type Diagnostic } from '../core/manifest';
import { readHash, sanitizeProject, share, validFileName, type Reproduction } from '../core/share';
import { loadGist } from '../core/gist';
import { importGithub, parseGithubSpec, specToString } from '../core/github';
import { importTree, ImportError, type ImportReport, type RawFiles } from '../core/importer';
import { bytesToBase64, base64ToBytes, isBinaryContent, humanSize, fileSize } from '../core/files';
import { HOSTS, hostInfo, type HostApp } from '../core/hosts';
import { PS_UXP_TABLE, UXP_VERSIONS } from '../core/versions';
import type { LogEntry, Project, Theme } from '../core/types';
import { LintClient } from '../lint/client';
import type { LintResponse } from '../lint/adapter';
import { loadPrefs, loadSavedAsync, loadSavedSync, savePrefs, saveProject, type UiPrefs } from './storage';
import { readDrop, readFileList } from './dropFiles';
import { Icon } from './components/Icon';
import { Splitter } from './components/Splitter';
import { Dialog } from './components/Dialog';
import { FileTree } from './components/FileTree';
import { CommandPalette, type PaletteCommand } from './components/CommandPalette';
import { ConsoleView, HostLog, ProblemsView } from './components/LogViews';
import { ManifestPanel } from './components/ManifestPanel';
import { Gallery, loadExampleFiles, loadExampleIndex, type ExampleMeta } from './components/Gallery';
import { ImportDialog } from './components/ImportDialog';
import { ShareDialog } from './components/ShareDialog';
import { ReproductionDetails, ReproductionDialog } from './components/ReproductionDialog';
import { RecipeGuide, templateFromManifest } from './components/RecipeGuide';
import { Welcome } from './components/Welcome';
import { HostDialog } from './components/HostDialog';
import { useFolderSync } from './useFolderSync';
import runtimeSrc from '../runtime/runtime.js?raw';
import panelCss from '../runtime/panel.css?raw';
import shimCss from '../runtime/shim.css?raw';
import psApi from '../generated/ps-api.json';

// Monaco (about 4 MB) loads in its own chunk after first paint; a read-only view shows the file until then.
const Editor = lazy(() => import('./Editor').then((m) => ({ default: m.Editor })));

const ASSETS: RuntimeAssets = { runtime: runtimeSrc, panelCss, shimCss, vendor: null, psApi };
/** The vendored React bundle (~220 KB) only ships to projects that use React, so it is fetched on demand. */
let vendorLoading: Promise<string> | null = null;
function loadVendor(): Promise<string> {
  vendorLoading ??= import('../generated/react-bundle.js?raw').then((m) => (ASSETS.vendor = m.default));
  return vendorLoading;
}
/** Source-level check (before compiling): JSX files or a React import mean the preview needs the vendor bundle. */
function mayUseReact(files: Record<string, string>): boolean {
  return Object.entries(files).some(([k, v]) => /\.(jsx|tsx)$/i.test(k) || (/\.(js|mjs|cjs|ts)$/i.test(k) && /['"]react(-dom)?(\/[\w-]+)?['"]/.test(v)));
}
async function vendorForProject(project: Project): Promise<string | null> {
  return mayUseReact(project.files) ? loadVendor() : null;
}
const THEMES: Theme[] = ['darkest', 'dark', 'medium', 'light', 'lightest'];
const SIZES = [
  { id: 'manifest', label: 'Manifest size' },
  { id: '230x300', label: '230 × 300' },
  { id: '320x480', label: '320 × 480' },
  { id: '400x640', label: '400 × 640' },
  { id: '600x400', label: '600 × 400' }
];
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
const DOCS = {
  manifest: 'https://developer.adobe.com/photoshop/uxp/2022/guides/uxp_guide/uxp-misc/manifest-v5/',
  css: 'https://developer.adobe.com/photoshop/uxp/2022/uxp-api/reference-css/'
};

type BottomTab = 'console' | 'host' | 'problems' | 'manifest' | 'about';
type MobileView = 'files' | 'code' | 'preview' | 'output';
type DialogId = 'import' | 'share' | 'reproduce' | 'reproduction-notes' | 'recipe' | 'shortcuts' | 'gallery' | 'run-host' | null;
interface Banner {
  kind: 'info' | 'warn' | 'error';
  text: string;
  details?: string[];
}

const params = new URLSearchParams(location.search);
const EMBED = params.get('embed') === '1';
const EMBED_VIEW = (params.get('view') as 'split' | 'editor' | 'preview' | null) || 'split';
const READ_ONLY = EMBED && params.get('readonly') === '1';

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

function sizeIdOf(p: Project) {
  return p.size ? `${p.size.width}x${p.size.height}` : 'manifest';
}

function initialState(): { project: Project; pending: ReturnType<typeof readHash> | 'idb' | null; source: string; reproduction?: Reproduction } {
  const h = readHash(location.hash);
  const start = templateById('hello').build();
  if (h?.kind === 'state') return h.project ? { project: h.project, pending: null, source: 'share link', reproduction: h.reproduction } : { project: start, pending: null, source: 'bad-link' };
  if (h) return { project: start, pending: h, source: h.kind };
  if (!EMBED) {
    const saved = loadSavedSync();
    if (saved === 'idb') return { project: start, pending: 'idb', source: 'autosave' };
    if (saved) return { project: saved, pending: null, source: 'autosave' };
  }
  return { project: start, pending: null, source: 'template' };
}

function rawFromApi(files: Record<string, string | { text?: string; base64?: string }>): RawFiles {
  const raw: RawFiles = {};
  for (const [k, v] of Object.entries(files)) raw[k] = typeof v === 'string' ? v : v.base64 != null ? base64ToBytes(v.base64) : v.text ?? '';
  return raw;
}

export function App() {
  const init = useMemo(initialState, []);
  const [project, setProject] = useState<Project>(init.project);
  const [reproduction, setReproduction] = useState<Reproduction | undefined>(init.reproduction);
  const [revision, setRevision] = useState(0);
  const [projectSession, setProjectSession] = useState(0);
  const [tabs, setTabs] = useState<string[]>(() => [...new Set(['manifest.json', init.project.active])].filter((f) => init.project.files[f] != null));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lintDiagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [compatibilityDiagnostics, setCompatibilityDiagnostics] = useState<Diagnostic[]>([]);
  const diagnostics = useMemo(() => [...lintDiagnostics, ...compatibilityDiagnostics], [lintDiagnostics, compatibilityDiagnostics]);
  const [lintInfo, setLintInfo] = useState<LintResponse['engine'] | null>(null);
  const [bottomTab, setBottomTab] = useState<BottomTab>(EMBED && params.get('console') === '1' ? 'console' : 'console');
  const [sizeId, setSizeId] = useState(sizeIdOf(init.project));
  const [autoRun, setAutoRun] = useState(true);
  const [runId, setRunId] = useState(0);
  const [build, setBuild] = useState<PreviewBuild | null>(null);
  const [ready, setReady] = useState(false);
  const [entrypoints, setEntrypoints] = useState<EntrypointInfo>({ panels: [], commands: [], menus: {} });
  const [missingPackages, setMissingPackages] = useState<string[]>([]);
  const [toast, setToast] = useState<{ text: string; kind?: 'error' } | null>(null);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [palette, setPalette] = useState<string | null>(null);
  const [prefs, setPrefsState] = useState<UiPrefs>(loadPrefs);
  // A #github / #gist / #example link (or a large autosave) loads after first paint: the starter is not run meanwhile,
  // so embeds on docs pages never flash the wrong plugin.
  const [routePending, setRoutePending] = useState(() => init.pending === 'idb' || (!!init.pending && ['github', 'gist', 'example'].includes(init.pending.kind)));
  const [welcome, setWelcome] = useState(() => !EMBED && init.source === 'template' && !loadPrefs().seenWelcome);
  const [banner, setBanner] = useState<Banner | null>(init.source === 'bad-link' ? { kind: 'error', text: 'This share link is damaged or incomplete, so the starter panel was opened instead.' } : null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<{ source: 'github' | 'zip'; list: string[]; retry: (root: string) => void } | null>(null);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed' | 'off'>(EMBED ? 'off' : 'saved');
  const [narrow, setNarrow] = useState(() => matchMedia('(max-width: 860px)').matches);
  const [mobileView, setMobileView] = useState<MobileView>('code');
  const [dragging, setDragging] = useState(false);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const lint = useRef<LintClient | null>(null);
  const routeHash = useRef<string | null>(init.pending && init.pending !== 'idb' ? location.hash : null);

  const setPrefs = useCallback((patch: Partial<UiPrefs>) => {
    setPrefsState((p) => {
      const next = { ...p, ...patch };
      if (!EMBED) savePrefs(next);
      return next;
    });
  }, []);
  const appTheme: 'dark' | 'light' = EMBED && (params.get('theme') === 'light' || params.get('theme') === 'dark') ? (params.get('theme') as 'dark' | 'light') : prefs.appTheme === 'system' ? (systemDark ? 'dark' : 'light') : prefs.appTheme;

  const say = useCallback((text: string, kind?: 'error') => {
    setToast({ text, kind });
    window.setTimeout(() => setToast((cur) => (cur?.text === text ? null : cur)), kind === 'error' ? 6000 : 3200);
  }, []);

  // ---------------------------------------------------------------- project loading
  const loadProject = useCallback(
    (p: Project, why: string | null, opts: { report?: ImportReport | null; origin?: string | null; keepHash?: boolean } = {}) => {
      setRoutePending(false);
      setReady(false); // the preview shows the previous project until the new build runs
      setProject(p);
      setReproduction(undefined);
      setRevision((r) => r + 1);
      setProjectSession((s) => s + 1);
      setTabs([...new Set(['manifest.json', p.active])].filter((f) => p.files[f] != null));
      setSizeId(sizeIdOf(p));
      setImportReport(opts.report ?? null);
      setOrigin(opts.origin ?? null);
      setMissingPackages([]);
      setCandidates(null);
      setWelcome(false);
      if (opts.report) {
        const r = opts.report;
        const details = [...r.notes];
        if (r.entryStub) details.unshift(`${r.entryStub.file} was generated to load ${r.entryStub.entry} without a bundler. It is marked with a comment; delete it once you add your own build output.`);
        if (r.skipped.length) details.push(`${r.skipped.length} file${r.skipped.length > 1 ? 's' : ''} skipped: ${r.skipped.slice(0, 5).map((s) => `${s.path} (${s.reason})`).join(', ')}${r.skipped.length > 5 ? '…' : ''}`);
        setBanner(details.length ? { kind: r.entryStub ? 'warn' : 'info', text: `Imported ${r.fileCount} files (${humanSize(r.totalBytes)})${r.root ? ' from ' + r.root : ''}.`, details } : null);
      } else setBanner(null);
      if (!opts.keepHash && location.hash && !EMBED) history.replaceState(null, '', location.pathname + location.search);
      if (why) say(why);
    },
    [say]
  );

  const importRaw = useCallback(
    (raw: RawFiles, name: string, root?: string, retry?: (root: string) => void) => {
      try {
        const r = importTree(raw, { name, root });
        loadProject(r.project, `Opened ${r.project.name}`, { report: r.report });
        setDialog(null);
        return true;
      } catch (e: any) {
        if (e instanceof ImportError && (e.candidates?.length ?? 0) > 1 && retry) {
          setCandidates({ source: 'zip', list: e.candidates!, retry });
          setDialog('import');
          return false;
        }
        throw e;
      }
    },
    [loadProject]
  );

  const openGithub = useCallback(
    async (input: string, root?: string) => {
      const spec = parseGithubSpec(input);
      if (!spec) throw new Error('Use owner/repo, owner/repo/sub/folder or a github.com URL.');
      setLoading(`Loading ${specToString(spec)} from GitHub…`);
      try {
        const r = await importGithub(spec, { root, onProgress: (done, total) => setLoading(`Downloading ${done} of ${total} files from GitHub…`) });
        const finalSpec = specToString({ ...r.spec, path: [r.spec.path, r.report.root.replace(/\/$/, '')].filter(Boolean).join('/') || undefined } as any);
        loadProject(r.project, `Opened ${r.project.name} from GitHub`, { report: r.report, origin: location.origin + location.pathname + '#github=' + encodeURIComponent(finalSpec) });
        setDialog(null);
      } catch (e: any) {
        if (e instanceof ImportError && (e.candidates?.length ?? 0) > 1) {
          setCandidates({ source: 'github', list: e.candidates!, retry: (c) => openGithub(input, c).catch((err) => say(String(err.message || err), 'error')) });
          setDialog('import');
          return;
        }
        throw e;
      } finally {
        setLoading(null);
      }
    },
    [loadProject, say]
  );

  const openExample = useCallback(
    async (meta: ExampleMeta) => {
      setLoading(`Loading ${meta.title}…`);
      try {
        const files = await loadExampleFiles(meta);
        const r = importTree(files, { name: meta.title });
        loadProject(r.project, `Opened example: ${meta.title}`, { report: r.report.entryStub || r.report.notes.length ? r.report : null, origin: location.origin + location.pathname + '#example=' + meta.id });
        setDialog(null);
      } catch (e: any) {
        say(String(e.message || e), 'error');
      } finally {
        setLoading(null);
      }
    },
    [loadProject, say]
  );

  const openTemplate = useCallback(
    (id: string, app?: HostApp) => {
      const t = templateById(id);
      loadProject(buildTemplate(t, app), `New project from "${t.label}"`, { origin: location.origin + location.pathname + templateHash(t, app) });
      setDialog(null);
    },
    [loadProject]
  );

  const openZipFile = useCallback(
    async (file: File, root?: string) => {
      if (file.size > MAX_ARCHIVE_BYTES) throw new Error('Archive exceeds the 50 MB import limit.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      let raw: RawFiles;
      try {
        raw = readZip(bytes);
      } catch (e) {
        if (e instanceof ArchiveLimitError) throw e;
        throw new Error(`${file.name} is not a valid zip or .ccx archive.`);
      }
      importRaw(raw, file.name.replace(/\.(zip|ccx)$/i, ''), root, (c) => {
        try {
          importRaw(raw, file.name.replace(/\.(zip|ccx)$/i, ''), c);
        } catch (e: any) {
          say(String(e.message || e), 'error');
        }
      });
    },
    [importRaw, say]
  );

  const openJsonFile = useCallback(
    async (file: File) => {
      let data: any;
      try {
        data = JSON.parse(await file.text());
      } catch {
        throw new Error(`${file.name} is not valid JSON.`);
      }
      const p = sanitizeProject(data);
      if (!p) throw new Error(`${file.name} is not a saved playground project. To open a plugin, import its folder or zip.`);
      loadProject(p, 'Opened ' + file.name);
      setDialog(null);
    },
    [loadProject]
  );

  const openGist = useCallback(
    async (id: string) => {
      setLoading('Loading gist…');
      try {
        const p = await loadGist(id);
        loadProject(p, 'Opened gist ' + id.slice(0, 8), { origin: location.origin + location.pathname + '#gist=' + id });
        setDialog(null);
      } finally {
        setLoading(null);
      }
    },
    [loadProject]
  );

  // Hash routes and IndexedDB autosave resolve after first paint.
  useEffect(() => {
    // A preview-only embed shows no problems, so it skips the ESLint worker (2.2 MB).
    if (!(EMBED && EMBED_VIEW === 'preview' && params.get('console') !== '1')) lint.current = new LintClient();
    const pending = init.pending;
    const fail = (what: string) => (e: any) => {
      setRoutePending(false);
      setBanner({ kind: 'error', text: `Could not open ${what}: ${e?.message || e}`, details: ['The starter panel is open instead.'] });
    };
    if (pending === 'idb') loadSavedAsync().then((p) => (p ? loadProject(p, null) : setRoutePending(false)), () => setRoutePending(false));
    else if (pending?.kind === 'github') openGithub(pending.spec).catch(fail(pending.spec)).finally(() => setRoutePending(false));
    else if (pending?.kind === 'gist') openGist(pending.id).catch(fail('gist ' + pending.id)).finally(() => setRoutePending(false));
    else if (pending?.kind === 'template') {
      const t = TEMPLATES.find((x) => x.id === pending.id);
      if (t) loadProject(buildTemplate(t, pending.host), null, { keepHash: true, origin: location.href });
      else fail('template')(new Error(`no template "${pending.id}"`));
    } else if (pending?.kind === 'example') {
      setLoading('Loading example…');
      loadExampleIndex()
        .then((idx) => {
          const m = idx.examples.find((x) => x.id === pending.id);
          if (!m) throw new Error(`no example "${pending.id}"`);
          return openExample(m);
        })
        .catch(fail('example'))
        .finally(() => {
          setLoading(null);
          setRoutePending(false);
        });
    } else if (init.source === 'share link') say('Opened from a share link');
    const mq = matchMedia('(max-width: 860px)');
    const dq = matchMedia('(prefers-color-scheme: dark)');
    const onMq = () => setNarrow(mq.matches);
    const onDq = () => setSystemDark(dq.matches);
    // Opening a project link in this tab must also rerun the initial route loader.
    const onHash = () => { if (readHash(location.hash)) location.reload(); };
    window.addEventListener('hashchange', onHash);
    mq.addEventListener('change', onMq);
    dq.addEventListener('change', onDq);
    return () => {
      lint.current?.dispose();
      window.removeEventListener('hashchange', onHash);
      mq.removeEventListener('change', onMq);
      dq.removeEventListener('change', onDq);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dataset.appTheme = appTheme;
  }, [appTheme]);

  // ---------------------------------------------------------------- derived
  const manifestParse = useMemo(() => parseManifest(project.files['manifest.json']), [project.files]);
  const manifest = manifestParse.value;
  const exampleTemplate = templateFromManifest(manifest?.id);
  const scenario = project.target.app === 'premierepro' ? project.scenario ?? 'sample' : 'sample';
  const size = useMemo(() => {
    if (sizeId === 'manifest') return panelSize(manifest);
    const [w, h] = sizeId.split('x').map(Number);
    return { width: w || 320, height: h || 480 };
  }, [sizeId, manifest]);

  // ---------------------------------------------------------------- preview build
  const [vendorReady, setVendorReady] = useState(false);
  const buildScenario = useRef<PreviewScenario>('sample');
  const folderSync = useFolderSync(project, projectSession, vendorForProject, say);
  const rebuild = useCallback(() => {
    if (!ASSETS.vendor && mayUseReact(project.files)) {
      setReady(false);
      loadVendor().then(() => setVendorReady(true), (e) => say('Could not load React for the preview: ' + (e?.message || e), 'error'));
      return;
    }
    let b: PreviewBuild;
    try {
      b = buildPreview(project, ASSETS, scenario);
    } catch (e: any) {
      setLogs([{ kind: 'error', level: 'error', text: 'Preview build failed: ' + (e?.message || e), time: Date.now() }]);
      return;
    }
    setBuild(b);
    buildScenario.current = scenario;
    setReady(false);
    const sys: LogEntry[] = b.compileErrors.map((e) => ({ kind: 'error', level: 'error', text: e.message, file: e.file, line: e.line, time: Date.now() }));
    if (!b.entryHtml && !b.headless) sys.push({ kind: 'system', level: 'warn', text: 'No plugin entry file to show. Check "main" in manifest.json.', file: 'manifest.json', time: Date.now() });
    // Missing scripts are reported by the runtime when the panel tries to load them; list the rest here.
    for (const m of b.missing.filter((x) => !/\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(x))) sys.push({ kind: 'system', level: 'warn', text: `${m} is referenced by ${b.entryHtml} but is not in the project.`, file: b.entryHtml || undefined, time: Date.now() });
    setLogs(sys);
    setEntrypoints({ panels: [], commands: [], menus: {} });
    setMissingPackages(b.unresolvedPackages);
    setRunId((r) => r + 1);
  }, [project, say, scenario]);

  useEffect(() => {
    if (routePending) return;
    if (!autoRun && build && buildScenario.current === scenario) return;
    const t = window.setTimeout(rebuild, build ? 400 : 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.files, project.target, scenario, autoRun, vendorReady, routePending]);

  // Lint (worker, debounced).
  useEffect(() => {
    const t = window.setTimeout(() => {
      lint.current?.lint(project.files, project.target).then((r) => {
        setDiagnostics(r.diagnostics);
        setLintInfo(r.engine);
      });
    }, 250);
    return () => window.clearTimeout(t);
  }, [project.files, project.target]);

  // Autosave (localStorage, IndexedDB for big projects). Embeds never write the reader's storage.
  useEffect(() => {
    if (EMBED) return;
    let current = true;
    setSaveState('saving');
    const t = window.setTimeout(() => saveProject(project).then((r) => {
      if (current) setSaveState(r === 'failed' ? 'failed' : 'saved');
    }), 600);
    return () => { current = false; window.clearTimeout(t); };
  }, [project]);

  // ---------------------------------------------------------------- edits
  const onEdit = useCallback((path: string, value: string) => {
    setProject((p) => (p.files[path] === value ? p : { ...p, files: { ...p.files, [path]: value } }));
    if (routeHash.current && location.hash === routeHash.current) {
      history.replaceState(null, '', location.pathname + location.search);
      routeHash.current = null;
    }
  }, []);
  const openFile = useCallback((path: string) => {
    setProject((p) => (p.files[path] == null ? p : { ...p, active: path }));
    setTabs((t) => (t.includes(path) ? t : [...t, path]));
    setMobileView('code');
  }, []);
  const closeTab = useCallback(
    (path: string) => {
      setTabs((t) => {
        const next = t.filter((x) => x !== path);
        if (project.active === path) {
          const i = t.indexOf(path);
          const fallback = next[Math.min(i, next.length - 1)] || 'manifest.json';
          setProject((p) => ({ ...p, active: p.files[fallback] != null ? fallback : Object.keys(p.files)[0] }));
        }
        return next;
      });
    },
    [project.active]
  );
  const revealAt = useCallback(
    (file: string, line?: number, column = 1) => {
      if (project.files[file] == null) return say(`${file} is not in the project`, 'error');
      openFile(file);
      if (!line) return;
      const w = window as any;
      if (w.__pgReveal) setTimeout(() => w.__pgReveal(file, line, column), 30);
      else w.__pgPendingReveal = { path: file, line, column };
    },
    [openFile, project.files, say]
  );
  const createFile = useCallback(
    (path: string) => {
      const name = path.trim().replace(/^\/+/, '');
      if (!name) return;
      if (!validFileName(name)) return say('That name has characters UXP plugins cannot use (\\ : * ? " < > | or ..).', 'error');
      if (project.files[name] != null) return say(name + ' already exists', 'error');
      setProject((p) => ({ ...p, files: { ...p.files, [name]: '' }, active: name }));
      setTabs((t) => [...t, name]);
    },
    [project.files, say]
  );
  const deleteFile = useCallback(
    (path: string) => {
      if (path === 'manifest.json') return say('manifest.json is required', 'error');
      const under = Object.keys(project.files).filter((f) => f === path || f.startsWith(path + '/'));
      if (!under.length || !window.confirm(under.length > 1 ? `Delete ${path} and its ${under.length} files?` : `Delete ${path}?`)) return;
      setProject((p) => {
        const files = { ...p.files };
        for (const f of under) delete files[f];
        return { ...p, files, active: under.includes(p.active) ? 'manifest.json' : p.active };
      });
      setTabs((t) => t.filter((x) => !under.includes(x)));
    },
    [project.files, say]
  );
  const renameFile = useCallback(
    (from: string, to: string) => {
      to = to.trim().replace(/^\/+/, '');
      if (!to || to === from) return;
      if (!validFileName(to)) return say('That name has characters UXP plugins cannot use.', 'error');
      const moves = Object.keys(project.files).filter((f) => f === from || f.startsWith(from + '/'));
      if (moves.some((f) => project.files[to + f.slice(from.length)] != null)) return say(to + ' already exists', 'error');
      setProject((p) => {
        const files: Record<string, string> = {};
        for (const [k, v] of Object.entries(p.files)) files[moves.includes(k) ? to + k.slice(from.length) : k] = v;
        const active = moves.includes(p.active) ? to + p.active.slice(from.length) : p.active;
        return { ...p, files, active };
      });
      setTabs((t) => t.map((x) => (moves.includes(x) ? to + x.slice(from.length) : x)));
      setRevision((r) => r + 1);
    },
    [project.files, say]
  );

  const onLog = useCallback((e: LogEntry) => {
    setLogs((l) => {
      const last = l[l.length - 1];
      if (last && last.kind === e.kind && last.text === e.text && last.level === e.level && e.kind !== 'host-call') {
        const copy = l.slice();
        copy[copy.length - 1] = { ...last, count: (last.count || 1) + 1, time: e.time };
        return copy;
      }
      return (l.length > 1000 ? l.slice(-800) : l).concat(e);
    });
  }, []);
  const [readyCount, setReadyCount] = useState(0);
  const onReady = useCallback(() => {
    setReady(true);
    setReadyCount((n) => n + 1);
  }, []);
  const onMissingPackage = useCallback((name: string) => setMissingPackages((m) => (m.includes(name) ? m : [...m, name])), []);
  const onBatchPlayResult = useCallback(
    (r: any) => {
      setBottomTab('host');
      if (r?.error) say('batchPlay: ' + r.error, 'error');
      else say('batchPlay ran in the mock');
    },
    [say]
  );

  // ---------------------------------------------------------------- actions
  const shareBase = location.origin + location.pathname;
  const projectForShare = useMemo(() => ({ ...project, size: sizeId === 'manifest' ? null : size }), [project, sizeId, size]);
  const doZip = useCallback(async () => {
    const r = buildPluginZip(project, mayUseReact(project.files) ? await loadVendor() : null);
    download(r.fileName, r.zip as unknown as BlobPart, 'application/zip');
    if (r.problems.length) {
      setBanner({ kind: 'warn', text: `Downloaded ${r.fileName}, but UXP Developer Tool may reject it:`, details: r.problems });
    } else say(`Downloaded ${r.fileName} (${r.files.length} files)` + (r.warnings.length ? '. ' + r.warnings.join(' ') : ''));
  }, [project, say]);
  const doJson = useCallback(() => download(`${project.name.replace(/[^\w.-]+/g, '-') || 'playground'}.json`, JSON.stringify(project, null, 2), 'application/json'), [project]);
  const runCommand = useCallback((id: string) => postToPreview({ type: 'invokeCommand', id }), []);
  const runDescriptors = useCallback((descriptors: any[]) => postToPreview({ type: 'batchPlay', descriptors }), []);
  const copyText = useCallback(
    (text: string, what: string) => {
      navigator.clipboard?.writeText(text).then(
        () => say(what + ' copied'),
        () => say('Clipboard is blocked here; select and copy manually', 'error')
      );
    },
    [say]
  );
  const toggleSidebar = useCallback(() => setPrefs({ sidebarOpen: !prefs.sidebarOpen }), [prefs.sidebarOpen, setPrefs]);
  const toggleBottom = useCallback(() => setPrefs({ bottomOpen: !prefs.bottomOpen }), [prefs.bottomOpen, setPrefs]);
  const cycleTheme = useCallback(() => setPrefs({ appTheme: prefs.appTheme === 'system' ? (systemDark ? 'light' : 'dark') : prefs.appTheme === 'dark' ? 'light' : 'dark' }), [prefs.appTheme, systemDark, setPrefs]);
  const showBottom = useCallback(
    (t: BottomTab) => {
      setBottomTab(t);
      if (!prefs.bottomOpen) setPrefs({ bottomOpen: true });
      setMobileView('output');
    },
    [prefs.bottomOpen, setPrefs]
  );

  // ---------------------------------------------------------------- drag and drop import
  useEffect(() => {
    if (READ_ONLY) return;
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setDragging(true);
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      if (--depth <= 0) setDragging(false);
    };
    const over = (e: DragEvent) => hasFiles(e) && e.preventDefault();
    const drop = async (e: DragEvent) => {
      if (!hasFiles(e) || !e.dataTransfer) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      try {
        const { raw, single } = await readDrop(e.dataTransfer);
        if (single) await (/\.json$/i.test(single.name) ? openJsonFile(single) : openZipFile(single));
        else importRaw(raw, 'Dropped plugin', undefined, (c) => importRaw(raw, 'Dropped plugin', c));
      } catch (err: any) {
        say(String(err?.message || err), 'error');
      }
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
    };
  }, [importRaw, openJsonFile, openZipFile, say]);

  // ---------------------------------------------------------------- keyboard shortcuts
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') rebuild();
      else if (k === 's') say(EMBED ? 'Embeds do not save. Open in the playground to keep changes.' : 'Saved in this browser. Use Share or Download to take it elsewhere.');
      else if (k === 'k' || (k === 'p' && e.shiftKey)) setPalette('>');
      else if (k === 'p') setPalette('');
      else if (k === 'b' && !EMBED) toggleSidebar();
      else if (k === 'j' && !EMBED) toggleBottom();
      else if (k === '/' && e.shiftKey) setDialog('shortcuts');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [rebuild, say, toggleSidebar, toggleBottom]);

  // ---------------------------------------------------------------- automation + embed API
  const stateRef = useRef({ project, logs, diagnostics, entrypoints, build, ready, missingPackages, importReport, lintInfo, projectForShare });
  stateRef.current = { project, logs, diagnostics, entrypoints, build, ready, missingPackages, importReport, lintInfo, projectForShare };
  useEffect(() => {
    const api = {
      version: 1,
      /** Imports raw files ({ path: text } or { path: { text } | { base64 } }) the same way a dropped folder is imported. */
      importFiles(files: Record<string, any>, opts: { name?: string; root?: string } = {}) {
        try {
          const r = importTree(rawFromApi(files), { name: opts.name, root: opts.root });
          loadProject(r.project, null, { report: r.report });
          return { ok: true, report: r.report, files: Object.keys(r.project.files).length };
        } catch (e: any) {
          return { ok: false, error: String(e?.message || e), candidates: e?.candidates };
        }
      },
      getProject: () => stateRef.current.project,
      setProject(p: any) {
        const s = sanitizeProject(p);
        if (!s) return false;
        loadProject(s, null);
        return true;
      },
      run: () => rebuild(),
      getReport() {
        const s = stateRef.current;
        const consoleLines = s.logs.filter((l) => l.kind !== 'host-call').map((l) => `${l.level || 'log'}: ${l.file ? l.file + (l.line ? ':' + l.line : '') + ' ' : ''}${l.text}`);
        const host = s.logs.filter((l) => l.kind === 'host-call');
        const sh = share(shareBase, s.projectForShare);
        return {
          ready: s.ready,
          console: consoleLines,
          errors: s.logs.filter((l) => l.level === 'error' || l.level === 'warn').filter((l) => l.kind !== 'host-call').map((l) => `${l.level}: ${l.file ? l.file + (l.line ? ':' + l.line : '') + ' ' : ''}${l.text}`),
          host: host.map((l) => l.text),
          hostErrors: host.filter((l) => l.level === 'error').map((l) => l.text),
          notSimulated: host.filter((l) => l.detail?.unsupported || /not simulated/.test(l.text)).map((l) => l.text),
          problems: s.diagnostics.map((d) => `${d.severity} ${d.file}:${d.line} ${d.message} (${d.ruleId})`),
          entrypoints: s.entrypoints,
          missing: s.build?.missing || [],
          unresolvedPackages: s.missingPackages,
          importReport: s.importReport,
          shareLength: sh.length,
          shareStatus: sh.status,
          shareOmitted: sh.omitted,
          lintEngine: s.lintInfo
        };
      },
      async exportZipBase64() {
        const p = stateRef.current.project;
        const r = buildPluginZip(p, mayUseReact(p.files) ? await loadVendor() : null);
        return bytesToBase64(r.zip);
      }
    };
    (window as any).uxpPlayground = api;
    // Embeds: a host page can drive the playground with postMessage.
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== 'object' || typeof d.type !== 'string' || !d.type.startsWith('uxp-playground:')) return;
      if (!EMBED || e.source !== window.parent || e.source === window) return;
      if (d.type === 'uxp-playground:load' && d.project) api.setProject(d.project);
      else if (d.type === 'uxp-playground:load' && d.files) api.importFiles(d.files, { name: d.name });
      else if (d.type === 'uxp-playground:run') rebuild();
      else if (d.type === 'uxp-playground:set-file' && typeof d.path === 'string' && typeof d.content === 'string' && !READ_ONLY) {
        setProject((p) => ({ ...p, files: { ...p.files, [d.path]: d.content } }));
        setRevision((r) => r + 1);
      }
    };
    window.addEventListener('message', onMsg);
    if (window.parent !== window) window.parent.postMessage({ type: 'uxp-playground:ready', version: 1 }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, [loadProject, rebuild, shareBase]);

  // Tell an embedding page about run results.
  useEffect(() => {
    if (!EMBED || !ready || window.parent === window) return;
    const errors = logs.filter((l) => l.level === 'error').length;
    window.parent.postMessage({ type: 'uxp-playground:ran', errors }, '*');
  }, [ready, logs]);

  // ---------------------------------------------------------------- palette commands
  const paletteCommands = useMemo<PaletteCommand[]>(() => {
    const cmds: PaletteCommand[] = [
      { id: 'run', title: 'Run preview', group: 'Preview', hint: `${MOD}+Enter`, icon: 'play', run: rebuild },
      { id: 'live', title: autoRun ? 'Turn off live preview' : 'Turn on live preview', group: 'Preview', icon: 'refresh', run: () => setAutoRun(!autoRun) },
      ...THEMES.map((t) => ({ id: 'theme-' + t, title: `Panel theme: ${t}`, group: 'Preview', icon: 'eye', run: () => setProject((p) => ({ ...p, theme: t })) })),
      ...SIZES.map((s) => ({ id: 'size-' + s.id, title: `Panel size: ${s.label}`, group: 'Preview', icon: 'eye', run: () => setSizeId(s.id) })),
      ...entrypoints.commands.map((c) => ({ id: 'cmd-' + c, title: `Invoke command: ${c}`, group: 'Plugin', icon: 'command', run: () => runCommand(c) })),
      { id: 'share', title: 'Share link or embed code…', group: 'Project', icon: 'share', run: () => setDialog('share') },
      { id: 'zip', title: 'Download plugin .zip (for UXP Developer Tool)', group: 'Project', icon: 'download', run: doZip },
      { id: 'run-host', title: 'Run in host…', group: 'Project', icon: 'play', run: () => setDialog('run-host') },
      { id: 'json', title: 'Save project as .json', group: 'Project', icon: 'file', run: doJson },
      { id: 'import', title: 'Import from GitHub, zip, folder or gist…', group: 'Project', icon: 'upload', run: () => setDialog('import') },
      { id: 'gallery', title: 'Browse examples…', group: 'Project', icon: 'book', run: () => setDialog('gallery') },
      ...TEMPLATES.map((t) => ({ id: 'tpl-' + t.id, title: `New from starter: ${t.label}`, group: 'Starters', icon: 'sparkle', run: () => openTemplate(t.id, project.target.app) })),
      { id: 'console', title: 'Show console', group: 'View', icon: 'terminal', run: () => showBottom('console') },
      { id: 'host', title: 'Show host calls', group: 'View', icon: 'layers', run: () => showBottom('host') },
      { id: 'problems', title: 'Show problems', group: 'View', icon: 'alert', run: () => showBottom('problems') },
      { id: 'manifest', title: 'Edit manifest settings', group: 'View', icon: 'settings', run: () => showBottom('manifest') },
      { id: 'sidebar', title: 'Toggle file sidebar', group: 'View', hint: `${MOD}+B`, icon: 'sidebar', run: toggleSidebar },
      { id: 'bottom', title: 'Toggle bottom panel', group: 'View', hint: `${MOD}+J`, icon: 'panel', run: toggleBottom },
      { id: 'apptheme', title: 'Switch light/dark app theme', group: 'View', icon: appTheme === 'dark' ? 'sun' : 'moon', run: cycleTheme },
      { id: 'font+', title: 'Editor font larger', group: 'View', run: () => setPrefs({ fontSize: Math.min(22, prefs.fontSize + 1) }) },
      { id: 'font-', title: 'Editor font smaller', group: 'View', run: () => setPrefs({ fontSize: Math.max(10, prefs.fontSize - 1) }) },
      { id: 'shortcuts', title: 'Keyboard shortcuts', group: 'Help', hint: `${MOD}+?`, icon: 'keyboard', run: () => setDialog('shortcuts') },
      { id: 'welcome', title: 'Show welcome screen', group: 'Help', icon: 'sparkle', run: () => setWelcome(true) },
      { id: 'about', title: 'What the preview simulates', group: 'Help', icon: 'info', run: () => showBottom('about') }
    ];
    return cmds;
  }, [rebuild, autoRun, entrypoints.commands, runCommand, doZip, doJson, openTemplate, project.target.app, showBottom, toggleSidebar, toggleBottom, appTheme, cycleTheme, prefs.fontSize, setPrefs]);
  const fileCommands = useMemo<PaletteCommand[]>(
    () => Object.keys(project.files).sort().map((f) => ({ id: 'file:' + f, title: f, group: 'Files', icon: 'file', run: () => openFile(f) })),
    [project.files, openFile]
  );

  // ---------------------------------------------------------------- render helpers
  const counts = useMemo(() => ({ error: diagnostics.filter((d) => d.severity === 'error').length, warning: diagnostics.filter((d) => d.severity === 'warning').length }), [diagnostics]);
  const consoleLogs = useMemo(() => logs.filter((l) => l.kind !== 'host-call'), [logs]);
  const hostLogs = useMemo(() => logs.filter((l) => l.kind === 'host-call'), [logs]);
  const runtimeErrors = consoleLogs.filter((l) => l.level === 'error').length;
  const host = primaryHost(manifest, project.target.app);
  const docsFor = useCallback((ruleId: string) => (ruleId.startsWith('manifest/') ? DOCS.manifest : ruleId.startsWith('css/') ? DOCS.css : undefined), []);
  const activeIsBinary = isBinaryContent(project.files[project.active] || '');

  const editorFallback = (
    <div className="editor-fallback" aria-busy="true">
      <pre>{activeIsBinary ? '' : (project.files[project.active] || '').slice(0, 6000)}</pre>
    </div>
  );

  const editor = (
    <section className="editor-col" aria-label="Editor">
      <div className="tabbar" role="tablist" aria-label="Open files">
        {tabs.map((t) => (
          <div key={t} className={'ftab ' + (t === project.active ? 'active' : '')} role="tab" aria-selected={t === project.active}>
            <button className="ftab-name" onClick={() => openFile(t)} title={t} data-testid={'tab-file-' + t}>
              {t.split('/').pop()}
              {diagnostics.some((d) => d.file === t && d.severity === 'error') && <span className="tab-dot err" aria-label="has errors" />}
            </button>
            {tabs.length > 1 && (
              <button className="ftab-close" onClick={() => closeTab(t)} aria-label={'Close ' + t}>
                <Icon name="close" size={12} />
              </button>
            )}
          </div>
        ))}
        <span className="spacer" />
        {READ_ONLY && <span className="pill">Read-only</span>}
      </div>
      <div className="editor-host" data-testid="editor-pane">
        {activeIsBinary ? (
          <BinaryView path={project.active} content={project.files[project.active]} />
        ) : (
          <Suspense fallback={editorFallback}>
            <Editor
              files={project.files}
              active={project.active}
              diagnostics={diagnostics}
              onCompatibilityDiagnostics={setCompatibilityDiagnostics}
              onChange={onEdit}
              revision={revision}
              theme={appTheme}
              fontSize={prefs.fontSize}
              readOnly={READ_ONLY}
              onRun={rebuild}
              onPalette={() => setPalette('>')}
            />
          </Suspense>
        )}
      </div>
    </section>
  );

  const previewToolbar = (
    <div className="preview-toolbar">
      <label className="field compact">
        <span className="sr-only">Panel theme</span>
        <select data-testid="theme" value={project.theme} onChange={(e) => setProject((p) => ({ ...p, theme: e.target.value as Theme }))} title="Host UI theme">
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="field compact">
        <span className="sr-only">Panel size</span>
        <select data-testid="size" value={SIZES.some((s) => s.id === sizeId) ? sizeId : 'custom'} onChange={(e) => setSizeId(e.target.value)} title="Panel size">
          {SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
          {!SIZES.some((s) => s.id === sizeId) && <option value="custom">{sizeId.replace('x', ' × ')}</option>}
        </select>
      </label>
      {entrypoints.commands.length > 0 && (
        <div className="cmd-list" role="group" aria-label="Commands">
          {entrypoints.commands.map((c) => (
            <button key={c} className="btn small" onClick={() => runCommand(c)} data-testid={'command-' + c} title={`Invoke command "${c}"`}>
              <Icon name="command" size={12} /> {c}
            </button>
          ))}
        </div>
      )}
      <span className="spacer" />
      <label className="switch" title="Re-run the preview as you type">
        <input type="checkbox" checked={autoRun} onChange={(e) => setAutoRun(e.target.checked)} data-testid="autorun" /> Live
      </label>
      <button className="btn primary small" onClick={rebuild} data-testid="run" title={`Run (${MOD}+Enter)`}>
        <Icon name="play" size={12} /> Run
      </button>
    </div>
  );

  const previewBody = (
    <div className="preview-body">
      {!EMBED && (project.target.app === 'premierepro' || exampleTemplate || reproduction) && (
        <div className="preview-context">
          {project.target.app === 'premierepro' && <label className="field compact">
            <span>Mock data</span>
            <select value={scenario} onChange={(e) => setProject((p) => ({ ...p, scenario: e.target.value as PreviewScenario }))}>
              {PREMIERE_SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>}
          {exampleTemplate && (
            <button className="btn small" onClick={() => setDialog('recipe')}>{exampleTemplate.recipe ? 'Recipe guide' : 'Host verification'}</button>
          )}
          {reproduction && <button className="btn small" onClick={() => setDialog('reproduction-notes')}>Reproduction notes</button>}
        </div>
      )}
      {banner && (
        <div className={'banner ' + banner.kind} role={banner.kind === 'error' ? 'alert' : 'status'} data-testid="banner">
          <div className="banner-main">
            <Icon name={banner.kind === 'error' ? 'error' : banner.kind === 'warn' ? 'alert' : 'info'} size={14} />
            <span>{banner.text}</span>
            <button className="icon-btn" onClick={() => setBanner(null)} aria-label="Dismiss">
              <Icon name="close" size={12} />
            </button>
          </div>
          {banner.details && banner.details.length > 0 && (
            <ul>
              {banner.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {missingPackages.length > 0 && (
        <div className="banner warn" data-testid="missing-packages">
          <div className="banner-main">
            <Icon name="alert" size={14} />
            <span>
              Modules unavailable in the browser preview: <code>{missingPackages.join(', ')}</code>. Import the built plugin folder if your project uses an npm bundler.
            </span>
          </div>
        </div>
      )}
      {manifestParse.error ? (
        <div className="empty-state" data-testid="manifest-error">
          <Icon name="error" size={28} />
          <h3>manifest.json has a syntax error</h3>
          <p>{manifestParse.error}</p>
          <button className="btn" onClick={() => revealAt('manifest.json', manifestParse.errorLine || 1)}>Open manifest.json</button>
        </div>
      ) : build && !build.entryHtml && !build.headless ? (
        <div className="empty-state">
          <Icon name="eye" size={28} />
          <h3>Nothing to preview</h3>
          <p>
            Set <code>"main"</code> in manifest.json to your plugin's entry file.
          </p>
        </div>
      ) : (
        <Preview
          html={build?.html || ''}
          project={project}
          manifest={manifest}
          size={size}
          onLog={onLog}
          onEntrypoints={setEntrypoints}
          onReady={onReady}
          onMissingPackage={onMissingPackage}
          onBatchPlayResult={onBatchPlayResult}
          onResize={EMBED ? undefined : (s) => setSizeId(`${s.width}x${s.height}`)}
          entrypoints={entrypoints}
          runId={runId}
        />
      )}
      {!EMBED && (
        <button className="fidelity" onClick={() => showBottom('about')} data-testid="fidelity-notice">
          <Icon name="info" size={12} /> Approximate preview with mocked {HOSTS.find((h) => h.id === project.target.app)?.label || 'host'} APIs, not the real UXP runtime
        </button>
      )}
    </div>
  );

  const previewCol = (
    <section className="preview-col" aria-label="Preview" data-testid="preview-col" data-state={ready ? 'ready' : 'loading'} data-errors={runtimeErrors} data-ready-run={readyCount}>
      {previewToolbar}
      {previewBody}
    </section>
  );

  const bottomTabs: { id: BottomTab; label: string; badge?: number; badgeKind?: string }[] = [
    { id: 'console', label: 'Console', badge: runtimeErrors || undefined, badgeKind: 'err' },
    { id: 'host', label: 'Host calls', badge: hostLogs.length || undefined },
    { id: 'problems', label: 'Problems', badge: counts.error + counts.warning || undefined, badgeKind: counts.error ? 'err' : 'warn' },
    { id: 'manifest', label: 'Manifest' },
    { id: 'about', label: 'About' }
  ];
  const bottom = (
    <section className="bottom" aria-label="Output">
      <div className="bottom-tabs" role="tablist">
        {bottomTabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={bottomTab === t.id} className={'tab ' + (bottomTab === t.id ? 'active' : '')} onClick={() => setBottomTab(t.id)} data-testid={'tab-' + t.id}>
            {t.label}
            {t.badge ? <span className={'badge ' + (t.badgeKind || '')}>{t.badge}</span> : null}
          </button>
        ))}
        <span className="spacer" />
        {bottomTab !== 'manifest' && bottomTab !== 'about' && bottomTab !== 'problems' && (
          <button className="icon-btn" onClick={() => setLogs((l) => (bottomTab === 'host' ? l.filter((x) => x.kind !== 'host-call') : l.filter((x) => x.kind === 'host-call')))} title="Clear" aria-label="Clear output">
            <Icon name="trash" size={14} />
          </button>
        )}
        {!EMBED && !narrow && (
          <button className="icon-btn" onClick={toggleBottom} title={`Hide panel (${MOD}+J)`} aria-label="Hide bottom panel">
            <Icon name="chevronDown" size={14} />
          </button>
        )}
      </div>
      <div className="bottom-body" role="tabpanel" data-testid={'panel-' + bottomTab}>
        {bottomTab === 'console' && <ConsoleView logs={consoleLogs} onOpenFile={(f, l) => revealAt(f, l)} />}
        {bottomTab === 'host' && <HostLog logs={hostLogs} onRunDescriptors={runDescriptors} onCopy={copyText} />}
        {bottomTab === 'problems' && <ProblemsView diagnostics={diagnostics} engine={lintInfo ? `${lintInfo.name} ${lintInfo.version} + ${lintInfo.plugin} ${lintInfo.pluginVersion}${lintInfo.fallback ? ' (built-in rules)' : ''}` : 'Starting ESLint…'} docsFor={docsFor} onOpen={(d) => revealAt(d.file, d.line, d.column)} />}
        {bottomTab === 'manifest' && <ManifestPanel text={project.files['manifest.json']} onChange={(t) => { onEdit('manifest.json', t); setRevision((r) => r + 1); }} onOpenManifest={() => openFile('manifest.json')} />}
        {bottomTab === 'about' && <About host={host} />}
      </div>
    </section>
  );

  // ---------------------------------------------------------------- embed layout
  if (EMBED) {
    const openUrl = share(shareBase, projectForShare, undefined, reproduction).url;
    return (
      <div className={'app embed view-' + EMBED_VIEW} data-testid="embed">
        <header className="embed-bar">
          <span className="logo-mark small" aria-hidden="true">Ux</span>
          <strong className="embed-title">{project.name}</strong>
          <span className="spacer" />
          <a className="btn small" href={openUrl} target="_blank" rel="noopener" data-testid="open-in-playground">
            Open in Playground <Icon name="external" size={12} />
          </a>
        </header>
        <div className="embed-main">
          {EMBED_VIEW !== 'preview' && editor}
          {EMBED_VIEW !== 'editor' && previewCol}
        </div>
        {params.get('console') === '1' && <div className="embed-console">{bottom}</div>}
        {toast && <div className={'toast ' + (toast.kind || '')} role="status" data-testid="toast">{toast.text}</div>}
      </div>
    );
  }

  // ---------------------------------------------------------------- full layout
  const sidebar = (
    <aside className="sidebar" aria-label="Files">
      <FileTree files={project.files} active={project.active} diagnostics={diagnostics} onOpen={openFile} onDelete={deleteFile} onRename={renameFile} onCreate={createFile} />
      {origin && (
        <div className="side-origin">
          <Icon name={origin.includes('#github=') ? 'github' : origin.includes('#example=') ? 'book' : 'sparkle'} size={12} />
          <span title={origin}>{decodeURIComponent(origin.split('#')[1]?.split('=').slice(1).join('=') || '')}</span>
        </div>
      )}
    </aside>
  );

  const header = (
    <header className="header">
      <button className="brand" onClick={() => setWelcome(true)} title="Welcome and examples" aria-label="UXP Playground welcome">
        <span className="logo-mark" aria-hidden="true">Ux</span>
        <span className="brand-name">UXP Playground</span>
      </button>
      <div className="project-controls">
        <input className="project-name" value={project.name} onChange={(e) => setProject((p) => ({ ...p, name: e.target.value.slice(0, 80) }))} aria-label="Project name" spellCheck={false} />
        <div className="target">
          <label className="field compact">
            <span className="sr-only">Host app</span>
            <select data-testid="host" value={project.target.app} onChange={(e) => {
              const host = hostInfo(e.target.value);
              if (host) setProject((p) => ({ ...p, target: { app: host.id, uxp: host.uxp } }));
            }} title="Host app to preview">
              {HOSTS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field compact">
            <span className="sr-only">UXP version</span>
            <select data-testid="uxp" value={project.target.uxp} onChange={(e) => setProject((p) => ({ ...p, target: { ...p.target, uxp: e.target.value } }))} title="UXP version for lint rules">
              {UXP_VERSIONS.map((v) => (
                <option key={v} value={v}>
                  UXP {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <span className="spacer" />
      <button className="btn ghost" onClick={() => setDialog('gallery')} data-testid="examples" aria-label="Examples" title="Examples">
        <Icon name="book" size={14} /> <span className="hide-sm">Examples</span>
      </button>
      <button className="btn ghost" onClick={() => { setCandidates(null); setDialog('import'); }} data-testid="import" aria-label="Import" title="Import">
        <Icon name="upload" size={14} /> <span className="hide-sm">Import</span>
      </button>
      <button className="btn ghost" onClick={() => setDialog('share')} data-testid="share" aria-label="Share" title="Share">
        <Icon name="share" size={14} /> <span className="hide-sm">Share</span>
      </button>
      <div className="split-btn">
        <button className="btn primary" onClick={() => setDialog('run-host')} data-testid="run-host" title="Run in host" aria-label="Run in host">
          <Icon name="play" size={14} /> <span className="hide-sm">Run in host</span>
        </button>
        <button className="btn primary" onClick={doZip} data-testid="download-zip" title="Download plugin .zip" aria-label="Download plugin .zip">
          <Icon name="download" size={14} />
        </button>
        <button className="btn primary" onClick={doJson} data-testid="download-json" title="Save the playground project as .json" aria-label="Save project as .json">
          .json
        </button>
      </div>
      <button className="icon-btn" onClick={() => setPalette('>')} title={`Command palette (${MOD}+K)`} aria-label="Command palette" data-testid="palette-button">
        <Icon name="command" />
      </button>
      <button className="icon-btn" onClick={cycleTheme} title="Light or dark" aria-label={appTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} data-testid="app-theme">
        <Icon name={appTheme === 'dark' ? 'sun' : 'moon'} />
      </button>
    </header>
  );

  const status = (
    <footer className="statusbar">
      <button className="sb-item" onClick={toggleSidebar} title={`Files (${MOD}+B)`} aria-label="Toggle files">
        <Icon name="sidebar" size={12} />
      </button>
      <button className={'sb-item ' + (counts.error ? 'err' : '')} onClick={() => showBottom('problems')} data-testid="status-problems">
        <Icon name="error" size={12} /> {counts.error} <Icon name="alert" size={12} /> {counts.warning}
      </button>
      <span className="sb-item">{ready ? (runtimeErrors ? `${runtimeErrors} runtime error${runtimeErrors > 1 ? 's' : ''}` : 'Preview ready') : 'Running…'}</span>
      <span className="spacer" />
      <span className="sb-item hide-sm">{lintInfo ? `${lintInfo.plugin} ${lintInfo.pluginVersion}` : 'ESLint loading'}</span>
      <span className="sb-item hide-sm">
        {host.app || project.target.app} {host.minVersion ? '≥ ' + host.minVersion : ''}
      </span>
      <span className="sb-item" data-testid="save-state">{saveState === 'saving' ? 'Saving…' : saveState === 'failed' ? 'Not saved (storage full)' : 'Saved locally'}</span>
      <button className="sb-item" onClick={() => setDialog('shortcuts')} aria-label="Keyboard shortcuts">
        <Icon name="keyboard" size={12} />
      </button>
      <button className="sb-item" onClick={toggleBottom} title={`Output (${MOD}+J)`} aria-label="Toggle output panel">
        <Icon name="panel" size={12} />
      </button>
    </footer>
  );

  const mobileTabs: [MobileView, string, string][] = [
    ['files', 'Files', 'folder'],
    ['code', 'Code', 'code'],
    ['preview', 'Preview', 'eye'],
    ['output', 'Output', 'terminal']
  ];

  return (
    <div className={'app' + (narrow ? ' narrow' : '')} style={{ ['--sidebar-w' as any]: prefs.sidebarWidth + 'px', ['--preview-w' as any]: prefs.previewWidth + 'px', ['--bottom-h' as any]: prefs.bottomHeight + 'px' }}>
      <a className="skip-link" href="#main-editor">Skip to editor</a>
      {header}
      {narrow ? (
        <>
          <nav className="mobile-tabs" aria-label="Views">
            {mobileTabs.map(([id, label, icon]) => (
              <button key={id} className={mobileView === id ? 'active' : ''} aria-pressed={mobileView === id} onClick={() => setMobileView(id)}>
                <Icon name={icon} size={14} /> {label}
                {id === 'output' && runtimeErrors > 0 && <span className="badge err">{runtimeErrors}</span>}
              </button>
            ))}
          </nav>
          <main className="mobile-main" id="main-editor">
            {/* All views stay mounted so the preview keeps running (and logging) while you edit. */}
            {(['files', 'code', 'preview', 'output'] as MobileView[]).map((v) => (
              <div key={v} className="mobile-view" hidden={mobileView !== v}>
                {v === 'files' ? sidebar : v === 'code' ? editor : v === 'preview' ? previewCol : bottom}
              </div>
            ))}
          </main>
        </>
      ) : (
        <main className="workbench" id="main-editor">
          {prefs.sidebarOpen && (
            <>
              {sidebar}
              <Splitter axis="x" value={prefs.sidebarWidth} min={160} max={420} onChange={(v) => setPrefs({ sidebarWidth: v })} label="Resize file sidebar" testId="split-sidebar" />
            </>
          )}
          <div className="center">
            <div className="center-top">
              {editor}
              <Splitter axis="x" value={prefs.previewWidth} min={260} max={1100} invert onChange={(v) => setPrefs({ previewWidth: v })} label="Resize preview" testId="split-preview" />
              {previewCol}
            </div>
            {prefs.bottomOpen && (
              <>
                <Splitter axis="y" value={prefs.bottomHeight} min={90} max={700} invert onChange={(v) => setPrefs({ bottomHeight: v })} label="Resize output panel" testId="split-bottom" />
                {bottom}
              </>
            )}
          </div>
        </main>
      )}
      {status}

      {loading && (
        <div className="loading-bar" role="status" data-testid="loading">
          <span className="spinner" aria-hidden="true" /> {loading}
        </div>
      )}
      {dragging && (
        <div className="drop-overlay" aria-hidden="true">
          <div>
            <Icon name="upload" size={32} />
            <p>Drop a plugin folder, .zip, .ccx or playground .json</p>
          </div>
        </div>
      )}
      {welcome && (
        <Welcome
          target={project.target.app}
          onClose={() => {
            setWelcome(false);
            setPrefs({ seenWelcome: true });
          }}
          onOpenExample={(m) => {
            setPrefs({ seenWelcome: true });
            openExample(m);
          }}
          onOpenTemplate={(id, app) => {
            setPrefs({ seenWelcome: true });
            openTemplate(id, app);
          }}
          onImport={() => {
            setWelcome(false);
            setPrefs({ seenWelcome: true });
            setDialog('import');
          }}
          onGithub={(spec) => {
            setPrefs({ seenWelcome: true });
            setWelcome(false);
            openGithub(spec).catch((e) => say(String(e.message || e), 'error'));
          }}
          onCopyLink={(hash) => copyText(shareBase + hash, 'Link')}
        />
      )}
      {dialog === 'gallery' && (
        <Dialog title="Examples" onClose={() => setDialog(null)} wide testId="gallery-dialog" className="gallery-dialog">
          <Gallery target={project.target.app} onOpenExample={openExample} onOpenTemplate={openTemplate} onCopyLink={(hash) => copyText(shareBase + hash, 'Link')} />
        </Dialog>
      )}
      {dialog === 'import' && (
        <ImportDialog
          onClose={() => {
            setDialog(null);
            setCandidates(null);
          }}
          onGithub={(spec, root) => openGithub(spec, root)}
          onZip={(f, root) => openZipFile(f, root)}
          onFolder={async (list) => {
            const raw = await readFileList(list);
            importRaw(raw, 'Folder', undefined, (c) => importRaw(raw, 'Folder', c));
          }}
          onGist={openGist}
          onJson={openJsonFile}
          candidates={candidates}
          progress={loading}
        />
      )}
      {dialog === 'share' && <ShareDialog project={projectForShare} base={shareBase} origin={origin} onClose={() => setDialog(null)} onCopied={(w) => say(w + ' copied')} onReproduce={() => setDialog('reproduce')} />}
      {dialog === 'reproduce' && <ReproductionDialog project={projectForShare} base={shareBase} logs={logs} initial={reproduction} onClose={() => setDialog(null)} onCopy={copyText} />}
      {dialog === 'reproduction-notes' && reproduction && <ReproductionDetails project={project} report={reproduction} onClose={() => setDialog(null)} onShare={() => setDialog('reproduce')} />}
      {dialog === 'recipe' && exampleTemplate && <RecipeGuide template={exampleTemplate} scenario={scenario} host={project.target.app} onClose={() => setDialog(null)} onRun={() => setDialog('run-host')} />}
      {dialog === 'run-host' && <HostDialog project={project} sync={folderSync} onClose={() => setDialog(null)} onDownload={doZip} />}
      {dialog === 'shortcuts' && <Shortcuts onClose={() => setDialog(null)} />}
      {palette != null && (
        <CommandPalette
          commands={palette.startsWith('>') ? paletteCommands : fileCommands}
          initial={palette.startsWith('>') ? '' : ''}
          placeholder={palette.startsWith('>') ? 'Type a command' : 'Go to file'}
          onClose={() => setPalette(null)}
        />
      )}
      {toast && (
        <div className={'toast ' + (toast.kind || '')} role={toast.kind === 'error' ? 'alert' : 'status'} data-testid="toast">
          {toast.text}
        </div>
      )}
    </div>
  );
}

function BinaryView({ path, content }: { path: string; content: string }) {
  const isImg = /^data:image\//.test(content);
  return (
    <div className="binary-view">
      {isImg ? <img src={content} alt={path} /> : <Icon name="file" size={40} />}
      <p>
        <strong>{path}</strong> · {humanSize(fileSize(content))}
      </p>
      <p className="muted small">Binary file. It is included in the exported zip{isImg ? ' and used by the preview' : ''}.</p>
    </div>
  );
}

function Shortcuts({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    [`${MOD} K`, 'Command palette'],
    [`${MOD} P`, 'Go to file'],
    [`${MOD} Enter`, 'Run preview'],
    [`${MOD} S`, 'Confirm saved (autosave is always on)'],
    [`${MOD} B`, 'Toggle file sidebar'],
    [`${MOD} J`, 'Toggle output panel'],
    [`${MOD} ?`, 'This list'],
    ['F2', 'Rename the selected file'],
    ['Esc', 'Close dialogs and the palette']
  ];
  return (
    <Dialog title="Keyboard shortcuts" onClose={onClose} testId="shortcuts">
      <table className="shortcuts">
        <tbody>
          {rows.map(([k, d]) => (
            <tr key={k}>
              <td>
                {k.split(' ').map((x) => (
                  <kbd key={x}>{x}</kbd>
                ))}
              </td>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

function About({ host }: { host: { app?: string; minVersion?: string } }) {
  return (
    <div className="about">
      <p>
        The editor uses Adobe API declarations for Photoshop and Premiere Pro autocomplete. Your plugin's JavaScript runs in the browser, and the exported project can run in its Adobe app through UXP Developer Tool.
      </p>
      <p>
        The preview approximates Spectrum widgets, theme colours, host data, and UXP permission checks. Photoshop previews enforce the modal-scope rule for <code>apiVersion</code> 2.
        {host.minVersion && ` This manifest targets ${hostInfo(host.app)?.label ?? host.app} ${host.minVersion} or later.`}
      </p>
      <p>
        Use the Adobe app to check native layout, fonts, real documents, and permission prompts. The Host calls tab identifies APIs the preview could not simulate.
      </p>
      <p className="muted small">Photoshop → UXP versions from Adobe's changelog and version table: {PS_UXP_TABLE.map((r) => `PS ${r.ps} → UXP ${r.uxp}`).join(' · ')}.</p>
    </div>
  );
}

