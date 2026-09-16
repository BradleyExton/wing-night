import { validatePromptPackFile } from "../promptPack/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

// Served by the Express static mount in `apps/server/src/createApp`. Declared
// here so the mount and the client-side URL builder share one string and a
// rename is a typecheck failure rather than a silent 404 on the TV.
export const SONG_GUESS_AUDIO_ROUTE_PATH = "/song-audio";

export const SONG_GUESS_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type SongGuessDifficulty = (typeof SONG_GUESS_DIFFICULTIES)[number];

// One song in the pack. `file` is a bare filename, not a path or a URL: the
// client resolves it against the server origin at render time, because there
// is no dev proxy and a root-relative URL would hit the Vite origin.
export type SongGuessPrompt = {
  id: string;
  file: string;
  clipStart: number;
  clipEnd: number;
  revealStart: number;
  correctTitle: string;
  correctArtist: string;
  difficulty?: SongGuessDifficulty;
  hint?: string;
};

export type SongGuessContentFile = {
  prompts: SongGuessPrompt[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isNonNegativeFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
};

const isSongGuessDifficulty = (value: unknown): value is SongGuessDifficulty => {
  return SONG_GUESS_DIFFICULTIES.some((difficulty) => difficulty === value);
};

// A filename, not a path: anything with a separator would let a pack reach
// outside the audio directory, and express.static would refuse it anyway.
const isAudioFileName = (value: unknown): value is string => {
  return (
    isNonEmptyString(value) && !value.includes("/") && !value.includes("\\")
  );
};

const validateClipWindow = (value: Record<string, unknown>): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  for (const field of ["clipStart", "clipEnd", "revealStart"] as const) {
    if (!isNonNegativeFiniteNumber(value[field])) {
      issues.push({
        path: field,
        message: "must be a non-negative number of seconds"
      });
    }
  }

  if (issues.length > 0) {
    return issues;
  }

  // Both are known-good numbers by here, so an inverted window is the only
  // remaining way the clip can be unplayable.
  if ((value.clipStart as number) >= (value.clipEnd as number)) {
    issues.push({
      path: "clipEnd",
      message: "must be greater than clipStart"
    });
  }

  return issues;
};

export const validateSongGuessPrompt = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = (["id", "correctTitle", "correctArtist"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  if (!isAudioFileName(value.file)) {
    issues.push({
      path: "file",
      message: "must be an audio filename with no path separators"
    });
  }

  issues.push(...validateClipWindow(value));

  if (
    value.difficulty !== undefined &&
    !isSongGuessDifficulty(value.difficulty)
  ) {
    issues.push({
      path: "difficulty",
      message: `must be one of ${SONG_GUESS_DIFFICULTIES.join(", ")}`
    });
  }

  if (value.hint !== undefined && !isNonEmptyString(value.hint)) {
    issues.push({ path: "hint", message: "must be a non-empty string" });
  }

  return issues;
};

export const validateSongGuessContentFile = (value: unknown): ValidationIssue[] => {
  return validatePromptPackFile(value, validateSongGuessPrompt);
};

export const isSongGuessPrompt = (value: unknown): value is SongGuessPrompt => {
  return validateSongGuessPrompt(value).length === 0;
};

export const isSongGuessContentFile = (
  value: unknown
): value is SongGuessContentFile => {
  return validateSongGuessContentFile(value).length === 0;
};
