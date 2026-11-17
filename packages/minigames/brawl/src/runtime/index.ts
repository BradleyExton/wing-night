import type {
  BrawlBestTurn,
  BrawlCrewBlock,
  BrawlCrewFrame,
  BrawlCrewMember,
  BrawlCrewWalk,
  BrawlPlayerFigure,
  CrewPad,
  Player,
  Team
} from "@wingnight/shared";
import {
  BRAWL_CREW_WORLD,
  advanceBrawlCrew,
  createBrawlCrewStart,
  resolveBrawlCrewBlock,
  toCastPlayerFigure
} from "@wingnight/shared";
import type {
  MinigameRuntimeActionEnvelope,
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult
} from "@wingnight/minigames-core";

import {
  isBrawlPeckPayload,
  isBrawlRoundMemory,
  isBrawlRuntimeState,
  isBrawlWalkPayload
} from "./guards/index.js";
import { isBrawlRules, resolveBrawlRules } from "./rules/index.js";
import { resolveBrawlBanked, resolveBrawlPoints, resolveBrawlTotal } from "./scoring/index.js";
import {
  BRAWL_PULSE_TICKS,
  BRAWL_READY_HOLD_MS,
  type BrawlRuntimeBlock,
  type BrawlRuntimeState
} from "./types/index.js";
import { cloneBestTurn, resolveBrawlPhase, toBrawlDisplayView, toBrawlHostView } from "./views/index.js";

// Streets of Barrie, the whole team at once (docs/minigames/brawl-crew-spec.md §0.5). The reducer
// is the sequencer: nothing a pad sends carries a tick. Every action arrives with the server's
// `receivedAtMs`; the reducer turns it into a tick on the block's own clock, steps the block's
// frame to that tick, applies the thumb there and keeps the frame. That frame IS the server's
// reading of the fight — there is no input log and no referee — and it is what every screen steps
// forward from. While the thumbs are quiet the server sends a `pulse` on its own clock, which is
// how a wave going down or the bell is noticed with no device reporting it.

// Milliseconds and ticks are converted by multiplying first and dividing once: 250 ms is tick 15
// exactly, where 250 / (1000 / 60) is 14.999… and floors to the tick before.
const TICK_HZ = BRAWL_CREW_WORLD.tickHz;

const resolveTicksIn = (elapsedMs: number): number => Math.floor((elapsedMs * TICK_HZ) / 1000);

/** The first millisecond of a tick, counted from the block's start. */
const resolveMsAt = (tick: number): number => Math.ceil((tick * 1000) / TICK_HZ);

// The active team's seating, as the figures the surfaces name. Only players the roster still
// lists count; an id with no player behind it is skipped.
const resolveTeamFigures = (
  teamId: string | null,
  players: readonly Player[],
  teams: readonly Team[]
): BrawlPlayerFigure[] => {
  const team = teamId === null ? undefined : teams.find((entry) => entry.id === teamId);

  if (team === undefined) {
    return [];
  }

  return team.playerIds.flatMap((playerId) => {
    const player = players.find((entry) => entry.id === playerId);

    return player === undefined ? [] : [toCastPlayerFigure(player, team)];
  });
};

// The street a block is fought on, for the crew it has. Laid out again on every action that steps
// the fight, so the last one is kept: the layout is a pure function of these four numbers.
let lastLayout: { key: string; block: BrawlCrewBlock } | null = null;

const resolveLayout = (state: Pick<BrawlRuntimeState, "courseSeed" | "blocksPerTurn">, block: number, crew: number): BrawlCrewBlock => {
  const key = `${state.courseSeed}:${state.blocksPerTurn}:${block}:${crew}`;

  if (lastLayout === null || lastLayout.key !== key) {
    lastLayout = {
      key,
      block: resolveBrawlCrewBlock({ seed: state.courseSeed, blocks: state.blocksPerTurn, block, crew })
    };
  }

  return lastLayout.block;
};

