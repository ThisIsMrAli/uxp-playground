import { useRef } from 'react';

/** Drag handle between panes. `axis="x"` resizes width, `"y"` height. Keyboard: arrow keys move 16px. */
export function Splitter({ axis, value, min, max, onChange, invert, label, testId }: { axis: 'x' | 'y'; value: number; min: number; max: number; onChange: (v: number) => void; invert?: boolean; label: string; testId?: string }) {
  const start = useRef<{ pos: number; value: number } | null>(null);
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div
      className={`splitter splitter-${axis}`}
      role="separator"
      aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'}
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-testid={testId}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        start.current = { pos: axis === 'x' ? e.clientX : e.clientY, value };
        document.body.classList.add('resizing', `resizing-${axis}`);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        const d = (axis === 'x' ? e.clientX : e.clientY) - start.current.pos;
        onChange(clamp(start.current.value + (invert ? -d : d)));
      }}
      onLostPointerCapture={() => {
        start.current = null;
        document.body.classList.remove('resizing', 'resizing-x', 'resizing-y');
      }}
      onDoubleClick={() => onChange(clamp((min + max) / 2))}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 64 : 16;
        const dec = axis === 'x' ? 'ArrowLeft' : 'ArrowUp';
        const inc = axis === 'x' ? 'ArrowRight' : 'ArrowDown';
        if (e.key === dec) onChange(clamp(value + (invert ? step : -step)));
        else if (e.key === inc) onChange(clamp(value + (invert ? -step : step)));
        else return;
        e.preventDefault();
      }}
    />
  );
}
