import type { RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import type { StageRenderMode } from "../resolveStageViewModel";
import { resolveRemainingTimerSeconds } from "../../../../utils/resolveRemainingTimerSeconds";

type UseMinigameCountdownOptions = {
  stageMode: StageRenderMode;
  minigameTimerSnapshot: NonNullable<RoomState["timer"]> | null;
};

export const useMinigameCountdown = ({
  stageMode,
  minigameTimerSnapshot
}: UseMinigameCountdownOptions): number | null => {
  const [nowTimestampMs, setNowTimestampMs] = useState(() => Date.now());

  useEffect(() => {
    if (
      stageMode !== "minigame_play" ||
      minigameTimerSnapshot === null ||
      minigameTimerSnapshot.isPaused
    ) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNowTimestampMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [stageMode, minigameTimerSnapshot]);

  if (minigameTimerSnapshot === null) {
    return null;
  }

  return resolveRemainingTimerSeconds(minigameTimerSnapshot, nowTimestampMs);
};
