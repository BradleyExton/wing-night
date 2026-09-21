import type { SchlonicMinigameRun } from "@wingnight/shared";

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
};

// Three runs covers a full team without cycling in the sample pack, and 22 chunks is about
// seventeen seconds of zone — long enough to find a rhythm, short enough that the tablet keeps
// moving. Par is what a player who takes the high line and keeps hold of it comes home with:
// well over what the zone gives away for free, well under a perfect run.
export const DEFAULT_SCHLONIC_RULES: SchlonicRuntimeRules = {
  runsPerTurn: 3,
  zoneSeed: 20260919,
  zoneChunks: 22,
  parWingsPerRun: 70
};
