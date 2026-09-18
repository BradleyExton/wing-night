import type { ContraptionMinigameRun, ContraptionVec2 } from "@wingnight/shared";

import { decodeTrack } from "../../runtime/grading/index.js";

// How one recorded run plays out on a screen, as a pure function of elapsed
// time. Flight replays the server's track; a short hold lets the settle read;
// the verdict lands; and a MISS gets its punchline — the cleaner walks on and
// takes the wing away — because a miss that ends in a gag stays legible even
// when the physics did not. A landed run has no cleanup beat.

export type RunSequenceStage = "flight" | "verdict" | "cleanup" | "held";

export type RunSequencePosition = {
  frameIndex: number;
  stage: RunSequenceStage;
  // 0..1 through the cleanup beat; 0 before it and 1 once it has completed.
  cleanupProgress: number;
};

// Played past the settle so the wing visibly stops before anything is said.
export const SETTLE_HOLD_SECONDS = 0.6;

export const VERDICT_SECONDS = 1.2;

export const CLEANUP_SECONDS = 2.6;

const clampUnit = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};

export const resolveTrackPositions = (run: ContraptionMinigameRun): ContraptionVec2[] => {
  return decodeTrack(run.track);
};

export const resolveFrameCount = (run: ContraptionMinigameRun): number => {
  return Math.floor(run.track.positions.length / 2);
};

// The last frame worth showing: a hold past the settle, or the whole track
// when the wing never stopped.
export const resolveLastPlayedFrame = (run: ContraptionMinigameRun): number => {
  const lastFrame = Math.max(0, resolveFrameCount(run) - 1);

  if (run.settleSeconds === null) {
    return lastFrame;
  }

  return Math.min(
    lastFrame,
    Math.round((run.settleSeconds + SETTLE_HOLD_SECONDS) * run.track.keyframeHz)
  );
};

export const resolveFlightMs = (run: ContraptionMinigameRun): number => {
  return (resolveLastPlayedFrame(run) / run.track.keyframeHz) * 1000;
};

export const hasCleanupBeat = (run: ContraptionMinigameRun): boolean => {
  return run.outcome !== "landed";
};

export const resolveSequenceDurationMs = (run: ContraptionMinigameRun): number => {
  return (
    resolveFlightMs(run) +
    VERDICT_SECONDS * 1000 +
    (hasCleanupBeat(run) ? CLEANUP_SECONDS * 1000 : 0)
  );
};

export const resolveRunSequence = (
  elapsedMs: number,
  run: ContraptionMinigameRun
): RunSequencePosition => {
  const flightMs = resolveFlightMs(run);
  const lastFrame = resolveLastPlayedFrame(run);

  if (elapsedMs < flightMs) {
    return {
      frameIndex: Math.min(lastFrame, Math.floor((Math.max(0, elapsedMs) / 1000) * run.track.keyframeHz)),
      stage: "flight",
      cleanupProgress: 0
    };
  }

  const verdictMs = VERDICT_SECONDS * 1000;
  const sinceVerdict = elapsedMs - flightMs;

  if (sinceVerdict < verdictMs) {
    return { frameIndex: lastFrame, stage: "verdict", cleanupProgress: 0 };
  }

  if (!hasCleanupBeat(run)) {
    return { frameIndex: lastFrame, stage: "held", cleanupProgress: 0 };
  }

  const cleanupProgress = clampUnit((sinceVerdict - verdictMs) / (CLEANUP_SECONDS * 1000));

  return {
    frameIndex: lastFrame,
    stage: cleanupProgress >= 1 ? "held" : "cleanup",
    cleanupProgress
  };
};
