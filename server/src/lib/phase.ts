export interface PhaseRoomState {
  phase: string;
  currentRoundNumber: number;
}

export function getPhaseUpdate(room: PhaseRoomState, nextPhase: string): { phase: string; currentRoundNumber?: number } {
  const update: { phase: string; currentRoundNumber?: number } = { phase: nextPhase };

  if (nextPhase === 'ROUND_INTRO') {
    if (room.currentRoundNumber === 0) {
      update.currentRoundNumber = 1;
    } else if (room.phase === 'ROUND_RESULTS') {
      update.currentRoundNumber = room.currentRoundNumber + 1;
    }
  }

  return update;
}
