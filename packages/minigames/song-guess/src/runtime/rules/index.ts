import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_SONG_GUESS_SONGS_PER_TURN,
  type SongGuessRuntimeRules
} from "../types/index.js";

const isPositiveInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
};

// Config-load-time schema check for gameConfig.minigameRules.songGuess. The
// single field is optional; when present it must be well-formed.
export const isSongGuessRules = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (!("songsPerTurn" in value) || value.songsPerTurn === undefined) {
    return true;
  }

  return isPositiveInteger(value.songsPerTurn);
};

export const resolveSongGuessRules = (
  rules: SerializableValue | null
): SongGuessRuntimeRules => {
  if (typeof rules !== "object" || rules === null || Array.isArray(rules)) {
    return { songsPerTurn: DEFAULT_SONG_GUESS_SONGS_PER_TURN };
  }

  const parsedRules = rules as Partial<SongGuessRuntimeRules>;

  return {
    songsPerTurn: isPositiveInteger(parsedRules.songsPerTurn)
      ? parsedRules.songsPerTurn
      : DEFAULT_SONG_GUESS_SONGS_PER_TURN
  };
};
