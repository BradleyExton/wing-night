import type { GeoCoordinates } from "../content/geo/index.js";

// Simultaneous answers (SPEC.md "Answers on the phones"): ONE team per turn, as ever, but during
// that team's turn each of its players answers on their own phone at the same time — a GEO pin, a
// TRIVIA choice — and the host still locks and reveals. These are the shapes that crosses the wire.
//
// Who answers: the playing team's players whose phones hold their faces right now (`seated`). An
// answer is secret until the host locks the question: the TV and the room hear how many are in,
// and each phone only its own (`player:minigamePlayerView`, over its own room).

// The answers in: how many of the playing team's phones have answered, out of the phones that can
// (awake, or asleep with an answer already in). Never who, never what — on the TV and on the host
// tablet alike: the tablet sits with the playing team, so an answer on it would be an answer every
// teammate can copy. Null on the views when nobody on the team has a phone, so a night without
// phones draws exactly what it always drew.
export type PhoneAnswerTally = {
  answeredCount: number;
  seatedCount: number;
};

// Whether a phone may still answer: `open` until the host locks the question in, `locked` after.
export type PhoneAnswerStatus = "open" | "locked";

// One GEO phone's own pin on the photo in hand, and — once the host locks it — how it measured.
export type GeoMinigamePlayerView = {
  minigame: "GEO";
  promptId: string;
  // Not the answer: the photo's title, the same words the TV prints under the photo.
  promptTitle: string;
  photoNumber: number;
  promptsPerTurn: number;
  status: PhoneAnswerStatus;
  pin: GeoCoordinates | null;
  result: { distanceKm: number; pointsAwarded: number; isBest: boolean } | null;
};

// One TRIVIA phone's own choice. `choices` is null on a question the pack wrote without them: the
// host judges that one aloud as ever, and the phone only says so.
export type TriviaMinigamePlayerView = {
  minigame: "TRIVIA";
  promptId: string;
  question: string;
  choices: string[] | null;
  status: PhoneAnswerStatus;
  choiceIndex: number | null;
  // Only once the host has revealed the question: whether this phone's choice was the answer.
  isCorrect: boolean | null;
};

export type MinigamePlayerView = GeoMinigamePlayerView | TriviaMinigamePlayerView;

// Server → one playing-team phone's `player:<id>` room only: its own answer card. Null when the
// card goes away (the turn, the phase or the question moved on and this phone has nothing to do).
export type PlayerMinigamePlayerViewPayload = Record<"minigamePlayerView", MinigamePlayerView | null>;
