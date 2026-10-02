import type { MinigameType, MountPile, MountPlayerFigure, Player, Team } from "@wingnight/shared";
import { addMountHen, createMountPile, resolveMountClimbTicks, runMountClimb } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import {
  isMountLimbPayload,
  isMountRoundMemory,
  isMountRuntimeState,
  readMountTurnStamp,
  type MountTurnStamp
} from "./guards/index.js";
import { isMountRules, resolveMountRules } from "./rules/index.js";
import { resolveMountPoints, resolveShareBanked } from "./scoring/index.js";
import type { MountRuntimeClimb, MountRuntimeState } from "./types/index.js";
import { clonePile, resolveMountPhase, toMountDisplayView, toMountHostView } from "./views/index.js";

export const mountMinigameId: MinigameType = "MOUNT";

const toFigure = (player: Player, team: Team): MountPlayerFigure => {
  return {
    playerId: player.id,
    name: player.name,
    avatarSrc: player.avatarSrc ?? null,
    teamId: team.id,
    genre: team.genre ?? null
  };
};

// The active team's seating, as the figures the surfaces name, BRAWL's `resolveTeamFigures`. Only
// players the roster still lists count; an id with no player behind it is skipped.
const resolveTeamFigures = (
  teamId: string | null,
  players: readonly Player[],
  teams: readonly Team[]
): MountPlayerFigure[] => {
  const team = teamId === null ? undefined : teams.find((entry) => entry.id === teamId);

  if (team === undefined) {
    return [];
  }

  return team.playerIds.flatMap((playerId) => {
    const player = players.find((entry) => entry.id === playerId);

    return player === undefined ? [] : [toFigure(player, team)];
  });
};

/**
 * Every player the surfaces may have to draw a head on: this turn's climbers, and whoever is
 * already stuck on the pile from an earlier turn. A pile hen whose player has left the roster is
 * drawn as the house hen.
 */
const resolveFigures = (
  climbers: readonly MountPlayerFigure[],
  pile: MountPile,
  players: readonly Player[],
  teams: readonly Team[]
): Record<string, MountPlayerFigure> => {
  const figures: Record<string, MountPlayerFigure> = {};

  for (const hen of pile.hens) {
    const player = hen.playerId === null ? undefined : players.find((entry) => entry.id === hen.playerId);
    const team = player === undefined ? undefined : teams.find((entry) => entry.playerIds.includes(player.id));

    if (player !== undefined) {
      figures[player.id] =
        team === undefined
          ? { playerId: player.id, name: player.name, avatarSrc: player.avatarSrc ?? null, teamId: null, genre: null }
          : toFigure(player, team);
    }
  }

  for (const climber of climbers) {
    figures[climber.playerId] = { ...climber };
  }

  return figures;
};

const createReadyClimb = (player: MountPlayerFigure | null, climbIndex: number): MountRuntimeClimb => {
  return { climbIndex, player, status: "ready", climbTicks: null, inputs: [], skipped: false, result: null };
};

const rulesOf = (state: MountRuntimeState): { climbSeconds: number; secondsPerHen: number } => {
  return { climbSeconds: state.climbSeconds, secondsPerHen: state.secondsPerHen };
};

/**
 * Brings `climbIndex` into hand: its clock is fixed now, by the published rule, from the hens on
 * the pile as it stands. Past the last climb there is nothing to bring in.
 */
const bringIntoHand = (state: MountRuntimeState, climbIndex: number): MountRuntimeState => {
  const climbTicks = resolveMountClimbTicks(rulesOf(state), state.pile.hens.length);

  return {
    ...state,
    climbIndex,
    climbs: state.climbs.map((climb) => (climb.climbIndex === climbIndex ? { ...climb, climbTicks } : climb))
  };
};

/** True unless the stamp names another team's turn or a climb that is not the one in hand. */
const isStampForClimbInHand = (state: MountRuntimeState, stamp: MountTurnStamp): boolean => {
  return (
    (stamp.teamId === undefined || stamp.teamId === state.activeTurnTeamId) &&
    (stamp.climbIndex === undefined || stamp.climbIndex === state.climbIndex)
  );
};

