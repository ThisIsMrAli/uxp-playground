import { useEffect, useRef, useState } from 'react';
import type { LogEntry, Project, Theme } from '../core/types';
import { firstPanel } from '../core/manifest';
import { isBinaryContent } from '../core/files';
import { Icon } from './components/Icon';

export interface EntrypointInfo {
  panels: string[];
  commands: string[];
  menus: Record<string, { id: string; label: string; enabled?: boolean; checked?: boolean }[]>;
}

interface Props {
  html: string;
  project: Project;
  manifest: any;
  size: { width: number; height: number };
  onLog: (e: LogEntry) => void;
  onEntrypoints: (c: EntrypointInfo) => void;
  onReady: (runId: number) => void;
  onMissingPackage: (name: string) => void;
  onBatchPlayResult?: (r: any) => void;
  onResize?: (size: { width: number; height: number }) => void;
  entrypoints: EntrypointInfo;
  runId: number;
}

function fmt(v: any): string {
  if (typeof v === 'string') return v;
  if (v && v.__error) return `${v.name}: ${v.message}`;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Picks the manifest icon for the panel header (theme-aware, @1x/@2x scale files). */
export function panelIcon(manifest: any, files: Record<string, string>, theme: Theme): string | null {
  const panel = firstPanel(manifest);
  const lists = [panel?.icons, manifest?.icons].filter(Array.isArray) as any[][];
  for (const list of lists) {
    const pick = list.find((i) => Array.isArray(i.theme) && i.theme.includes(theme)) || list.find((i) => Array.isArray(i.theme) && i.theme.includes('all')) || list[0];
    if (!pick || typeof pick.path !== 'string') continue;
    const p = pick.path.replace(/^\.\//, '');
    for (const cand of [p, p.replace(/(\.\w+)$/, '@2x$1'), p.replace(/(\.\w+)$/, '@1x$1')]) {
      const v = files[cand];
      if (v && isBinaryContent(v)) return v;
      if (v && /\.svg$/i.test(cand)) return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(v);
    }
  }
  return null;
}

export function Preview({ html, project, manifest, size, onLog, onEntrypoints, onReady, onMissingPackage, onBatchPlayResult, onResize, entrypoints, runId }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const cb = useRef({ onLog, onEntrypoints, onReady, onMissingPackage, onBatchPlayResult });
  cb.current = { onLog, onEntrypoints, onReady, onMissingPackage, onBatchPlayResult };
  const runRef = useRef(runId);
  runRef.current = runId;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!frame.current || e.source !== frame.current.contentWindow) return;
      const d = e.data;
      if (!d || !d.__pg) return;
      const p = d.payload || {};
      const time = Date.now();
      const c = cb.current;
      if (d.type === 'console') c.onLog({ kind: 'console', level: p.level, text: (p.args || []).map(fmt).join(' '), time });
      else if (d.type === 'error') c.onLog({ kind: 'error', level: 'error', text: p.message, detail: p.stack, time, file: p.file || (p.source && /^plugin:\/\/\//.test(p.source) ? p.source.slice(10) : undefined), line: p.line });
      else if (d.type === 'host-call') {
        const text = p.note
          ? `${p.module}: ${p.fn && p.fn !== '(note)' ? p.fn + ' — ' : ''}${p.note}`
          : `${p.module}.${p.fn}(${(p.args || []).map((a: any) => (typeof a === 'string' ? JSON.stringify(a) : fmt(a))).join(', ')})${p.error ? ' ✖ ' + p.error : p.result !== undefined && p.result !== 'undefined' ? ' → ' + fmt(p.result) : ''}${p.modal ? '  [modal: ' + p.modal + ']' : ''}`;
        c.onLog({ kind: 'host-call', level: p.error ? 'error' : p.unsupported ? 'warn' : 'info', text, detail: p, time });
      } else if (d.type === 'file-written') c.onLog({ kind: 'file-written', level: 'info', text: `Wrote ${p.url || p.path} (${p.size ?? '?'} ${typeof p.size === 'number' ? 'bytes' : ''})`, detail: p, time });
      else if (d.type === 'ready') c.onReady(runRef.current);
      else if (d.type === 'entrypoints') c.onEntrypoints({ panels: p.panels || [], commands: p.commands || [], menus: p.menus || {} });
      else if (d.type === 'missing-package') c.onMissingPackage(p.name);
      else if (d.type === 'batchplay-result') c.onBatchPlayResult?.(p);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Theme switches are live: UXP fires document.theme.onUpdated instead of reloading the panel.
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ __pgParent: true, type: 'setTheme', theme: project.theme }, '*');
  }, [project.theme]);

  const panel = firstPanel(manifest);
  const title = panel ? (typeof panel.label === 'string' ? panel.label : panel.label?.default) || panel.id : (typeof manifest?.name === 'string' ? manifest.name : manifest?.name?.default) || 'Plugin';
  const icon = panelIcon(manifest, project.files, project.theme);
  const menu = panel ? entrypoints.menus[panel.id] || [] : [];
  const resizeStart = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  return (
    <div className="panel-stage" data-theme={project.theme}>
      <div className="panel-chrome" style={{ width: size.width }} data-testid="panel-chrome">
        <div className="panel-tab">
          {icon ? <img className="panel-icon" src={icon} alt="" width={16} height={16} /> : <span className="panel-icon placeholder" />}
          <span className="panel-title" data-testid="panel-title">{title}</span>
          <span className="spacer" />
          {menu.length > 0 && (
            <div className="flyout">
              <button className="icon-btn" aria-label="Panel menu" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="flyout-button">
                <Icon name="menu" size={14} />
              </button>
              {menuOpen && (
                <ul className="flyout-menu" role="menu" onMouseLeave={() => setMenuOpen(false)}>
                  {menu.map((m) =>
                    m.label === '-' ? (
                      <li key={m.id} role="separator" className="sep" />
                    ) : (
                      <li key={m.id} role="none">
                        <button role="menuitem" disabled={m.enabled === false} onClick={() => { setMenuOpen(false); postToPreview({ type: 'invokeMenu', panelId: panel.id, menuId: m.id }); }}>
                          {m.checked ? '✓ ' : ''}
                          {m.label}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          )}
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
        {onResize && (
          <div
            className="panel-grip"
            role="slider"
            tabIndex={0}
            aria-label={`Panel size ${size.width} by ${size.height}`}
            aria-valuenow={size.width}
            title="Drag to resize the panel"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
              document.body.classList.add('resizing');
            }}
            onPointerMove={(e) => {
              const s = resizeStart.current;
              if (!s) return;
              onResize({ width: Math.max(120, Math.round(s.w + e.clientX - s.x)), height: Math.max(80, Math.round(s.h + e.clientY - s.y)) });
            }}
            onPointerUp={() => {
              resizeStart.current = null;
              document.body.classList.remove('resizing');
            }}
            onKeyDown={(e) => {
              const k = e.shiftKey ? 40 : 10;
              if (e.key === 'ArrowRight') onResize({ ...size, width: size.width + k });
              else if (e.key === 'ArrowLeft') onResize({ ...size, width: Math.max(120, size.width - k) });
              else if (e.key === 'ArrowDown') onResize({ ...size, height: size.height + k });
              else if (e.key === 'ArrowUp') onResize({ ...size, height: Math.max(80, size.height - k) });
              else return;
              e.preventDefault();
            }}
          />
        )}
      </div>
    </div>
  );
}

export function postToPreview(msg: Record<string, unknown>) {
  const f = document.querySelector<HTMLIFrameElement>('iframe[data-testid="preview-frame"]');
  f?.contentWindow?.postMessage({ __pgParent: true, ...msg }, '*');
}
