import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import { TEMPLATES } from '../../core/templates';

export interface ExampleMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  file: string;
  origin?: { repo: string; path: string; commit?: string; license?: string; url?: string };
  note?: string;
}

export interface ExampleIndex {
  generated: string;
  source: string;
  examples: ExampleMeta[];
}

let indexPromise: Promise<ExampleIndex> | null = null;
export function loadExampleIndex(): Promise<ExampleIndex> {
  if (!indexPromise)
    indexPromise = fetch('./examples/index.json').then((r) => {
      if (!r.ok) throw new Error('examples/index.json: HTTP ' + r.status);
      return r.json();
    });
  indexPromise.catch(() => (indexPromise = null));
  return indexPromise;
}

export async function loadExampleFiles(meta: ExampleMeta): Promise<Record<string, string>> {
  const r = await fetch('./examples/' + meta.file);
  if (!r.ok) throw new Error(`Could not load example ${meta.id}: HTTP ${r.status}`);
  return (await r.json()).files;
}

export function Gallery({ onOpenExample, onOpenTemplate, onCopyLink, compact }: { onOpenExample: (m: ExampleMeta) => void; onOpenTemplate: (id: string) => void; onCopyLink: (hash: string) => void; compact?: boolean }) {
  const [index, setIndex] = useState<ExampleIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  useEffect(() => {
    loadExampleIndex().then(setIndex, (e) => setError(String(e.message || e)));
  }, []);
  const starters = TEMPLATES.map((t) => ({ id: t.id, title: t.label, description: t.description, category: 'Starters', tags: t.tags || [] }));
  const all = useMemo(() => [...starters.map((s) => ({ ...s, kind: 'template' as const })), ...(index?.examples || []).map((e) => ({ ...e, kind: 'example' as const }))], [index]);
  const cats = ['All', ...Array.from(new Set(all.map((x) => x.category)))];
  const shown = all.filter((x) => (cat === 'All' || x.category === cat) && (!q || (x.title + ' ' + x.description + ' ' + x.tags.join(' ')).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className={'gallery' + (compact ? ' compact' : '')} data-testid="gallery">
      <div className="gallery-bar">
        <div className="search-box">
          <Icon name="search" size={14} />
          <input placeholder="Search examples (batchPlay, React, file…)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search examples" />
        </div>
        <div className="seg" role="tablist" aria-label="Category">
          {cats.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {error && <div className="banner warn">Examples could not be loaded: {error}</div>}
      <ul className="cards">
        {shown.map((x) => (
          <li key={x.kind + x.id} className="card">
            <button className="card-main" onClick={() => (x.kind === 'template' ? onOpenTemplate(x.id) : onOpenExample(x as ExampleMeta))} data-testid={`${x.kind}-${x.id}`}>
              <span className="card-cat">{x.category}</span>
              <strong className="card-title">{x.title}</strong>
              <span className="card-desc">{x.description}</span>
              <span className="card-tags">
                {x.tags.slice(0, 4).map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </span>
            </button>
            <div className="card-actions">
              <button className="icon-btn" title="Copy link to this example" aria-label={`Copy link to ${x.title}`} onClick={() => onCopyLink((x.kind === 'template' ? '#template=' : '#example=') + x.id)}>
                <Icon name="share" size={13} />
              </button>
              {x.kind === 'example' && (x as ExampleMeta).origin?.url && (
                <a className="icon-btn" href={(x as ExampleMeta).origin!.url} target="_blank" rel="noreferrer" title="Source on GitHub" aria-label={`Source of ${x.title} on GitHub`}>
                  <Icon name="github" size={13} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      {index && <p className="muted small gallery-foot">{index.source}</p>}
    </div>
  );
}
