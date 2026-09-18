import type {
  FappyMinigameDisplayView,
  FappyMinigameHostView,
  FappyPhase
} from "@wingnight/shared";

import type { FappyRuntimeState } from "../types/index.js";

// Derived, never stored: the relay is over once the cursor has walked past
// the last leg, otherwise the room is in whatever state the current leg is.
export const resolveFappyPhase = (state: FappyRuntimeState): FappyPhase => {
  if (state.legIndex >= state.legsPerTurn) {
    return "done";
  }

  return state.legs[state.legIndex]?.status ?? "done";
};

export const resolveTotalGatesCleared = (state: FappyRuntimeState): number => {
  return state.legs.reduce((total, leg) => total + leg.gatesCleared, 0);
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
    pointsPerGate: state.pointsPerGate,
    legs: state.legs.map((leg) => ({ ...leg, flapTicks: [...leg.flapTicks] })),
    totalGatesCleared: resolveTotalGatesCleared(state)
  };
};

export const toFappyHostView = (state: FappyRuntimeState): FappyMinigameHostView => {
  return toFappyViewFields(state);
};

export const toFappyDisplayView = (state: FappyRuntimeState): FappyMinigameDisplayView => {
  return toFappyViewFields(state);
};
