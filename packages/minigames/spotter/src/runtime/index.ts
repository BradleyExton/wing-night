import type { MinigameType, SpotterShotBand, SpotterShotResult } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import {
  applyDirection,
  chebyshevDistance,
  generateSpotterTargets,
  resolveStartCell,
  rollSpotterSeed
} from "./field/index.js";
import { isNudgePayload, isSpotterRuntimeState } from "./guards/index.js";
import { isSpotterRules, resolveSpotterRules } from "./rules/index.js";
import { MAX_SPOTTER_PATH_LENGTH, type SpotterRuntimeState } from "./types/index.js";
import { resolveSpotterStatus, toSpotterDisplayView, toSpotterHostView } from "./views/index.js";

export const spotterMinigameId: MinigameType = "SPOTTER";

export { isSpotterRules, resolveSpotterRules } from "./rules/index.js";
export { generateSpotterTargets, resolveStartCell } from "./field/index.js";

const resolveShotPoints = (
  state: SpotterRuntimeState,
  distanceCells: number
): { band: SpotterShotBand; points: number } => {
  const matchedBand = state.scoreBandsCells.find((band) => distanceCells <= band.maxCells);

  if (matchedBand === undefined) {
    return { band: "MISS", points: 0 };
  }

  return { band: distanceCells === 0 ? "HIT" : "CLOSE", points: matchedBand.points };
};

export const spotterRuntimePlugin: MinigameRuntimePlugin = {
  id: "SPOTTER",
  isRules: isSpotterRules,
  initialize: (input) => {
    const rules = resolveSpotterRules(input.rules);
    const seed = rules.seed ?? rollSpotterSeed();

    const initialState: SpotterRuntimeState = {
      activeTurnTeamId: input.activeRoundTeamId ?? input.teamIds[0] ?? null,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId },
      seed,
      gridCols: rules.gridCols,
      gridRows: rules.gridRows,
      scoreBandsCells: rules.scoreBandsCells.map((band) => ({ ...band })),
      targets: generateSpotterTargets({
        seed,
        gridCols: rules.gridCols,
        gridRows: rules.gridRows,
        targetCount: rules.targetsPerTurn
      }),
      targetIndex: 0,
      cursor: resolveStartCell(rules.gridCols, rules.gridRows),
      path: [],
      results: []
    };

    return initialState;
  },
  reduceAction: (input): MinigameRuntimeReductionResult => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isSpotterRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const actionType = input.envelope.actionType;

    if (resolveSpotterStatus(state) === "done") {
      return unchanged;
    }

    if (actionType === "nudge") {
      if (!isNudgePayload(input.envelope.actionPayload)) {
        return unchanged;
      }

      const direction = input.envelope.actionPayload.direction;
      const nextCursor = applyDirection(state.cursor, direction, state.gridCols, state.gridRows);

      // A nudge into the wall moves nothing; recording it would put a phantom
      // step on the TV trail.
      if (nextCursor.col === state.cursor.col && nextCursor.row === state.cursor.row) {
        return unchanged;
      }

      const path = [...state.path, direction].slice(-MAX_SPOTTER_PATH_LENGTH);

      return {
        state: { ...state, cursor: nextCursor, path },
        didMutate: true
      };
    }

    if (actionType === "fire") {
      const target = state.targets[state.targetIndex];

      if (target === undefined || state.activeTurnTeamId === null) {
        return unchanged;
      }

      const distanceCells = chebyshevDistance(state.cursor, target);
      const { band, points } = resolveShotPoints(state, distanceCells);
      const result: SpotterShotResult = {
        targetIndex: state.targetIndex,
        col: state.cursor.col,
        row: state.cursor.row,
        distanceCells,
        band,
        points
      };
      const previousPoints = state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0;

      return {
        state: {
          ...state,
          pendingPointsByTeamId: {
            ...state.pendingPointsByTeamId,
            [state.activeTurnTeamId]: Math.min(input.pointsMax, previousPoints + points)
          },
          targetIndex: state.targetIndex + 1,
          path: [],
          results: [...state.results, result]
        },
        didMutate: true
      };
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isSpotterRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isSpotterRuntimeState(input.state)) {
      return null;
    }

    return toSpotterHostView(input.state);
  },
  selectDisplayView: (input) => {
    if (!isSpotterRuntimeState(input.state)) {
      return null;
    }

    return toSpotterDisplayView(input.state);
  }
};
