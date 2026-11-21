import type {
  BordenCrewMember,
  BordenFrame,
  BordenInput,
  BordenPlayerFigure,
  BordenStick,
  BordenStretch,
  CrewPad,
  Player,
  Team
} from "@wingnight/shared";
import {
  BORDEN_WORLD,
  advanceBorden,
  createBordenStart,
  resolveBordenHandoffBottles,
  resolveBordenPairs,
  resolveBordenStretch,
  toCastPlayerFigure
} from "@wingnight/shared";
import type {
  MinigameRuntimeActionEnvelope,
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import { isBordenJumpPayload, isBordenRuntimeState, isBordenStickPayload } from "./guards/index.js";
import { isBordenRules, resolveBordenRules } from "./rules/index.js";
import { resolveBordenBanked, resolveBordenPoints, resolveBordenTotal } from "./scoring/index.js";
import {
  BORDEN_PULSE_TICKS,
  BORDEN_READY_HOLD_MS,
  type BordenRuntimeState,
  type BordenRuntimeStretch
} from "./types/index.js";
import { toBordenDisplayView, toBordenHostView } from "./views/index.js";

// Base Borden, two hens at a time (docs/minigames/base-borden-spec.md §0.3, §0.5). Streets of
// Barrie's reducer in another uniform: nothing a phone sends carries a tick. Every action arrives
// with the room's `receivedAtMs`; the reducer turns it into a tick on the stretch's own clock,
// steps the stretch's frame to that tick, applies the thumb there and keeps the frame. That frame
// IS the room's reading of the stretch — there is no input log and no referee — and it is what
// every phone steps forward from. While the thumbs are quiet the room sends a `pulse` on its own
// clock, which is how a wipe or the gate is noticed with no phone reporting it.
//
// The crew is everyone who stepped out, in the order they did: their seats. When the first stretch
// starts the crew is locked and the pairs are dealt from it round-robin (`resolveBordenPairs`); a
// stretch's `pair` says which seat is which hen. Nobody stepped out is the tablet's game: one hen
// a stretch, the roster's players in turn, steered by the host's own thumbs.

// Milliseconds and ticks are converted by multiplying first and dividing once: 250 ms is tick 15
// exactly, where 250 / (1000 / 60) is 14.999… and floors to the tick before.
const TICK_HZ = BORDEN_WORLD.tickHz;

const resolveTicksIn = (elapsedMs: number): number => Math.floor((elapsedMs * TICK_HZ) / 1000);

/** The first millisecond of a tick, counted from the stretch's start. */
const resolveMsAt = (tick: number): number => Math.ceil((tick * 1000) / TICK_HZ);

// The active team's seating, as the figures the surfaces name. Only players the roster still lists
// count; an id with no player behind it is skipped.
const resolveTeamFigures = (
  teamId: string | null,
  players: readonly Player[],
  teams: readonly Team[]
): BordenPlayerFigure[] => {
  const team = teamId === null ? undefined : teams.find((entry) => entry.id === teamId);

  if (team === undefined) {
    return [];
  }

  return team.playerIds.flatMap((playerId) => {
    const player = players.find((entry) => entry.id === playerId);

    return player === undefined ? [] : [toCastPlayerFigure(player, team)];
  });
};

// The ground a stretch is run on, for the pair it has. Laid out again on every action that steps
// the stretch, so the last one is kept: the layout is a pure function of these three numbers.
let lastLayout: { key: string; stretch: BordenStretch } | null = null;

const resolveLayout = (courseSeed: number, stretchIndex: number, pair: number): BordenStretch => {
  const key = `${courseSeed}:${stretchIndex}:${pair}`;

  if (lastLayout === null || lastLayout.key !== key) {
    lastLayout = { key, stretch: resolveBordenStretch({ seed: courseSeed, stretch: stretchIndex, pair }) };
  }

  return lastLayout.stretch;
};

const createReadyStretch = (stretchIndex: number): BordenRuntimeStretch => {
  return {
    stretchIndex,
    status: "ready",
    pair: [0],
    bottles: [],
    startedAtMs: null,
    readyAtMs: null,
    frame: null,
    outcome: null,
    banked: 0,
    total: 0,
    skipped: false,
    stats: null
  };
};

const currentStretch = (state: BordenRuntimeState): BordenRuntimeStretch | null => {
  return state.stretches[state.stretchIndex] ?? null;
};

const replaceStretch = (state: BordenRuntimeState, next: BordenRuntimeStretch): BordenRuntimeStretch[] => {
  return state.stretches.map((stretch) => (stretch.stretchIndex === next.stretchIndex ? next : stretch));
};

/** The crew may still grow: the first stretch is on the line and nothing has been run or skipped. */
const isCrewOpen = (state: BordenRuntimeState): boolean => {
  return state.stretchIndex === 0 && state.stretches[0]?.status === "ready";
};

/**
 * Who runs each stretch, as seats: the round-robin pairs for the crew as it stands (never fewer
 * than one seat, so a crew still empty is shown a stretch for one), or on the tablet one hen a
 * stretch, the roster in turn.
 */
const resolvePairs = (state: BordenRuntimeState): number[][] => {
  const seats = Math.max(1, state.crew.length);

  if (state.tablet) {
    return state.stretches.map((stretch) => [stretch.stretchIndex % seats]);
  }

  return resolveBordenPairs(seats);
};

/**
 * Deals every stretch not yet run its pair, and prices it for that pair. A stretch that has started
 * keeps the pair and the kit it was dealt.
 */
const withPairs = (state: BordenRuntimeState): BordenRuntimeState => {
  const pairs = resolvePairs(state);

  return {
    ...state,
    stretches: state.stretches.map((stretch) => {
      if (stretch.status !== "ready") {
        return stretch;
      }

      const pair = pairs[stretch.stretchIndex] ?? [0];

      return { ...stretch, pair, total: resolveLayout(state.courseSeed, stretch.stretchIndex, pair.length).total };
    })
  };
};

/** Rescores the game from the stretches as they stand, at every stretch's end. */
const withTurnScore = (state: BordenRuntimeState, pointsMax: number): BordenRuntimeState => {
  if (state.activeTurnTeamId === null) {
    return state;
  }

  const points = resolveBordenPoints(resolveBordenBanked(state.stretches), resolveBordenTotal(state.stretches), pointsMax);

  return {
    ...state,
    pendingPointsByTeamId: {
      ...state.pendingPointsByTeamId,
      [state.activeTurnTeamId]: Math.min(pointsMax, Math.max(0, state.turnStartPoints + points))
    }
  };
};

const mutated = (state: BordenRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

/** The tick the stretch's clock reads at a moment on the room's, never behind the frame it has. */
const resolveTick = (stretch: BordenRuntimeStretch, frame: BordenFrame, atMs: number): number => {
  return Math.max(frame.tick, resolveTicksIn(atMs - (stretch.startedAtMs ?? atMs)));
};

/**
 * Nobody stepped out, and the host has started a stretch: it is the tablet's game from here on,
 * the roster's players one a stretch (the house hen for a team with no roster).
 */
const toTablet = (state: BordenRuntimeState): BordenRuntimeState => {
  const crew: BordenCrewMember[] =
    state.roster.length === 0
      ? [{ player: null, seat: 0 }]
      : state.roster.map((figure, seat) => ({ player: { ...figure }, seat }));

  return withPairs({ ...state, crew, tablet: true });
};

/** The stretch's first tick: its pair at the left edge with what they carried in. */
const startStretch = (state: BordenRuntimeState, stretch: BordenRuntimeStretch, atMs: number): BordenRuntimeStretch => {
  const layout = resolveLayout(state.courseSeed, stretch.stretchIndex, stretch.pair.length);

  return {
    ...stretch,
    status: "running",
    startedAtMs: atMs,
    frame: createBordenStart(layout, { bottles: stretch.bottles }),
    banked: 0,
    total: layout.total
  };
};

/**
 * The stretch over, cleared, wiped, skipped or at its cap: what it banked stays, the frame before
 * the last stretch's is let go, and the next stretch is on the line with the hot bottles handed on
 * through the gate and a beat to hold before a thumb of its pair may start it.
 */
const finishStretch = (
  state: BordenRuntimeState,
  done: BordenRuntimeStretch,
  atMs: number,
  pointsMax: number,
  options: { bottles: BordenRuntimeStretch["bottles"]; holdMs: number }
): BordenRuntimeState => {
  const nextIndex = done.stretchIndex + 1;
  const stretches = replaceStretch(state, done).map((stretch) => {
    if (stretch.stretchIndex === nextIndex) {
      return { ...stretch, bottles: [...options.bottles], readyAtMs: atMs + options.holdMs };
    }

    return stretch.stretchIndex < done.stretchIndex && stretch.frame !== null ? { ...stretch, frame: null } : stretch;
  });

  return withTurnScore({ ...state, stretches, stretchIndex: nextIndex }, pointsMax);
};

/**
 * The stretch with its frame stepped on. Still running, it carries the new frame and what it has
 * banked. Over, its hens' numbers are kept for the end card and the game moves to the next.
 */
const settleStretch = (
  state: BordenRuntimeState,
  stretch: BordenRuntimeStretch,
  frame: BordenFrame,
  atMs: number,
  pointsMax: number
): BordenRuntimeState => {
  if (frame.outcome === null) {
    return { ...state, stretches: replaceStretch(state, { ...stretch, frame, banked: frame.banked }) };
  }

  const done: BordenRuntimeStretch = {
    ...stretch,
    status: "done",
    frame,
    outcome: frame.outcome,
    banked: frame.banked,
    stats: frame.hens.map((hen) => ({ ...hen.stats }))
  };

  return finishStretch(state, done, atMs, pointsMax, {
    bottles: resolveBordenHandoffBottles(frame),
    holdMs: BORDEN_READY_HOLD_MS
  });
};

/**
 * Whose thumb this is, as a hen in the stretch: the face that sent it, if she is in the stretch's
 * pair, or on the tablet the host's own thumbs for its one hen.
 */
const resolveSlot = (state: BordenRuntimeState, stretch: BordenRuntimeStretch, actorPlayerId: string | undefined): number | null => {
  if (actorPlayerId === undefined) {
    return state.tablet ? 0 : null;
  }

  if (state.tablet) {
    return null;
  }

  const seat = state.crew.find((member) => member.player?.playerId === actorPlayerId)?.seat;
  const slot = seat === undefined ? -1 : stretch.pair.indexOf(seat);

  return slot < 0 ? null : slot;
};

type Thumb = { kind: "stick"; dir: BordenStick } | { kind: "jump" };

/** One thumb's change as the sim reads it, or null for a payload that is not one. */
const resolveThumb = (envelope: MinigameRuntimeActionEnvelope): Thumb | null => {
  if (envelope.actionType === "stick") {
    return isBordenStickPayload(envelope.actionPayload) ? { kind: "stick", dir: envelope.actionPayload.dir } : null;
  }

  return isBordenJumpPayload(envelope.actionPayload) ? { kind: "jump" } : null;
};

const toInput = (thumb: Thumb, tick: number, hen: number): BordenInput => {
  return thumb.kind === "stick" ? { tick, hen, kind: "stick", dir: thumb.dir } : { tick, hen, kind: "jump" };
};

const createInitialState = (
  base: Pick<BordenRuntimeState, "activeTurnTeamId" | "roster" | "stretchesPerTurn" | "courseSeed" | "turnStartPoints" | "pendingPointsByTeamId">
): BordenRuntimeState => {
  return withPairs({
    ...base,
    crew: [],
    tablet: false,
    stretchIndex: 0,
    stretches: Array.from({ length: base.stretchesPerTurn }, (_unused, stretchIndex) => createReadyStretch(stretchIndex))
  });
};

export const bordenRuntimePlugin: MinigameRuntimePlugin = {
  id: "BORDEN",
  // Playing is never the host's undo point: the thumbs, stepping out, and the room's own pulse.
  transientActionTypes: ["stick", "jump", "stepOut", "pulse"],
  // What a crew player's phone may send. Starting the first stretch, skipping and resetting stay
  // the host's (online, the room's).
  contestantActionTypes: ["stepOut", "stick", "jump"],
  isRules: isBordenRules,
  initialize: (input) => {
    const rules = resolveBordenRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;

    return createInitialState({
      activeTurnTeamId,
      roster: resolveTeamFigures(activeTurnTeamId, input.players, input.teams),
      stretchesPerTurn: rules.stretchesPerTurn,
      courseSeed: rules.courseSeed,
      turnStartPoints: activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    });
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isBordenRuntimeState(input.state)) {
      return unchanged;
    }

    const state: BordenRuntimeState = input.state;
    const stretch = currentStretch(state);
    const { actionType, receivedAtMs, actorPlayerId } = input.envelope;

    // Escape hatch (AGENTS.md §11): the whole base again from the fences, handing back exactly the
    // points this game banked. Everyone steps out again.
    if (actionType === "resetTurn") {
      return mutated(withTurnScore(createInitialState(state), input.pointsMax));
    }

    if (stretch === null || stretch.status === "done") {
      return unchanged;
    }

    // Escape hatch (AGENTS.md §11): forgive a stretch the room cannot take. It banks nothing —
    // whatever it had put down goes with it — and its pair hands nothing on. The next stretch is on
    // the line at once.
    if (actionType === "skipStretch") {
      const skipped: BordenRuntimeStretch = {
        ...stretch,
        status: "done",
        skipped: true,
        frame: null,
        banked: 0,
        outcome: null,
        stats: null
      };

      return mutated(finishStretch(state, skipped, receivedAtMs ?? 0, input.pointsMax, { bottles: [], holdMs: 0 }));
    }

    // Everything past here is on the stretch's clock, and a clock needs the room's reading.
    if (receivedAtMs === undefined) {
      return unchanged;
    }

    // Stepping out: a player on the team taps in while the first stretch is on the line. The order
    // they step out in is their seats. Nobody steps out twice, nobody past the base's four, and
    // nobody once the first stretch has gone.
    if (actionType === "stepOut") {
      const figure = state.roster.find((entry) => entry.playerId === actorPlayerId);
      const isOut = state.crew.some((member) => member.player?.playerId === actorPlayerId);

      if (!isCrewOpen(state) || state.tablet || figure === undefined || isOut || state.crew.length >= BORDEN_WORLD.maxPlayers) {
        return unchanged;
      }

      return mutated(withPairs({ ...state, crew: [...state.crew, { player: { ...figure }, seat: state.crew.length }] }));
    }

    // The host's Start. The first stretch waits for it; a later one can be started by it too (and
    // is, on the tablet, where there is no crew thumb to do it). With nobody stepped out the game is
    // the tablet's.
    if (actionType === "startStretch") {
      if (stretch.status !== "ready" || actorPlayerId !== undefined) {
        return unchanged;
      }

      const dealt = state.crew.length === 0 && !state.tablet ? toTablet(state) : state;
      const ready = currentStretch(dealt) ?? stretch;

      return mutated({ ...dealt, stretches: replaceStretch(dealt, startStretch(dealt, ready, receivedAtMs)) });
    }

    // The room's own step, while the thumbs are quiet.
    if (actionType === "pulse") {
      if (stretch.status !== "running" || stretch.frame === null) {
        return unchanged;
      }

      const layout = resolveLayout(state.courseSeed, stretch.stretchIndex, stretch.pair.length);
      const tick = resolveTick(stretch, stretch.frame, receivedAtMs);

      if (tick === stretch.frame.tick) {
        return unchanged;
      }

      return mutated(settleStretch(state, stretch, advanceBorden(stretch.frame, layout, [], tick), receivedAtMs, input.pointsMax));
    }

    if (actionType !== "stick" && actionType !== "jump") {
      return unchanged;
    }

    const thumb = resolveThumb(input.envelope);
    const slot = resolveSlot(state, stretch, actorPlayerId);

    if (thumb === null || slot === null) {
      return unchanged;
    }

    // From stretch two on, the first thumb of its pair after the beat has been held starts it.
    let live = stretch;

    if (stretch.status === "ready") {
      if (actorPlayerId === undefined || stretch.readyAtMs === null || receivedAtMs < stretch.readyAtMs) {
        return unchanged;
      }

      live = startStretch(state, stretch, receivedAtMs);
    }

    if (live.frame === null) {
      return unchanged;
    }

    const hen = live.frame.hens[slot];

    // A stick that says what the frame already has is a retry, not a change: nothing to step for.
    // A jump is a press, so it never repeats.
    if (thumb.kind === "stick" && hen !== undefined && hen.stick === thumb.dir && live === stretch) {
      return unchanged;
    }

    const layout = resolveLayout(state.courseSeed, live.stretchIndex, live.pair.length);
    const tick = resolveTick(live, live.frame, receivedAtMs);
    const caughtUp = advanceBorden(live.frame, layout, [], tick);
    // The thumb is stamped at the tick the stretch has reached and read by the step after it, so
    // the frame that goes out already has it: a phone never has to guess where a stick is.
    const stepped =
      caughtUp.outcome !== null
        ? caughtUp
        : advanceBorden(caughtUp, layout, [toInput(thumb, caughtUp.tick, slot)], caughtUp.tick + 1);

    return mutated(settleStretch(state, live, stepped, receivedAtMs, input.pointsMax));
  },
  // Every player on the team, while a stretch is on the line or being run: who has stepped out, and
  // for the stretch's pair each hen's hearts and state as her player's phone shows them. A crew
  // player waiting for her stretch is `out` here; the view's `crew` and `pair` say she is next.
  selectCrew: (input) => {
    if (!isBordenRuntimeState(input.state)) {
      return null;
    }

    const state: BordenRuntimeState = input.state;
    const stretch = currentStretch(state);

    if (stretch === null || stretch.status === "done") {
      return null;
    }

    const pads: Record<string, CrewPad> = {};

    for (const figure of state.roster) {
      const member = state.tablet ? undefined : state.crew.find((entry) => entry.player?.playerId === figure.playerId);
      const slot = member === undefined ? -1 : stretch.pair.indexOf(member.seat);
      const hen = slot < 0 ? undefined : stretch.frame?.hens[slot];

      pads[figure.playerId] =
        member === undefined || slot < 0
          ? { state: "out", slot: null, hearts: 0 }
          : { state: hen?.state ?? "up", slot: member.seat, hearts: hen?.hearts ?? BORDEN_WORLD.heartsMax };
    }

    return { status: stretch.status, playerIds: state.roster.map((figure) => figure.playerId), pads };
  },
  // The room steps the stretch itself half a second past the frame it holds. A thumb arriving first
  // moves the frame and this with it, so a pulse only ever lands in a lull.
  selectDeadlineAction: (input) => {
    if (!isBordenRuntimeState(input.state)) {
      return null;
    }

    const stretch = currentStretch(input.state);

    if (stretch === null || stretch.status !== "running" || stretch.frame === null || stretch.startedAtMs === null) {
      return null;
    }

    return {
      actionType: "pulse",
      atMs: stretch.startedAtMs + resolveMsAt(stretch.frame.tick + BORDEN_PULSE_TICKS)
    };
  },
  syncPendingPoints: (input) => {
    if (!isBordenRuntimeState(input.state)) {
      return input.state;
    }

    return { ...input.state, pendingPointsByTeamId: { ...input.pendingPointsByTeamId } };
  },
  selectHostView: (input) => {
    return isBordenRuntimeState(input.state) ? toBordenHostView(input.state) : null;
  },
  selectDisplayView: (input) => {
    return isBordenRuntimeState(input.state) ? toBordenDisplayView(input.state) : null;
  }
};
