import type {
  ContraptionLevel,
  ContraptionMinigameDisplayView,
  ContraptionMinigameHostView,
  ContraptionMinigameLevelView,
  ContraptionMinigameRun,
  MinigameDisplayView,
  MinigameHostView
} from "@wingnight/shared";

import { clonePlacedPiece } from "../content/index.js";
import {
  WING_RADIUS,
  type ContraptionRuntimeContent,
  type ContraptionRuntimeRules,
  type ContraptionRuntimeState
} from "../types/index.js";

// The level a turn plays: the pinned one if the rules name it and the pack
// has it, else the first in the pack. Same level for every team in the round.
export const resolveLevel = (
  content: ContraptionRuntimeContent,
  rules: Pick<ContraptionRuntimeRules, "levelId">
): ContraptionLevel | null => {
  const pinned =
    rules.levelId === null
      ? undefined
      : content.prompts.find((level) => level.id === rules.levelId);

  return pinned ?? content.prompts[0] ?? null;
};

export const resolveLevelById = (
  content: ContraptionRuntimeContent,
  levelId: string | null
): ContraptionLevel | null => {
  if (levelId === null) {
    return null;
  }

  return content.prompts.find((level) => level.id === levelId) ?? null;
};

export const resolveActiveTurnTeamId = (state: ContraptionRuntimeState): string | null => {
  return state.turnOrderTeamIds[state.activeTurnIndex] ?? null;
};

// Everything the scene needs and nothing the team could cheat with: the
// solution never leaves the content.
export const toLevelView = (level: ContraptionLevel): ContraptionMinigameLevelView => {
  return {
    id: level.id,
    title: level.title,
    wing: { x: level.wing.x, y: level.wing.y, radius: WING_RADIUS },
    bucket: { ...level.bucket },
    obstacles: (level.obstacles ?? []).map((obstacle) => ({
      id: obstacle.id,
      from: { ...obstacle.from },
      to: { ...obstacle.to }
    })),
    pickups: (level.pickups ?? []).map((pickup) => ({ ...pickup })),
    pieceBudget: level.pieceBudget,
    pointsLanded: level.pointsLanded
  };
};

const cloneRun = (run: ContraptionMinigameRun | null): ContraptionMinigameRun | null => {
  if (run === null) {
    return null;
  }

  return {
    ...run,
    track: { keyframeHz: run.track.keyframeHz, positions: [...run.track.positions] },
    collectedPickupIds: [...run.collectedPickupIds]
  };
};

const toViewFields = (
  state: ContraptionRuntimeState,
  content: ContraptionRuntimeContent
): Omit<ContraptionMinigameHostView, "minigame"> => {
  const level = resolveLevelById(content, state.levelId);

  return {
    activeTurnTeamId: resolveActiveTurnTeamId(state),
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: state.phase,
    level: level === null ? null : toLevelView(level),
    pieces: state.pieces.map(clonePlacedPiece),
    attemptsPerTurn: state.attemptsPerTurn,
    attemptsUsed: state.attemptsUsed,
    bestPoints: state.bestPoints,
    run: cloneRun(state.run)
  };
};

export const toContraptionHostView = (
  state: ContraptionRuntimeState,
  content: ContraptionRuntimeContent
): MinigameHostView => {
  return {
    minigame: "CONTRAPTION",
    ...toViewFields(state, content)
  } satisfies ContraptionMinigameHostView;
};

// The display sees the plan and the run — that is the game — but, like the
// host, never the solution. Both projections drop it at `toLevelView`.
export const toContraptionDisplayView = (
  state: ContraptionRuntimeState,
  content: ContraptionRuntimeContent
): MinigameDisplayView => {
  return {
    minigame: "CONTRAPTION",
    ...toViewFields(state, content)
  } satisfies ContraptionMinigameDisplayView;
};
