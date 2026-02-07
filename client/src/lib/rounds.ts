export function getCurrentRound<T extends { roundNumber: number }>(
  rounds: T[],
  currentRoundNumber: number
): T | undefined {
  return rounds.find((round) => round.roundNumber === currentRoundNumber);
}
