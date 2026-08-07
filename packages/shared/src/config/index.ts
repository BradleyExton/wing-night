import type { GameConfigFile } from "../content/gameConfig/index.js";
import type { PlayersContentEntry } from "../content/players/index.js";
import type { TeamsContentEntry } from "../content/teams/index.js";
import type { TriviaPrompt } from "../content/trivia/index.js";
import type { DrawingPrompt } from "../content/drawing/index.js";
import type { ValidationIssue } from "../content/validationIssue/index.js";

// The wire contract for the config pre-flight surface: what the wizard may
// edit, what it gets back, and how a failure is named. It lives in `shared`
// because both halves compile against it — the server writes these shapes,
// the wizard reads them.

// The editable content files. Geo is deliberately absent: its content is
// produced by the geo import CLI, and the wizard shows a count rather than an
// editor, so there is no write path to key.
export const CONFIG_FILE_KEYS = [
  "gameConfig",
  "players",
  "teams",
  "trivia",
  "drawing"
] as const;

export type ConfigFileKey = (typeof CONFIG_FILE_KEYS)[number];

export const isConfigFileKey = (value: unknown): value is ConfigFileKey => {
  return (
    typeof value === "string" &&
    (CONFIG_FILE_KEYS as readonly string[]).includes(value)
  );
};

// One edited file. `value` is the whole file's next contents, unvalidated —
// the server runs it through the same shared validator the loader uses before
// anything reaches disk.
export type ConfigFileEdit = {
  key: ConfigFileKey;
  value: unknown;
};

// What `config:read` returns: the merged on-disk content (local wins over
// sample), NOT an echo of room state — the geo import CLI may have written
// local files the room never saw, and the prompt packs are not in room state
// at all.
export type ConfigContentSnapshot = {
  gameConfig: GameConfigFile;
  players: PlayersContentEntry[];
  teams: TeamsContentEntry[];
  triviaPrompts: TriviaPrompt[];
  drawingPrompts: DrawingPrompt[];
  geoPromptCount: number;
};

export const CONFIG_ACTIONS = {
  READ: "read",
  SAVE: "save",
  APPLY: "apply"
} as const;

export type ConfigAction = (typeof CONFIG_ACTIONS)[keyof typeof CONFIG_ACTIONS];

export const CONFIG_ERROR_CODES = {
  // Apply attempted past SETUP. Saves are still allowed in this state — you
  // can prep next week's config mid-night; Reset Game is the escape hatch.
  LOCKED: "CONFIG_LOCKED",
  // A payload failed its shared validator. Carries the issues.
  INVALID: "CONFIG_INVALID",
  // Reading/reloading content off disk failed — an unparseable local file,
  // typically the very breakage the wizard exists to repair.
  LOAD_FAILED: "CONFIG_LOAD_FAILED",
  // Validation passed but the file could not be written.
  WRITE_FAILED: "CONFIG_WRITE_FAILED",
  // The request payload was not the expected shape.
  BAD_REQUEST: "CONFIG_BAD_REQUEST"
} as const;

export type ConfigErrorCode =
  (typeof CONFIG_ERROR_CODES)[keyof typeof CONFIG_ERROR_CODES];

// Every config:* reply rides one `config:result` emit to the requesting
// socket, discriminated on `ok`. An ack callback would have been the other
// option; it was rejected because every `ClientToServerEvents` entry is
// single-arg and `socketEvents/index.test-d.ts` pins those tuples, so acks
// would have been the first multi-arg entry in the whole contract.
export type ConfigResultPayload =
  | {
      action: ConfigAction;
      ok: true;
      // Populated for `read` and a successful `apply` (both have just read
      // from disk); `null` for `save`, which does not re-read.
      content: ConfigContentSnapshot | null;
    }
  | {
      action: ConfigAction;
      ok: false;
      code: ConfigErrorCode;
      message: string;
      // Non-empty only for CONFIG_INVALID; the field is always present so a
      // consumer can map issues to fields without a presence check.
      issues: ValidationIssue[];
    };
