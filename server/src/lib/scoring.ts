export interface ScoringPlayer {
  id: string;
}

export interface ScoringTeam {
  id: string;
  players: ScoringPlayer[];
}

export interface ScoringWingResult {
  playerId: string;
  completed: boolean;
}

export interface ScoringGameState {
  roundScores?: Record<string, number>;
}

export interface RoundResult {
  teamId: string;
  wingPoints: number;
  gamePoints: number;
  totalPoints: number;
  placement: number;
}

export function calculateRoundResults(
  teams: ScoringTeam[],
  wingResults: ScoringWingResult[],
  gameState: ScoringGameState | null
): RoundResult[] {
  const roundScores = gameState?.roundScores || {};

  const results = teams.map((team) => {
    const teamPlayerIds = new Set(team.players.map((p) => p.id));
    const completedWings = wingResults.filter(
      (w) => w.completed && teamPlayerIds.has(w.playerId)
    ).length;
    const wingPoints = completedWings * 50;
    const gamePoints = roundScores[team.id] || 0;

    return {
      teamId: team.id,
      wingPoints,
      gamePoints,
      totalPoints: wingPoints + gamePoints,
      placement: 0,
    };
  });

  results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.teamId.localeCompare(b.teamId);
  });

  results.forEach((result, index) => {
    result.placement = index + 1;
  });

  return results;
}
