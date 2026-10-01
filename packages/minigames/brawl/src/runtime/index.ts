import type { BrawlBestTurn, BrawlInput, BrawlPlayerFigure, MinigameType, Player, Team } from "@wingnight/shared";
import { runBrawlRun } from "@wingnight/shared";
import type {
  MinigameRuntimePlugin,
  MinigameRuntimeReductionResult,
  SerializableValue
} from "@wingnight/minigames-core";

import {
  isBrawlPeckPayload,
  isBrawlRoundMemory,
  isBrawlRuntimeState,
  isBrawlWalkPayload
} from "./guards/index.js";
import { isBrawlRules, resolveBrawlRules } from "./rules/index.js";
import { resolveBrawlPoints, resolveGoonsDown, resolveGoonsTotal } from "./scoring/index.js";
import type { BrawlRuntimeBlock, BrawlRuntimeRules, BrawlRuntimeState } from "./types/index.js";
import { cloneBestTurn, resolveBrawlPhase, toBrawlDisplayView, toBrawlHostView } from "./views/index.js";

export const brawlMinigameId: MinigameType = "BRAWL";

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

const createReadyBlock = (
  figures: readonly BrawlPlayerFigure[],
  blockIndex: number
): BrawlRuntimeBlock => {
  return {
    blockIndex,
    // The roster cycles, so a short team's first player fights again rather than the team taking
    // fewer blocks of the street than everyone else.
    player: figures.length === 0 ? null : (figures[blockIndex % figures.length] ?? null),
    status: "ready",
    inputs: [],
    skipped: false,
    result: null
  };
};

const createBlocks = (
  figures: readonly BrawlPlayerFigure[],
  rules: BrawlRuntimeRules
): BrawlRuntimeBlock[] => {
  return Array.from({ length: rules.blocksPerTurn }, (_unused, blockIndex) => {
    return createReadyBlock(figures, blockIndex);
  });
};

/**
 * This turn as a turn to beat, once it is over: what the whole team put down. Null while the
 * team is still on the street, and null for a turn that put nothing down — nought is nobody's
 * number to beat.
 */
const resolveTurnAsBest = (state: BrawlRuntimeState): BrawlBestTurn | null => {
  const goons = resolveGoonsDown(state.blocks);

  if (resolveBrawlPhase(state) !== "finished" || state.activeTurnTeamId === null || goons <= 0) {
    return null;
  }

  return { teamId: state.activeTurnTeamId, teamName: state.activeTurnTeamName, goons };
};

/**
 * The turn to beat is the finished turn that put down the most worth; a tie keeps the one that
 * stood first, because a target should not move for a draw.
 */
const pickBestTurn = (
  standing: BrawlBestTurn | null,
  challenger: BrawlBestTurn | null
): BrawlBestTurn | null => {
  if (challenger === null) {
    return standing;
  }

  return standing === null || challenger.goons > standing.goons ? challenger : standing;
};

// One thumb's action as a log entry, or null for a payload that is not one.
const resolveInput = (actionType: "walk" | "peck", actionPayload: SerializableValue): BrawlInput | null => {
  if (actionType === "walk") {
    return isBrawlWalkPayload(actionPayload)
      ? { tick: actionPayload.tick, kind: "walk", dir: actionPayload.dir }
      : null;
  }

  return isBrawlPeckPayload(actionPayload) ? { tick: actionPayload.tick, kind: "peck" } : null;
};

const mutated = (state: BrawlRuntimeState): MinigameRuntimeReductionResult => {
  return { state, didMutate: true };
};

const currentBlock = (state: BrawlRuntimeState): BrawlRuntimeBlock | null => {
  return state.blocks[state.blockIndex] ?? null;
};

const replaceBlock = (
  state: BrawlRuntimeState,
  blockIndex: number,
  nextBlock: BrawlRuntimeBlock
): BrawlRuntimeBlock[] => {
  return state.blocks.map((block) => (block.blockIndex === blockIndex ? nextBlock : block));
};

/**
 * Rescores the turn from the blocks as they stand. Called after every block so the room watches
 * the tally climb rather than learning it all at the end.
 */
const withTurnScore = (state: BrawlRuntimeState, pointsMax: number): BrawlRuntimeState => {
  if (state.activeTurnTeamId === null) {
    return state;
  }

  const points = resolveBrawlPoints(
    resolveGoonsDown(state.blocks),
    resolveGoonsTotal(state.courseSeed, state.blocksPerTurn),
    pointsMax
  );

  return {
    ...state,
    pendingPointsByTeamId: {
      ...state.pendingPointsByTeamId,
      [state.activeTurnTeamId]: Math.min(pointsMax, Math.max(0, state.turnStartPoints + points))
    }
  };
};

// The block is over and the tablet moves on to the next teammate. A block only ever happens once:
// there is no second go at a stretch of street.
const finishBlock = (
  state: BrawlRuntimeState,
  block: BrawlRuntimeBlock,
  pointsMax: number
): BrawlRuntimeState => {
  return withTurnScore(
    {
      ...state,
      blocks: replaceBlock(state, block.blockIndex, block),
      blockIndex: block.blockIndex + 1
    },
    pointsMax
  );
};

