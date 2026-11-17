import type { BrawlBestTurn, BrawlCrewHenStats, BrawlMinigameBlock, BrawlPlayerFigure } from "@wingnight/shared";

export type BrawlRuntimeRules = {
  /** How many blocks the street has, end to end. */
  blocksPerTurn: number;
  /**
   * The street every team in the round fights. A rule and not a roll on purpose: a team that drew
   * an easier street than the one before it has not won a fight, it has won a lottery.
   */
  courseSeed: number;
};

/**
 * One block as the runtime holds it: the view's block, plus what the turn's results card needs of
 * a block whose frame has been let go (`stats`, by slot, taken off its terminal frame).
 */
export type BrawlRuntimeBlock = BrawlMinigameBlock & {
  stats: BrawlCrewHenStats[] | null;
};

export type BrawlRuntimeState = {
  activeTurnTeamId: string | null;
  /** The team's name, kept so the turn can be named as the one to beat without a roster in reach. */
  activeTurnTeamName: string | null;
  /** The team's players in roster order: who may step out, and whose block a tablet block is. */
  roster: BrawlPlayerFigure[];
  blocksPerTurn: number;
  courseSeed: number;
  /** The block in hand; equal to `blocksPerTurn` once the team is through. */
  blockIndex: number;
  blocks: BrawlRuntimeBlock[];
  /** What the active team had banked before this turn, so `resetTurn` hands back exactly the turn. */
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
  /**
   * The turn to beat: the finished turn that banked the biggest share of its street, from any
   * team before this one. It arrives through `roundMemory` at the top of the turn and never moves
   * inside one.
   */
  bestTurn: BrawlBestTurn | null;
};

/** What BRAWL asks the round to remember between turns. */
export type BrawlRoundMemory = {
  bestTurn: BrawlBestTurn | null;
};

// Three blocks is Dunlop Street, the waterfront and Centennial Beach ending at the Spirit
// Catcher — the boss goose closes block three. The seed is the one the sandbox and the sample
// rules share.
export const DEFAULT_BRAWL_RULES: BrawlRuntimeRules = {
  blocksPerTurn: 3,
  courseSeed: 20261001
};

/**
 * How long the beat after a block is held before a crew thumb may start the next one, on the
 * server's clock: long enough for the room to see how it ended.
 */
export const BRAWL_READY_HOLD_MS = 2500;

/** While a block runs and no thumb moves, the server steps the fight itself this often, in ticks. */
export const BRAWL_PULSE_TICKS = 30;
