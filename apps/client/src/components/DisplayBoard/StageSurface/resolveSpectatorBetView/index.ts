import {
  Phase,
  SPECTATOR_BET_STATUSES,
  resolveBestBettorPlayerIds,
  resolveSpectatorBetWinnerIds,
  type DisplayRoomStateSnapshot,
  type SpectatorBetOutcome
} from "@wingnight/shared";

// What the TV says about the watchers' side bets, phase by phase. Only three places: the line and
// the count while the window is open (the briefing and the wings), the settlement on the turn's
// results, and the night's best bettor at the end. Never during play — no standing over a turn in
// progress (docs/minigame-design-principles.md §3) — and never a pick before the turn settles,
// which the display snapshot does not carry anyway.
export type SpectatorBetReadoutView = { line: number; betCount: number };

export type SpectatorBetSettlementView = {
  line: number;
  turnPoints: number;
  outcome: SpectatorBetOutcome;
  callerNames: string[];
};

export type BestBettorView = { names: string[]; won: number; played: number };

export type SpectatorBetView = {
  readout: SpectatorBetReadoutView | null;
  settlement: SpectatorBetSettlementView | null;
  bestBettor: BestBettorView | null;
};

type SpectatorBetRoom = Pick<
  DisplayRoomStateSnapshot,
  "phase" | "players" | "teams" | "claimedPlayerIds" | "spectatorBets" | "betTallyByPlayerId"
>;

const NO_VIEW: SpectatorBetView = { readout: null, settlement: null, bestBettor: null };

// The line goes up only when somebody could take it: a phone in the room off the playing team, or
// a bet already in. A night with no phones keeps the briefing exactly as it was.
const hasWatcherPhone = (room: SpectatorBetRoom, teamId: string): boolean => {
  const playingIds = new Set(room.teams.find((team) => team.id === teamId)?.playerIds ?? []);

  return room.claimedPlayerIds.some((playerId) => !playingIds.has(playerId));
};

export const resolveSpectatorBetView = (room: SpectatorBetRoom | null): SpectatorBetView => {
  if (room === null) {
    return NO_VIEW;
  }

  const bets = room.spectatorBets;
  const nameById = new Map(room.players.map((player) => [player.id, player.name] as const));

  if (room.phase === Phase.FINAL_RESULTS) {
    const bestIds = resolveBestBettorPlayerIds(room.betTallyByPlayerId, room.players);
    const record = bestIds.length === 0 ? undefined : room.betTallyByPlayerId[bestIds[0]];

    return record === undefined
      ? NO_VIEW
      : { ...NO_VIEW, bestBettor: { names: bestIds.map((id) => nameById.get(id) ?? id), ...record } };
  }

  if (bets === null) {
    return NO_VIEW;
  }

  const isWindowPhase = room.phase === Phase.MINIGAME_INTRO || room.phase === Phase.EATING;

  if (
    isWindowPhase &&
    bets.status === SPECTATOR_BET_STATUSES.OPEN &&
    (bets.betCount > 0 || hasWatcherPhone(room, bets.teamId))
  ) {
    return { ...NO_VIEW, readout: { line: bets.line, betCount: bets.betCount } };
  }

  if (
    room.phase === Phase.TURN_RESULTS &&
    bets.status === SPECTATOR_BET_STATUSES.SETTLED &&
    bets.betCount > 0 &&
    bets.turnPoints !== null &&
    bets.outcome !== null
  ) {
    return {
      ...NO_VIEW,
      settlement: {
        line: bets.line,
        turnPoints: bets.turnPoints,
        outcome: bets.outcome,
        callerNames: resolveSpectatorBetWinnerIds(bets, room.players).map((id) => nameById.get(id) ?? id)
      }
    };
  }

  return NO_VIEW;
};
