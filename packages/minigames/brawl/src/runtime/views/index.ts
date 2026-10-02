import type {
  BrawlBestTurn,
  BrawlMinigameDisplayView,
  BrawlMinigameHostView,
  BrawlPhase
} from "@wingnight/shared";

import { resolveGoonsDown, resolveGoonsTotal } from "../scoring/index.js";
import type { BrawlRuntimeState } from "../types/index.js";

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

  return Math.max(
    0,
    (state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0) - state.turnStartPoints
  );
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
    blocks: state.blocks.map((block) => ({
      ...block,
      player: block.player === null ? null : { ...block.player },
      inputs: block.inputs.map((input) => ({ ...input })),
      result: block.result === null ? null : { ...block.result }
    })),
    goonsDown: resolveGoonsDown(state.blocks, state.heartPrice),
    goonsTotal: resolveGoonsTotal(state.courseSeed, state.blocksPerTurn),
    heartPrice: state.heartPrice,
    points: resolvePoints(state),
    bestTurn: cloneBestTurn(state.bestTurn)
  };
};

export const toBrawlHostView = (state: BrawlRuntimeState): BrawlMinigameHostView => {
  return toBrawlViewFields(state);
};

export const toBrawlDisplayView = (state: BrawlRuntimeState): BrawlMinigameDisplayView => {
  return toBrawlViewFields(state);
};
