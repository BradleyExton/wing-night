import type {
  JoustAim,
  JoustShotResult,
  JoustShotRun,
  JoustShotTrack,
  MinigameType
} from "@wingnight/shared";
import { clampJoustAim, simulateJoustShot } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { joustContentAdapter, resolveJoustContent } from "./content/index.js";
import { isJoustAimPayload, isJoustRuntimeState } from "./guards/index.js";
import { isJoustRules, resolveJoustRules } from "./rules/index.js";
import {
  JOUST_MIN_LAUNCH_PULL,
  JOUST_POINTS_BY_ZONE,
  JOUST_SIMULATION_OPTIONS,
  SLACK_JOUST_AIM,
  type JoustRuntimeContent,
  type JoustRuntimeState
} from "./types/index.js";
import { resolveCurrentArena, toJoustDisplayView, toJoustHostView } from "./views/index.js";

export const joustMinigameId: MinigameType = "JOUST";

// Each team's turn is fought in its own arena, chosen by the team's place in
// the turn order so no two teams face the same cactus and a mid-turn reconnect
// rehydrates the same one. Deterministic for the same reason GEO's prompt
// cursor is: a random draw would re-roll on every re-entry.
const resolveArenaId = (
  teamIds: string[],
  activeRoundTeamId: string | null,
  content: JoustRuntimeContent
): string | null => {
  if (content.prompts.length === 0) {
    return null;
  }

  const teamIndex =
    activeRoundTeamId === null ? 0 : Math.max(0, teamIds.indexOf(activeRoundTeamId));

  return content.prompts[teamIndex % content.prompts.length]?.id ?? null;
};

// Stable per arena and per shot, so the jitter — and therefore the track — is
// the same on a replayed reducer as on the first run.
const resolveShotSeed = (arenaId: string, shotIndex: number): number => {
  let hash = 2166136261;

  for (let index = 0; index < arenaId.length; index += 1) {
    hash ^= arenaId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash ^ (shotIndex + 1)) | 0;
};

// Room state is plain mutable JSON; the integrator's readonly track is copied
// into that shape once, here, when it is stored.
const toTrack = (run: JoustShotRun): JoustShotTrack => {
  return {
    keyframeHz: run.keyframeHz,
    keyframes: run.keyframes.map((frame) => [...frame]),
    hitZone: run.hitZone,
    hitFrameIndex: run.hitFrameIndex
  };
};

const aimMagnitude = (aim: JoustAim): number => {
  return Math.sqrt(aim.x * aim.x + aim.y * aim.y);
};

const withPendingPoints = (
  state: JoustRuntimeState,
  points: number,
  pointsMax: number
): Record<string, number> => {
  if (state.activeTurnTeamId === null) {
    return { ...state.pendingPointsByTeamId };
  }

  return {
    ...state.pendingPointsByTeamId,
    [state.activeTurnTeamId]: Math.min(pointsMax, Math.max(0, points))
  };
};

const currentTeamPoints = (state: JoustRuntimeState): number => {
  if (state.activeTurnTeamId === null) {
    return 0;
  }

  return state.pendingPointsByTeamId[state.activeTurnTeamId] ?? 0;
};

// Shared by `nextShot` and the `skipShot` escape hatch: both land on a fresh
// band, or on `done` once the team's shots are spent. The replayed track is
// dropped on the way out so the snapshot only ever carries one.
const advanceToNextShot = (state: JoustRuntimeState): MinigameRuntimeReductionResult => {
  const nextShotIndex = state.shotIndex + 1;
  const hasNextShot = nextShotIndex < state.shotsPerTurn;

  return {
    state: {
      ...state,
      shotIndex: hasNextShot ? nextShotIndex : state.shotIndex,
      phase: hasNextShot ? "aiming" : "done",
      aim: { ...SLACK_JOUST_AIM },
      lastShot: hasNextShot ? null : state.lastShot
    },
    didMutate: true
  };
};

