import type { FappyPlayerFigure, MinigameType, Player, Team } from "@wingnight/shared";
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
  resolveElapsedMs,
  resolveFappyPhase,
  resolveTotalGatesCleared,
  toFappyDisplayView,
  toFappyHostView
} from "./views/index.js";

export const fappyMinigameId: MinigameType = "FAPPY";

// One course for every team: no relay is easier than another, the way SCHLONIC's
// street is a rule. The legs still differ because `resolveFappyGates` mixes the
// leg index into this seed. It must not be mixed in here as well — doing it twice
// cancelled it out, and every leg of a relay flew the same six gates.
const FAPPY_COURSE_SEED = 0x5eedfa99 | 0;

// The active team's seating, as the figures the surfaces draw. Only players
// the roster still lists count; an id with no player behind it is skipped.
const resolveTeamFigures = (
  teamId: string | null,
  players: readonly Player[],
  teams: readonly Team[]
): FappyPlayerFigure[] => {
  const team = teamId === null ? undefined : teams.find((entry) => entry.id === teamId);

  if (team === undefined) {
    return [];
  }

  return team.playerIds.flatMap((playerId) => {
    const player = players.find((entry) => entry.id === playerId);

    return player === undefined
      ? []
      : [
          {
            playerId: player.id,
            name: player.name,
            avatarSrc: player.avatarSrc ?? null,
            teamId: team.id,
            genre: team.genre ?? null
          }
        ];
  });
};

const createReadyLeg = (
  figures: readonly FappyPlayerFigure[],
  legIndex: number
): FappyRuntimeLeg => {
  return {
    legIndex,
    // The roster cycles, so a short team's first player flies again rather
    // than the team flying fewer legs than everyone else.
    player: figures.length === 0 ? null : (figures[legIndex % figures.length] ?? null),
    seed: FAPPY_COURSE_SEED,
    status: "ready",
    attempt: 0,
    checkpointGate: 0,
    flapTicks: [],
    crashes: 0,
    skipped: false,
    knockedEagles: [],
    lastRun: null
  };
};

const createLegs = (
  figures: readonly FappyPlayerFigure[],
  rules: FappyRuntimeRules
): FappyRuntimeLeg[] => {
  return Array.from({ length: rules.legsPerTurn }, (_unused, legIndex) => {
    return createReadyLeg(figures, legIndex);
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
  const finished: FappyRuntimeState = {
    ...state,
    finishedAtMs: receivedAtMs,
    legIndex: state.legsPerTurn
  };
  // A relay whose clock never started is one nobody flew: `startedAtMs` is set
  // by the first flap of the turn and by nothing else, so a null here means
  // every leg was skipped. It used to fall back to `receivedAtMs`, which made
  // the elapsed time zero — and zero is under par, so skipping the whole relay
  // paid the full round. The escape hatch scores nothing instead, which is the
  // bargain JOUST's `skipShot` and SCHLONIC's `skipRun` already make.
  //
  // Otherwise the score reads `resolveElapsedMs`, not the raw wall clock: it
  // carries the skip penalty, so a relay with a forgiven leg in it pays for
  // exactly the time the deck and the TV show.
  const points =
    state.startedAtMs === null ? 0 : resolveFinishPoints(resolveElapsedMs(finished) ?? 0, finished, pointsMax);

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
    leg.checkpointGate,
    leg.knockedEagles
  );
  // Whatever the attempt knocked away stays away, whichever way it ended.
  const knockedEagles = run.frame.knockedEagles.map((knocked) => knocked.gate);
  const lastRun = {
    endTick: run.endTick,
    gatesCleared: run.gatesCleared,
    outcome: run.outcome === "cleared" ? ("cleared" as const) : ("crashed" as const)
  };

  if (run.outcome === "cleared") {
    return mutated(clearLeg(state, { ...leg, knockedEagles, lastRun }, receivedAtMs, pointsMax));
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
      knockedEagles,
      lastRun
    })
  };

  return mutated(isPastLimit(crashed, receivedAtMs) ? timeOut(crashed, receivedAtMs, pointsMax) : crashed);
};

