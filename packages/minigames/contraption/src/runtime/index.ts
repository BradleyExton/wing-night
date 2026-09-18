import type { ContraptionPlacedPiece, MinigameType } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { contraptionContentAdapter, resolveContraptionContent } from "./content/index.js";
import { gradeAttempt } from "./grading/index.js";
import {
  isContraptionRuntimeState,
  isPlacePiecePayload,
  isRemovePiecePayload
} from "./guards/index.js";
import { isContraptionRules, resolveContraptionRules } from "./rules/index.js";
import type { ContraptionRuntimeState } from "./types/index.js";
import {
  resolveActiveTurnTeamId,
  resolveLevel,
  resolveLevelById,
  toContraptionDisplayView,
  toContraptionHostView
} from "./views/index.js";

export const contraptionMinigameId: MinigameType = "CONTRAPTION";

const isSameCell = (
  left: Pick<ContraptionPlacedPiece, "column" | "row">,
  right: Pick<ContraptionPlacedPiece, "column" | "row">
): boolean => {
  return left.column === right.column && left.row === right.row;
};

// Best-of-N: pending points for the active team are the baseline they walked
// in with plus their BEST run, capped — never a running sum of attempts.
const withBestPoints = (
  state: ContraptionRuntimeState,
  bestPoints: number,
  pointsMax: number
): Pick<ContraptionRuntimeState, "bestPoints" | "pendingPointsByTeamId"> => {
  const activeTurnTeamId = resolveActiveTurnTeamId(state);

  if (activeTurnTeamId === null) {
    return { bestPoints, pendingPointsByTeamId: { ...state.pendingPointsByTeamId } };
  }

  return {
    bestPoints,
    pendingPointsByTeamId: {
      ...state.pendingPointsByTeamId,
      [activeTurnTeamId]: Math.min(pointsMax, state.pendingPointsBaseline + bestPoints)
    }
  };
};

export const contraptionRuntimePlugin: MinigameRuntimePlugin = {
  id: "CONTRAPTION",
  content: contraptionContentAdapter,
  isRules: isContraptionRules,
  initialize: (input) => {
    const content = resolveContraptionContent(input.content);
    const rules = resolveContraptionRules(input.rules);
    const level = resolveLevel(content, rules);

    // No levels means no round to run; the server clears the projection and
    // the host surface falls back to its "check the content pack" note.
    if (level === null) {
      return null;
    }

    const runtimeTeamIds =
      input.activeRoundTeamId === null ? input.teamIds : [input.activeRoundTeamId];
    const activeTurnTeamId = runtimeTeamIds[0] ?? null;

    const initialState: ContraptionRuntimeState = {
      turnOrderTeamIds: runtimeTeamIds,
      activeTurnIndex: 0,
      levelId: level.id,
      attemptsPerTurn: rules.attemptsPerTurn,
      attemptsUsed: 0,
      phase: "building",
      pieces: [],
      run: null,
      bestPoints: 0,
      pendingPointsBaseline:
        activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return initialState;
  },
  reduceAction: (input): MinigameRuntimeReductionResult => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isContraptionRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const content = resolveContraptionContent(input.content);
    const level = resolveLevelById(content, state.levelId);
    const { actionType, actionPayload } = input.envelope;

    if (level === null) {
      return unchanged;
    }

    if (actionType === "placePiece") {
      if (state.phase !== "building" || !isPlacePiecePayload(actionPayload)) {
        return unchanged;
      }

      const existingIndex = state.pieces.findIndex((piece) => isSameCell(piece, actionPayload));

      // Tapping an occupied cell swaps the piece rather than stacking a second
      // segment under the first; the budget only counts NEW cells.
      if (existingIndex !== -1) {
        if (state.pieces[existingIndex]?.kind === actionPayload.kind) {
          return unchanged;
        }

        const pieces = [...state.pieces];
        pieces[existingIndex] = {
          kind: actionPayload.kind,
          column: actionPayload.column,
          row: actionPayload.row
        };

        return { state: { ...state, pieces }, didMutate: true };
      }

      if (state.pieces.length >= level.pieceBudget) {
        return unchanged;
      }

      return {
        state: {
          ...state,
          pieces: [
            ...state.pieces,
            { kind: actionPayload.kind, column: actionPayload.column, row: actionPayload.row }
          ]
        },
        didMutate: true
      };
    }

    if (actionType === "removePiece") {
      if (state.phase !== "building" || !isRemovePiecePayload(actionPayload)) {
        return unchanged;
      }

      const pieces = state.pieces.filter((piece) => !isSameCell(piece, actionPayload));

      if (pieces.length === state.pieces.length) {
        return unchanged;
      }

      return { state: { ...state, pieces }, didMutate: true };
    }

    if (actionType === "clearPieces") {
      if (state.phase !== "building" || state.pieces.length === 0) {
        return unchanged;
      }

      return { state: { ...state, pieces: [] }, didMutate: true };
    }

    // GO. The server simulates here, in the reducer, and the track it emits is
    // what every display replays — no client ever predicts.
    if (actionType === "runContraption") {
      if (state.phase !== "building" || state.attemptsUsed >= state.attemptsPerTurn) {
        return unchanged;
      }

      const attemptNumber = state.attemptsUsed + 1;
      const graded = gradeAttempt(level, state.pieces, attemptNumber);
      const bestPoints = Math.max(state.bestPoints, graded.points);

      return {
        state: {
          ...state,
          phase: "ran",
          attemptsUsed: attemptNumber,
          run: {
            attemptNumber,
            track: graded.track,
            outcome: graded.outcome,
            settleSeconds: graded.settleSeconds,
            collectedPickupIds: graded.collectedPickupIds,
            points: graded.points,
            replayToken: 0
          },
          ...withBestPoints(state, bestPoints, input.pointsMax)
        },
        didMutate: true
      };
    }

    // Escape hatch (AGENTS.md §11): run the replay again for a room that
    // missed it. Changes nothing but the token the display keys playback on.
    if (actionType === "replayRun") {
      if (state.run === null) {
        return unchanged;
      }

      return {
        state: { ...state, run: { ...state.run, replayToken: state.run.replayToken + 1 } },
        didMutate: true
      };
    }

    if (actionType === "nextAttempt") {
      if (state.phase !== "ran") {
        return unchanged;
      }

      const hasAttemptsLeft = state.attemptsUsed < state.attemptsPerTurn;

      // Pieces stay where they are: the second go is a REBUILD of the first,
      // and a team that liked most of its machine should not start from zero.
      return {
        state: {
          ...state,
          phase: hasAttemptsLeft ? "building" : "done",
          run: hasAttemptsLeft ? null : state.run
        },
        didMutate: true
      };
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isContraptionRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isContraptionRuntimeState(input.state)) {
      return null;
    }

    return toContraptionHostView(input.state, resolveContraptionContent(input.content));
  },
  selectDisplayView: (input) => {
    if (!isContraptionRuntimeState(input.state)) {
      return null;
    }

    return toContraptionDisplayView(input.state, resolveContraptionContent(input.content));
  }
};
