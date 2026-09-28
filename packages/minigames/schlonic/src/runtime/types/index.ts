import type { SchlonicBestRun, SchlonicMinigameRun } from "@wingnight/shared";

export type SchlonicRuntimeRules = {
  runsPerTurn: number;
  /**
   * The zone every team in the round runs. A rule and not a roll on purpose: SCHLONIC is a race
   * over one hill, and a team that drew an easier hill than the one before it is not a race.
   */
  zoneSeed: number;
  zoneChunks: number;
  /** The wings one clean run is expected to come home with. Par for the whole team is this times the runs. */
  parWingsPerRun: number;
};

export type SchlonicRuntimeRun = SchlonicMinigameRun;

export type SchlonicRuntimeState = {
  activeTurnTeamId: string | null;
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
   * The round's best cleared run so far, from any team: the ghost the runner races. Arrives
   * through `roundMemory` from the previous turn and leaves the same way.
   */
  bestRun: SchlonicBestRun | null;
  /** The best as it stood when this turn began, so `resetTurn` forgets this turn's runs only. */
  turnStartBestRun: SchlonicBestRun | null;
};

/** What SCHLONIC asks the round to remember between turns. */
export type SchlonicRoundMemory = {
  bestRun: SchlonicBestRun | null;
};

// Three runs covers a full team without cycling in the sample pack, and 22 chunks is about
// seventeen seconds of zone — long enough to find a rhythm, short enough that the tablet keeps
// moving. Par is what a player who takes the high line and keeps hold of it comes home with:
// well over what the floor gives away — a bot that hops every hazard on the floor and never takes
// a hit banks ~107 of the default zone's 165, and a person takes hits — and well under a perfect
// run. The floor alone cannot make par, which is the point: the hill lines are the difference.
export const DEFAULT_SCHLONIC_RULES: SchlonicRuntimeRules = {
  runsPerTurn: 3,
  zoneSeed: 20260919,
  zoneChunks: 22,
  parWingsPerRun: 120
};
