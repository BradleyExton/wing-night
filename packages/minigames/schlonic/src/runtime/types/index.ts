import type { SchlonicBestTurn, SchlonicMinigameRun } from "@wingnight/shared";

export type SchlonicRuntimeRules = {
  /** How many legs the street has: one run each, in seating order, end to end. */
  runsPerTurn: number;
  /**
   * The street every team in the round runs. A rule and not a roll on purpose: SCHLONIC is a
   * race over one street, and a team that drew an easier street than the one before it is not
   * a race.
   */
  zoneSeed: number;
  /** Chunks per LEG; the course is `runsPerTurn` of them end to end. */
  zoneChunks: number;
  /** The wings one clean leg is expected to come home with. Par for the whole team is this times the legs. */
  parWingsPerRun: number;
};

export type SchlonicRuntimeRun = SchlonicMinigameRun;

export type SchlonicRuntimeState = {
  activeTurnTeamId: string | null;
  /** The team's name, kept so the turn can be named as the one to beat without a roster in reach. */
  activeTurnTeamName: string | null;
  runsPerTurn: number;
  zoneSeed: number;
  zoneChunks: number;
  parWingsPerRun: number;
  /** The run in hand; equal to `runsPerTurn` once the team is through. */
  runIndex: number;
  runs: SchlonicRuntimeRun[];
  /** What the active team had banked before this turn, so `resetTurn` hands back exactly the turn. */
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
  /**
   * The turn to beat: the finished turn that banked the most wings, from any team before this
   * one. Each leg's runner races its leg of it as a ghost. It arrives through `roundMemory` at
   * the top of the turn and never moves inside one — this turn's own legs only join the memory
   * once the turn is over (`selectRoundMemory`), so a rider never races a teammate.
   */
  bestTurn: SchlonicBestTurn | null;
};

/** What SCHLONIC asks the round to remember between turns. */
export type SchlonicRoundMemory = {
  bestTurn: SchlonicBestTurn | null;
};

// Three legs covers a full team without cycling in the sample pack, and 22 chunks a leg is about
// seventeen seconds of street each — long enough to find a rhythm, short enough that the tablet
// keeps moving. Par is what a player who takes the high line and keeps hold of it comes home with:
// well over what the floor gives away, because a person takes hits, and under everything a leg
// holds. The legs are not equal — on the default street (this seed, three legs of 22) they hold
// 156, 174 and 140 wings (`resolveSchlonicWingTotal`), 470 for the turn — so one par sits 20
// under the leanest leg and further under the other two. The floor alone is not meant to make
// par, which is the point: the hill lines and the rails are the difference.
export const DEFAULT_SCHLONIC_RULES: SchlonicRuntimeRules = {
  runsPerTurn: 3,
  zoneSeed: 20260919,
  zoneChunks: 22,
  parWingsPerRun: 120
};
