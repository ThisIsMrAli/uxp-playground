import * as monaco from '@pg/monaco';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker';
import CssWorker from 'monaco-editor/language/css/css.worker.js?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker.js?worker';
import { manifestSchema } from './manifestSchema';

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
  typingsLoaded = Promise.all(
    Object.entries(typingFiles).map(async ([path, load]) => {
      const content = await load();
      const uri = 'file://' + path;
      ts.javascriptDefaults.addExtraLib(content, uri);
      ts.typescriptDefaults.addExtraLib(content, uri);
    })
  ).then(() => {
    // The DefinitelyTyped package resolves as "photoshop"; uxp is a declared ambient module. Map premierepro/indesign loosely.
    const extra = `declare module "premierepro" { const anyModule: any; export = anyModule; }\ndeclare module "indesign" { const anyModule: any; export = anyModule; }\n`;
    ts.javascriptDefaults.addExtraLib(extra, 'file:///node_modules/@types/pg-stubs/index.d.ts');
    ts.typescriptDefaults.addExtraLib(extra, 'file:///node_modules/@types/pg-stubs/index.d.ts');
    return Object.keys(typingFiles).length;
  });
  return typingsLoaded;
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
