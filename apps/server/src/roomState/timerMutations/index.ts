import { Phase, TIMER_EXTEND_MAX_SECONDS } from "@wingnight/shared";
import type { RoomTimerState } from "@wingnight/shared";

import { defineRoomMutation } from "../defineRoomMutation/index.js";

const resolveEatingTimer = (timer: RoomTimerState | null): RoomTimerState | null => {
  if (timer === null || timer.phase !== Phase.EATING) {
    return null;
  }

  return timer;
};

export const pauseRoomTimer = defineRoomMutation({
  requiredPhase: Phase.EATING,
  run: (roomState): boolean => {
    const currentTimer = resolveEatingTimer(roomState.timer);

    if (currentTimer === null || currentTimer.isPaused) {
      return false;
    }

    const now = Date.now();
    const remainingMs = Math.max(0, currentTimer.endsAt - now);

    roomState.timer = {
      ...currentTimer,
      isPaused: true,
      remainingMs,
      endsAt: now + remainingMs
    };

    return true;
  }
});

export const resumeRoomTimer = defineRoomMutation({
  requiredPhase: Phase.EATING,
  run: (roomState): boolean => {
    const currentTimer = resolveEatingTimer(roomState.timer);

    if (currentTimer === null || !currentTimer.isPaused) {
      return false;
    }

    const now = Date.now();

    roomState.timer = {
      ...currentTimer,
      startedAt: now,
      endsAt: now + currentTimer.remainingMs,
      isPaused: false
    };

    return true;
  }
});

export const extendRoomTimer = defineRoomMutation({
  requiredPhase: Phase.EATING,
  run: (roomState, additionalSeconds: number): boolean => {
    const currentTimer = resolveEatingTimer(roomState.timer);

    if (
      currentTimer === null ||
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
      roomState.timer = {
        ...currentTimer,
        remainingMs: nextRemainingMs,
        durationMs: currentTimer.durationMs + additionalMs,
        endsAt: now + nextRemainingMs
      };

      return true;
    }

    const nextEndsAt = currentTimer.endsAt + additionalMs;
    roomState.timer = {
      ...currentTimer,
      endsAt: nextEndsAt,
      durationMs: currentTimer.durationMs + additionalMs,
      remainingMs: Math.max(0, nextEndsAt - now)
    };

    return true;
  }
});
