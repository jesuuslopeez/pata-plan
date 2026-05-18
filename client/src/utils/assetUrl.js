import api from '../services/api';

const stripApiSuffix = (base) => base.replace(/\/api\/?$/, '');

export const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = stripApiSuffix(api.defaults.baseURL || '');
  if (!base) return url;
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
};