export const brawlRuntimePlugin: MinigameRuntimePlugin = {
  id: "BRAWL",
  transientActionTypes: ["walk", "peck"],
  isRules: isBrawlRules,
  initialize: (input) => {
    const rules = resolveBrawlRules(input.rules);
    const activeTurnTeamId = input.activeRoundTeamId ?? input.teamIds[0] ?? null;
    const figures = resolveTeamFigures(activeTurnTeamId, input.players, input.teams);
    // The turn to beat, if a team before this one has set one. Fixed for the whole turn.
    const bestTurn = isBrawlRoundMemory(input.roundMemory)
      ? cloneBestTurn(input.roundMemory.bestTurn)
      : null;

    const initialState: BrawlRuntimeState = {
      activeTurnTeamId,
      activeTurnTeamName: input.teams.find((team) => team.id === activeTurnTeamId)?.name ?? null,
      blocksPerTurn: rules.blocksPerTurn,
      courseSeed: rules.courseSeed,
      blockIndex: 0,
      blocks: createBlocks(figures, rules),
      turnStartPoints:
        activeTurnTeamId === null ? 0 : (input.pendingPointsByTeamId[activeTurnTeamId] ?? 0),
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId },
      bestTurn
    };

    return initialState;
  },
  reduceAction: (input) => {
    const unchanged = { state: input.state, didMutate: false };

    if (!isBrawlRuntimeState(input.state)) {
      return unchanged;
    }

    const state = input.state;
    const phase = resolveBrawlPhase(state);
    const block = currentBlock(state);
    const isLive = phase === "ready" || phase === "running";
    const { actionType, actionPayload } = input.envelope;

    // The two thumbs, as the tablet logged them. The left one walks (`dir` −1 or 1 while held,
    // nought when it lifts); the right one pecks. The server keeps the log and nothing else: the
    // block is scored by re-running it, never by trusting a reported number.
    if (actionType === "walk" || actionType === "peck") {
      const entry = resolveInput(actionType, actionPayload);

      if (block === null || !isLive || entry === null) {
        return unchanged;
      }

      const lastInput = block.inputs[block.inputs.length - 1];

      // A log is non-decreasing, NOT strictly ascending as SCHLONIC's is: two thumbs can land on
      // the same tick, so a walk and a peck may share one and the sim reads both. An earlier tick
      // than the last is a duplicate delivery or a stale tablet, not a finger.
      if (lastInput !== undefined && entry.tick < lastInput.tick) {
        return unchanged;
      }

      return mutated({
        ...state,
        blocks: replaceBlock(state, block.blockIndex, {
          ...block,
          status: "running",
          inputs: [...block.inputs, entry]
        })
      });
    }

    // The referee: the server re-runs the log itself, on the block's own stretch of the street,
    // and takes its own reading. The tablet only ever says "that's the end of it" — never how it
    // went, and never what it scored. A block nobody has touched has not started.
    if (actionType === "endBlock") {
      if (block === null || phase !== "running") {
        return unchanged;
      }

      const refereed = runBrawlRun(
        { seed: state.courseSeed, blocks: state.blocksPerTurn, block: block.blockIndex },
        block.inputs
      );

      return mutated(
        finishBlock(
          state,
          {
            ...block,
            status: "done",
            result: {
              // `runBrawlRun` always runs to a terminal frame; `running` would be a sim bug, and
              // the bell is the honest reading of a block that never ended.
              outcome: refereed.outcome === "running" ? "timeout" : refereed.outcome,
              endTick: refereed.endTick,
              goons: refereed.goons,
              hearts: refereed.frame.hearts
            }
          },
          input.pointsMax
        )
      );
    }

    // Escape hatch (AGENTS.md §11): forgive a block the tablet can't take — a dead touch surface,
    // a player who would rather watch. It banks nothing and the tablet moves on.
    if (actionType === "skipBlock") {
      if (block === null || !isLive) {
        return unchanged;
      }

      return mutated(
        finishBlock(
          state,
          { ...block, status: "done", skipped: true, inputs: [], result: null },
          input.pointsMax
        )
      );
    }

    // Escape hatch (AGENTS.md §11): put the whole team back on block one, handing back exactly
    // the points this turn banked. The turn to beat is untouched: it was never this turn's, and a
    // turn put back on the street is no longer finished, so it leaves the memory of its own accord.
    if (actionType === "resetTurn") {
      const reset: BrawlRuntimeState = {
        ...state,
        blockIndex: 0,
        blocks: state.blocks.map((entry) =>
          createReadyBlock(entry.player === null ? [] : [entry.player], entry.blockIndex)
        )
      };

      return mutated(withTurnScore(reset, input.pointsMax));
    }

    return unchanged;
  },
  syncPendingPoints: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return input.state;
    }

    return {
      ...input.state,
      pendingPointsByTeamId: { ...input.pendingPointsByTeamId }
    };
  },
  selectHostView: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return null;
    }

    return toBrawlHostView(input.state);
  },
  selectDisplayView: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return null;
    }

    return toBrawlDisplayView(input.state);
  },
  // The one thing a turn leaves for the next: the turn to beat — the one it inherited, or its own
  // now that it is over, whichever put down more. Taken from the latest state, so a turn put back
  // on the street by a reset is not handed on.
  selectRoundMemory: (input) => {
    if (!isBrawlRuntimeState(input.state)) {
      return null;
    }

    return {
      bestTurn: cloneBestTurn(pickBestTurn(input.state.bestTurn, resolveTurnAsBest(input.state)))
    };
  }
};
