import type { Player } from "../player/index.js";

// Spectator bets: the watchers' job. Before each team's turn, every guest whose phone holds a face
// and who is NOT on the team about to play taps OVER or UNDER on that turn's score line. It is a
// side game and nothing else: a bet never touches `totalScore`, the pending points or any team's
// standing. The room's reward is the reveal on the turn's results, and at the end of the night the
// best bettor is named.

export const SPECTATOR_BET_PICKS = {
  OVER: "over",
  UNDER: "under"
} as const;

export type SpectatorBetPick = (typeof SPECTATOR_BET_PICKS)[keyof typeof SPECTATOR_BET_PICKS];

export const isSpectatorBetPick = (value: unknown): value is SpectatorBetPick => {
  return value === SPECTATOR_BET_PICKS.OVER || value === SPECTATOR_BET_PICKS.UNDER;
};

// The life of one turn's bets. OPEN from the turn's briefing until play starts (in Quick Play,
// where there is no EATING, that is the briefing alone); CLOSED through play; SETTLED on the turn's
// results, where it re-settles if the host's undo changes the turn's score; VOID when the host
// skips the turn. Leaving the results freezes it: the tally takes it once and it is gone.
export const SPECTATOR_BET_STATUSES = {
  OPEN: "open",
  CLOSED: "closed",
  SETTLED: "settled",
  VOID: "void"
} as const;

export type SpectatorBetStatus = (typeof SPECTATOR_BET_STATUSES)[keyof typeof SPECTATOR_BET_STATUSES];

// A push is only reachable by a fractional score landing exactly on the line, which the .5 line
// makes impossible for every game that scores in whole points. It pays nobody and costs nobody.
export type SpectatorBetOutcome = SpectatorBetPick | "push";

export type SpectatorBets = {
  // Which turn this is (`<round>:<turn cursor>`). A phone's own pick is matched against it, so a
  // pick from the turn before never paints on this one.
  turnKey: string;
  // The team playing: the bet is on its score, and nobody on it may bet.
  teamId: string;
  line: number;
  // The team's pending minigame points when the window opened. The turn's score is what the team
  // adds on top of this, never the pending total itself.
  baselinePoints: number;
  status: SpectatorBetStatus;
  // Every pick, by player. The server's truth; no screen sees a pick until the turn is SETTLED,
  // so nobody herds onto the side the room is leaning (`projectSpectatorBets`).
  betsByPlayerId: Record<string, SpectatorBetPick>;
  // Who has bet, in roster order: the host's view of the window. Empty on the TV and the phones.
  bettorPlayerIds: string[];
  // How many have bet: the one fact about the window every screen gets.
  betCount: number;
  // Set when SETTLED: the team's points this turn, and which side of the line they fell.
  turnPoints: number | null;
  outcome: SpectatorBetOutcome | null;
};

// One player's side record across the night. A push counts in neither.
export type SpectatorBetRecord = { won: number; played: number };

export type SpectatorBetTally = Record<string, SpectatorBetRecord>;

// The line is one visible rule for every game: half the turn's points cap, on the half-point at or
// above it — floor(max / 2) + 0.5. A whole-number score can never land on a .5 line, so every turn
// settles OVER or UNDER and somebody always called it; for an odd cap (15 → 7.5) it is exactly
// half, for an even one (20 → 10.5) half a point over. A cap of zero, or no cap, is no bet.
export const resolveSpectatorBetLine = (pointsMax: number | null): number | null => {
  if (pointsMax === null || !Number.isFinite(pointsMax) || pointsMax <= 0) {
    return null;
  }

  return Math.floor(pointsMax / 2) + 0.5;
};

export const resolveSpectatorBetOutcome = (turnPoints: number, line: number): SpectatorBetOutcome => {
  if (turnPoints > line) {
    return SPECTATOR_BET_PICKS.OVER;
  }

  return turnPoints < line ? SPECTATOR_BET_PICKS.UNDER : "push";
};

// What a role is shown of the turn's bets. Until the turn is SETTLED nobody sees a pick — not the
// TV, not the phones, not the host — and only the host sees who has bet; the TV and the phones
// get the count. Once settled, the picks are the show: everyone gets all of them.
export const projectSpectatorBets = (
  bets: SpectatorBets | null,
  options: { showBettors: boolean }
): SpectatorBets | null => {
  if (bets === null || bets.status === SPECTATOR_BET_STATUSES.SETTLED) {
    return bets;
  }

  return {
    ...bets,
    betsByPlayerId: {},
    bettorPlayerIds: options.showBettors ? bets.bettorPlayerIds : []
  };
};

// The players who called a settled turn, in roster order.
export const resolveSpectatorBetWinnerIds = (bets: SpectatorBets, players: readonly Player[]): string[] => {
  if (bets.status !== SPECTATOR_BET_STATUSES.SETTLED || bets.outcome === null || bets.outcome === "push") {
    return [];
  }

  return players
    .filter((player) => bets.betsByPlayerId[player.id] === bets.outcome)
    .map((player) => player.id);
};

// The night's best bettor: the most bets won; level on wins, the fewer bets played (the sharper
// record — 4 from 5 beats 4 from 8); still level, they share the title. Nobody who won nothing is
// named. Roster order, and only players still on the roster.
export const resolveBestBettorPlayerIds = (
  tally: SpectatorBetTally,
  players: readonly Player[]
): string[] => {
  let best: SpectatorBetRecord | null = null;
  let bestIds: string[] = [];

  for (const player of players) {
    const record = tally[player.id];

    if (record === undefined || record.won === 0) {
      continue;
    }

    const isBetter =
      best === null || record.won > best.won || (record.won === best.won && record.played < best.played);
    const isLevel = best !== null && record.won === best.won && record.played === best.played;

    if (isBetter) {
      best = record;
      bestIds = [player.id];
    } else if (isLevel) {
      bestIds = [...bestIds, player.id];
    }
  }

  return bestIds;
};

// Why `player:placeBet` said no.
export const SPECTATOR_BET_REFUSAL_REASONS = {
  // Too many taps too fast (the claim bucket's size).
  RATE_LIMITED: "rate_limited",
  // Not `{ pick: "over" | "under" }`.
  MALFORMED: "malformed",
  // This socket holds no face.
  NOT_SEATED: "not_seated",
  // No window is open: play has started, or this turn has no line.
  CLOSED: "closed",
  // The bettor is on the team that is playing.
  ACTIVE_TEAM: "active_team",
  // The server hit a fault handling this message and refused it rather than go down with it.
  SERVER_ERROR: "server_error"
} as const;

export type SpectatorBetRefusalReason =
  (typeof SPECTATOR_BET_REFUSAL_REASONS)[keyof typeof SPECTATOR_BET_REFUSAL_REASONS];

export type PlayerPlaceBetResult =
  | { ok: true; turnKey: string; pick: SpectatorBetPick }
  | { ok: false; reason: SpectatorBetRefusalReason };
