import {
  Phase,
  TIMER_EXTEND_MAX_SECONDS,
  type RoomState
} from "@wingnight/shared";

import { getRoomStateSnapshot } from "../baseMutations/index.js";
import { isRoomInFatalState } from "../selectors/index.js";
import { getRoomState } from "../stateStore/index.js";

export const pauseRoomTimer = (): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const currentTimer = roomState.timer;

  if (
    roomState.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    currentTimer.isPaused
  ) {
    return getRoomStateSnapshot();
  }

  const now = Date.now();
  const remainingMs = Math.max(0, currentTimer.endsAt - now);

  roomState.timer = {
    ...currentTimer,
    isPaused: true,
    remainingMs,
    endsAt: now + remainingMs
  };

  return getRoomStateSnapshot();
};

export const resumeRoomTimer = (): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const currentTimer = roomState.timer;

  if (
    roomState.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    !currentTimer.isPaused
  ) {
    return getRoomStateSnapshot();
  }

  const now = Date.now();

  roomState.timer = {
    ...currentTimer,
    startedAt: now,
    endsAt: now + currentTimer.remainingMs,
    isPaused: false
  };

  return getRoomStateSnapshot();
};

export const extendRoomTimer = (additionalSeconds: number): RoomState => {
  const roomState = getRoomState();

  if (isRoomInFatalState(roomState)) {
    return getRoomStateSnapshot();
  }

  const currentTimer = roomState.timer;

  if (
    roomState.phase !== Phase.EATING ||
    currentTimer === null ||
    currentTimer.phase !== Phase.EATING ||
    !Number.isInteger(additionalSeconds) ||
    additionalSeconds <= 0 ||
    additionalSeconds > TIMER_EXTEND_MAX_SECONDS
  ) {
    return getRoomStateSnapshot();
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

    return getRoomStateSnapshot();
  }

  const nextEndsAt = currentTimer.endsAt + additionalMs;
  roomState.timer = {
    ...currentTimer,
    endsAt: nextEndsAt,
    durationMs: currentTimer.durationMs + additionalMs,
    remainingMs: Math.max(0, nextEndsAt - now)
  };

  return getRoomStateSnapshot();
};
