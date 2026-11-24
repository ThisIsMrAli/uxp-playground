import { useEffect, useRef } from 'react';
import { languageFor, loadTypings, monaco, setupJson } from './monacoSetup';
import type { Diagnostic } from '../core/manifest';

interface Props {
  files: Record<string, string>;
  active: string;
  diagnostics: Diagnostic[];
  onChange: (path: string, value: string) => void;
  /** Bumped when files are replaced from outside (template, import), forcing model sync. */
  revision: number;
}

const uriFor = (path: string) => monaco.Uri.parse('file:///' + path);

export function Editor({ files, active, diagnostics, onChange, revision }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const filesRef = useRef(files);
  filesRef.current = files;

  useEffect(() => {
    setupJson();
    loadTypings().catch((e) => console.warn('typings', e));
    const ed = monaco.editor.create(host.current!, {
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13,
      tabSize: 2,
      scrollBeyondLastLine: false,
      fixedOverflowWidgets: true,
      ariaLabel: 'Code editor'
    });
    editor.current = ed;
    (window as any).__pgEditor = ed;
    (window as any).__pgMonaco = monaco;
    const sub = ed.onDidChangeModelContent(() => {
      const model = ed.getModel();
      if (!model) return;
      const path = model.uri.path.replace(/^\//, '');
      onChangeRef.current(path, model.getValue());
    });
    return () => {
      sub.dispose();
      ed.dispose();
      monaco.editor.getModels().forEach((m) => m.dispose());
    };
  }, []);

  // Sync models with files (create/delete; overwrite content only on external revisions).
  useEffect(() => {
    const wanted = new Set(Object.keys(files));
    monaco.editor.getModels().forEach((m) => {
      const p = m.uri.path.replace(/^\//, '');
      if (m.uri.scheme === 'file' && !wanted.has(p)) m.dispose();
    });
    for (const [path, text] of Object.entries(files)) {
      const uri = uriFor(path);
      const existing = monaco.editor.getModel(uri);
      if (!existing) monaco.editor.createModel(text, languageFor(path), uri);
      else if (existing.getValue() !== text) {
        existing.pushEditOperations([], [{ range: existing.getFullModelRange(), text }], () => null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, Object.keys(files).join('|')]);

  useEffect(() => {
    const ed = editor.current;
    if (!ed) return;
    let model = monaco.editor.getModel(uriFor(active));
    if (!model && files[active] != null) model = monaco.editor.createModel(files[active], languageFor(active), uriFor(active));
    if (model && ed.getModel() !== model) ed.setModel(model);
  }, [active, revision, files]);

  useEffect(() => {
    const byFile = new Map<string, Diagnostic[]>();
    for (const d of diagnostics) {
      if (!byFile.has(d.file)) byFile.set(d.file, []);
      byFile.get(d.file)!.push(d);
    }
    monaco.editor.getModels().forEach((m) => {
      const p = m.uri.path.replace(/^\//, '');
      const list = byFile.get(p) || [];
      monaco.editor.setModelMarkers(
        m,
        'uxp-lint',
        list.map((d) => ({
          startLineNumber: d.line,
          startColumn: d.column,
          endLineNumber: d.endLine ?? d.line,
          endColumn: d.endColumn ?? Math.max(d.column + 1, m.getLineMaxColumn(Math.min(d.line, m.getLineCount()))),
          message: `${d.message} (${d.ruleId})`,
          severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : d.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Info,
          source: d.source
        }))
      );
    });
  }, [diagnostics, revision]);

  return <div className="editor-host" ref={host} data-testid="editor" />;
}

export function revealLine(path: string, line: number, column: number) {
  const ed = (window as any).__pgEditor as monaco.editor.IStandaloneCodeEditor | undefined;
  if (!ed) return;
  const m = monaco.editor.getModel(uriFor(path));
  if (m) {
    ed.setModel(m);
    ed.revealLineInCenter(line);
    ed.setPosition({ lineNumber: line, column });
    ed.focus();
  }
}
