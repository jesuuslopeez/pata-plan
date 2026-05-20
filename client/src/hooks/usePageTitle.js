import { useEffect } from 'react';

const BASE_TITLE = 'PataPlan';

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title
      ? `${title} · ${BASE_TITLE}`
      : `${BASE_TITLE} — Gestión sanitaria de mascotas`;
  }, [title]);
}
