import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { templateHash, TEMPLATES } from '../../core/templates';
import { HOSTS, hostInfo, type HostApp } from '../../core/hosts';

export interface ExampleMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  file: string;
  host?: HostApp;
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

type GalleryProps = {
  onOpenExample: (m: ExampleMeta) => void;
  onOpenTemplate: (id: string, app?: HostApp) => void;
  onCopyLink: (hash: string) => void;
  target: HostApp;
  compact?: boolean;
};

const starters = TEMPLATES.map((t) => ({
  id: t.id, title: t.label, description: t.description, category: 'Starters', tags: t.tags || [],
  host: t.host ?? 'PS', kind: 'template' as const, template: t
}));

export function Gallery({ onOpenExample, onOpenTemplate, onCopyLink, target, compact }: GalleryProps) {
  const [index, setIndex] = useState<ExampleIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [host, setHost] = useState<HostApp | 'all'>('all');
  useEffect(() => {
    loadExampleIndex().then(setIndex, (e) => setError(String(e.message || e)));
  }, []);
  const sharedHost = host === 'all' ? target : host;
  const all = [...starters, ...(index?.examples || []).map((e) => ({ ...e, host: e.host ?? 'PS', kind: 'example' as const }))];
  const available = all.filter((x) => host === 'all' || x.host === host || x.host === 'shared');
  const cats = ['All', ...new Set(available.map((x) => x.category))];
  const hostLabel = (app: HostApp | 'shared') => app === 'shared' ? 'Shared UXP · ' + hostInfo(sharedHost)?.label : hostInfo(app)?.label;
  const query = q.trim().toLowerCase();
  const shown = available.filter((x) => (cat === 'All' || x.category === cat) && [x.title, x.description, hostLabel(x.host), ...x.tags].join(' ').toLowerCase().includes(query));
  return (
    <div className={'gallery' + (compact ? ' compact' : '')} data-testid="gallery">
      <div className="gallery-bar">
        <label className="field compact gallery-host">
          <span>Host</span>
          <select aria-label="Example host" value={host} onChange={(e) => { setHost(e.target.value as HostApp | 'all'); setCat('All'); }}>
            <option value="all">All hosts</option>
            {HOSTS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
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
      {!shown.length && <p className="muted" role="status">No examples match these filters.</p>}
      <ul className="cards">
        {shown.map((x) => (
          <li key={x.kind + x.id} className="card">
            <button className="card-main" onClick={() => (x.kind === 'template' ? onOpenTemplate(x.id, sharedHost) : onOpenExample(x))} data-testid={`${x.kind}-${x.id}`}>
              <span className="card-cat">{hostLabel(x.host)}</span>
              <strong className="card-title">{x.title}</strong>
              <span className="card-desc">{x.description}</span>
              <span className="card-tags">
                {x.tags.slice(0, 4).map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </span>
            </button>
            <div className="card-actions">
              <button className="icon-btn" title="Copy link to this example" aria-label={`Copy link to ${x.title}`} onClick={() => onCopyLink(x.kind === 'template' ? templateHash(x.template, sharedHost) : '#example=' + x.id)}>
                <Icon name="share" size={13} />
              </button>
              {x.kind === 'example' && x.origin?.url && (
                <a className="icon-btn" href={x.origin.url} target="_blank" rel="noreferrer" title="Source on GitHub" aria-label={`Source of ${x.title} on GitHub`}>
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
