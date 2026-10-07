import { useSyncExternalStore } from "react";

const LANDSCAPE_QUERY = "(orientation: landscape)";

const subscribe = (onChange: () => void): (() => void) => {
  const query = window.matchMedia(LANDSCAPE_QUERY);

  query.addEventListener("change", onChange);

  return (): void => {
    query.removeEventListener("change", onChange);
  };
};

// Whether the phone is on its side — the same media query that takes `PhoneGameFrame`'s rotate
// card away. Anything timed to be SEEN on the game (a hold over it) waits for this: while the
// phone is upright the card covers the game. A server render has no screen to turn.
export const useIsLandscape = (): boolean => {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(LANDSCAPE_QUERY).matches,
    () => false
  );
};
