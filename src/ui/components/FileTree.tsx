import { useMemo, useState, type ReactElement } from "react";
import { Icon } from './Icon';
import { fileSize, humanSize, isBinaryContent, isImagePath } from '../../core/files';
import type { Diagnostic } from '../../core/manifest';

interface Node {
  name: string;
  path: string;
  children?: Node[];
}

function buildTree(paths: string[]): Node[] {
  const root: Node = { name: '', path: '', children: [] };
  for (const p of paths) {
    const parts = p.split('/');
    let cur = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/');
      if (i === parts.length - 1) cur.children!.push({ name: part, path });
      else {
        let next = cur.children!.find((c) => c.children && c.name === part);
        if (!next) cur.children!.push((next = { name: part, path, children: [] }));
        cur = next;
      }
    });
  }
  const sort = (n: Node[]): Node[] =>
    n
      .sort((a, b) => {
        if (a.path === 'manifest.json') return -1;
        if (b.path === 'manifest.json') return 1;
        if (!!a.children !== !!b.children) return a.children ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true });
      })
      .map((x) => (x.children ? { ...x, children: sort(x.children) } : x));
  return sort(root.children!);
}

function fileIcon(path: string, content: string) {
  if (isImagePath(path) || isBinaryContent(content)) return 'image';
  if (path === 'manifest.json') return 'manifest';
  return 'file';
}

function badge(path: string) {
  const ext = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
  return ext && ['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'mjs', 'cjs'].includes(ext) ? ext : null;
}

export function FileTree({
  files,
  active,
  diagnostics,
  onOpen,
  onDelete,
  onRename,
  onCreate,
  readOnly
}: {
  files: Record<string, string>;
  active: string;
  diagnostics: Diagnostic[];
  onOpen: (p: string) => void;
  onDelete: (p: string) => void;
  onRename: (from: string, to: string) => void;
  onCreate: (p: string) => void;
  readOnly?: boolean;
}) {
  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<{ mode: 'new' | 'rename'; path: string; value: string } | null>(null);
  const counts = useMemo(() => {
    const m = new Map<string, { e: number; w: number }>();
    for (const d of diagnostics) {
      if (d.severity === 'info') continue;
      const c = m.get(d.file) || { e: 0, w: 0 };
      if (d.severity === 'error') c.e++;
      else c.w++;
      m.set(d.file, c);
    }
    return m;
  }, [diagnostics]);

  const commit = () => {
    if (!editing) return;
    const v = editing.value.trim().replace(/^\/+/, '');
    setEditing(null);
    if (!v) return;
    if (editing.mode === 'new') onCreate(v);
    else if (v !== editing.path) onRename(editing.path, v);
  };

  const render = (nodes: Node[], depth: number): ReactElement[] =>
    nodes.flatMap((n) => {
      const pad = { paddingLeft: 8 + depth * 12 };
      if (n.children) {
        const isClosed = closed[n.path];
        return [
          <li key={'d:' + n.path} role="treeitem" aria-expanded={!isClosed} aria-level={depth + 1}>
            <button className="tree-row folder" style={pad} onClick={() => setClosed((c) => ({ ...c, [n.path]: !isClosed }))} data-testid={`folder-${n.path}`}>
              <Icon name={isClosed ? 'chevronRight' : 'chevronDown'} size={12} className="chev" />
              <Icon name={isClosed ? 'folder' : 'folderOpen'} size={14} />
              <span className="tree-name">{n.name}</span>
            </button>
          </li>,
          ...(isClosed ? [] : render(n.children, depth + 1))
        ];
      }
      const c = counts.get(n.path);
      const content = files[n.path] ?? '';
      const isActive = n.path === active;
      if (editing && editing.mode === 'rename' && editing.path === n.path) {
        return [
          <li key={n.path} className="tree-edit" style={pad}>
            <input autoFocus aria-label="New file name" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null); }} data-testid="rename-input" />
          </li>
        ];
      }
      return [
        <li key={n.path} role="treeitem" aria-selected={isActive} aria-level={depth + 1} className={isActive ? 'active' : ''}>
          <button
            className="tree-row file"
            style={pad}
            onClick={() => onOpen(n.path)}
            onDoubleClick={() => !readOnly && n.path !== 'manifest.json' && setEditing({ mode: 'rename', path: n.path, value: n.path })}
            onKeyDown={(e) => {
              if (readOnly) return;
              if (e.key === 'F2' && n.path !== 'manifest.json') setEditing({ mode: 'rename', path: n.path, value: n.path });
              if ((e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) && n.path !== 'manifest.json') onDelete(n.path);
            }}
            data-testid={`file-${n.path}`}
            title={isBinaryContent(content) ? `${n.path} (${humanSize(fileSize(content))})` : n.path}
          >
            <span className="chev-space" />
            <Icon name={fileIcon(n.path, content)} size={14} />
            <span className="tree-name">{n.name}</span>
            {badge(n.path) && <span className={`ext ext-${badge(n.path)}`}>{badge(n.path)}</span>}
            {c && (c.e > 0 ? <span className="pill err">{c.e}</span> : <span className="pill warn">{c.w}</span>)}
          </button>
          {!readOnly && n.path !== 'manifest.json' && (
            <span className="row-actions">
              <button className="icon-btn" title={`Rename ${n.path}`} aria-label={`Rename ${n.path}`} onClick={() => setEditing({ mode: 'rename', path: n.path, value: n.path })}>
                <Icon name="edit" size={13} />
              </button>
              <button className="icon-btn" title={`Delete ${n.path}`} aria-label={`Delete ${n.path}`} onClick={() => onDelete(n.path)} data-testid={`delete-${n.path}`}>
                <Icon name="trash" size={13} />
              </button>
            </span>
          )}
        </li>
      ];
    });

  return (
    <div className="file-tree">
      <div className="pane-head">
        <span className="pane-title">Files</span>
        <span className="muted small">{Object.keys(files).length}</span>
        <span className="spacer" />
        {!readOnly && (
          <button className="icon-btn" onClick={() => setEditing({ mode: 'new', path: '', value: '' })} title="New file (folders: use a/b.js)" aria-label="New file" data-testid="add-file">
            <Icon name="plus" />
          </button>
        )}
      </div>
      {editing?.mode === 'new' && (
        <div className="tree-edit new">
          <input autoFocus aria-label="New file name" placeholder="utils.js or lib/helpers.js" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null); }} data-testid="new-file-name" />
        </div>
      )}
      <ul className="tree" role="tree" aria-label="Project files">
        {render(tree, 0)}
      </ul>
    </div>
  );
}
