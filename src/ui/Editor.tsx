import { useEffect, useRef } from 'react';
import { languageFor, loadTypings, monaco, setupJson } from './monacoSetup';
import type { Diagnostic } from '../core/manifest';
import { isBinaryContent } from '../core/files';

interface Props {
  files: Record<string, string>;
  active: string;
  diagnostics: Diagnostic[];
  onChange: (path: string, value: string) => void;
  /** Bumped when files are replaced from outside (template, import), forcing model sync. */
  revision: number;
  theme: 'dark' | 'light';
  fontSize: number;
  readOnly?: boolean;
  onRun?: () => void;
  onPalette?: () => void;
}

const uriFor = (path: string) => monaco.Uri.file('/' + path);

export function Editor({ files, active, diagnostics, onChange, revision, theme, fontSize, readOnly, onRun, onPalette }: Props) {
  const keys = useRef({ onRun, onPalette });
  keys.current = { onRun, onPalette };
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
      theme: theme === 'light' ? 'vs' : 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize,
      readOnly: !!readOnly,
      fontFamily: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
      renderLineHighlight: 'line',
      smoothScrolling: true,
      padding: { top: 8 },
      stickyScroll: { enabled: false },
      tabSize: 2,
      scrollBeyondLastLine: false,
      fixedOverflowWidgets: true,
      ariaLabel: 'Code editor'
    });
    editor.current = ed;
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => keys.current.onRun?.());
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => keys.current.onPalette?.());
    ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => keys.current.onPalette?.());
    (window as any).__pgEditor = ed;
    (window as any).__pgMonaco = monaco;
    (window as any).__pgReveal = revealLine;
    const pending = (window as any).__pgPendingReveal;
    if (pending) setTimeout(() => revealLine(pending.path, pending.line, pending.column), 50);
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

  useEffect(() => {
    monaco.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
  }, [theme]);
  useEffect(() => {
    editor.current?.updateOptions({ fontSize, readOnly: !!readOnly });
  }, [fontSize, readOnly]);

  // Sync models with files (create/delete; overwrite content only on external revisions).
  useEffect(() => {
    const wanted = new Set(Object.keys(files));
    monaco.editor.getModels().forEach((m) => {
      const p = m.uri.path.replace(/^\//, '');
      if (m.uri.scheme === 'file' && !p.startsWith('node_modules/') && !wanted.has(p)) m.dispose();
    });
    for (const [path, text] of Object.entries(files)) {
      if (isBinaryContent(text)) continue;
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
    if (!model && files[active] != null && !isBinaryContent(files[active])) model = monaco.editor.createModel(files[active], languageFor(active), uriFor(active));
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
          code: d.docsUrl ? { value: d.ruleId, target: monaco.Uri.parse(d.docsUrl) } : d.ruleId,
          severity: d.severity === 'error' ? monaco.MarkerSeverity.Error : d.severity === 'warning' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Info,
          source: d.source === 'eslint' ? 'uxp-lint' : d.source
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
