type TimerSnapshot = {
  isPaused: boolean;
  remainingMs: number;
  endsAt: number;
};

export const resolveRemainingTimerSeconds = (
  timerSnapshot: TimerSnapshot,
  nowTimestampMs: number
): number => {
  if (timerSnapshot.isPaused) {
    return Math.max(0, Math.ceil(timerSnapshot.remainingMs / 1000));
  }

  return Math.max(0, Math.ceil((timerSnapshot.endsAt - nowTimestampMs) / 1000));
};
