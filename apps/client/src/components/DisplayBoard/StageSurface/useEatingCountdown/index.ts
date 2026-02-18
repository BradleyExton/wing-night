import type { RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import type { StageRenderMode } from "../resolveStageViewModel";

type UseEatingCountdownOptions = {
  stageMode: StageRenderMode;
  eatingTimerSnapshot: NonNullable<RoomState["timer"]> | null;
  fallbackEatingSeconds: number | null;
};

export const useEatingCountdown = ({
  stageMode,
  eatingTimerSnapshot,
  fallbackEatingSeconds
}: UseEatingCountdownOptions): number | null => {
  const [nowTimestampMs, setNowTimestampMs] = useState(() => Date.now());

  useEffect(() => {
    if (stageMode !== "eating" || eatingTimerSnapshot === null || eatingTimerSnapshot.isPaused) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNowTimestampMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [stageMode, eatingTimerSnapshot]);

  if (eatingTimerSnapshot !== null) {
    return eatingTimerSnapshot.isPaused
      ? Math.max(0, Math.ceil(eatingTimerSnapshot.remainingMs / 1000))
      : Math.max(0, Math.ceil((eatingTimerSnapshot.endsAt - nowTimestampMs) / 1000));
  }

  return fallbackEatingSeconds;
};
