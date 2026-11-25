import { useState } from 'react';
import { hostInfo } from '../../core/hosts';
import { parseManifest, primaryHost } from '../../core/manifest';
import { PREMIERE_SCENARIOS } from '../../core/scenarios';
import { REPRO_LOG_LENGTH, REPRO_LOG_LIMIT, REPRO_TEXT_LIMIT, share, type Reproduction, type ShareResult } from '../../core/share';
import type { LogEntry, Project } from '../../core/types';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

function Context({ project }: { project: Project }) {
  const host = hostInfo(project.target.app);
  const minVersion = primaryHost(parseManifest(project.files['manifest.json']).value, project.target.app).minVersion;
  const scenario = project.target.app === 'premierepro'
    ? PREMIERE_SCENARIOS.find(({ id }) => id === (project.scenario ?? 'sample'))?.label
    : undefined;
  return (
    <p className="muted small">
      {host?.label} · UXP {project.target.uxp}{minVersion && ` · Manifest minimum ${minVersion}`}{scenario && ` · ${scenario}`}
    </p>
  );
}

export function ReproductionDialog({ project, base, logs, initial, onCopy, onClose }: {
  project: Project;
  base: string;
  logs: LogEntry[];
  initial?: Reproduction;
  onCopy: (text: string, what: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    steps: initial?.steps ?? '', expected: initial?.expected ?? '', actual: initial?.actual ?? '', hostVersion: initial?.hostVersion ?? ''
  }));
  const [entries] = useState(() => Array.from(new Set([
    ...(initial?.logs ?? []),
    ...logs.slice(-REPRO_LOG_LIMIT).map((l) => `${l.file ? l.file + (l.line ? ':' + l.line : '') + ' · ' : ''}${l.text}`.slice(0, REPRO_LOG_LENGTH))
  ])).filter(Boolean).slice(0, REPRO_LOG_LIMIT));
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<ShareResult | null>(null);
  const valid = Boolean(draft.steps.trim() && draft.expected.trim());
  const files = Object.keys(project.files).sort();
  const update = (field: keyof typeof draft, value: string) => {
    setResult(null);
    setDraft((current) => ({ ...current, [field]: value }));
  };
  return (
    <Dialog title="Share a reproduction" onClose={onClose} testId="reproduction-dialog" wide>
      <p>Describe the shortest steps that reproduce the issue. Review the project files and choose any output you want to include.</p>
      <Context project={project} />
      <form className="repro-form" onSubmit={(e) => {
        e.preventDefault();
        if (valid) setResult(share(base, project, undefined, { ...draft, logs: entries.filter((entry) => selected.includes(entry)) }));
      }}>
        <label>Steps to reproduce
          <textarea required value={draft.steps} maxLength={REPRO_TEXT_LIMIT} rows={3} onChange={(e) => update('steps', e.target.value)} />
        </label>
        <label>Expected result
          <textarea required value={draft.expected} maxLength={REPRO_TEXT_LIMIT} rows={2} onChange={(e) => update('expected', e.target.value)} />
        </label>
        <label>Actual result <span className="muted small">(optional)</span>
          <textarea value={draft.actual} maxLength={REPRO_TEXT_LIMIT} rows={2} onChange={(e) => update('actual', e.target.value)} />
        </label>
        <label>Adobe app version tested <span className="muted small">(optional)</span>
          <input value={draft.hostVersion} maxLength={80} placeholder="26.5.2" onChange={(e) => update('hostVersion', e.target.value)} />
        </label>
        <details className="repro-review">
          <summary>Project files ({files.length})</summary>
          <ul>{files.map((file) => <li key={file}><code>{file}</code></li>)}</ul>
        </details>
        {entries.length > 0 && <details className="repro-review">
          <summary>Preview output ({selected.length} selected)</summary>
          <div className="repro-logs">
            {entries.map((entry) => <label key={entry}>
              <input type="checkbox" checked={selected.includes(entry)} onChange={(e) => {
                setResult(null);
                setSelected((current) => e.target.checked ? [...current, entry] : current.filter((item) => item !== entry));
              }} />
              <code>{entry}</code>
            </label>)}
          </div>
        </details>}
        <div><button className="btn primary" type="submit" disabled={!valid}>Create reproduction link</button></div>
      </form>
      {result && (
        <section className="share-sec repro-result" aria-label="Reproduction link">
          <p role="status">The link contains the project, report, and {selected.length} selected output line{selected.length === 1 ? '' : 's'}. Everything stays in the URL.</p>
          {result.omitted.length > 0 && <p className="banner warn">Large binary files omitted from the link: {result.omitted.join(', ')}</p>}
          {result.status !== 'ok' && <p className="banner warn">This link is long. Reduce the project to the files needed to reproduce the issue.</p>}
          <div className="row">
            <input readOnly className="grow mono" aria-label="Reproduction URL" value={result.url} onFocus={(e) => e.target.select()} />
            <button className="btn" disabled={result.status === 'too-long'} onClick={() => onCopy(result.url, 'Reproduction link')}><Icon name="copy" size={14} /> Copy</button>
          </div>
        </section>
      )}
    </Dialog>
  );
}

export function ReproductionDetails({ project, report, onShare, onClose }: {
  project: Project;
  report: Reproduction;
  onShare: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog title="Reproduction notes" onClose={onClose} testId="reproduction-notes" wide footer={<button className="btn primary" onClick={onShare}>Share an updated reproduction</button>}>
      <Context project={project} />
      <dl className="repro-notes">
        {report.hostVersion && <><dt>Adobe app version reported</dt><dd>{report.hostVersion}</dd></>}
        <dt>Steps to reproduce</dt><dd>{report.steps}</dd>
        <dt>Expected result</dt><dd>{report.expected}</dd>
        {report.actual && <><dt>Actual result</dt><dd>{report.actual}</dd></>}
        {report.logs.length > 0 && <><dt>Shared preview output</dt><dd><ul>{report.logs.map((log, i) => <li key={i}><code>{log}</code></li>)}</ul></dd></>}
      </dl>
    </Dialog>
  );
}
