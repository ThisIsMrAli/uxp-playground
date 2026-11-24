import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/** Accessible modal: focus moves in on open and back on close, Escape closes, Tab stays inside. */
export function Dialog({ title, onClose, children, wide, testId, footer, className }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; testId?: string; footer?: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = box.current?.querySelector<HTMLElement>('[autofocus], input, button:not(.dialog-close), [tabindex="0"]');
    (first || box.current)?.focus();
    return () => prev?.focus?.();
  }, []);
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        className={'dialog ' + (wide ? 'dialog-wide ' : '') + (className || '')}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        data-testid={testId}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
          if (e.key === 'Tab' && box.current) {
            const els = Array.from(box.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((x) => !x.hasAttribute('disabled'));
            if (!els.length) return;
            const i = els.indexOf(document.activeElement as HTMLElement);
            if (e.shiftKey && i <= 0) {
              els[els.length - 1].focus();
              e.preventDefault();
            } else if (!e.shiftKey && i === els.length - 1) {
              els[0].focus();
              e.preventDefault();
            }
          }
        }}
      >
        <header className="dialog-head">
          <h2>{title}</h2>
          <button className="icon-btn dialog-close" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
        {footer && <footer className="dialog-foot">{footer}</footer>}
      </div>
    </div>
  );
}
