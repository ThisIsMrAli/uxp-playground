import { useMemo, useState } from 'react';
import type { LogEntry } from '../../core/types';
import type { Diagnostic } from '../../core/manifest';
import { Icon } from './Icon';
import { JsonTree } from './JsonTree';
import { batchPlayCode, describeDescriptor } from '../../core/batchplay';

function time(t: number) {
  const d = new Date(t);
  return d.toLocaleTimeString(undefined, { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function ConsoleView({ logs, onOpenFile }: { logs: LogEntry[]; onOpenFile: (f: string, line?: number) => void }) {
  const [filter, setFilter] = useState('');
  const [level, setLevel] = useState<'all' | 'error' | 'warn'>('all');
  const shown = logs.filter((l) => (level === 'all' || (level === 'error' ? l.level === 'error' : l.level === 'error' || l.level === 'warn')) && (!filter || l.text.toLowerCase().includes(filter.toLowerCase())));
  return (
    <div className="logview">
      <div className="log-toolbar">
        <input className="log-filter" placeholder="Filter output" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter console" />
        <div className="seg" role="radiogroup" aria-label="Level">
          {(['all', 'warn', 'error'] as const).map((l) => (
            <button key={l} role="radio" aria-checked={level === l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>
              {l === 'all' ? 'All' : l === 'warn' ? 'Warnings' : 'Errors'}
            </button>
          ))}
        </div>
      </div>
      <ul className="log" aria-live="polite">
        {shown.map((l, i) => (
          <li key={i} className={`lvl-${l.level || 'log'} kind-${l.kind}`}>
            <span className="log-icon">{l.level === 'error' ? <Icon name="error" size={13} /> : l.level === 'warn' ? <Icon name="alert" size={13} /> : l.kind === 'file-written' ? <Icon name="file" size={13} /> : <span className="dot" />}</span>
            <span className="log-text">
              {l.file && (
                <button className="link file-link" onClick={() => onOpenFile(l.file!, l.line)}>
                  {l.file}
                  {l.line ? ':' + l.line : ''}
                </button>
              )}{' '}
              {l.text}
              {l.kind === 'file-written' && l.detail?.content && <pre className="file-content">{String(l.detail.content).slice(0, 2000)}</pre>}
            </span>
            {l.count && l.count > 1 ? <span className="pill">{l.count}</span> : null}
            <span className="log-time">{time(l.time)}</span>
          </li>
        ))}
        {!logs.length && (
          <li className="empty-state">
            <Icon name="terminal" size={20} />
            <div>
              <strong>No output yet</strong>
              <span>console.log() calls, errors and files your plugin writes show up here.</span>
            </div>
          </li>
        )}
        {!!logs.length && !shown.length && <li className="muted empty">No entries match the filter.</li>}
      </ul>
    </div>
  );
}

function short(v: any, n = 80): string {
  let s: string;
  try {
    s = typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v);
  } catch {
    s = String(v);
  }
  if (s === undefined) s = 'undefined';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function HostLog({ logs, onRunDescriptors, onCopy }: { logs: LogEntry[]; onRunDescriptors: (d: any[]) => void; onCopy: (text: string, what: string) => void }) {
  const [filter, setFilter] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const shown = useMemo(
    () => logs.filter((l) => (!onlyIssues || l.detail?.error || l.detail?.unsupported || /not simulated/.test(l.text)) && (!filter || l.text.toLowerCase().includes(filter.toLowerCase()))),
    [logs, filter, onlyIssues]
  );
  return (
    <div className="logview hostlog">
      <div className="log-toolbar">
        <input className="log-filter" placeholder="Filter calls (e.g. batchPlay, layer)" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter host calls" />
        <label className="check">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} /> Errors and unsimulated only
        </label>
      </div>
      <ul className="log calls">
        {shown.map((l, i) => {
          const p = l.detail || {};
          const isNote = !!p.note;
          const key = p.id ?? i;
          const isBp = p.fn === 'action.batchPlay' && Array.isArray(p.args?.[0]);
          const open = openId === key;
          return (
            <li key={key} className={`call ${p.error ? 'lvl-error' : isNote ? (p.unsupported ? 'lvl-warn' : 'lvl-note') : ''} ${open ? 'open' : ''}`}>
              <button className="call-row" onClick={() => setOpenId(open ? null : key)} aria-expanded={open}>
                <span className={`mod mod-${p.module || 'host'}`}>{p.module || 'host'}</span>
                {isNote ? (
                  <span className="call-note">{p.fn && p.fn !== '(note)' ? <code>{p.fn}</code> : null} {p.note}</span>
                ) : (
                  <span className="call-sig">
                    <code>{p.fn}</code>
                    <span className="args">({(p.args || []).map((a: any) => short(a, 60)).join(', ')})</span>
                    {isBp && <span className="bp-desc">{(p.args[0] as any[]).map(describeDescriptor).join(' ; ')}</span>}
                  </span>
                )}
                {p.modal && <span className="tag modal" title="Inside executeAsModal">modal</span>}
                {p.error ? <span className="res err">✖ {short(p.error, 140)}</span> : !isNote && p.result !== undefined && p.result !== 'undefined' ? <span className="res">→ {short(p.result, 60)}</span> : null}
                <span className="log-time">{time(l.time)}</span>
              </button>
              {open && (
                <div className="call-detail" data-testid="call-detail">
                  {isBp && (
                    <div className="inspector" data-testid="batchplay-inspector">
                      <div className="insp-head">
                        <strong>batchPlay inspector</strong>
                        <span className="spacer" />
                        <button className="btn sm" onClick={() => onCopy(batchPlayCode(p.args[0], p.args[1]), 'Code')}>
                          <Icon name="copy" size={13} /> Copy as code
                        </button>
                        <button className="btn sm" onClick={() => onCopy(JSON.stringify(p.args[0], null, 2), 'Descriptors')}>
                          <Icon name="copy" size={13} /> Copy descriptors
                        </button>
                        <button className="btn sm" onClick={() => onRunDescriptors(p.args[0])} data-testid="bp-rerun">
                          <Icon name="play" size={13} /> Run again
                        </button>
                      </div>
                      {(p.args[0] as any[]).map((d, k) => (
                        <div className="insp-desc" key={k}>
                          <div className="insp-title">
                            #{k + 1} <code>{d?._obj}</code> <span className="muted">{describeDescriptor(d)}</span>
                          </div>
                          <JsonTree value={d} open={3} />
                          {Array.isArray(p.result) && p.result[k] !== undefined && (
                            <>
                              <div className="insp-sub">Result (mock)</div>
                              <JsonTree value={p.result[k]} open={2} />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isBp && (
                    <>
                      <div className="insp-sub">Arguments</div>
                      <JsonTree value={p.args || []} open={2} />
                      {p.result !== undefined && (
                        <>
                          <div className="insp-sub">Result</div>
                          <JsonTree value={p.result} open={2} />
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {!logs.length && (
          <li className="empty-state">
            <Icon name="layers" size={20} />
            <div>
              <strong>No host calls yet</strong>
              <span>Every call into the mocked photoshop, uxp, fs and network APIs is listed here. Click a batchPlay call to inspect its descriptors.</span>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

export function ProblemsView({ diagnostics, engine, docsFor, onOpen }: { diagnostics: Diagnostic[]; engine: string; docsFor: (ruleId: string) => string | undefined; onOpen: (d: Diagnostic) => void }) {
  const byFile = useMemo(() => {
    const m = new Map<string, Diagnostic[]>();
    for (const d of diagnostics) {
      if (!m.has(d.file)) m.set(d.file, []);
      m.get(d.file)!.push(d);
    }
    for (const list of m.values()) list.sort((a, b) => a.line - b.line || a.column - b.column);
    return [...m.entries()].sort(([a], [b]) => (a === 'manifest.json' ? -1 : b === 'manifest.json' ? 1 : a.localeCompare(b)));
  }, [diagnostics]);
  return (
    <div className="logview problems">
      <div className="log-toolbar">
        <span className="muted small" data-testid="lint-engine">{engine}</span>
      </div>
      <ul className="log">
        {byFile.map(([file, list]) => [
          <li key={'f:' + file} className="prob-file">
            <Icon name="file" size={13} /> {file} <span className="muted">{list.length}</span>
          </li>,
          ...list.map((d, i) => {
            const url = d.docsUrl || docsFor(d.ruleId);
            return (
              <li key={file + i} className={`prob lvl-${d.severity === 'warning' ? 'warn' : d.severity}`}>
                <span className="log-icon">{d.severity === 'error' ? <Icon name="error" size={13} /> : d.severity === 'warning' ? <Icon name="alert" size={13} /> : <Icon name="info" size={13} />}</span>
                <button className="link prob-msg" onClick={() => onOpen(d)}>
                  {d.message}
                </button>
                <span className="prob-rule">
                  {url ? (
                    <a href={url} target="_blank" rel="noreferrer" title="Rule documentation">
                      {d.ruleId}
                    </a>
                  ) : (
                    d.ruleId
                  )}
                </span>
                <span className="prob-loc">
                  {d.line}:{d.column}
                </span>
              </li>
            );
          })
        ])}
        {!diagnostics.length && (
          <li className="empty-state ok">
            <Icon name="check" size={20} />
            <div>
              <strong>No problems found</strong>
              <span>ESLint, the UXP rules and the manifest checks found nothing to report.</span>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
