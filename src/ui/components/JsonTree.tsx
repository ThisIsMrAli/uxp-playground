import { useState } from 'react';

/** Collapsible JSON viewer (keyboard accessible). */
export function JsonTree({ value, name, depth = 0, open = 2 }: { value: any; name?: string; depth?: number; open?: number }) {
  const [expanded, setExpanded] = useState(depth < open);
  const isObj = value && typeof value === 'object';
  const label = name != null ? <span className="jt-key">{name}: </span> : null;
  if (!isObj) {
    const cls = value === null ? 'null' : typeof value;
    return (
      <div className="jt-row" style={{ paddingLeft: depth * 12 }}>
        {label}
        <span className={'jt-' + cls}>{typeof value === 'string' ? JSON.stringify(value) : String(value)}</span>
      </div>
    );
  }
  const entries = Array.isArray(value) ? value.map((v, i) => [String(i), v] as const) : Object.entries(value);
  const summary = Array.isArray(value) ? `Array(${value.length})` : value._obj ? `{ _obj: "${value._obj}" … }` : value._ref ? `{ _ref: "${value._ref}" … }` : `{${entries.length}}`;
  return (
    <div>
      <button className="jt-row jt-toggle" style={{ paddingLeft: depth * 12 }} onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
        <span className="jt-caret">{expanded ? '▾' : '▸'}</span>
        {label}
        <span className="jt-summary">{summary}</span>
      </button>
      {expanded && entries.map(([k, v]) => <JsonTree key={k} name={k} value={v} depth={depth + 1} open={open} />)}
    </div>
  );
}
