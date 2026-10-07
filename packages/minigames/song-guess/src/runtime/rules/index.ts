import { isPositiveInteger, isRecord } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import {
  DEFAULT_SONG_GUESS_POINTS_PER_MARK,
  DEFAULT_SONG_GUESS_SONGS_PER_TURN,
  type SongGuessRuntimeRules
} from "../types/index.js";

const isOptionalPositiveInteger = (value: unknown): boolean => {
  return value === undefined || isPositiveInteger(value);
};

// Config-load-time schema check for gameConfig.minigameRules.songGuess. Every
// field is optional; when present it must be well-formed.
export const isSongGuessRules = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isOptionalPositiveInteger(value.songsPerTurn) &&
    isOptionalPositiveInteger(value.pointsPerMark)
  );
};

export const resolveSongGuessRules = (
  rules: SerializableValue | null
): SongGuessRuntimeRules => {
  const parsedRules = isRecord(rules) ? (rules as Partial<SongGuessRuntimeRules>) : {};

  return {
    songsPerTurn: isPositiveInteger(parsedRules.songsPerTurn)
      ? parsedRules.songsPerTurn
      : DEFAULT_SONG_GUESS_SONGS_PER_TURN,
    pointsPerMark: isPositiveInteger(parsedRules.pointsPerMark)
      ? parsedRules.pointsPerMark
      : DEFAULT_SONG_GUESS_POINTS_PER_MARK
  };
};
