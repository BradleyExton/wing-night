import type {
  SchlonicBestTurn,
  SchlonicMinigameDisplayView,
  SchlonicMinigameHostView,
  SchlonicPhase
} from "@wingnight/shared";

import { resolveWingsBanked, resolveWingsPar } from "../scoring/index.js";
import type { SchlonicRuntimeState } from "../types/index.js";

/** A deep copy of the turn to beat, so no view shares an array with the state. */
export const cloneBestTurn = (bestTurn: SchlonicBestTurn | null): SchlonicBestTurn | null => {
  return bestTurn === null
    ? null
    : {
        ...bestTurn,
        legs: bestTurn.legs.map((leg) => {
          return leg === null
            ? null
            : {
                ...leg,
                player: leg.player === null ? null : { ...leg.player },
                inputs: leg.inputs.map((input) => ({ ...input }))
              };
        })
      };
};

// Derived, never stored: the team is through once every run is behind it; otherwise the room is
// in whatever state the run in hand is.
export const resolveSchlonicPhase = (state: SchlonicRuntimeState): SchlonicPhase => {
  if (state.runIndex >= state.runsPerTurn) {
    return "finished";
  }

  return state.runs[state.runIndex]?.status === "running" ? "running" : "ready";
};

const resolvePoints = (state: SchlonicRuntimeState): number | null => {
  if (state.activeTurnTeamId === null || resolveSchlonicPhase(state) !== "finished") {
    return null;
  }

  return Math.max(
    0,
    (state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0) - state.turnStartPoints
  );
};

// Nothing in a zone is a secret — the whole run is on the TV as it happens — so the host and
// display views are the same projection; the two exports exist so each outer union gets its own
// member.
const toSchlonicViewFields = (state: SchlonicRuntimeState) => {
  return {
    minigame: "SCHLONIC" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: resolveSchlonicPhase(state),
    runIndex: state.runIndex,
    runsPerTurn: state.runsPerTurn,
    zoneSeed: state.zoneSeed,
    zoneChunks: state.zoneChunks,
    parWingsPerRun: state.parWingsPerRun,
    runs: state.runs.map((run) => ({
      ...run,
      player: run.player === null ? null : { ...run.player },
      inputs: run.inputs.map((input) => ({ ...input })),
      result: run.result === null ? null : { ...run.result }
    })),
    wingsBanked: resolveWingsBanked(state.runs),
    wingsPar: resolveWingsPar(state.parWingsPerRun, state.runsPerTurn),
    points: resolvePoints(state),
    bestTurn: cloneBestTurn(state.bestTurn)
  };
};

export const toSchlonicHostView = (state: SchlonicRuntimeState): SchlonicMinigameHostView => {
  return toSchlonicViewFields(state);
};

export const toSchlonicDisplayView = (
  state: SchlonicRuntimeState
): SchlonicMinigameDisplayView => {
  return toSchlonicViewFields(state);
};
