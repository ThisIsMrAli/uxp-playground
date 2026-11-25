import { useState } from 'react';
import { Icon } from './Icon';
import { Gallery, type ExampleMeta } from './Gallery';
import { type HostApp } from '../../core/hosts';
import { TEMPLATES } from '../../core/templates';

export function Welcome({ onClose, onOpenExample, onOpenTemplate, onImport, onGithub, onCopyLink, target }: { onClose: () => void; onOpenExample: (m: ExampleMeta) => void; onOpenTemplate: (id: string, app?: HostApp) => void; onImport: () => void; onGithub: (spec: string) => void; onCopyLink: (hash: string) => void; target: HostApp }) {
  const [gh, setGh] = useState('');
  const starter = TEMPLATES.find((t) => t.host === target) ?? TEMPLATES[0];
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title" data-testid="welcome" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <button className="icon-btn dialog-close" onClick={onClose} aria-label="Close welcome" data-testid="welcome-close">
          <Icon name="close" />
        </button>
        <div className="welcome-hero">
          <div className="logo-mark big" aria-hidden="true">Ux</div>
          <div>
            <h1 id="welcome-title">UXP Playground</h1>
            <p>Write, run and share Adobe UXP plugins in the browser. Nothing to install, nothing uploaded.</p>
          </div>
        </div>
        <div className="welcome-actions">
          <button className="welcome-card" onClick={() => onOpenTemplate(starter.id)} autoFocus data-testid="welcome-start">
            <Icon name="sparkle" size={20} />
            <strong>Start a panel</strong>
            <span>{starter.label}</span>
          </button>
          <form className="welcome-card" onSubmit={(e) => { e.preventDefault(); if (gh.trim()) onGithub(gh.trim()); }}>
            <Icon name="github" size={20} />
            <strong>Open from GitHub</strong>
            <input value={gh} onChange={(e) => setGh(e.target.value)} placeholder="owner/repo or URL" aria-label="GitHub repository" data-testid="welcome-github" />
          </form>
          <button className="welcome-card" onClick={onImport}>
            <Icon name="upload" size={20} />
            <strong>Import your plugin</strong>
            <span>Zip, .ccx, a folder or a gist. Drag and drop works too.</span>
          </button>
        </div>
        <h2 className="welcome-sub">Examples</h2>
        <Gallery compact target={target} onOpenExample={onOpenExample} onOpenTemplate={onOpenTemplate} onCopyLink={onCopyLink} />
        <p className="welcome-note">
          <Icon name="info" size={13} /> The browser preview uses sample data. Use Run in host to test a plugin in its Adobe app.
        </p>
      </div>
    </div>
  );
}
