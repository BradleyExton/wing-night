import { HOST_CONTROL_TOKEN_QUERY_KEY } from "@wingnight/shared";

// The key to the host seat for a device that is not the laptop. It arrives
// once, in the query of the URL the laptop's host QR encodes, and is kept here
// so a refresh — or the tablet's browser restoring the tab tomorrow — still
// connects as HOST without a rescan. Modelled on `hostSecretStorage`.
const HOST_CONTROL_TOKEN_STORAGE_KEY = "wingnight.hostControlToken";

type HostControlTokenStorageBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const resolveStorageBackend = (): HostControlTokenStorageBackend | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

const toToken = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
};

export const saveHostControlToken = (
  hostControlToken: string,
  storageBackend: HostControlTokenStorageBackend | null = resolveStorageBackend()
): void => {
  storageBackend?.setItem(HOST_CONTROL_TOKEN_STORAGE_KEY, hostControlToken);
};

export const readHostControlToken = (
  storageBackend: HostControlTokenStorageBackend | null = resolveStorageBackend()
): string | null => toToken(storageBackend?.getItem(HOST_CONTROL_TOKEN_STORAGE_KEY));

// Called when the server refuses the seat: whatever was stored no longer
// matches (the minted token was rotated, or `HOST_CONTROL_TOKEN` changed), so
// the next rescan starts clean instead of losing to it.
export const clearHostControlToken = (
  storageBackend: HostControlTokenStorageBackend | null = resolveStorageBackend()
): void => {
  storageBackend?.removeItem(HOST_CONTROL_TOKEN_STORAGE_KEY);
};

type HostControlTokenLocation = {
  location: Pick<Location, "href">;
  history: Pick<History, "replaceState" | "state">;
  storageBackend: HostControlTokenStorageBackend | null;
  // `VITE_HOST_CONTROL_TOKEN`, the build-time pin. Last resort.
  configuredToken: string | null;
};

const resolveBrowserLocation = (
  configuredToken: string | null
): HostControlTokenLocation => ({
  location: window.location,
  history: window.history,
  storageBackend: resolveStorageBackend(),
  configuredToken
});

// The token this host page should connect with: the URL's > the stored one >
// the build's. A token found in the URL is stored and then taken back OUT of
// the address bar, so it is not left on screen, in the tab's history entry or
// in a screenshot of the tablet for anyone at the party to read.
export const consumeHostControlToken = (
  configuredToken: string | null,
  browser: HostControlTokenLocation = resolveBrowserLocation(configuredToken)
): string | null => {
  const url = new URL(browser.location.href);
  const queryToken = toToken(url.searchParams.get(HOST_CONTROL_TOKEN_QUERY_KEY));

  if (url.searchParams.has(HOST_CONTROL_TOKEN_QUERY_KEY)) {
    url.searchParams.delete(HOST_CONTROL_TOKEN_QUERY_KEY);
    browser.history.replaceState(browser.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  if (queryToken !== null) {
    saveHostControlToken(queryToken, browser.storageBackend);
    return queryToken;
  }

  return readHostControlToken(browser.storageBackend) ?? browser.configuredToken;
};
