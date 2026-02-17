export type ActiveTimerKind = "EATING" | "TRIVIA_TURN";

export type ActiveTimer = {
  kind: ActiveTimerKind;
  startsAt: number;
  endsAt: number;
  durationSeconds: number;
};
