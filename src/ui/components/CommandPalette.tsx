import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { useModalFocus } from './useModalFocus';

export interface PaletteCommand {
  id: string;
  title: string;
  group?: string;
  hint?: string;
  icon?: string;
  run: () => void;
}

/** Fuzzy score: all query characters in order; bonus for word starts and contiguous runs. */
export function fuzzyScore(query: string, text: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let score = 0;
  let ti = 0;
  let run = 0;
  for (const ch of q) {
    const i = t.indexOf(ch, ti);
    if (i < 0) return 0;
    run = i === ti ? run + 1 : 1;
    score += 1 + run + (i === 0 || /[\s/:._-]/.test(t[i - 1]) ? 3 : 0);
    ti = i + 1;
  }
  return score - t.length / 100;
}

export function CommandPalette({ commands, onClose, initial = '', placeholder }: { commands: PaletteCommand[]; onClose: () => void; initial?: string; placeholder?: string }) {
  const [q, setQ] = useState(initial);
  const [sel, setSel] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const trapFocus = useModalFocus(box);
  const items = useMemo(
    () =>
      commands
        .map((c) => ({ c, s: fuzzyScore(q, (c.group ? c.group + ': ' : '') + c.title) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 60)
        .map((x) => x.c),
    [q, commands]
  );
  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);
  const pick = (c: PaletteCommand | undefined) => {
    if (!c) return;
    onClose();
    setTimeout(c.run, 0);
  };
  return (
    <div className="dialog-backdrop palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} tabIndex={-1} className="palette" role="dialog" aria-modal="true" aria-label="Command palette" data-testid="palette" onKeyDown={trapFocus}>
        <div className="palette-input">
          <Icon name="search" />
          <input
            data-initial-focus
            role="combobox"
            aria-label="Search commands"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[sel] ? 'pc-' + items[sel].id : undefined}
            placeholder={placeholder || 'Type a command, file or template…'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { setSel((s) => Math.max(0, Math.min(items.length - 1, s + 1))); e.preventDefault(); }
              else if (e.key === 'ArrowUp') { setSel((s) => Math.max(0, s - 1)); e.preventDefault(); }
              else if (e.key === 'Enter') { pick(items[sel]); e.preventDefault(); }
              else if (e.key === 'Escape') { onClose(); e.preventDefault(); }
            }}
            data-testid="palette-input"
          />
        </div>
        <ul className="palette-list" role="listbox" id="palette-list" ref={list}>
          {items.map((c, i) => (
            <li key={c.id} id={'pc-' + c.id} role="option" aria-selected={i === sel} className={i === sel ? 'sel' : ''} onMouseEnter={() => setSel(i)} onMouseDown={(e) => { e.preventDefault(); pick(c); }}>
              <Icon name={c.icon || 'command'} size={14} />
              {c.group && <span className="pc-group">{c.group}</span>}
              <span className="pc-title">{c.title}</span>
              {c.hint && <kbd>{c.hint}</kbd>}
            </li>
          ))}
          {!items.length && <li className="muted empty">No matching commands</li>}
        </ul>
      </div>
    </div>
  );
}
