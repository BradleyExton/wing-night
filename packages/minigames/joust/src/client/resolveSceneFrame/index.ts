import type { JoustFrame, JoustMinigameArena, JoustMinigameShot, JoustAim } from "@wingnight/shared";
import {
  JOUST_CHAMP_BALL_INDICES,
  JOUST_CHAMP_HEAD_INDEX,
  resolveJoustRestFrame
} from "@wingnight/shared";

// How long the impact burst stays on the struck body, in track frames.
const IMPACT_FRAMES = 12;

export type SceneFrame = {
  frame: JoustFrame;
  impactBodyIndex: number | null;
};

// The one frame both surfaces draw: a track frame while a shot is on screen,
// otherwise the rest pose for the current pull.
export const resolveSceneFrame = (
  arena: JoustMinigameArena,
  aim: JoustAim,
  lastShot: JoustMinigameShot | null,
  replayIndex: number
): SceneFrame => {
  if (lastShot === null) {
    return { frame: resolveJoustRestFrame(arena, aim), impactBodyIndex: null };
  }

  const { keyframes, hitFrameIndex, hitZone } = lastShot.run;
  const clampedIndex = Math.max(0, Math.min(replayIndex, keyframes.length - 1));
  const frame = keyframes[clampedIndex] ?? resolveJoustRestFrame(arena, aim);
  const isImpactVisible =
    hitZone !== null &&
    hitFrameIndex !== null &&
    clampedIndex >= hitFrameIndex &&
    clampedIndex < hitFrameIndex + IMPACT_FRAMES;

  if (!isImpactVisible) {
    return { frame, impactBodyIndex: null };
  }

  const impactBodyIndex =
    hitZone === "head"
      ? JOUST_CHAMP_HEAD_INDEX
      : hitZone === "balls"
        ? JOUST_CHAMP_BALL_INDICES[0]
        : JOUST_CHAMP_HEAD_INDEX - 2;

  return { frame, impactBodyIndex };
};

export const isReplayFinished = (
  lastShot: JoustMinigameShot | null,
  replayIndex: number
): boolean => {
  return lastShot === null || replayIndex >= lastShot.run.keyframes.length - 1;
};
