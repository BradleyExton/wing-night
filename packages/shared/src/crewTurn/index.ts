import type { MinigameType } from "../content/gameConfig/index.js";
import { CONTESTANT_MINIGAME_TYPES, MINIGAME_DEVICE_MODES, type MinigameDeviceMode } from "../contestantTurn/index.js";

// A CREW turn: every player on the active team plays at once, each from their own phone, and
// the TV is the one picture (docs/minigames/brawl-crew-spec.md). It sits beside the arcade
// relays' `ContestantTurn` rather than inside it because nothing about a relay's turn fits: a
// relay has ONE leg in hand, ONE player whose leg it is and ONE device writing its log, and a
// crew has none of the three. The phones here are gamepads — they draw no game — so the room
// tells each one only what a pad has to show.

// The games a whole team plays at once from its phones. The server's registry test pins the
// `selectCrew` hook to this list the way it pins the relays' hooks to `CONTESTANT_MINIGAME_TYPES`.
export const CREW_MINIGAME_TYPES: readonly MinigameType[] = ["BRAWL"];

export const isCrewMinigameType = (value: unknown): value is MinigameType => {
  return (CREW_MINIGAME_TYPES as readonly unknown[]).includes(value);
};

// Every game a phone plays a part in, relay or crew: the rounds the host's per-round device
// setting applies to.
export const isPhoneMinigameType = (value: unknown): value is MinigameType => {
  return (CONTESTANT_MINIGAME_TYPES as readonly unknown[]).includes(value) || isCrewMinigameType(value);
};

// Where the stage in hand is: `ready` is the crew assembling (a phone shows its way in),
// `running` is the fight, `done` is the beat after it.
export const CREW_STAGE_STATUSES = ["ready", "running", "done"] as const;

export type CrewStageStatus = (typeof CREW_STAGE_STATUSES)[number];

// One player's pad, as their phone draws it. `out` has not stepped out (or sat the stage out):
// the phone shows its way in while the stage is `ready`. `up` is playing; `down` is out of hearts
// and waiting on a teammate; `away` is a pad that went quiet and was sat down. `slot` is the
// player's place in the crew — their colour on the wall and on the phone — or null while `out`.
export const CREW_PAD_STATES = ["out", "up", "down", "away"] as const;

export type CrewPadState = (typeof CREW_PAD_STATES)[number];

export type CrewPad = {
  state: CrewPadState;
  slot: number | null;
  hearts: number;
};

// One crew turn as the room needs to see it, from the briefing to the turn's results. Every
// field is server-derived; no client works any of it out.
export type CrewTurn = {
  minigame: MinigameType;
  // The round's device mode as it stood when this turn's briefing opened, locked there exactly
  // as a relay's is. In `tablet` mode no phone is a pad: the game plays its tablet shape.
  deviceMode: MinigameDeviceMode;
  // Null before MINIGAME_PLAY and once the turn is over.
  status: CrewStageStatus | null;
  // Whose phones may send the game's inputs right now: the active team's roster, in roster
  // order. Empty outside play.
  playerIds: string[];
  // Each of those players' pad. It moves only when somebody steps out, loses a heart, goes down
  // or gets up — a handful of times a stage — so the phones' snapshot stays quiet while the
  // wall's is busy.
  pads: Record<string, CrewPad>;
};

// Whether the phones are the pads this turn: a crew turn locked to phones. The tablet then
// mounts no runner and mirrors the wall.
export const isCrewPhoneTurn = (turn: CrewTurn | null): turn is CrewTurn => {
  return turn !== null && turn.deviceMode === MINIGAME_DEVICE_MODES.PHONES;
};
