import type { MinigameType, Player, SchlonicPlayerFigure, Team } from "@wingnight/shared";
import { runSchlonicRun } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { isSchlonicRuntimeState, isSchlonicTickPayload } from "./guards/index.js";
import { isSchlonicRules, resolveSchlonicRules } from "./rules/index.js";
import { resolveRingsBanked, resolveRingsPar, resolveSchlonicPoints } from "./scoring/index.js";
import type { SchlonicRuntimeRules, SchlonicRuntimeRun, SchlonicRuntimeState } from "./types/index.js";
import { resolveSchlonicPhase, toSchlonicDisplayView, toSchlonicHostView } from "./views/index.js";

export const schlonicMinigameId: MinigameType = "SCHLONIC";

// The active team's seating, as the figures the surfaces name. Only players the roster still
// lists count; an id with no player behind it is skipped.
const resolveTeamFigures = (
  teamId: string | null,
  players: readonly Player[],
  teams: readonly Team[]
): SchlonicPlayerFigure[] => {
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

const createReadyRun = (
  figures: readonly SchlonicPlayerFigure[],
  runIndex: number
): SchlonicRuntimeRun => {
  return {
    runIndex,
    // The roster cycles, so a short team's first player runs again rather than the team taking
    // fewer runs at the zone than everyone else.
    player: figures.length === 0 ? null : (figures[runIndex % figures.length] ?? null),
    status: "ready",
    inputs: [],
    skipped: false,
    result: null
  };
};

const createRuns = (
  figures: readonly SchlonicPlayerFigure[],
  rules: SchlonicRuntimeRules
): SchlonicRuntimeRun[] => {
  return Array.from({ length: rules.runsPerTurn }, (_unused, runIndex) => {
    return createReadyRun(figures, runIndex);
  });
};

const mutated = (state: SchlonicRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

const currentRun = (state: SchlonicRuntimeState): SchlonicRuntimeRun | null => {
  return state.runs[state.runIndex] ?? null;
};

const replaceRun = (
  state: SchlonicRuntimeState,
  runIndex: number,
  nextRun: SchlonicRuntimeRun
): SchlonicRuntimeRun[] => {
  return state.runs.map((run) => (run.runIndex === runIndex ? nextRun : run));
};

/**
 * Rescores the turn from the runs as they stand. Called after every run so the room watches the
 * tally climb rather than learning it all at the end.
 */
const withTurnScore = (
  state: SchlonicRuntimeState,
  pointsMax: number
): SchlonicRuntimeState => {
  if (state.activeTurnTeamId === null) {
    return state;
  }

  const points = resolveSchlonicPoints(
    resolveRingsBanked(state.runs),
    resolveRingsPar(state.parRingsPerRun, state.runsPerTurn),
    pointsMax
  );

  return {
    ...state,
    pendingPointsByTeamId: {
      ...state.pendingPointsByTeamId,
      [state.activeTurnTeamId]: Math.min(
        pointsMax,
        Math.max(0, state.turnStartPoints + points)
      )
    }
  };
};

// The run is over and the tablet moves on. A run only ever happens once: there is no second
// attempt at the zone, which is what makes the greedy line a decision rather than a rehearsal.
const finishRun = (
  state: SchlonicRuntimeState,
  run: SchlonicRuntimeRun,
  pointsMax: number
): SchlonicRuntimeState => {
  return withTurnScore(
    {
      ...state,
      runs: replaceRun(state, run.runIndex, run),
      runIndex: run.runIndex + 1
    },
    pointsMax
  );
};

export const schlonicRuntimePlugin: MinigameRuntimePlugin = {
  id: "SCHLONIC",
  isRules: isSchlonicRules,
  initialize: (input) => {
    const rules = resolveSchlonicRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;
    const figures = resolveTeamFigures(activeTurnTeamId, input.players, input.teams);

    const initialState: SchlonicRuntimeState = {
      activeTurnTeamId,
      runsPerTurn: rules.runsPerTurn,
      zoneSeed: rules.zoneSeed,
      zoneChunks: rules.zoneChunks,
      parRingsPerRun: rules.parRingsPerRun,
      runIndex: 0,
      runs: createRuns(figures, rules),
      turnStartPoints:
        activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isSchlonicRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const phase = resolveSchlonicPhase(state);
    const run = currentRun(state);
    const isLive = phase === "ready" || phase === "running";
    const { actionType, actionPayload } = input.envelope;

    // The button, as the tablet logged it. Down is a jump off the floor; up ends the climb, so
    // a tap is a hop and a hold is the full jump. The server keeps the log and nothing else:
    // the run is scored by re-running it, never by trusting a reported number.
    if (actionType === "press" || actionType === "release") {
      if (run === null || !isLive || !isSchlonicTickPayload(actionPayload)) {
        return unchanged;
      }

      const lastInput = run.inputs[run.inputs.length - 1];

      // A log is strictly ascending: a repeat or an out-of-order tick is a duplicate delivery or
      // a stale tablet, not a finger.
      if (lastInput !== undefined && actionPayload.tick <= lastInput.tick) {
        return unchanged;
      }

      return mutated({
        ...state,
        runs: replaceRun(state, run.runIndex, {
          ...run,
          status: "running",
          inputs: [...run.inputs, { tick: actionPayload.tick, down: actionType === "press" }]
        })
      });
    }

    // The referee: the server re-runs the log itself and takes its own reading. The tablet only
    // ever says "that's the end of it" — never how it went, and never what it scored.
    if (actionType === "endRun") {
      if (run === null || phase !== "running") {
        return unchanged;
      }

      const refereed = runSchlonicRun(
        { seed: state.zoneSeed, chunks: state.zoneChunks },
        run.inputs
      );

      return mutated(
        finishRun(
          state,
          {
            ...run,
            status: "done",
            result: {
              outcome: refereed.outcome === "running" ? "wiped" : refereed.outcome,
              endTick: refereed.endTick,
              rings: refereed.rings,
              distance: refereed.distance
            }
          },
          input.pointsMax
        )
      );
    }

    // Escape hatch (AGENTS.md §11): forgive a run the tablet can't take — a dead touch surface,
    // a player who would rather watch. It banks nothing and the tablet moves on.
    if (actionType === "skipRun") {
      if (run === null || !isLive) {
        return unchanged;
      }

      return mutated(
        finishRun(
          state,
          { ...run, status: "done", skipped: true, inputs: [], result: null },
          input.pointsMax
        )
      );
    }

    // Escape hatch (AGENTS.md §11): put the whole team back on the start line, handing back
    // exactly the points this turn banked.
    if (actionType === "resetTurn") {
      const reset: SchlonicRuntimeState = {
        ...state,
        runIndex: 0,
        runs: state.runs.map((entry) =>
          createReadyRun(entry.player === null ? [] : [entry.player], entry.runIndex)
        )
      };

      return mutated(withTurnScore(reset, input.pointsMax));
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isSchlonicRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isSchlonicRuntimeState(input.state)) {
      return null;
    }

    return toSchlonicHostView(input.state);
  },
  selectDisplayView: (input) => {
    if (!isSchlonicRuntimeState(input.state)) {
      return null;
    }

    return toSchlonicDisplayView(input.state);
  }
};
