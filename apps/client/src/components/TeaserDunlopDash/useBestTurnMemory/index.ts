import { useCallback } from "react";
import type { SerializableValue } from "@wingnight/minigames-core";

// Dunlop Dash hands each turn the round's best turn to race (its `roundMemory`), and the teaser
// keeps that best on the phone between visits, so your ghost is waiting on the street next time.
// Browser storage can be missing or refuse outright (a private window, blocked site data), and a
// teaser with no memory is still a game, so every read and write is allowed to fail.
const STORAGE_KEY = "wingnight.teaser.dunlopDash.roundMemory";

type BestTurnMemory = {
  load: () => SerializableValue | null;
  save: (memory: SerializableValue | null) => void;
};

export const useBestTurnMemory = (): BestTurnMemory => {
  const load = useCallback((): SerializableValue | null => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      return stored === null ? null : (JSON.parse(stored) as SerializableValue);
    } catch {
      return null;
    }
  }, []);

  const save = useCallback((memory: SerializableValue | null): void => {
    try {
      if (memory === null) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
    } catch {
      // Nothing to keep it in; the next visit races nobody.
    }
  }, []);

  return { load, save };
};
