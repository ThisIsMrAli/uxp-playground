import { useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';
import { useModalFocus } from './useModalFocus';

/** Accessible modal: focus moves in on open and back on close, Escape closes, Tab stays inside. */
export function Dialog({ title, onClose, children, wide, testId, footer, className }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean; testId?: string; footer?: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const trapFocus = useModalFocus(box);
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={box}
        className={'dialog ' + (wide ? 'dialog-wide ' : '') + (className || '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-testid={testId}
        onKeyDown={(e) => {
          trapFocus(e);
          if (e.key === 'Escape') {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <header className="dialog-head">
          <h2 id={titleId}>{title}</h2>
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
