const explicitBase = import.meta.env.VITE_ASSET_BASE_URL;
const apiBase = import.meta.env.VITE_API_URL;
const derivedBase = apiBase ? apiBase.replace(/\/api\/?$/, '') : '';

const ASSET_BASE = explicitBase || derivedBase || (import.meta.env.PROD ? '' : 'http://localhost:3000');

export function getAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${ASSET_BASE}${path}`;
}

export { ASSET_BASE };
