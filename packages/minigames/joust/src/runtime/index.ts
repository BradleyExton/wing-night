import type {
  JoustAim,
  JoustPerch,
  JoustShotResult,
  JoustShotRun,
  JoustShotTrack,
  MinigameType
} from "@wingnight/shared";
import {
  JOUST_WORLD,
  clampJoustAim,
  resolveJoustPerchPoints,
  simulateJoustShot
} from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { joustContentAdapter, resolveJoustContent } from "./content/index.js";
import { resolveShotGhost } from "./ghost/index.js";
import { isJoustAimPayload, isJoustRuntimeState } from "./guards/index.js";
import { resolveJoustRoster, resolveStandingPins, type JoustStandingPin } from "./lineup/index.js";
import { isJoustRules, resolveJoustRules } from "./rules/index.js";
import {
  JOUST_MIN_LAUNCH_PULL,
  JOUST_POINTS_PER_TOPPLE,
  JOUST_RACK_CLEARED_BONUS,
  JOUST_SIMULATION_OPTIONS,
  SLACK_JOUST_AIM,
  type JoustRuntimeContent,
  type JoustRuntimeState
} from "./types/index.js";
import { resolveCurrentArena, toJoustDisplayView, toJoustHostView } from "./views/index.js";

export const joustMinigameId: MinigameType = "JOUST";

// Each team's turn is fought on its own lane, chosen by the team's place in
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

// Stable per lane and per shot, so the jitter — and therefore the track — is
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
    topples: run.topples.map((topple) => ({ ...topple })),
    collapses: run.collapses.map((collapse) => ({ ...collapse }))
  };
};

// What a felled player is worth: their perch's value, so a shelf pays more than the sand.
const pointsForPin = (pin: JoustStandingPin, perches: readonly JoustPerch[]): number => {
  const perch = pin.perchIndex === null ? null : (perches[pin.perchIndex] ?? null);

  return JOUST_POINTS_PER_TOPPLE * resolveJoustPerchPoints(perch);
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

const standingCount = (state: JoustRuntimeState): number => {
  return state.lineup.length - state.downPlayerIds.length;
};

// Shared by `nextShot` and the `skipShot` escape hatch: both land on a fresh
// band, or on `done` once the team's shots are spent — or once there is nobody
// left to knock over, because firing at an empty lane is not a shot. The track
// is dropped on the way, but its arc stays behind as a ghost for the next
// teammate to aim off; a skipped shot flew nothing and leaves the last ghost be.
const advanceToNextShot = (state: JoustRuntimeState): MinigameRuntimeReductionResult => {
  const nextShotIndex = state.shotIndex + 1;
  const hasNextShot = nextShotIndex < state.shotsPerTurn && standingCount(state) > 0;

  return {
    state: {
      ...state,
      shotIndex: hasNextShot ? nextShotIndex : state.shotIndex,
      phase: hasNextShot ? "aiming" : "done",
      aim: { ...SLACK_JOUST_AIM },
      lastShot: hasNextShot ? null : state.lastShot,
      previousShotGhost:
        hasNextShot && state.lastShot !== null
          ? resolveShotGhost(state.lastShot, JOUST_WORLD.floorY)
          : state.previousShotGhost
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

  const standing = resolveStandingPins(state.lineup, state.downPlayerIds, arena.perches);
  const run = simulateJoustShot(
    {
      pinFeet: standing.map((pin) => ({ x: pin.x, y: pin.y })),
      perches: arena.perches,
      obstacles: arena.obstacles,
      collapsedPerchIndices: state.collapsedPerchIndices
    },
    clampedAim,
    { ...JOUST_SIMULATION_OPTIONS, seed: resolveShotSeed(arena.id, state.shotIndex) }
  );
  // `pinIndex` addresses the standing set the shot was fired at, which is the only list the
  // integrator ever saw — never the lineup.
  const toppled = run.topples.flatMap((topple) => {
    const pin = standing[topple.pinIndex];
    return pin === undefined ? [] : [pin];
  });
  const toppledPlayerIds = toppled.map((pin) => pin.playerId);
  const collapsedPerchIndices = run.collapses.map((collapse) => collapse.perchIndex);
  const isRackCleared =
    toppledPlayerIds.length > 0 && toppledPlayerIds.length === standing.length;
  const points =
    toppled.reduce((total, pin) => total + pointsForPin(pin, arena.perches), 0) +
    (isRackCleared ? JOUST_RACK_CLEARED_BONUS : 0);
  const shot: JoustShotResult = {
    shotNumber: state.shotIndex + 1,
    toppledPlayerIds,
    collapsedPerchIndices,
    isRackCleared,
    points
  };

  return {
    state: {
      ...state,
      phase: "resolved",
      aim: { ...SLACK_JOUST_AIM },
      downPlayerIds: [...state.downPlayerIds, ...toppledPlayerIds],
      collapsedPerchIndices: [...state.collapsedPerchIndices, ...collapsedPerchIndices],
      shots: [...state.shots, shot],
      lastShot: {
        ...shot,
        toppledPlayerIds: [...toppledPlayerIds],
        collapsedPerchIndices: [...collapsedPerchIndices],
        aim: clampedAim,
        run: toTrack(run),
        pinPlayerIds: standing.map((pin) => pin.playerId),
        rubblePerchIndices: [...state.collapsedPerchIndices]
      },
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

    // No lane means no round to run; the server clears the projection and the
    // host surface falls back to its "check the content pack" note.
    if (arenaId === null) {
      return null;
    }

    const roster = resolveJoustRoster({
      players: input.players,
      teams: input.teams,
      activeTurnTeamId
    });

    const initialState: JoustRuntimeState = {
      activeTurnTeamId,
      arenaId,
      lineup: roster.lineup,
      teammates: roster.teammates,
      downPlayerIds: [],
      collapsedPerchIndices: [],
      previousShotGhost: null,
      // Everybody on the team shoots, so the turn is as long as the team is.
      shotsPerTurn: Math.max(1, roster.teammates.length * rules.shotsPerPlayer),
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
        toppledPlayerIds: [],
        collapsedPerchIndices: [],
        isRackCleared: false,
        points: 0
      };

      return advanceToNextShot({ ...state, shots: [...state.shots, forfeited] });
    }

    // Escape hatch (AGENTS.md §11): run the whole turn again — the rack back on
    // its feet, the towers back on their legs, and exactly the points this turn
    // banked handed back.
    if (actionType === "resetTurn") {
      return {
        state: {
          ...state,
          shotIndex: 0,
          phase: "aiming",
          aim: { ...SLACK_JOUST_AIM },
          downPlayerIds: [],
          collapsedPerchIndices: [],
          previousShotGhost: null,
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
