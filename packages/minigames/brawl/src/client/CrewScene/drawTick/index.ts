import type { BrawlCrewFrame, BrawlCrewGoon, BrawlGoonState } from "@wingnight/shared";

import { CLANK_TICKS, GOON_WALK_FRAME_TICKS } from "../Goons/index.js";

/**
 * How often a goon's drawing actually changes, by state, in ticks. A goon is drawn by React —
 * its pose is a component — but only on the ticks its picture changes: a walk frame every eight
 * ticks, the honk's throb and the stars' orbit every six. A swan's stalk is a held stance and
 * never changes. Everything else about it (where it is, which way it faces) is written straight
 * onto its group every frame.
 */
const DRAW_STEP_TICKS: Record<BrawlGoonState, number> = {
  entering: GOON_WALK_FRAME_TICKS,
  approach: GOON_WALK_FRAME_TICKS,
  stalk: 0,
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

/** A fresh clank is redrawn every this many ticks: six steps of its burst, not twelve renders. */
const CLANK_STEP_TICKS = 2;

/**
 * How long ago — in drawn steps of ticks — a peck last clanked off this goon's helmet, while the
 * clank is still on screen (`CLANK_TICKS`); null once it has burst out, or if it never clanked.
 */
export const resolveClankAge = (frame: Pick<BrawlCrewFrame, "events" | "tick">, spawnIndex: number): number | null => {
  let last: number | null = null;

  for (const event of frame.events) {
    if (event.kind === "clank" && event.spawnIndex === spawnIndex && event.tick <= frame.tick) {
      last = last === null ? event.tick : Math.max(last, event.tick);
    }
  }

  if (last === null || frame.tick - last >= CLANK_TICKS) {
    return null;
  }

  return Math.floor((frame.tick - last) / CLANK_STEP_TICKS) * CLANK_STEP_TICKS;
};

/**
 * What the figure layer last rendered of the goons, as one string: who is on the street, in what
 * state, at what drawn tick, and any clank still bursting off a helmet. The layer re-renders only
 * when this changes — a few times a second while goons walk, never on a frame where nothing
 * about a drawing moved.
 */
export const resolveGoonsSignature = (frame: Pick<BrawlCrewFrame, "goons" | "tick" | "events">): string => {
  return frame.goons
    .map((goon: BrawlCrewGoon) => {
      const clank = resolveClankAge(frame, goon.spawnIndex);

      return `${goon.spawnIndex}:${goon.state}:${resolveGoonDrawTick(goon.state, frame.tick)}${clank === null ? "" : `:c${clank}`}`;
    })
    .join(",");
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * A goon's two groups, placed. Its SLOT stands on its line: `x` along the street, `z` down the
 * band from the back of it, which is where the drawing already stands itself. Its BODY, inside
 * the slot, is turned to its facing and lifted by its height — so a gull's shadow, which is the
 * slot's, stays on its line while the bird is in the air above it.
 */
export const resolveGoonSlotTransform = (goon: Pick<BrawlCrewGoon, "x" | "z">): string => {
  return `translate(${round2(goon.x)} ${round2(goon.z)})`;
};

export const resolveGoonBodyTransform = (goon: Pick<BrawlCrewGoon, "y" | "facing">): string => {
  return `translate(0 ${round2(-goon.y)}) scale(${goon.facing} 1)`;
};
