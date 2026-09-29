import { useCallback } from "react";
import type { SerializableValue } from "@wingnight/minigames-core";

// What the phone keeps of a game between visits: its best result, and the round's memory the
// runtime hands forward (Dunlop Dash's best turn, whose legs ride as ghosts), so the next visit
// races it. Browser storage can be missing or refuse outright (a private window, blocked site
// data), and a teaser with no memory is still a game, so every read and write may fail.
export type TeaserGameRecord = {
  best: number | null;
  roundMemory: SerializableValue | null;
};

const EMPTY_RECORD: TeaserGameRecord = { best: null, roundMemory: null };

const resolveStorageKey = (slug: string): string => `wingnight.teaser.${slug}`;

const parseRecord = (stored: string | null): TeaserGameRecord => {
  if (stored === null) {
    return EMPTY_RECORD;
  }

  const parsed = JSON.parse(stored) as Partial<TeaserGameRecord> | null;

  return {
    best: typeof parsed?.best === "number" ? parsed.best : null,
    roundMemory: parsed?.roundMemory ?? null
  };
};

type TeaserGameMemory = {
  load: () => TeaserGameRecord;
  save: (record: TeaserGameRecord) => void;
};

export const useTeaserGameMemory = (slug: string): TeaserGameMemory => {
  const load = useCallback((): TeaserGameRecord => {
    try {
      return parseRecord(window.localStorage.getItem(resolveStorageKey(slug)));
    } catch {
      return EMPTY_RECORD;
    }
  }, [slug]);

  const save = useCallback(
    (record: TeaserGameRecord): void => {
      try {
        window.localStorage.setItem(resolveStorageKey(slug), JSON.stringify(record));
      } catch {
        // Nothing to keep it in; the next visit starts fresh.
      }
    },
    [slug]
  );

  return { load, save };
};
