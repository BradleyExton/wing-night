import { isDeepStrictEqual } from "node:util";

import {
  Phase,
  SPECTATOR_BET_REFUSAL_REASONS,
  SPECTATOR_BET_STATUSES,
  resolveSpectatorBetLine,
  resolveSpectatorBetOutcome,
  type RoomState,
  type SpectatorBetPick,
  type SpectatorBetRefusalReason,
  type SpectatorBets
} from "@wingnight/shared";

import { resolveMinigamePointsMax, resolveTeamIdByPlayerId } from "../selectors/index.js";

// The watchers' side bet on each turn (`RoomState.spectatorBets`), and the night's side tally
// (`betTallyByPlayerId`). Nothing in this module reads or writes a team's score: a bet is settled
// FROM the turn's pending minigame points and written only to the tally.
//
// The window follows the turn's phases (`applySpectatorBetPhaseEffects`, inside every phase
// transition): the briefing opens it, play closes it, the results settle it, leaving the results
// freezes it into the tally. A skip voids it (`voidSpectatorBets`, from `skipTurnBoundary`), and a
// reset takes the whole of it with the rest of the room.

const resolveTurnKey = (state: RoomState): string => `${state.currentRound}:${state.roundTurnCursor}`;

const openSpectatorBets = (state: RoomState): SpectatorBets | null => {
  const teamId = state.activeRoundTeamId;
  const line = resolveSpectatorBetLine(resolveMinigamePointsMax(state));

  if (teamId === null || line === null || state.currentRoundConfig === null) {
    return null;
  }

  return {
    turnKey: resolveTurnKey(state),
    teamId,
    line,
    baselinePoints: state.pendingMinigamePointsByTeamId[teamId] ?? 0,
    status: SPECTATOR_BET_STATUSES.OPEN,
    betsByPlayerId: {},
    bettorPlayerIds: [],
    betCount: 0,
    turnPoints: null,
    outcome: null
  };
};

// The turn's own points: what the team added on top of what it carried into the turn. Each team
// plays once a round, so the baseline is 0 on every night the pack can build — but the pending
// map holds the whole round, and reading it raw is one game change away from settling a turn on
// points the team won somewhere else.
const settle = (state: RoomState, bets: SpectatorBets): SpectatorBets => {
  const turnPoints = (state.pendingMinigamePointsByTeamId[bets.teamId] ?? 0) - bets.baselinePoints;

  return {
    ...bets,
    status: SPECTATOR_BET_STATUSES.SETTLED,
    turnPoints,
    outcome: resolveSpectatorBetOutcome(turnPoints, bets.line)
  };
};

// The results are left: every bettor's record takes the turn, once, and the turn's bets are gone.
// A push is no bet at all. Clearing the bets here is what makes this happen once — nothing can
// bring a frozen turn back to SETTLED.
const freezeSpectatorBets = (state: RoomState): void => {
  const bets = state.spectatorBets;

  if (bets !== null && bets.status === SPECTATOR_BET_STATUSES.SETTLED && bets.outcome !== "push") {
    const nextTally = { ...state.betTallyByPlayerId };

    for (const [playerId, pick] of Object.entries(bets.betsByPlayerId)) {
      const record = nextTally[playerId] ?? { won: 0, played: 0 };

      nextTally[playerId] = {
        won: record.won + (pick === bets.outcome ? 1 : 0),
        played: record.played + 1
      };
    }

    state.betTallyByPlayerId = nextTally;
  }

  state.spectatorBets = null;
};

// Runs inside every phase transition, after the turn cursor and the pending points have moved.
export const applySpectatorBetPhaseEffects = (
  state: RoomState,
  previousPhase: Phase,
  nextPhase: Phase
): void => {
  if (previousPhase === Phase.TURN_RESULTS && nextPhase !== Phase.TURN_RESULTS) {
    freezeSpectatorBets(state);
  }

  const bets = state.spectatorBets;

  if (nextPhase === Phase.MINIGAME_INTRO) {
    state.spectatorBets = openSpectatorBets(state);
  } else if (nextPhase === Phase.MINIGAME_PLAY) {
    state.spectatorBets =
      bets !== null && bets.status === SPECTATOR_BET_STATUSES.OPEN
        ? { ...bets, status: SPECTATOR_BET_STATUSES.CLOSED }
        : bets;
  } else if (nextPhase === Phase.TURN_RESULTS) {
    state.spectatorBets = bets !== null && bets.status !== SPECTATOR_BET_STATUSES.VOID ? settle(state, bets) : bets;
  } else if (nextPhase !== Phase.EATING && nextPhase !== Phase.ROUND_RESULTS) {
    // A void turn's record stays up on the round's results it skipped to; anywhere else outside a
    // turn there are no bets.
    state.spectatorBets = null;
  }
};

