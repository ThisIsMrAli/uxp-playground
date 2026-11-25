import * as monaco from '@pg/monaco';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from './typescript.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker';
import CssWorker from 'monaco-editor/language/css/css.worker.js?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker.js?worker';
import { manifestSchema } from './manifestSchema';
import { HOST_MODULE_DECLARATIONS, PREMIERE_TYPES_URI, type PremiereCompatibilityWorker } from './premiereEditor';

(self as any).MonacoEnvironment = {
  getWorker(_id: string, label: string) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    return new EditorWorker();
  }
};

// Real Adobe typings, bundled at build time (no network at runtime).
const typingFiles = {
  ...import.meta.glob('/node_modules/@types/photoshop/**/*.d.ts', { query: '?raw', import: 'default' }),
  ...import.meta.glob('/node_modules/@adobe/cc-ext-uxp-types/uxp/index.d.ts', { query: '?raw', import: 'default' })
} as Record<string, () => Promise<string>>;

let typingsLoaded: Promise<number> | null = null;

export function loadTypings(): Promise<number> {
  if (typingsLoaded) return typingsLoaded;
  const ts = (monaco as any).typescript;
  const opts = {
    target: ts.ScriptTarget.ES2022,
    allowJs: true,
    checkJs: false,
    allowNonTsExtensions: true,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    typeRoots: ['node_modules/@types']
  };
  ts.javascriptDefaults.setCompilerOptions(opts);
  ts.typescriptDefaults.setCompilerOptions(opts);
  ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: false });
  ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false, diagnosticCodesToIgnore: [2307, 2792, 7016] });
  ts.javascriptDefaults.setEagerModelSync(true);
  ts.typescriptDefaults.setEagerModelSync(true);
  typingsLoaded = Promise.all([
    ...Object.entries(typingFiles).map(async ([path, load]) => ({ content: await load(), filePath: 'file://' + path })),
    import('/node_modules/@adobe/premierepro/src/premierepro.d.ts?raw').then(({ default: content }) => ({ content, filePath: PREMIERE_TYPES_URI }))
  ]).then((libs) => {
    libs.push({ content: HOST_MODULE_DECLARATIONS, filePath: 'file:///node_modules/@types/pg-stubs/index.d.ts' });
    ts.javascriptDefaults.setExtraLibs(libs);
    ts.typescriptDefaults.setExtraLibs(libs);
    // Flush the extra-library event before issuing the first custom worker request.
    return new Promise<number>((resolve) => setTimeout(() => resolve(libs.length), 0));
  });
  return typingsLoaded;
}

export async function getPremiereCompatibility(uris: monaco.Uri[], minVersion: string) {
  const files = uris.filter((uri) => !/\.d\.ts$/i.test(uri.path));
  if (!files.length) return [];
  await loadTypings();
  const getWorker = files.some((uri) => languageFor(uri.path) === 'typescript')
    ? await monaco.typescript.getTypeScriptWorker()
    : await monaco.typescript.getJavaScriptWorker();
  // Sync all project sources, including JS, so the worker can follow imports across files.
  const worker = await getWorker(...uris) as unknown as PremiereCompatibilityWorker;
  return worker.getPremiereCompatibility(files.map((uri) => uri.toString()), minVersion);
}

let schemaSet = false;
export function setupJson() {
  if (schemaSet) return;
  schemaSet = true;
  (monaco as any).json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [{ uri: 'https://uxp-playground.local/manifest-v5.schema.json', fileMatch: ['manifest.json'], schema: manifestSchema }]
  });
}

export function languageFor(path: string): string {
  if (/\.json$/i.test(path)) return 'json';
  if (/\.html?$/i.test(path)) return 'html';
  if (/\.css$/i.test(path)) return 'css';
  if (/\.tsx?$/i.test(path)) return 'typescript';
  if (/\.(jsx?|mjs|cjs)$/i.test(path)) return 'javascript';
  return 'plaintext';
}

export { monaco };
