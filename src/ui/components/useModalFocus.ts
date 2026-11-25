import { useLayoutEffect, type KeyboardEvent, type RefObject } from 'react';

const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

function focusable(box: HTMLElement): HTMLElement[] {
  return Array.from(box.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (el) => !el.matches(':disabled') && !el.closest('[hidden], [inert], [aria-hidden="true"]') && el.getClientRects().length > 0
  );
}

/** Move focus into a modal, keep Tab inside it, and restore focus on close. */
export function useModalFocus(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const box = ref.current;
    if (box) (box.querySelector<HTMLElement>('[data-initial-focus]') || focusable(box)[0] || box).focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, [ref]);

  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || !ref.current) return;
    const items = focusable(ref.current);
    if (!items.length) { event.preventDefault(); ref.current.focus(); return; }
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); items[items.length - 1].focus(); }
    else if (!event.shiftKey && (index === -1 || index === items.length - 1)) { event.preventDefault(); items[0].focus(); }
  };
}
