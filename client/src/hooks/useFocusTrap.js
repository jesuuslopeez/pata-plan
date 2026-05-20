import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(active = true) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active || !containerRef.current) return undefined;

    const container = containerRef.current;
    const previousActive = document.activeElement;

    const focusables = container.querySelectorAll(FOCUSABLE_SELECTORS);
    const first = focusables[0];
    if (first instanceof HTMLElement) first.focus();

    function handleKeyDown(event) {
      if (event.key !== 'Tab') return;
      const current = container.querySelectorAll(FOCUSABLE_SELECTORS);
      if (current.length === 0) return;
      const firstEl = current[0];
      const lastEl = current[current.length - 1];

      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (previousActive instanceof HTMLElement) previousActive.focus();
    };
  }, [active]);

  return containerRef;
}
