import { PLAYER_JOIN_TOKEN_QUERY_KEY, isRecord } from "@wingnight/shared";

// What a guest's phone keeps so that coming back costs nothing: the join token
// it scanned off the TV, and — once it has tapped its face — the claim secret
// and the face it claims. A phone on plain HTTP cannot hold a wake lock, so it
// sleeps between turns; on waking it reconnects with these and is the same
// player before its first paint, with no re-pick. Modelled on
// `hostControlToken`: the token arrives once in the URL and is taken back out
// of the address bar, so it is not left in the tab's history or a screenshot.
const PLAYER_SEAT_STORAGE_KEY = "wingnight.playerSeat";

export type PlayerSeat = {
  joinToken: string;
  claimSecret: string | null;
  playerId: string | null;
};

type PlayerSeatStorageBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const resolveStorageBackend = (): PlayerSeatStorageBackend | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
};

const toNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parsePlayerSeat = (raw: string | null): PlayerSeat | null => {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) {
      return null;
    }

    const joinToken = toNonEmptyString(parsed.joinToken);
    const claimSecret = toNonEmptyString(parsed.claimSecret);
    const playerId = toNonEmptyString(parsed.playerId);

    if (joinToken === null) {
      return null;
    }

    // A secret without its face (or the reverse) is half a claim: drop both.
    return claimSecret !== null && playerId !== null
      ? { joinToken, claimSecret, playerId }
      : { joinToken, claimSecret: null, playerId: null };
  } catch {
    return null;
  }
};

export const readPlayerSeat = (
  storageBackend: PlayerSeatStorageBackend | null = resolveStorageBackend()
): PlayerSeat | null => parsePlayerSeat(storageBackend?.getItem(PLAYER_SEAT_STORAGE_KEY) ?? null);

export const savePlayerSeat = (
  seat: PlayerSeat,
  storageBackend: PlayerSeatStorageBackend | null = resolveStorageBackend()
): void => {
  storageBackend?.setItem(PLAYER_SEAT_STORAGE_KEY, JSON.stringify(seat));
};

// The face is this phone's: keep the secret to come back as this player.
export const savePlayerClaim = (
  playerId: string,
  claimSecret: string,
  storageBackend: PlayerSeatStorageBackend | null = resolveStorageBackend()
): void => {
  const seat = readPlayerSeat(storageBackend);

  if (seat !== null) {
    savePlayerSeat({ joinToken: seat.joinToken, claimSecret, playerId }, storageBackend);
  }
};

// The face is gone (released here, by the host, or by a roster change) but
// the night is the same one: keep the join token so the picker still works.
export const forgetPlayerClaim = (
  storageBackend: PlayerSeatStorageBackend | null = resolveStorageBackend()
): void => {
  const seat = readPlayerSeat(storageBackend);

  if (seat !== null) {
    savePlayerSeat({ joinToken: seat.joinToken, claimSecret: null, playerId: null }, storageBackend);
  }
};

// The join token is dead (Reset Game rotated it): only a fresh scan helps.
export const clearPlayerSeat = (
  storageBackend: PlayerSeatStorageBackend | null = resolveStorageBackend()
): void => {
  storageBackend?.removeItem(PLAYER_SEAT_STORAGE_KEY);
};

type PlayerSeatLocation = {
  location: Pick<Location, "href">;
  history: Pick<History, "replaceState" | "state">;
  storageBackend: PlayerSeatStorageBackend | null;
};

const resolveBrowserLocation = (): PlayerSeatLocation => ({
  location: window.location,
  history: window.history,
  storageBackend: resolveStorageBackend()
});

// The seat this phone should connect with. A token in the URL is a scan: it
// is stored, then stripped from the address bar. Scanning the same code again
// keeps the claim (the phone just comes back); a different code is a
// different night, so any claim from the old one is dropped. No token in the
// URL is a reload or a reopened tab: whatever was stored, or nothing.
export const consumePlayerSeat = (
  browser: PlayerSeatLocation = resolveBrowserLocation()
): PlayerSeat | null => {
  const url = new URL(browser.location.href);
  const queryToken = toNonEmptyString(url.searchParams.get(PLAYER_JOIN_TOKEN_QUERY_KEY));
  const storedSeat = readPlayerSeat(browser.storageBackend);

  if (url.searchParams.has(PLAYER_JOIN_TOKEN_QUERY_KEY)) {
    url.searchParams.delete(PLAYER_JOIN_TOKEN_QUERY_KEY);
    browser.history.replaceState(browser.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  if (queryToken === null) {
    return storedSeat;
  }

  if (storedSeat !== null && storedSeat.joinToken === queryToken) {
    return storedSeat;
  }

  const scannedSeat: PlayerSeat = { joinToken: queryToken, claimSecret: null, playerId: null };

  savePlayerSeat(scannedSeat, browser.storageBackend);

  return scannedSeat;
};
