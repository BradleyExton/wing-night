import type { MinigameType } from "@wingnight/shared";
import { runFappyLeg } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { isFappyFlapPayload, isFappyRuntimeState, isReceivedAtMs } from "./guards/index.js";
import { isFappyRules, resolveFappyRules } from "./rules/index.js";
import { resolveFinishPoints, resolveTimeoutPoints } from "./scoring/index.js";
import type { FappyRuntimeLeg, FappyRuntimeRules, FappyRuntimeState } from "./types/index.js";
import {
  resolveFappyPhase,
  resolveTotalGatesCleared,
  toFappyDisplayView,
  toFappyHostView
} from "./views/index.js";

export const fappyMinigameId: MinigameType = "FAPPY";

// Stable per team and per leg, so a reconnect, a reset or a replayed reducer
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
    attempt: 0,
    checkpointGate: 0,
    flapTicks: [],
    crashes: 0,
    skipped: false,
    lastRun: null
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

const mutated = (state: FappyRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

const currentLeg = (state: FappyRuntimeState): FappyRuntimeLeg | null => {
  return state.legs[state.legIndex] ?? null;
};

const replaceLeg = (
  state: FappyRuntimeState,
  legIndex: number,
  nextLeg: FappyRuntimeLeg
): FappyRuntimeLeg[] => {
  return state.legs.map((leg) => (leg.legIndex === legIndex ? nextLeg : leg));
};

const withTurnPoints = (
  state: FappyRuntimeState,
  turnPoints: number,
  pointsMax: number
): Record<string, number> => {
  if (state.activeTurnTeamId === null) {
    return { ...state.pendingPointsByTeamId };
  }

  return {
    ...state.pendingPointsByTeamId,
    [state.activeTurnTeamId]: Math.min(pointsMax, Math.max(0, state.turnStartPoints + turnPoints))
  };
};

const isPastLimit = (state: FappyRuntimeState, receivedAtMs: number): boolean => {
  return state.startedAtMs !== null && receivedAtMs - state.startedAtMs >= state.limitSeconds * 1000;
};

// The limit caught the team: the relay is over where it stands, and it keeps
// the limit share scaled by how far it got.
const timeOut = (
  state: FappyRuntimeState,
  receivedAtMs: number,
  pointsMax: number
): FappyRuntimeState => {
  const timedOut: FappyRuntimeState = { ...state, timedOutAtMs: receivedAtMs };
  const points = resolveTimeoutPoints(
    resolveTotalGatesCleared(timedOut),
    timedOut.legsPerTurn * timedOut.gatesPerLeg,
    pointsMax
  );

  return { ...timedOut, pendingPointsByTeamId: withTurnPoints(timedOut, points, pointsMax) };
};

// The last gate of the last leg: the clock stops and the time is the score.
const finish = (
  state: FappyRuntimeState,
  receivedAtMs: number,
  pointsMax: number
): FappyRuntimeState => {
  const startedAtMs = state.startedAtMs ?? receivedAtMs;
  const finished: FappyRuntimeState = {
    ...state,
    startedAtMs,
    finishedAtMs: receivedAtMs,
    legIndex: state.legsPerTurn
  };
  const points = resolveFinishPoints(receivedAtMs - startedAtMs, finished, pointsMax);

  return { ...finished, pendingPointsByTeamId: withTurnPoints(finished, points, pointsMax) };
};

// A cleared leg hands the tablet on: the next leg is ready for its player's
// first tap, and the clock has not stopped for the handoff.
const clearLeg = (
  state: FappyRuntimeState,
  leg: FappyRuntimeLeg,
  receivedAtMs: number,
  pointsMax: number
): FappyRuntimeState => {
  const withCleared: FappyRuntimeState = {
    ...state,
    legs: replaceLeg(state, leg.legIndex, { ...leg, status: "cleared" })
  };

  if (leg.legIndex + 1 >= state.legsPerTurn) {
    return finish(withCleared, receivedAtMs, pointsMax);
  }

  return { ...withCleared, legIndex: leg.legIndex + 1 };
};

// The referee: the server re-runs the attempt from its checkpoint with the
// log it holds and keeps its own count. Cleared moves the relay on; a crash
// starts the next attempt on the perch of the last gate cleared.
const endLeg = (
  state: FappyRuntimeState,
  leg: FappyRuntimeLeg,
  receivedAtMs: number,
  pointsMax: number
): MinigameRuntimeReductionResult => {
  const run = runFappyLeg(
    { seed: leg.seed, legIndex: leg.legIndex, gatesPerLeg: state.gatesPerLeg },
    leg.flapTicks,
    leg.checkpointGate
  );
  const lastRun = {
    endTick: run.endTick,
    gatesCleared: run.gatesCleared,
    outcome: run.outcome === "cleared" ? ("cleared" as const) : ("crashed" as const)
  };

  if (run.outcome === "cleared") {
    return mutated(clearLeg(state, { ...leg, lastRun }, receivedAtMs, pointsMax));
  }

  const crashed: FappyRuntimeState = {
    ...state,
    legs: replaceLeg(state, leg.legIndex, {
      ...leg,
      status: "ready",
      attempt: leg.attempt + 1,
      checkpointGate: Math.max(leg.checkpointGate, run.gatesCleared),
      flapTicks: [],
      crashes: leg.crashes + 1,
      lastRun
    })
  };

  return mutated(isPastLimit(crashed, receivedAtMs) ? timeOut(crashed, receivedAtMs, pointsMax) : crashed);
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
      parSeconds: rules.parSeconds,
      limitSeconds: rules.limitSeconds,
      legIndex: 0,
      legs: createLegs(activeTurnTeamId, playerIds, rules),
      startedAtMs: null,
      finishedAtMs: null,
      timedOutAtMs: null,
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
    const isLive = phase === "ready" || phase === "flying";
    const { actionType, actionPayload, receivedAtMs } = input.envelope;

    // Every action here is timed against the server's clock; one that arrives
    // without a stamp is a fixture from before the stamp existed, not a tap.
    if (!isReceivedAtMs(receivedAtMs)) {
      return unchanged;
    }

    if (actionType === "flap") {
      if (leg === null || !isLive || !isFappyFlapPayload(actionPayload)) {
        return unchanged;
      }

      if (isPastLimit(state, receivedAtMs)) {
        return mutated(timeOut(state, receivedAtMs, input.pointsMax));
      }

      const lastTick = leg.flapTicks[leg.flapTicks.length - 1];

      // A log is strictly ascending: a repeat or an out-of-order tick is a
      // duplicate delivery or a stale tablet, not a second flap.
      if (lastTick !== undefined && actionPayload.tick <= lastTick) {
        return unchanged;
      }

      return mutated({
        ...state,
        // The relay's clock starts on its very first tap and never restarts.
        startedAtMs: state.startedAtMs ?? receivedAtMs,
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

      return endLeg(state, leg, receivedAtMs, input.pointsMax);
    }

    // The tablet's clock says the limit has passed; the server's clock decides.
    if (actionType === "timeOut") {
      if (!isLive || !isPastLimit(state, receivedAtMs)) {
        return unchanged;
      }

      return mutated(timeOut(state, receivedAtMs, input.pointsMax));
    }

    // Escape hatch (AGENTS.md §11): forgive a leg the tablet can't fly — a
    // dead touch surface, a player who has had enough. The leg counts as
    // cleared and the relay moves on; the clock keeps running.
    if (actionType === "skipLeg") {
      if (leg === null || !isLive) {
        return unchanged;
      }

      return mutated(
        clearLeg(state, { ...leg, skipped: true, flapTicks: [] }, receivedAtMs, input.pointsMax)
      );
    }

    // Escape hatch (AGENTS.md §11): run the whole relay again from the start
    // line, clock and all, handing back exactly the points this turn banked.
    if (actionType === "resetTurn") {
      const reset: FappyRuntimeState = {
        ...state,
        legIndex: 0,
        legs: state.legs.map((entry) =>
          createReadyLeg(state.activeTurnTeamId, entry.playerId === null ? [] : [entry.playerId], entry.legIndex)
        ),
        startedAtMs: null,
        finishedAtMs: null,
        timedOutAtMs: null
      };

      return mutated({ ...reset, pendingPointsByTeamId: withTurnPoints(reset, 0, input.pointsMax) });
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
