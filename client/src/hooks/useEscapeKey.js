import { useEffect } from 'react';

export function useEscapeKey(handler, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof handler !== 'function') return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        handler(event);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}