const createReadyBlock = (blockIndex: number, crew: BrawlCrewMember[] = [], readyAtMs: number | null = null): BrawlRuntimeBlock => {
  return {
    blockIndex,
    status: "ready",
    tablet: false,
    crew,
    crewSize: null,
    startedAtMs: null,
    readyAtMs,
    frame: null,
    outcome: null,
    banked: 0,
    total: 0,
    skipped: false,
    stats: null
  };
};

const currentBlock = (state: BrawlRuntimeState): BrawlRuntimeBlock | null => {
  return state.blocks[state.blockIndex] ?? null;
};

const replaceBlock = (state: BrawlRuntimeState, nextBlock: BrawlRuntimeBlock): BrawlRuntimeBlock[] => {
  return state.blocks.map((block) => (block.blockIndex === nextBlock.blockIndex ? nextBlock : block));
};

/**
 * What each block not yet fought would be dealt, for the crew as it stands: the block in hand for
 * the hens who have stepped out, the ones after it for the same crew (it carries over), and never
 * for fewer than one — the tablet's own hen. A block that has started keeps the kit it was dealt.
 */
const withTotals = (state: BrawlRuntimeState): BrawlRuntimeState => {
  const standing = Math.max(1, currentBlock(state)?.crew.length ?? 1);

  return {
    ...state,
    blocks: state.blocks.map((block) => {
      if (block.status !== "ready") {
        return block;
      }

      const total = resolveLayout(state, block.blockIndex, Math.max(1, block.crew.length || standing)).total;

      return total === block.total ? block : { ...block, total };
    })
  };
};

/** Rescores the turn from the blocks as they stand, at every block's end. */
const withTurnScore = (state: BrawlRuntimeState, pointsMax: number): BrawlRuntimeState => {
  if (state.activeTurnTeamId === null) {
    return state;
  }

  const points = resolveBrawlPoints(resolveBrawlBanked(state.blocks), resolveBrawlTotal(state.blocks), pointsMax);

  return {
    ...state,
    pendingPointsByTeamId: {
      ...state.pendingPointsByTeamId,
      [state.activeTurnTeamId]: Math.min(pointsMax, Math.max(0, state.turnStartPoints + points))
    }
  };
};

/**
 * This turn as a turn to beat, once it is over. Null while the team is still on the street, and
 * null for a turn that banked nothing — nought is nobody's number to beat.
 */
const resolveTurnAsBest = (state: BrawlRuntimeState): BrawlBestTurn | null => {
  const banked = resolveBrawlBanked(state.blocks);

  if (resolveBrawlPhase(state) !== "finished" || state.activeTurnTeamId === null || banked <= 0) {
    return null;
  }

  return {
    teamId: state.activeTurnTeamId,
    teamName: state.activeTurnTeamName,
    banked,
    total: Math.max(1, resolveBrawlTotal(state.blocks))
  };
};

/**
 * The turn to beat is the one that banked the biggest share of its own street — a crew of five is
 * dealt more than a crew of three, so the sums cannot be compared. A tie keeps the one that stood
 * first: a target should not move for a draw. Cross-multiplied, so it is a comparison of integers.
 */
const pickBestTurn = (standing: BrawlBestTurn | null, challenger: BrawlBestTurn | null): BrawlBestTurn | null => {
  if (challenger === null) {
    return standing;
  }

  return standing === null || challenger.banked * standing.total > standing.banked * challenger.total
    ? challenger
    : standing;
};

