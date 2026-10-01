import type { BrawlBestTurn, BrawlMinigameBlock } from "@wingnight/shared";

export type BrawlRuntimeRules = {
  /** How many blocks the street has: one each, in seating order, end to end. */
  blocksPerTurn: number;
  /**
   * The street every team in the round fights. A rule and not a roll on purpose: a team that drew
   * an easier street than the one before it has not won a fight, it has won a lottery.
   */
  courseSeed: number;
};

export type BrawlRuntimeBlock = BrawlMinigameBlock;

export type BrawlRuntimeState = {
  activeTurnTeamId: string | null;
  /** The team's name, kept so the turn can be named as the one to beat without a roster in reach. */
  activeTurnTeamName: string | null;
  blocksPerTurn: number;
  courseSeed: number;
  /** The block in hand; equal to `blocksPerTurn` once the team is through. */
  blockIndex: number;
  blocks: BrawlRuntimeBlock[];
  /** What the active team had banked before this turn, so `resetTurn` hands back exactly the turn. */
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
  /**
   * The turn to beat: the finished turn that put down the most worth, from any team before this
   * one. It arrives through `roundMemory` at the top of the turn and never moves inside one — this
   * turn only joins the memory once it is over (`selectRoundMemory`).
   */
  bestTurn: BrawlBestTurn | null;
};

/** What BRAWL asks the round to remember between turns. */
export type BrawlRoundMemory = {
  bestTurn: BrawlBestTurn | null;
};

// Three blocks is Dunlop Street, the waterfront and Centennial Beach ending at the Spirit
// Catcher — the boss goose closes block three — and covers a full team without cycling in the
// sample pack. The seed is the one the sandbox and the sample rules share.
export const DEFAULT_BRAWL_RULES: BrawlRuntimeRules = {
  blocksPerTurn: 3,
  courseSeed: 20261001
};
