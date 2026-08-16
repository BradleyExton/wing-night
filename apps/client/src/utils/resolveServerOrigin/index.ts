// Promoted out of `createRoomSocket` so the socket client and the anthem URL
// resolver share ONE origin resolver rather than drifting apart. This is a real
// seam, not a hypothetical one: there is no vite.config anywhere in the repo, so
// there is no dev proxy and the client is ALWAYS a different origin from the
// server. A root-relative asset URL would resolve against the Vite origin
// (5173 dev / 5273 under the e2e gate) and 404.
//
// Both reads happen inside the function body, so importing this module never
// touches `import.meta.env` or `window` — callers under `tsx --test` (no DOM,
// no Vite) can import it freely as long as they don't call it.
export const resolveServerOrigin = (): string => {
  const configuredUrl = import.meta.env.VITE_SOCKET_SERVER_URL;

  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.trim();
  }

  return `${window.location.protocol}//${window.location.hostname}:3000`;
};
