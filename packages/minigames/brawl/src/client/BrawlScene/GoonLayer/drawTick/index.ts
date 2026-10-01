import type { BrawlFrame, BrawlGoon, BrawlGoonState } from "@wingnight/shared";

import { GOON_WALK_FRAME_TICKS } from "../../Goons/index.js";

/**
 * How often a goon's drawing actually changes, by state, in ticks. A goon is drawn by React —
 * its pose is a component — but only on the ticks its picture changes: a walk frame every eight
 * ticks, the honk's throb and the stars' orbit every six. Everything else about it (where it is,
 * which way it faces) is written straight onto its group every frame.
 */
const DRAW_STEP_TICKS: Record<BrawlGoonState, number> = {
  entering: GOON_WALK_FRAME_TICKS,
  approach: GOON_WALK_FRAME_TICKS,
  telegraph: 6,
  stunned: 6,
  ko: 6,
  attack: 0,
  recover: 0,
  gone: 0
};

/** The tick a goon's drawing is rendered at: the frame's tick, held to its state's step. */
export const resolveGoonDrawTick = (state: BrawlGoonState, tick: number): number => {
  const step = DRAW_STEP_TICKS[state];

  return step === 0 ? 0 : Math.floor(tick / step) * step;
};

/**
 * What the goons layer last rendered, as one string: who is on the street, in what state, at
 * what drawn tick. The layer re-renders only when this changes — a few times a second while
 * goons walk, never on a frame where nothing about a drawing moved.
 */
export const resolveGoonsSignature = (frame: Pick<BrawlFrame, "goons" | "tick">): string => {
  return frame.goons
    .map((goon: BrawlGoon) => `${goon.spawnIndex}:${goon.state}:${resolveGoonDrawTick(goon.state, frame.tick)}`)
    .join(",");
};

/** A goon's group, placed: its foot point moved off the ground line by its height, flipped to its facing. */
export const resolveGoonTransform = (goon: Pick<BrawlGoon, "x" | "y" | "facing">): string => {
  return `translate(${Math.round(goon.x * 100) / 100} ${Math.round(-goon.y * 100) / 100}) scale(${goon.facing} 1)`;
};