const launch = (
  state: JoustRuntimeState,
  content: JoustRuntimeContent,
  aim: JoustAim,
  pointsMax: number
): MinigameRuntimeReductionResult => {
  const unchanged = { state, didMutate: false };
  const arena = resolveCurrentArena(state, content);
  const clampedAim = clampJoustAim(aim);

  if (
    state.phase !== "aiming" ||
    arena === null ||
    aimMagnitude(clampedAim) < JOUST_MIN_LAUNCH_PULL
  ) {
    return unchanged;
  }

  const run = simulateJoustShot(
    { targetX: arena.targetX, obstacles: arena.obstacles },
    clampedAim,
    { ...JOUST_SIMULATION_OPTIONS, seed: resolveShotSeed(arena.id, state.shotIndex) }
  );
  const points = run.hitZone === null ? 0 : JOUST_POINTS_BY_ZONE[run.hitZone];
  const shot: JoustShotResult = {
    shotNumber: state.shotIndex + 1,
    hitZone: run.hitZone,
    points
  };

  return {
    state: {
      ...state,
      phase: "resolved",
      aim: { ...SLACK_JOUST_AIM },
      shots: [...state.shots, shot],
      lastShot: { ...shot, aim: clampedAim, run: toTrack(run) },
      pendingPointsByTeamId: withPendingPoints(
        state,
        currentTeamPoints(state) + points,
        pointsMax
      )
    },
    didMutate: true
  };
};

export const joustRuntimePlugin: MinigameRuntimePlugin = {
  id: "JOUST",
  content: joustContentAdapter,
  isRules: isJoustRules,
  initialize: (input) => {
    const content = resolveJoustContent(input.content);
    const rules = resolveJoustRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;
    const arenaId = resolveArenaId(input.teamIds, input.activeRoundTeamId, content);

    // No arena means no round to run; the server clears the projection and the
    // host surface falls back to its "check the content pack" note.
    if (arenaId === null) {
      return null;
    }

    const initialState: JoustRuntimeState = {
      activeTurnTeamId,
      arenaId,
      shotsPerTurn: rules.shotsPerTurn,
      shotIndex: 0,
      phase: "aiming",
      aim: { ...SLACK_JOUST_AIM },
      shots: [],
      lastShot: null,
      turnStartPoints:
        activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isJoustRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const content = resolveJoustContent(input.content);
    const { actionType, actionPayload } = input.envelope;

    if (actionType === "setAim") {
      if (state.phase !== "aiming" || !isJoustAimPayload(actionPayload)) {
        return unchanged;
      }

      const aim = clampJoustAim(actionPayload);

      if (aim.x === state.aim.x && aim.y === state.aim.y) {
        return unchanged;
      }

      return { state: { ...state, aim }, didMutate: true };
    }

    if (actionType === "launch") {
      if (!isJoustAimPayload(actionPayload)) {
        return unchanged;
      }

      return launch(state, content, actionPayload, input.pointsMax);
    }

    if (actionType === "nextShot") {
      if (state.phase !== "resolved") {
        return unchanged;
      }

      return advanceToNextShot(state);
    }

    // Escape hatch (AGENTS.md §11): forfeit a shot the tablet can't make —
    // a dead touch surface, a team that's had enough. Scores nothing.
    if (actionType === "skipShot") {
      if (state.phase !== "aiming") {
        return unchanged;
      }

      const forfeited: JoustShotResult = {
        shotNumber: state.shotIndex + 1,
        hitZone: null,
        points: 0
      };

      return advanceToNextShot({ ...state, shots: [...state.shots, forfeited] });
    }

    // Escape hatch (AGENTS.md §11): run the whole turn again, handing back
    // exactly the points this turn banked.
    if (actionType === "resetTurn") {
      return {
        state: {
          ...state,
          shotIndex: 0,
          phase: "aiming",
          aim: { ...SLACK_JOUST_AIM },
          shots: [],
          lastShot: null,
          pendingPointsByTeamId: withPendingPoints(
            state,
            state.turnStartPoints,
            input.pointsMax
          )
        },
        didMutate: true
      };
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isJoustRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  syncContent: (input) => {
    if (!isJoustRuntimeState(input.state)) {
      return input.state;
    }

    const state = input.state;
    const content = resolveJoustContent(input.content);
    const arenaStillExists = content.prompts.some((prompt) => prompt.id === state.arenaId);

    return arenaStillExists ? state : { ...state, arenaId: null };
  },
  selectHostView: (input) => {
    if (!isJoustRuntimeState(input.state)) {
      return null;
    }

    return toJoustHostView(input.state, resolveJoustContent(input.content));
  },
  selectDisplayView: (input) => {
    if (!isJoustRuntimeState(input.state)) {
      return null;
    }

    return toJoustDisplayView(input.state, resolveJoustContent(input.content));
  }
};
