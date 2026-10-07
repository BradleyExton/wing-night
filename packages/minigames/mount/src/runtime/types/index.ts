import type { MountMinigameClimb, MountPile, MountPlayerFigure } from "@wingnight/shared";

export type MountRuntimeRules = {
  /** Every climb's base clock, in seconds. */
  climbSeconds: number;
  /** What every hen already on the pile adds to a climb's clock, in seconds: the published compensation. */
  secondsPerHen: number;
  /**
   * The round's first pile: the goose's stance is dealt from it. A rule and not a roll, so every
   * team in every round of the night climbs the same goose.
   */
  pileSeed: number;
};

export type MountRuntimeClimb = MountMinigameClimb;

export type MountRuntimeState = {
  activeTurnTeamId: string | null;
  climbSeconds: number;
  secondsPerHen: number;
  /** One climb per seated player, at least one. */
  climbsPerTurn: number;
  /** The climb in hand; equal to `climbsPerTurn` once the team is through. */
  climbIndex: number;
  climbs: MountRuntimeClimb[];
  /** The round's pile as it stands: every earlier turn's hens and this turn's refereed ones. */
  pile: MountPile;
  /** The pile as this turn found it, so `resetTurn` takes this turn's hens back off the mountain. */
  pileAtTurnStart: MountPile;
  /** Every player on the pile or in this turn, keyed by player id, for drawing a head on each hen. */
  figures: Record<string, MountPlayerFigure>;
  /** What the active team had banked before this turn, so `resetTurn` hands back exactly the turn. */
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
};

/** What MOUNT asks the round to remember between turns: the pile, which carries the high line. */
export type MountRoundMemory = {
  pile: MountPile;
};

// The spec's defaults (docs/minigames/mount-your-hens-spec.md §0.5): thirty seconds a climb and
// three more for every hen already on the pile; seed 20261002 deals the standing goose, the one
// the goose bot mounts.
export const DEFAULT_MOUNT_RULES: MountRuntimeRules = {
  climbSeconds: 30,
  secondsPerHen: 3,
  pileSeed: 20261002
};
