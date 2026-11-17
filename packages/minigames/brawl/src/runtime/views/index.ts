import type {
  BrawlBestTurn,
  BrawlCrewHenStats,
  BrawlMinigameBlock,
  BrawlMinigameDisplayView,
  BrawlMinigameHostView,
  BrawlPhase
} from "@wingnight/shared";

import { resolveBrawlBanked, resolveBrawlTotal } from "../scoring/index.js";
import type { BrawlRuntimeBlock, BrawlRuntimeState } from "../types/index.js";

/** A copy of the turn to beat, so no view shares an object with the state. */
export const cloneBestTurn = (bestTurn: BrawlBestTurn | null): BrawlBestTurn | null => {
  return bestTurn === null ? null : { ...bestTurn };
};

// Derived, never stored: the team is through once every block is behind it; otherwise the room
// is in whatever state the block in hand is.
export const resolveBrawlPhase = (state: BrawlRuntimeState): BrawlPhase => {
  if (state.blockIndex >= state.blocksPerTurn) {
    return "finished";
  }

  return state.blocks[state.blockIndex]?.status === "running" ? "running" : "ready";
};

const resolvePoints = (state: BrawlRuntimeState): number | null => {
  if (state.activeTurnTeamId === null || resolveBrawlPhase(state) !== "finished") {
    return null;
  }

  return Math.max(0, (state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0) - state.turnStartPoints);
};

/**
 * What each player did over the turn, by player id, once it is over: every block's own numbers
 * summed. A hen with nobody behind her (the house hen) is on no card.
 */
export const resolveTurnStats = (state: BrawlRuntimeState): Record<string, BrawlCrewHenStats> | null => {
  if (resolveBrawlPhase(state) !== "finished") {
    return null;
  }

  const stats: Record<string, BrawlCrewHenStats> = {};

  for (const block of state.blocks) {
    for (const member of block.crew) {
      const playerId = member.player?.playerId ?? null;
      const own = block.stats?.[member.slot];

      if (playerId === null || own === undefined) {
        continue;
      }

      const sum = stats[playerId] ?? { goons: 0, worth: 0, hits: 0, downs: 0, revives: 0 };

      stats[playerId] = {
        goons: sum.goons + own.goons,
        worth: sum.worth + own.worth,
        hits: sum.hits + own.hits,
        downs: sum.downs + own.downs,
        revives: sum.revives + own.revives
      };
    }
  }

  return stats;
};

// The block as the room sees it. The frame goes out only for the block in hand and the one just
// finished (its last frame is what the ending beat is drawn over); an older block's is nobody's
// to draw. The frame itself is not copied: the sim never writes to a frame it was handed, and
// copying a few kilobytes into two views on every thumb is the cost §0.5 is trying not to pay.
const toViewBlock = (block: BrawlRuntimeBlock, blockIndex: number): BrawlMinigameBlock => {
  const isDrawn = block.blockIndex === blockIndex || block.blockIndex === blockIndex - 1;

  return {
    blockIndex: block.blockIndex,
    status: block.status,
    tablet: block.tablet,
    crew: block.crew.map((member) => ({ slot: member.slot, player: member.player === null ? null : { ...member.player } })),
    crewSize: block.crewSize,
    startedAtMs: block.startedAtMs,
    readyAtMs: block.readyAtMs,
    frame: isDrawn ? block.frame : null,
    outcome: block.outcome,
    banked: block.banked,
    total: block.total,
    skipped: block.skipped
  };
};

// Nothing on the street is a secret — the whole block is on the TV as it happens — so the host
// and display views are the same projection; the two exports exist so each outer union gets its
// own member.
const toBrawlViewFields = (state: BrawlRuntimeState) => {
  return {
    minigame: "BRAWL" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: resolveBrawlPhase(state),
    blockIndex: state.blockIndex,
    blocksPerTurn: state.blocksPerTurn,
    courseSeed: state.courseSeed,
    roster: state.roster.map((figure) => ({ ...figure })),
    blocks: state.blocks.map((block) => toViewBlock(block, state.blockIndex)),
    banked: resolveBrawlBanked(state.blocks),
    total: resolveBrawlTotal(state.blocks),
    points: resolvePoints(state),
    bestTurn: cloneBestTurn(state.bestTurn),
    turnStats: resolveTurnStats(state)
  };
};

export const toBrawlHostView = (state: BrawlRuntimeState): BrawlMinigameHostView => {
  return toBrawlViewFields(state);
};

export const toBrawlDisplayView = (state: BrawlRuntimeState): BrawlMinigameDisplayView => {
  return toBrawlViewFields(state);
};