// The take-back (`contestantRetakeActionType`): the host hands the leg in hand from a phone to
// the tablet. The bird respawns exactly as a crash respawns it — on the perch of the last gate the
// leg got behind, as the next attempt, with a fresh log — because the tablet can never continue a
// log another device wrote. It is not a crash: nobody flew it into anything, so it is not counted
// as one, and the gates already cleared stay cleared.
const retakeLeg = (state: FappyRuntimeState, leg: FappyRuntimeLeg): FappyRuntimeState => {
  return {
    ...state,
    legs: replaceLeg(state, leg.legIndex, {
      ...leg,
      status: "ready",
      attempt: leg.attempt + 1,
      flapTicks: []
    })
  };
};

export const fappyRuntimePlugin: MinigameRuntimePlugin = {
  id: "FAPPY",
  transientActionTypes: ["flap"],
  // The phone flies its own leg and says when the attempt is over. `timeOut` is the clock's, so
  // the phone may send it as the tablet does — but the server sends it too (`selectDeadlineAction`).
  contestantActionTypes: ["flap", "endLeg", "timeOut"],
  contestantRetakeActionType: "retakeLeg",
  contestantResetActionType: "resetTurn",
  isRules: isFappyRules,
  initialize: (input) => {
    const rules = resolveFappyRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;
    const figures = resolveTeamFigures(activeTurnTeamId, input.players, input.teams);

    const initialState: FappyRuntimeState = {
      activeTurnTeamId,
      legsPerTurn: rules.legsPerTurn,
      gatesPerLeg: rules.gatesPerLeg,
      parSeconds: rules.parSeconds,
      limitSeconds: rules.limitSeconds,
      legIndex: 0,
      legs: createLegs(figures, rules),
      startedAtMs: null,
      finishedAtMs: null,
      timedOutAtMs: null,
      pointsMax: input.pointsMax,
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

    // A phone's leg taken back by the host: the next attempt starts clean on the tablet. A leg
    // nobody has flapped yet has nothing to restart.
    if (actionType === "retakeLeg") {
      if (leg === null || !isLive || leg.status !== "flying") {
        return unchanged;
      }

      return mutated(retakeLeg(state, leg));
    }

    // Escape hatch (AGENTS.md §11): run the whole relay again from the start
    // line, clock and all, handing back exactly the points this turn banked.
    if (actionType === "resetTurn") {
      const reset: FappyRuntimeState = {
        ...state,
        legIndex: 0,
        legs: state.legs.map((entry) =>
          createReadyLeg(entry.player === null ? [] : [entry.player], entry.legIndex)
        ),
        startedAtMs: null,
        finishedAtMs: null,
        timedOutAtMs: null
      };

      return mutated({ ...reset, pendingPointsByTeamId: withTurnPoints(reset, 0, input.pointsMax) });
    }

    return unchanged;
  },
  selectContestant: (input) => {
    if (!isFappyRuntimeState(input.state)) {
      return null;
    }

    const phase = resolveFappyPhase(input.state);
    const leg = currentLeg(input.state);

    if (leg === null || (phase !== "ready" && phase !== "flying")) {
      return null;
    }

    return {
      legIndex: leg.legIndex,
      playerId: leg.player?.playerId ?? null,
      nextPlayerId: input.state.legs[leg.legIndex + 1]?.player?.playerId ?? null
    };
  },
  // The relay's limit, enforced by the server's own clock: the phone flying the leg may be in a
  // pocket by then. The tablet's clock still sends `timeOut` too; whichever lands first wins and
  // the other is a no-op, because a timed-out relay is no longer live.
  selectDeadlineAction: (input) => {
    if (!isFappyRuntimeState(input.state)) {
      return null;
    }

    const phase = resolveFappyPhase(input.state);

    if (input.state.startedAtMs === null || (phase !== "ready" && phase !== "flying")) {
      return null;
    }

    return { actionType: "timeOut", atMs: input.state.startedAtMs + input.state.limitSeconds * 1000 };
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
