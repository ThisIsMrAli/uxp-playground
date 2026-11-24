import { useEffect, useRef } from 'react';
import type { LogEntry, Project } from '../core/types';
import { firstPanel } from '../core/manifest';

interface Props {
  html: string;
  project: Project;
  manifest: any;
  size: { width: number; height: number };
  onLog: (e: LogEntry) => void;
  onCommands: (c: { panels: string[]; commands: string[] }) => void;
  onReady: (runId: number) => void;
  runId: number;
}

function fmt(v: any, quote = false): string {
  if (typeof v === 'string') return quote ? JSON.stringify(v) : v;
  if (v && v.__error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function Preview({ html, project, manifest, size, onLog, onCommands, onReady, runId }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const onLogRef = useRef(onLog);
  onLogRef.current = onLog;
  const onCmdRef = useRef(onCommands);
  onCmdRef.current = onCommands;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const runRef = useRef(runId);
  runRef.current = runId;

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      const d = e.data;
      if (!d || !d.__pg) return;
      const p = d.payload || {};
      const time = Date.now();
      if (d.type === 'console') onLogRef.current({ kind: 'console', level: p.level, text: (p.args || []).map((a: any) => fmt(a)).join(' '), time });
      else if (d.type === 'error') onLogRef.current({ kind: 'error', level: 'error', text: p.message + (p.line ? ` (line ${p.line})` : ''), detail: p.stack, time });
      else if (d.type === 'host-call') {
        const text = p.note
          ? `${p.module}: ${p.fn === '(note)' ? '' : p.fn + ' — '}${p.note}`
          : `${p.module}.${p.fn}(${(p.args || []).map((a: any) => fmt(a, true)).join(', ')})${p.error ? ' ✖ ' + p.error : p.result !== undefined && p.result !== 'undefined' ? ' → ' + fmt(p.result) : ''}${p.modal ? '  [modal: ' + p.modal + ']' : ''}`;
        onLogRef.current({ kind: 'host-call', level: p.error ? 'error' : 'info', text, detail: p, time });
      } else if (d.type === 'file-written') onLogRef.current({ kind: 'file-written', level: 'info', text: `File written: ${p.path}`, detail: p, time });
      else if (d.type === 'ready') onReadyRef.current(runRef.current);
      else if (d.type === 'entrypoints') onCmdRef.current({ panels: p.panels || [], commands: p.commands || [] });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const panel = firstPanel(manifest);
  const title = panel ? (typeof panel.label === 'string' ? panel.label : panel.label?.default) || panel.id : manifest?.name || 'Plugin';

  return (
    <div className="panel-stage" data-theme={project.theme}>
      <div className="panel-chrome" style={{ width: size.width }}>
        <div className="panel-tab">
          <span className="panel-title" data-testid="panel-title">{title}</span>
          <span className="approx-badge" title="This preview runs in a browser. It is not the UXP engine.">Approximate</span>
        </div>
        <iframe
          key={runId}
          ref={frame}
          title="Plugin preview"
          data-testid="preview-frame"
          sandbox="allow-scripts allow-modals allow-forms"
          srcDoc={html}
          style={{ width: size.width, height: size.height }}
        />
      </div>
    </div>
  );
}

export function postToPreview(msg: Record<string, unknown>) {
  const f = document.querySelector<HTMLIFrameElement>('iframe[data-testid="preview-frame"]');
  f?.contentWindow?.postMessage({ __pgParent: true, ...msg }, '*');
}
