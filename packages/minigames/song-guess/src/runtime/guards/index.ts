import type { SongGuessPhase, SongGuessTeamScore } from "@wingnight/shared";
import type { SerializableValue } from "@wingnight/minigames-core";

import type { SongGuessRuntimeState } from "../types/index.js";

const SONG_GUESS_PHASES: readonly SongGuessPhase[] = [
  "idle",
  "clip_playing",
  "clip_paused",
  "reveal",
  "done"
];

export type SongGuessMarkPayload = {
  correct: boolean;
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isStringArray = (value: unknown): value is string[] => {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
};

const isSongGuessPhase = (value: unknown): value is SongGuessPhase => {
  return SONG_GUESS_PHASES.some((phase) => phase === value);
};

const isMark = (value: unknown): boolean => {
  return value === null || typeof value === "boolean";
};

const isSongGuessTeamScore = (value: unknown): value is SongGuessTeamScore => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const score = value as Partial<SongGuessTeamScore>;

  return isMark(score.title) && isMark(score.artist);
};

const isRecordOf = (
  value: unknown,
  isEntry: (entry: unknown) => boolean
): boolean => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every((entry) => isEntry(entry));
};

export const isSongGuessRuntimeState = (
  value: SerializableValue
): value is SongGuessRuntimeState => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const state = value as Partial<SongGuessRuntimeState>;

  if (!isStringArray(state.turnOrderTeamIds)) {
    return false;
  }

  if (!isNonNegativeInteger(state.activeTurnIndex)) {
    return false;
  }

  if (!isSongGuessPhase(state.phase)) {
    return false;
  }

  if (!isNonNegativeInteger(state.songCursor)) {
    return false;
  }

  if (!isStringArray(state.selectedSongIds)) {
    return false;
  }

  if (typeof state.replayUsed !== "boolean") {
    return false;
  }

  if (!isRecordOf(state.scoresBySongId, isSongGuessTeamScore)) {
    return false;
  }

  if (
    state.revealedAtMs !== null &&
    !(typeof state.revealedAtMs === "number" && Number.isFinite(state.revealedAtMs))
  ) {
    return false;
  }

  return isRecordOf(
    state.pendingPointsByTeamId,
    (entry) => typeof entry === "number"
  );
};

export const isSongGuessMarkPayload = (
  actionPayload: SerializableValue
): actionPayload is SongGuessMarkPayload => {
  if (
    typeof actionPayload !== "object" ||
    actionPayload === null ||
    Array.isArray(actionPayload)
  ) {
    return false;
  }

  return typeof (actionPayload as Partial<SongGuessMarkPayload>).correct === "boolean";
};