// The host skipped the turn: nobody wins or loses, and the tally never hears of it.
export const voidSpectatorBets = (state: RoomState): void => {
  const bets = state.spectatorBets;

  if (bets !== null && bets.status !== SPECTATOR_BET_STATUSES.SETTLED) {
    state.spectatorBets = { ...bets, status: SPECTATOR_BET_STATUSES.VOID };
  }
};

// After every room mutation: on the turn's results the bets follow the turn's score, so an undo
// that takes back the last verdict re-settles them. Says whether anything moved.
export const syncSpectatorBets = (state: RoomState): boolean => {
  const bets = state.spectatorBets;

  if (state.phase !== Phase.TURN_RESULTS || bets === null || bets.status !== SPECTATOR_BET_STATUSES.SETTLED) {
    return false;
  }

  const nextBets = settle(state, bets);

  if (isDeepStrictEqual(bets, nextBets)) {
    return false;
  }

  state.spectatorBets = nextBets;

  return true;
};

// Why this player may not bet right now, or null when they may. The socket layer has already
// proved the face is this phone's; this is the room's half: an open window, a player on the
// roster, and not on the team about to play.
export const resolveSpectatorBetRefusal = (
  state: RoomState,
  playerId: string
): SpectatorBetRefusalReason | null => {
  const bets = state.spectatorBets;

  if (bets === null || bets.status !== SPECTATOR_BET_STATUSES.OPEN) {
    return SPECTATOR_BET_REFUSAL_REASONS.CLOSED;
  }

  if (!state.players.some((player) => player.id === playerId)) {
    return SPECTATOR_BET_REFUSAL_REASONS.NOT_SEATED;
  }

  if (resolveTeamIdByPlayerId(state, playerId) === bets.teamId) {
    return SPECTATOR_BET_REFUSAL_REASONS.ACTIVE_TEAM;
  }

  return null;
};

const withBets = (
  state: RoomState,
  bets: SpectatorBets,
  betsByPlayerId: SpectatorBets["betsByPlayerId"]
): SpectatorBets => {
  const bettorPlayerIds = state.players
    .map((player) => player.id)
    .filter((id) => betsByPlayerId[id] !== undefined);

  return { ...bets, betsByPlayerId, bettorPlayerIds, betCount: bettorPlayerIds.length };
};

// The face's claim ended (let go, freed, moved to another face) while the window is open: the pick
// was that holder's, not the face's, so it goes with them. A locked bet stands — the window is
// shut and the turn is under way. Says whether anything moved.
export const dropSpectatorBet = (state: RoomState, playerId: string): boolean => {
  const bets = state.spectatorBets;

  if (bets === null || bets.status !== SPECTATOR_BET_STATUSES.OPEN || bets.betsByPlayerId[playerId] === undefined) {
    return false;
  }

  const { [playerId]: _dropped, ...betsByPlayerId } = bets.betsByPlayerId;

  state.spectatorBets = withBets(state, bets, betsByPlayerId);

  return true;
};

// One pick per player, changeable while the window is open. Says whether anything moved.
export const writeSpectatorBet = (state: RoomState, playerId: string, pick: SpectatorBetPick): boolean => {
  const bets = state.spectatorBets;

  if (bets === null || resolveSpectatorBetRefusal(state, playerId) !== null) {
    return false;
  }

  if (bets.betsByPlayerId[playerId] === pick) {
    return false;
  }

  state.spectatorBets = withBets(state, bets, { ...bets.betsByPlayerId, [playerId]: pick });

  return true;
};
