import type {
  MinigameDisplayView,
  MinigameHostView,
  SpotterHostShot,
  SpotterShotResult,
  SpotterStatus
} from "@wingnight/shared";

import type { SpotterRuntimeState } from "../types/index.js";

export const resolveSpotterStatus = (state: SpotterRuntimeState): SpotterStatus => {
  return state.targetIndex >= state.targets.length ? "done" : "aiming";
};

const toHostShot = (result: SpotterShotResult): SpotterHostShot => {
  return { band: result.band, points: result.points };
};

// The host view is deliberately starved: the holder gets the score of each
// shot and how many times they have nudged, but never the cursor, the targets,
// the trail or the seed — any of those would let the tablet reconstruct the
// picture the whole game depends on the room supplying.
export const toSpotterHostView = (state: SpotterRuntimeState): MinigameHostView => {
  const lastResult = state.results[state.results.length - 1];

  return {
    minigame: "SPOTTER",
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    status: resolveSpotterStatus(state),
    targetsPerTurn: state.targets.length,
    targetIndex: state.targetIndex,
    nudgesThisTarget: state.path.length,
    lastShot: lastResult === undefined ? null : toHostShot(lastResult),
    results: state.results.map(toHostShot)
  };
};

export const toSpotterDisplayView = (state: SpotterRuntimeState): MinigameDisplayView => {
  return {
    minigame: "SPOTTER",
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    status: resolveSpotterStatus(state),
    gridCols: state.gridCols,
    gridRows: state.gridRows,
    targets: state.targets.map((target) => ({ ...target })),
    targetIndex: state.targetIndex,
    cursor: { ...state.cursor },
    path: [...state.path],
    results: state.results.map((result) => ({ ...result }))
  };
};
