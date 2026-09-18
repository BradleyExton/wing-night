import { useEffect, useState } from "react";
import type { ContraptionMinigameRun } from "@wingnight/shared";

import { resolveSequenceDurationMs } from "../runSequence/index.js";

// Milliseconds since the current run started playing. Restarts from zero when
// a new attempt arrives or the host bumps the replay token, and stops ticking
// once the sequence has run its course so an idle display is not burning
// frames on a held picture.
export const useRunPlayback = (run: ContraptionMinigameRun | null): number => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const attemptNumber = run?.attemptNumber ?? null;
  const replayToken = run?.replayToken ?? null;
  const durationMs = run === null ? 0 : resolveSequenceDurationMs(run);

  useEffect(() => {
    setElapsedMs(0);

    if (attemptNumber === null) {
      return undefined;
    }

    let startedAt: number | null = null;
    let frame = 0;

    const tick = (now: number): void => {
      if (startedAt === null) {
        startedAt = now;
      }

      const next = now - startedAt;

      setElapsedMs(next);

      if (next < durationMs) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return (): void => {
      window.cancelAnimationFrame(frame);
    };
  }, [attemptNumber, replayToken, durationMs]);

  return elapsedMs;
};
