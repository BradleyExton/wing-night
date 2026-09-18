import type { MinigameType } from "@wingnight/shared";
import { runFappyLeg } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { isFappyFlapPayload, isFappyRuntimeState } from "./guards/index.js";
import { isFappyRules, resolveFappyRules } from "./rules/index.js";
import type { FappyRuntimeLeg, FappyRuntimeRules, FappyRuntimeState } from "./types/index.js";
import {
  resolveFappyPhase,
  resolveTotalGatesCleared,
  toFappyDisplayView,
  toFappyHostView
} from "./views/index.js";

export const fappyMinigameId: MinigameType = "FAPPY";

// Stable per team and per leg, so a reconnect, a redo or a replayed reducer
// derives the same course. Same FNV mix JOUST seeds its shots with.
const resolveLegSeed = (teamId: string | null, legIndex: number): number => {
  const key = teamId ?? "";
  let hash = 2166136261;

  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash ^ Math.imul(legIndex + 1, 0x9e3779b1)) | 0;
};

const createReadyLeg = (
  teamId: string | null,
  playerIds: readonly string[],
  legIndex: number
): FappyRuntimeLeg => {
  return {
    legIndex,
    // The roster cycles, so a short team's first player flies again rather
    // than the team flying fewer legs than everyone else.
    playerId: playerIds.length === 0 ? null : (playerIds[legIndex % playerIds.length] ?? null),
    seed: resolveLegSeed(teamId, legIndex),
    status: "ready",
    flapTicks: [],
    gatesCleared: 0,
    endTick: null,
    outcome: null
  };
};

const createLegs = (
  teamId: string | null,
  playerIds: readonly string[],
  rules: FappyRuntimeRules
): FappyRuntimeLeg[] => {
  return Array.from({ length: rules.legsPerTurn }, (_unused, legIndex) => {
    return createReadyLeg(teamId, playerIds, legIndex);
  });
};

// A leg keeps its player and seed across a redo: the same person flies the
// same course again.
const resetLeg = (leg: FappyRuntimeLeg): FappyRuntimeLeg => {
  return {
    ...leg,
    status: "ready",
    flapTicks: [],
    gatesCleared: 0,
    endTick: null,
    outcome: null
  };
};

const withPendingPoints = (
  state: FappyRuntimeState,
  pointsMax: number
): Record<string, number> => {
  if (state.activeTurnTeamId === null) {
    return { ...state.pendingPointsByTeamId };
  }

  const turnPoints = state.turnStartPoints + state.pointsPerGate * resolveTotalGatesCleared(state);

  return {
    ...state.pendingPointsByTeamId,
    [state.activeTurnTeamId]: Math.min(pointsMax, Math.max(0, turnPoints))
  };
};

const replaceLeg = (
  state: FappyRuntimeState,
  legIndex: number,
  nextLeg: FappyRuntimeLeg
): FappyRuntimeLeg[] => {
  return state.legs.map((leg) => (leg.legIndex === legIndex ? nextLeg : leg));
};