const mutated = (state: MountRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

const replaceClimb = (state: MountRuntimeState, nextClimb: MountRuntimeClimb): MountRuntimeClimb[] => {
  return state.climbs.map((climb) => (climb.climbIndex === nextClimb.climbIndex ? nextClimb : climb));
};

/**
 * Rescores the turn from the climbs as they stand. Called after every climb so the room watches
 * the tally climb rather than learning it all at the end.
 */
const withTurnScore = (state: MountRuntimeState, pointsMax: number): MountRuntimeState => {
  if (state.activeTurnTeamId === null) {
    return state;
  }

  const points = resolveMountPoints(resolveShareBanked(state.climbs), state.climbsPerTurn, pointsMax);

  return {
    ...state,
    pendingPointsByTeamId: {
      ...state.pendingPointsByTeamId,
      [state.activeTurnTeamId]: state.turnStartPoints + points
    }
  };
};

// The climb is over and the tablet moves on to the next teammate, whose clock is read off the
// pile as the finished climb left it.
const finishClimb = (
  state: MountRuntimeState,
  climb: MountRuntimeClimb,
  pile: MountPile,
  pointsMax: number
): MountRuntimeState => {
  return withTurnScore(
    bringIntoHand({ ...state, climbs: replaceClimb(state, climb), pile }, climb.climbIndex + 1),
    pointsMax
  );
};

export const mountRuntimePlugin: MinigameRuntimePlugin = {
  id: "MOUNT",
  transientActionTypes: ["limb"],
  isRules: isMountRules,
  initialize: (input) => {
    const rules = resolveMountRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;
    const climbers = resolveTeamFigures(activeTurnTeamId, input.players, input.teams);
    // The round's pile as the team before this one left it, or the bare goose on the round's
    // first turn.
    const pile = isMountRoundMemory(input.roundMemory)
      ? clonePile(input.roundMemory.pile)
      : createMountPile(rules.pileSeed);
    // One climb per seated player, in roster order; a team with nobody seated still gets one
    // climb, with the house hen.
    const climbsPerTurn = Math.max(1, climbers.length);

    const initialState: MountRuntimeState = {
      activeTurnTeamId,
      climbSeconds: rules.climbSeconds,
      secondsPerHen: rules.secondsPerHen,
      climbsPerTurn,
      climbIndex: 0,
      climbs: Array.from({ length: climbsPerTurn }, (_unused, climbIndex) =>
        createReadyClimb(climbers[climbIndex] ?? null, climbIndex)
      ),
      pile,
      pileAtTurnStart: clonePile(pile),
      figures: resolveFigures(climbers, pile, input.players, input.teams),
      turnStartPoints:
        activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };

    return bringIntoHand(initialState, 0);
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isMountRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const phase = resolveMountPhase(state);
    const climb = state.climbs[state.climbIndex] ?? null;
    const isLive = climb !== null && (phase === "ready" || phase === "running");
    const { actionType, actionPayload } = input.envelope;

    // The fingers, as the tablet logged them, a batch every 70 ms. The server keeps the log and
    // nothing else: the climb is scored by re-running it, never by trusting a reported number. A
    // malformed batch is refused whole, never half-logged.
    if (actionType === "limb") {
      if (
        climb === null ||
        !isLive ||
        !isMountLimbPayload(actionPayload) ||
        !isStampForClimbInHand(state, actionPayload)
      ) {
        return unchanged;
      }

      const lastSample = climb.inputs[climb.inputs.length - 1];
      const firstSample = actionPayload.samples[0];

      // A log is non-decreasing, not strictly ascending: two fingers can land on one tick. An
      // earlier tick than the last is a duplicate delivery or a stale tablet, not a finger.
      if (lastSample !== undefined && firstSample !== undefined && firstSample.tick < lastSample.tick) {
        return unchanged;
      }

      return mutated({
        ...state,
        climbs: replaceClimb(state, {
          ...climb,
          status: "running",
          inputs: [...climb.inputs, ...actionPayload.samples.map((sample) => ({ ...sample }))]
        })
      });
    }

    const stamp = readMountTurnStamp(actionPayload);

    // The referee: the server re-runs the log itself, against the pile as it stands, and takes
    // its own reading. The tablet only ever says "that's the end of it" — never how it went.
    //
    // A climb nobody touched is refereed too (its hen stood still to the clock, banks nothing,
    // and still joins the pile where it stood), but only when the end names that climb: an
    // unstamped `endClimb` on a climb with no log is the previous climb's end delivered twice,
    // and refereeing it would end the next player's climb before they touched it.
    if (actionType === "endClimb") {
      if (climb === null || !isLive || stamp === null || !isStampForClimbInHand(state, stamp)) {
        return unchanged;
      }

      if (phase === "ready" && stamp.climbIndex === undefined) {
        return unchanged;
      }

      const refereed = runMountClimb(
        state.pile.seed,
        state.pile,
        rulesOf(state),
        climb.player?.playerId ?? null,
        climb.inputs
      );

      return mutated(
        finishClimb(
          state,
          {
            ...climb,
            status: "done",
            inputs: [],
            result: {
              outcome: refereed.outcome,
              endTick: refereed.endTick,
              share: refereed.share,
              bestHeight: refereed.bestHeight,
              falls: refereed.falls
            }
          },
          addMountHen(state.pile, refereed),
          input.pointsMax
        )
      );
    }

    // Escape hatch (AGENTS.md §11): forgive a climb the tablet can't take — a dead touch surface,
    // a player who would rather watch. It banks nothing, no hen joins the pile, and the tablet
    // moves on.
    if (actionType === "skipClimb") {
      if (climb === null || !isLive || stamp === null || !isStampForClimbInHand(state, stamp)) {
        return unchanged;
      }

      return mutated(
        finishClimb(
          state,
          { ...climb, status: "done", skipped: true, inputs: [], result: null },
          state.pile,
          input.pointsMax
        )
      );
    }

    // Escape hatch (AGENTS.md §11): put the whole team back on climb one. This turn's hens come
    // off the mountain, and exactly the points this turn banked are handed back.
    if (actionType === "resetTurn") {
      const reset: MountRuntimeState = {
        ...state,
        pile: clonePile(state.pileAtTurnStart),
        climbs: state.climbs.map((entry) => createReadyClimb(entry.player, entry.climbIndex)),
        pendingPointsByTeamId:
          state.activeTurnTeamId === null
            ? state.pendingPointsByTeamId
            : { ...state.pendingPointsByTeamId, [state.activeTurnTeamId]: state.turnStartPoints }
      };

      return mutated(bringIntoHand(reset, 0));
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isMountRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isMountRuntimeState(input.state)) {
      return null;
    }

    return toMountHostView(input.state);
  },
  selectDisplayView: (input) => {
    if (!isMountRuntimeState(input.state)) {
      return null;
    }

    return toMountDisplayView(input.state);
  },
  // The one thing a turn leaves for the next: the pile as it stands, which carries the high line.
  // Taken from the latest state, so an undone climb's hen, or a turn put back by a reset, leaves
  // the round's memory too.
  selectRoundMemory: (input) => {
    if (!isMountRuntimeState(input.state)) {
      return null;
    }

    return { pile: clonePile(input.state.pile) };
  }
};
