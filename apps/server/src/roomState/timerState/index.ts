import {
  Phase,
  TIMER_EXTEND_MAX_SECONDS,
  type RoomState,
  type RoomTimerState
} from "@wingnight/shared";

export const createRunningTimer = (
  phase: Phase,
  durationSeconds: number
): RoomTimerState => {
  const startedAt = Date.now();
  const durationMs = durationSeconds * 1000;

  return {
    phase,
    startedAt,
    endsAt: startedAt + durationMs,
    durationMs,
    isPaused: false,
    remainingMs: durationMs
  };
};

export const createEatingTimerFromConfig = (state: RoomState): RoomTimerState | null => {
  const eatingSeconds = state.gameConfig?.timers.eatingSeconds ?? null;

  return eatingSeconds === null
    ? null
    : createRunningTimer(Phase.EATING, eatingSeconds);
};

export const pauseRoomTimerMutation = (state: RoomState): boolean => {
  const currentTimer = state.timer;

  if (
    state.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    currentTimer.isPaused
  ) {
    return false;
  }

  const now = Date.now();
  const remainingMs = Math.max(0, currentTimer.endsAt - now);

  state.timer = {
    ...currentTimer,
    isPaused: true,
    remainingMs,
    endsAt: now + remainingMs
  };

  return true;
};

export const resumeRoomTimerMutation = (state: RoomState): boolean => {
  const currentTimer = state.timer;

  if (
    state.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    !currentTimer.isPaused
  ) {
    return false;
  }

  const now = Date.now();

  state.timer = {
    ...currentTimer,
    startedAt: now,
    endsAt: now + currentTimer.remainingMs,
    isPaused: false
  };

  return true;
};

export const extendRoomTimerMutation = (
  state: RoomState,
  additionalSeconds: number
): boolean => {
  const currentTimer = state.timer;

  if (
    state.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    !Number.isInteger(additionalSeconds) ||
    additionalSeconds <= 0 ||
    additionalSeconds > TIMER_EXTEND_MAX_SECONDS
  ) {
    return false;
  }

  const additionalMs = additionalSeconds * 1000;
  const now = Date.now();

  if (currentTimer.isPaused) {
    const nextRemainingMs = currentTimer.remainingMs + additionalMs;
    state.timer = {
      ...currentTimer,
      remainingMs: nextRemainingMs,
      durationMs: currentTimer.durationMs + additionalMs,
      endsAt: now + nextRemainingMs
    };

    return true;
  }

  const nextEndsAt = currentTimer.endsAt + additionalMs;
  state.timer = {
    ...currentTimer,
    endsAt: nextEndsAt,
    durationMs: currentTimer.durationMs + additionalMs,
    remainingMs: Math.max(0, nextEndsAt - now)
  };

  return true;
};
