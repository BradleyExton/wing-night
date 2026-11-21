import type { BordenCrewMember, BordenHenStats, BordenMinigameStretch, BordenPlayerFigure } from "@wingnight/shared";

export type BordenRuntimeRules = {
  /** How many of the base's three stretches a game runs: the fences, the motor pool, the parade square. */
  stretchesPerTurn: number;
  /**
   * The base every room runs. A rule and not a roll on purpose, as Streets of Barrie's street is:
   * a room that drew an easier base than the last has not won anything.
   */
  courseSeed: number;
};

/**
 * One stretch as the runtime holds it: the view's stretch, plus what the end card needs of a
 * stretch whose frame has been let go (`stats`, hen by hen, taken off its terminal frame).
 */
export type BordenRuntimeStretch = BordenMinigameStretch & {
  stats: BordenHenStats[] | null;
};

export type BordenRuntimeState = {
  activeTurnTeamId: string | null;
  /** The team's players in roster order: who may step out, and whose a tablet stretch is. */
  roster: BordenPlayerFigure[];
  /** Who stepped out, in seat order. Locked when the first stretch starts. */
  crew: BordenCrewMember[];
  /** Nobody stepped out: the tablet runs one hen a stretch, the roster's players in turn. */
  tablet: boolean;
  stretchesPerTurn: number;
  courseSeed: number;
  /** The stretch in hand; equal to `stretchesPerTurn` once the game is over. */
  stretchIndex: number;
  stretches: BordenRuntimeStretch[];
  /** What the active team had banked before this game, so `resetTurn` hands back exactly the game. */
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
};

// The whole base, in the order it is run. The seed is the one the sandbox and the teaser share.
export const DEFAULT_BORDEN_RULES: BordenRuntimeRules = {
  stretchesPerTurn: 3,
  courseSeed: 20261120
};

/**
 * How long the beat after a stretch is held before a thumb of the next pair may start the next
 * one, on the room's clock: long enough to see how it ended and who is up.
 */
export const BORDEN_READY_HOLD_MS = 2500;

/** While a stretch runs and no thumb moves, the room steps it itself this often, in ticks. */
export const BORDEN_PULSE_TICKS = 30;