const mutated = (state: BrawlRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

/** The tick the block's clock reads at a moment on the server's, never behind the frame it has. */
const resolveTick = (block: BrawlRuntimeBlock, frame: BrawlCrewFrame, atMs: number): number => {
  return Math.max(frame.tick, resolveTicksIn(atMs - (block.startedAtMs ?? atMs)));
};

/**
 * The block's first tick: the crew that stepped out, or — nobody did — the tablet's own hen, the
 * roster's player for this block as the relay dealt them. Its size is locked and its street dealt.
 */
const startBlock = (state: BrawlRuntimeState, block: BrawlRuntimeBlock, atMs: number): BrawlRuntimeBlock => {
  const isTablet = block.crew.length === 0;
  const crew: BrawlCrewMember[] = isTablet
    ? [{ player: state.roster.length === 0 ? null : (state.roster[block.blockIndex % state.roster.length] ?? null), slot: 0 }]
    : block.crew;
  const layout = resolveLayout(state, block.blockIndex, crew.length);

  return {
    ...block,
    status: "running",
    tablet: isTablet,
    crew,
    crewSize: crew.length,
    startedAtMs: atMs,
    frame: createBrawlCrewStart(layout),
    banked: 0,
    total: layout.total
  };
};

/**
 * The block with its fight stepped on. Still running, it carries the new frame and what it has
 * banked. Over — cleared, wiped or at the bell — it is done: what it banked stays, its hens'
 * numbers are kept for the card, the frame before the last block's is let go, and the next block
 * is on the line with the same crew (a tablet's block hands on to the next player instead) and a
 * beat to hold before a thumb may start it.
 */
const settleBlock = (
  state: BrawlRuntimeState,
  block: BrawlRuntimeBlock,
  frame: BrawlCrewFrame,
  atMs: number,
  pointsMax: number
): BrawlRuntimeState => {
  if (frame.outcome === null) {
    return { ...state, blocks: replaceBlock(state, { ...block, frame, banked: frame.banked }) };
  }

  const done: BrawlRuntimeBlock = {
    ...block,
    status: "done",
    frame,
    outcome: frame.outcome,
    banked: frame.banked,
    stats: frame.hens.map((hen) => ({ ...hen.stats }))
  };

  return finishBlock(state, done, atMs, pointsMax);
};

const finishBlock = (state: BrawlRuntimeState, done: BrawlRuntimeBlock, atMs: number, pointsMax: number): BrawlRuntimeState => {
  const nextIndex = done.blockIndex + 1;
  const carried = done.tablet ? [] : done.crew;
  const blocks = replaceBlock(state, done).map((block) => {
    if (block.blockIndex === nextIndex) {
      return createReadyBlock(nextIndex, carried, atMs + BRAWL_READY_HOLD_MS);
    }

    return block.blockIndex < done.blockIndex && block.frame !== null ? { ...block, frame: null } : block;
  });

  return withTurnScore(withTotals({ ...state, blocks, blockIndex: nextIndex }), pointsMax);
};

/** Whose thumb this is, as a slot in the block's crew: the face that sent it, or the tablet's own hen. */
const resolveSlot = (block: BrawlRuntimeBlock, actorPlayerId: string | undefined): number | null => {
  if (actorPlayerId === undefined) {
    return block.tablet ? 0 : null;
  }

  if (block.tablet) {
    return null;
  }

  return block.crew.find((member) => member.player?.playerId === actorPlayerId)?.slot ?? null;
};

type Thumb = { kind: "walk"; dir: BrawlCrewWalk } | { kind: "peck"; held: boolean };

/** One thumb's change as the sim reads it, or null for a payload that is not one. */
const resolveThumb = (envelope: MinigameRuntimeActionEnvelope): Thumb | null => {
  if (envelope.actionType === "walk") {
    return isBrawlWalkPayload(envelope.actionPayload) ? { kind: "walk", dir: envelope.actionPayload.dir } : null;
  }

  return isBrawlPeckPayload(envelope.actionPayload) ? { kind: "peck", held: envelope.actionPayload.held } : null;
};

export const brawlRuntimePlugin: MinigameRuntimePlugin = {
  id: "BRAWL",
  // Playing is never the host's undo point: the thumbs, stepping out, and the server's own pulse.
  transientActionTypes: ["walk", "peck", "stepOut", "pulse"],
  // What a crew player's phone may send. Starting block one, skipping and resetting stay the host's.
  contestantActionTypes: ["stepOut", "walk", "peck"],
  isRules: isBrawlRules,
  initialize: (input) => {
    const rules = resolveBrawlRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;
    // The turn to beat, if a team before this one has set one. Fixed for the whole turn.
    const bestTurn = isBrawlRoundMemory(input.roundMemory) ? cloneBestTurn(input.roundMemory.bestTurn) : null;

    const initialState: BrawlRuntimeState = withTotals({
      activeTurnTeamId,
      activeTurnTeamName: input.teams.find((team) => team.id === activeTurnTeamId)?.name ?? null,
      roster: resolveTeamFigures(activeTurnTeamId, input.players, input.teams),
      blocksPerTurn: rules.blocksPerTurn,
      courseSeed: rules.courseSeed,
      blockIndex: 0,
      blocks: Array.from({ length: rules.blocksPerTurn }, (_unused, blockIndex) => createReadyBlock(blockIndex)),
      turnStartPoints: activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId },
      bestTurn
    });

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isBrawlRuntimeState(input.state)) {
      return unchanged;
    }

    const state: BrawlRuntimeState = input.state;
    const block = currentBlock(state);
    const { actionType, receivedAtMs, actorPlayerId } = input.envelope;

    // Escape hatch (AGENTS.md §11): the whole team back on block one, handing back exactly the
    // points this turn banked. Everyone steps out again.
    if (actionType === "resetTurn") {
      return mutated(
        withTurnScore(
          withTotals({
            ...state,
            blockIndex: 0,
            blocks: state.blocks.map((entry) => createReadyBlock(entry.blockIndex))
          }),
          input.pointsMax
        )
      );
    }

    if (block === null || block.status === "done") {
      return unchanged;
    }

    // Escape hatch (AGENTS.md §11): forgive a block the room cannot take. It banks nothing —
    // whatever it had put down goes with it — and the next block is on the line at once.
    if (actionType === "skipBlock") {
      const skipped: BrawlRuntimeBlock = { ...block, status: "done", skipped: true, frame: null, banked: 0, outcome: null };
      const next = finishBlock(state, skipped, receivedAtMs ?? 0, input.pointsMax);

      // No beat to hold after a skip: the block after it may start the moment a thumb says so.
      return mutated({
        ...next,
        blocks: next.blocks.map((entry) => (entry.blockIndex === skipped.blockIndex + 1 ? { ...entry, readyAtMs: receivedAtMs ?? 0 } : entry))
      });
    }

    // Everything past here is on the block's clock, and a clock needs the server's reading.
    if (receivedAtMs === undefined) {
      return unchanged;
    }

    // Stepping out: a player on the team taps in while the block is on the line, and her hen
    // walks onto the street. The order they step out in is their slots. Nobody steps out twice,
    // and nobody steps out of a fight that has started.
    if (actionType === "stepOut") {
      const figure = state.roster.find((entry) => entry.playerId === actorPlayerId);
      const isOut = block.crew.some((member) => member.player?.playerId === actorPlayerId);

      if (block.status !== "ready" || figure === undefined || isOut || block.crew.length >= BRAWL_CREW_WORLD.maxCrew) {
        return unchanged;
      }

      return mutated(
        withTotals({
          ...state,
          blocks: replaceBlock(state, { ...block, crew: [...block.crew, { player: figure, slot: block.crew.length }] })
        })
      );
    }

    // The host's Start. Block one waits for it; a later block can be started by it too (and is,
    // on the tablet, where there is no crew thumb to do it). With nobody stepped out the block is
    // the tablet's own.
    if (actionType === "startBlock") {
      if (block.status !== "ready" || actorPlayerId !== undefined) {
        return unchanged;
      }

      return mutated({ ...state, blocks: replaceBlock(state, startBlock(state, block, receivedAtMs)) });
    }

    // The server's own step, while the thumbs are quiet.
    if (actionType === "pulse") {
      if (block.status !== "running" || block.frame === null || block.crewSize === null) {
        return unchanged;
      }

      const layout = resolveLayout(state, block.blockIndex, block.crewSize);
      const tick = resolveTick(block, block.frame, receivedAtMs);

      if (tick === block.frame.tick) {
        return unchanged;
      }

      return mutated(settleBlock(state, block, advanceBrawlCrew(block.frame, layout, [], tick), receivedAtMs, input.pointsMax));
    }

    if (actionType !== "walk" && actionType !== "peck") {
      return unchanged;
    }

    const thumb = resolveThumb(input.envelope);

    if (thumb === null) {
      return unchanged;
    }

    // From block two on, the first crew thumb after the beat has been held starts the block.
    let live = block;

    if (block.status === "ready") {
      const isCrewThumb = actorPlayerId !== undefined && block.crew.some((member) => member.player?.playerId === actorPlayerId);

      if (!isCrewThumb || block.readyAtMs === null || receivedAtMs < block.readyAtMs) {
        return unchanged;
      }

      live = startBlock(state, block, receivedAtMs);
    }

    const slot = resolveSlot(live, actorPlayerId);

    if (slot === null || live.frame === null || live.crewSize === null) {
      return unchanged;
    }

    const hen = live.frame.hens[slot];
    const isRepeat = hen !== undefined && (thumb.kind === "walk" ? hen.walk === thumb.dir : hen.peckHeld === thumb.held);

    // A thumb that says what the frame already has is a retry, not a change: nothing to step for.
    if (isRepeat && live === block) {
      return unchanged;
    }

    const layout = resolveLayout(state, live.blockIndex, live.crewSize);
    const tick = resolveTick(live, live.frame, receivedAtMs);
    const caughtUp = advanceBrawlCrew(live.frame, layout, [], tick);
    // The thumb is stamped at the tick the fight has reached and read by the step after it, so
    // the frame that goes out already has it: a screen never has to guess where a stick is.
    const stepped =
      caughtUp.outcome !== null
        ? caughtUp
        : advanceBrawlCrew(caughtUp, layout, [{ ...thumb, tick: caughtUp.tick, hen: slot }], caughtUp.tick + 1);

    return mutated(settleBlock(state, live, stepped, receivedAtMs, input.pointsMax));
  },
  // Every player on the team, while a block is on the line or being fought: who has stepped out,
  // and each hen's hearts and state as her player's phone shows them.
  selectCrew: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return null;
    }

    const state: BrawlRuntimeState = input.state;
    const block = currentBlock(state);

    if (block === null || block.status === "done") {
      return null;
    }

    const pads: Record<string, CrewPad> = {};

    for (const figure of state.roster) {
      const member = block.tablet ? undefined : block.crew.find((entry) => entry.player?.playerId === figure.playerId);
      const hen = member === undefined ? undefined : block.frame?.hens[member.slot];

      pads[figure.playerId] =
        member === undefined
          ? { state: "out", slot: null, hearts: 0 }
          : { state: hen?.state ?? "up", slot: member.slot, hearts: hen?.hearts ?? BRAWL_CREW_WORLD.heartsMax };
    }

    return { status: block.status, playerIds: state.roster.map((figure) => figure.playerId), pads };
  },
  // The server steps the fight itself half a second past the frame it holds. A thumb arriving
  // first moves the frame and this with it, so a pulse only ever lands in a lull.
  selectDeadlineAction: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return null;
    }

    const block = currentBlock(input.state);

    if (block === null || block.status !== "running" || block.frame === null || block.startedAtMs === null) {
      return null;
    }

    return {
      actionType: "pulse",
      atMs: block.startedAtMs + resolveMsAt(block.frame.tick + BRAWL_PULSE_TICKS)
    };
  },
  syncPendingPoints: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return input.state;
    }

    return { ...input.state, pendingPointsByTeamId: { ...input.pendingPointsByTeamId } };
  },
  selectHostView: (input) => {
    return isBrawlRuntimeState(input.state) ? toBrawlHostView(input.state) : null;
  },
  selectDisplayView: (input) => {
    return isBrawlRuntimeState(input.state) ? toBrawlDisplayView(input.state) : null;
  },
  // The one thing a turn leaves for the next: the turn to beat — the one it inherited, or its own
  // now that it is over, whichever banked the bigger share.
  selectRoundMemory: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return null;
    }

    return { bestTurn: cloneBestTurn(pickBestTurn(input.state.bestTurn, resolveTurnAsBest(input.state))) };
  }
};
