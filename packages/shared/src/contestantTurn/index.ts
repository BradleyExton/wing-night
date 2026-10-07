import type { MinigameType } from "../content/gameConfig/index.js";

// Where an arcade relay's legs are played: on the host tablet, passed from hand to hand as it
// always has been, or on each contestant's own phone. A per-round setting the host makes; a
// round that never set one plays on the tablet.
export const MINIGAME_DEVICE_MODES = {
  TABLET: "tablet",
  PHONES: "phones"
} as const;

export type MinigameDeviceMode = (typeof MINIGAME_DEVICE_MODES)[keyof typeof MINIGAME_DEVICE_MODES];

export const DEFAULT_MINIGAME_DEVICE_MODE: MinigameDeviceMode = MINIGAME_DEVICE_MODES.TABLET;

export const isMinigameDeviceMode = (value: unknown): value is MinigameDeviceMode => {
  return value === MINIGAME_DEVICE_MODES.TABLET || value === MINIGAME_DEVICE_MODES.PHONES;
};

// The host's per-round choice, keyed by round number (1-based, like `currentRound`). A round
// with no entry plays on the tablet.
export type RoundDeviceModes = Record<number, MinigameDeviceMode>;

export const resolveRoundDeviceMode = (
  roundDeviceModes: RoundDeviceModes,
  round: number
): MinigameDeviceMode => {
  return roundDeviceModes[round] ?? DEFAULT_MINIGAME_DEVICE_MODE;
};

// The games a contestant can play on their own phone: the four arcade relays, whose host views
// carry nothing a turn could cheat with (each runtime's tests pin host view == display view).
// The server's runtime registry is checked against this list, so a game cannot grow the phone
// hooks without being added here, and the tablet only offers the phones setting for these.
export const CONTESTANT_MINIGAME_TYPES = ["FAPPY", "SCHLONIC", "BRAWL", "JOUST"] as const satisfies readonly MinigameType[];

export type ContestantMinigameType = (typeof CONTESTANT_MINIGAME_TYPES)[number];

export const isContestantMinigameType = (value: unknown): value is ContestantMinigameType => {
  return (CONTESTANT_MINIGAME_TYPES as readonly unknown[]).includes(value);
};

// Who is writing the leg in hand's input log. Exactly one of them, ever: the log is strictly
// ascending, so a leg two devices wrote to would be refused tick by tick.
export const CONTESTANT_CONTROLLERS = {
  TABLET: "tablet",
  PHONE: "phone"
} as const;

export type ContestantController = (typeof CONTESTANT_CONTROLLERS)[keyof typeof CONTESTANT_CONTROLLERS];

// One arcade turn as the room needs to see it, from the briefing to the turn's results. Every
// field is server-derived; no client works any of it out.
export type ContestantTurn = {
  minigame: ContestantMinigameType;
  // The round's device mode as it stood when this turn's briefing opened. It is LOCKED there: a
  // change on the tablet mid-turn takes effect from the next team's turn.
  deviceMode: MinigameDeviceMode;
  // The leg in hand — FAPPY's leg, SCHLONIC's run, BRAWL's block, JOUST's shot (during a JOUST
  // replay, the shot about to be aimed). Null before MINIGAME_PLAY and once the turn is over.
  legIndex: number | null;
  // Whose leg it is, and whose comes after it. Either may be null: a leg flown by the house bird.
  contestantPlayerId: string | null;
  nextContestantPlayerId: string | null;
  // The phone only in phones mode, for a contestant whose phone is claimed AND connected, on a
  // leg the tablet does not hold. Anything else is the tablet's — a null or unclaimed contestant
  // falls back to the tablet with no ceremony.
  controller: ContestantController;
  // Legs the tablet holds for the rest of this turn: taken back by the host, or begun on the
  // tablet (a leg the tablet has written to can never be continued by a phone).
  tabletLegIndexes: number[];
  // The contestant whose phone dropped while it held the leg in hand: the host's "<name>'s phone
  // dropped — take it back" prompt. Cleared when the phone comes back or the host takes it back.
  droppedPlayerId: string | null;
};

// Why `player:minigameAction` said no, in the order the server asks. A phone that sees anything
// but `rate_limited` should stop sending until the next snapshot says the leg is its own.
export const PLAYER_MINIGAME_ACTION_REFUSAL_REASONS = {
  // Too many actions too fast, far past what a thumb can do (`PLAYER_MINIGAME_ACTION_BURST`).
  RATE_LIMITED: "rate_limited",
  // Not an action envelope at all.
  MALFORMED: "malformed",
  // This socket holds no face.
  NOT_SEATED: "not_seated",
  // Not MINIGAME_PLAY, or not the game in play.
  WRONG_PHASE: "wrong_phase",
  // The turn was locked to the tablet, or the game has no phone turns.
  TABLET_MODE: "tablet_mode",
  // An action only the host sends: a skip, a reset, JOUST's next shot.
  HOST_ONLY_ACTION: "host_only_action",
  // Somebody else's leg, or no leg in hand.
  NOT_CONTESTANT: "not_contestant",
  // The contestant's own leg, but the tablet holds it (taken back, or begun on the tablet).
  TABLET_HOLDS_LEG: "tablet_holds_leg",
  // An answer (a game's player action type) from a face that is not on the team whose turn it is.
  NOT_ON_TURN: "not_on_turn",
  // An answer the game did not take: the question is locked, the answer is not one it offers, or it
  // is the answer already in. Nothing changed.
  NOT_ACCEPTED: "not_accepted",
  // The server hit a fault handling this message and refused it rather than go down with it.
  SERVER_ERROR: "server_error"
} as const;

export type PlayerMinigameActionRefusalReason =
  (typeof PLAYER_MINIGAME_ACTION_REFUSAL_REASONS)[keyof typeof PLAYER_MINIGAME_ACTION_REFUSAL_REASONS];

// The (optional) ack of `player:minigameAction`. `ok` means the server let the action through to
// the game; the game may still find it stale (a repeated tick) and do nothing, exactly as it
// would for the tablet.
export type PlayerMinigameActionResult =
  | { ok: true }
  | { ok: false; reason: PlayerMinigameActionRefusalReason };