const mutated = (state: FappyRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

const currentLeg = (state: FappyRuntimeState): FappyRuntimeLeg | null => {
  return state.legs[state.legIndex] ?? null;
};

const landLeg = (
  state: FappyRuntimeState,
  leg: FappyRuntimeLeg,
  landed: Pick<FappyRuntimeLeg, "gatesCleared" | "endTick" | "outcome">,
  pointsMax: number
): FappyRuntimeState => {
  const withLanding: FappyRuntimeState = {
    ...state,
    legs: replaceLeg(state, leg.legIndex, { ...leg, ...landed, status: "landed" })
  };

  return { ...withLanding, pendingPointsByTeamId: withPendingPoints(withLanding, pointsMax) };
};

// The referee: the server re-runs the sim from the log and keeps its own
// count. The tablet never sends a score, so there is nothing to dispute.
const endLeg = (
  state: FappyRuntimeState,
  leg: FappyRuntimeLeg,
  pointsMax: number
): MinigameRuntimeReductionResult => {
  const run = runFappyLeg(
    { seed: leg.seed, legIndex: leg.legIndex, gatesPerLeg: state.gatesPerLeg },
    leg.flapTicks
  );

  return mutated(
    landLeg(
      state,
      leg,
      {
        gatesCleared: run.gatesCleared,
        endTick: run.endTick,
        // The cap is sized so a run always resolves; a `flying` here is a
        // crash for scoring purposes rather than a leg that never ends.
        outcome: run.outcome === "flying" ? "crashed" : run.outcome
      },
      pointsMax
    )
  );
};

const advanceLeg = (state: FappyRuntimeState): FappyRuntimeState => {
  return { ...state, legIndex: Math.min(state.legsPerTurn, state.legIndex + 1) };
};

// The leg a redo targets: the one in hand if it has been flown, otherwise the
// one just passed — "redo" after the tablet has changed hands still means the
// last flight, and once the relay is over it means the final one.
const resolveRedoLegIndex = (state: FappyRuntimeState): number | null => {
  const leg = currentLeg(state);

  if (leg !== null && leg.status !== "ready") {
    return leg.legIndex;
  }

  return state.legIndex > 0 ? state.legIndex - 1 : null;
};

export const fappyRuntimePlugin: MinigameRuntimePlugin = {
  id: "FAPPY",
  isRules: isFappyRules,
  initialize: (input) => {
    const rules = resolveFappyRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;
    const playerIds =
      activeTurnTeamId === null ? [] : (input.playerIdsByTeamId?.[activeTurnTeamId] ?? []);

    const initialState: FappyRuntimeState = {
      activeTurnTeamId,
      legsPerTurn: rules.legsPerTurn,
      gatesPerLeg: rules.gatesPerLeg,
      pointsPerGate: rules.pointsPerGate,
      legIndex: 0,
      legs: createLegs(activeTurnTeamId, playerIds, rules),
      turnStartPoints:
        activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isFappyRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const phase = resolveFappyPhase(state);
    const leg = currentLeg(state);
    const { actionType, actionPayload } = input.envelope;

    if (actionType === "flap") {
      if (leg === null || (phase !== "ready" && phase !== "flying") || !isFappyFlapPayload(actionPayload)) {
        return unchanged;
      }

      const lastTick = leg.flapTicks[leg.flapTicks.length - 1];

      // A log is strictly ascending: a repeat or an out-of-order tick is a
      // duplicate delivery or a stale tablet, not a second flap.
      if (lastTick !== undefined && actionPayload.tick <= lastTick) {
        return unchanged;
      }

      return mutated({
        ...state,
        legs: replaceLeg(state, leg.legIndex, {
          ...leg,
          status: "flying",
          flapTicks: [...leg.flapTicks, actionPayload.tick]
        })
      });
    }

    if (actionType === "endLeg") {
      if (leg === null || phase !== "flying") {
        return unchanged;
      }

      return endLeg(state, leg, input.pointsMax);
    }

    if (actionType === "nextLeg") {
      if (phase !== "landed") {
        return unchanged;
      }

      return mutated(advanceLeg(state));
    }

    // Escape hatch (AGENTS.md §11): forfeit a leg the tablet can't fly — a
    // dead touch surface, a player who has had enough. The slot is consumed
    // so leg counts stay equal across teams, and the relay moves on at once.
    if (actionType === "skipLeg") {
      if (leg === null || (phase !== "ready" && phase !== "flying")) {
        return unchanged;
      }

      return mutated(
        advanceLeg(
          landLeg(state, leg, { gatesCleared: 0, endTick: null, outcome: "skipped" }, input.pointsMax)
        )
      );
    }

    // Escape hatch (AGENTS.md §11): fly the last leg again, handing back
    // exactly the points it banked.
    if (actionType === "redoLeg") {
      const redoLegIndex = resolveRedoLegIndex(state);
      const redoLeg = redoLegIndex === null ? null : (state.legs[redoLegIndex] ?? null);

      if (redoLeg === null || redoLegIndex === null) {
        return unchanged;
      }

      const rewound: FappyRuntimeState = {
        ...state,
        legIndex: redoLegIndex,
        legs: replaceLeg(state, redoLegIndex, resetLeg(redoLeg))
      };

      return mutated({ ...rewound, pendingPointsByTeamId: withPendingPoints(rewound, input.pointsMax) });
    }

    // Escape hatch (AGENTS.md §11): run the whole relay again, handing back
    // exactly the points this turn banked.
    if (actionType === "resetTurn") {
      const reset: FappyRuntimeState = {
        ...state,
        legIndex: 0,
        legs: state.legs.map(resetLeg)
      };

      return mutated({ ...reset, pendingPointsByTeamId: withPendingPoints(reset, input.pointsMax) });
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isFappyRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isFappyRuntimeState(input.state)) {
      return null;
    }

    return toFappyHostView(input.state);
  },
  selectDisplayView: (input) => {
    if (!isFappyRuntimeState(input.state)) {
      return null;
    }

    return toFappyDisplayView(input.state);
  }
};
