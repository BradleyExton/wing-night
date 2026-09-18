import type {
  FappyMinigameDisplayView,
  FappyMinigameHostView,
  FappyPhase
} from "@wingnight/shared";

import type { FappyRuntimeState } from "../types/index.js";

// Derived, never stored: the limit passing or the last gate ends the relay;
// otherwise the room is in whatever state the leg in hand is.
export const resolveFappyPhase = (state: FappyRuntimeState): FappyPhase => {
  if (state.timedOutAtMs !== null) {
    return "timedOut";
  }

  if (state.finishedAtMs !== null || state.legIndex >= state.legsPerTurn) {
    return "finished";
  }

  const status = state.legs[state.legIndex]?.status ?? "ready";

  return status === "flying" ? "flying" : "ready";
};

// A cleared leg counts every gate; the leg in hand counts up to its
// checkpoint, which is the last gate its bird got behind and stayed behind.
export const resolveTotalGatesCleared = (state: FappyRuntimeState): number => {
  return state.legs.reduce((total, leg) => {
    return total + (leg.status === "cleared" ? state.gatesPerLeg : leg.checkpointGate);
  }, 0);
};

export const resolveElapsedMs = (state: FappyRuntimeState): number | null => {
  const endedAtMs = state.timedOutAtMs ?? state.finishedAtMs;

  if (state.startedAtMs === null || endedAtMs === null) {
    return null;
  }

  return Math.max(0, endedAtMs - state.startedAtMs);
};

const resolvePoints = (state: FappyRuntimeState): number | null => {
  if (state.activeTurnTeamId === null || (state.finishedAtMs === null && state.timedOutAtMs === null)) {
    return null;
  }

  return Math.max(0, (state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0) - state.turnStartPoints);
};

// Nothing in a relay is a secret, so the host and display views are the same
// projection; the two exports exist so each outer union gets its own member.
const toFappyViewFields = (state: FappyRuntimeState) => {
  return {
    minigame: "FAPPY" as const,
    activeTurnTeamId: state.activeTurnTeamId,
    pendingPointsByTeamId: { ...state.pendingPointsByTeamId },
    phase: resolveFappyPhase(state),
    legIndex: state.legIndex,
    legsPerTurn: state.legsPerTurn,
    gatesPerLeg: state.gatesPerLeg,
    parSeconds: state.parSeconds,
    limitSeconds: state.limitSeconds,
    legs: state.legs.map((leg) => ({
      ...leg,
      flapTicks: [...leg.flapTicks],
      lastRun: leg.lastRun === null ? null : { ...leg.lastRun }
    })),
    totalGatesCleared: resolveTotalGatesCleared(state),
    startedAtMs: state.startedAtMs,
    finishedAtMs: state.finishedAtMs,
    timedOutAtMs: state.timedOutAtMs,
    elapsedMs: resolveElapsedMs(state),
    points: resolvePoints(state)
  };
};

export const toFappyHostView = (state: FappyRuntimeState): FappyMinigameHostView => {
  return toFappyViewFields(state);
};

export const toFappyDisplayView = (state: FappyRuntimeState): FappyMinigameDisplayView => {
  return toFappyViewFields(state);
};
