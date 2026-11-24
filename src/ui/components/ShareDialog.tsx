import { useMemo, useState } from 'react';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { share, SHARE_URL_WARN } from '../../core/share';
import type { Project } from '../../core/types';

export function ShareDialog({ project, base, origin, onClose, onCopied }: { project: Project; base: string; origin: string | null; onClose: () => void; onCopied: (what: string) => void }) {
  const [view, setView] = useState<'split' | 'preview' | 'editor'>('split');
  const [height, setHeight] = useState(480);
  const r = useMemo(() => share(base, project), [base, project]);
  const embed = useMemo(() => {
    const u = share(base, project, { embed: '1', ...(view !== 'split' ? { view } : {}) });
    return `<iframe src="${u.url.replace(/"/g, '&quot;')}" title="${project.name.replace(/"/g, '&quot;')} — UXP Playground" width="100%" height="${height}" style="border:0;border-radius:8px" loading="lazy"></iframe>`;
  }, [base, project, view, height]);
  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).then(() => onCopied(what), () => onCopied(what + ' (select and copy manually)'));
  };
  return (
    <Dialog title="Share" onClose={onClose} testId="share-dialog" wide>
      <section className="share-sec">
        <h3>Link</h3>
        <p className="muted small">The project is compressed into the URL. Nothing is uploaded.</p>
        <div className="row">
          <input readOnly className="grow mono" value={r.url} onFocus={(e) => e.target.select()} data-testid="share-url" aria-label="Share link" />
          <button className="btn primary" onClick={() => copy(r.url, 'Link')} data-testid="copy-link">
            <Icon name="copy" size={14} /> Copy
          </button>
        </div>
        <div className={'share-meter ' + r.status} data-testid="share-status">
          {r.length.toLocaleString()} characters.{' '}
          {r.status === 'ok' && 'Short enough for chat apps and issue trackers.'}
          {r.status === 'long' && `Over ${SHARE_URL_WARN.toLocaleString()} characters: some chat apps and forums cut long links. Prefer a gist or GitHub link for big projects.`}
          {r.status === 'too-long' && 'Too long for most browsers. Use "Save .json", a gist or a GitHub repository.'}
        </div>
        {r.omitted.length > 0 && (
          <div className="banner warn" data-testid="share-omitted">
            {r.omitted.length} binary file{r.omitted.length > 1 ? 's' : ''} left out of the link (over 4 KB): {r.omitted.slice(0, 6).join(', ')}
            {r.omitted.length > 6 ? '…' : ''}. The zip export includes them.
          </div>
        )}
        {origin && (
          <>
            <p className="muted small">Short link to the original {origin.includes('#github=') ? 'GitHub folder' : origin.includes('#example=') ? 'example' : 'template'} (without your edits):</p>
            <div className="row">
              <input readOnly className="grow mono" value={origin} onFocus={(e) => e.target.select()} aria-label="Link to the original" data-testid="origin-url" />
              <button className="btn" onClick={() => copy(origin, 'Original link')}>
                <Icon name={origin.includes('#github=') ? 'github' : 'copy'} size={14} /> Copy
              </button>
            </div>
          </>
        )}
      </section>
      <section className="share-sec">
        <h3>Embed</h3>
        <p className="muted small">Paste into documentation, a blog or a forum that allows iframes. The embed has its own minimal layout and does not touch the reader's saved work.</p>
        <div className="row">
          <div className="seg" role="radiogroup" aria-label="Embed view">
            {(['split', 'preview', 'editor'] as const).map((v) => (
              <button key={v} role="radio" aria-checked={view === v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>
                {v === 'split' ? 'Code + preview' : v === 'preview' ? 'Preview only' : 'Code only'}
              </button>
            ))}
          </div>
          <label className="inline">
            Height <input type="number" min={240} max={1200} step={20} value={height} onChange={(e) => setHeight(Number(e.target.value) || 480)} style={{ width: 80 }} />
          </label>
        </div>
        <textarea readOnly className="mono embed-code" value={embed} rows={4} onFocus={(e) => e.target.select()} data-testid="embed-code" aria-label="Embed code" />
        <button className="btn" onClick={() => copy(embed, 'Embed code')}>
          <Icon name="embed" size={14} /> Copy embed code
        </button>
      </section>
    </Dialog>
  );
}
