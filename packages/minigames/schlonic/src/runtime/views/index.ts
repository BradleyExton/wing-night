import type {
  SchlonicMinigameDisplayView,
  SchlonicMinigameHostView,
  SchlonicPhase
} from "@wingnight/shared";

import { resolveRingsBanked, resolveRingsPar } from "../scoring/index.js";
import type { SchlonicRuntimeState } from "../types/index.js";

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
    parRingsPerRun: state.parRingsPerRun,
    runs: state.runs.map((run) => ({
      ...run,
      player: run.player === null ? null : { ...run.player },
      inputs: run.inputs.map((input) => ({ ...input })),
      result: run.result === null ? null : { ...run.result }
    })),
    ringsBanked: resolveRingsBanked(state.runs),
    ringsPar: resolveRingsPar(state.parRingsPerRun, state.runsPerTurn),
    points: resolvePoints(state)
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
