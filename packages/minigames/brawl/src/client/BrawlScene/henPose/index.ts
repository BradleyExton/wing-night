import { CHARACTER_FOOT, CHARACTER_STAND_HEIGHT } from "@wingnight/cast";
import type { BrawlFrame } from "@wingnight/shared";
import { BRAWL_WORLD } from "@wingnight/shared";

/** The cast poses the hen is ever drawn in. Each is mounted once and shown by the paint loop. */
export const HEN_POSES = ["idle", "walk", "peck", "hurt", "ko"] as const;

export type HenPose = (typeof HEN_POSES)[number];

/**
 * The cast's 80×72 figure drawn at this scale in world units: foot to the middle of the head is
 * the sim's `henHeight`, the JOUST trick — the drawn bird and the box the sim fights with are
 * the same creature, give or take the bobblehead above it.
 */
export const HEN_SCALE = BRAWL_WORLD.henHeight / CHARACTER_STAND_HEIGHT;

/** How long a hit flashes the hen, in ticks: the sim's own mercy window. */
const FLASH_HZ = 8;

/**
 * What the hen is doing at one frame, as a pose. Reeling wins over everything (a hit knocks the
 * beak shut), then the peck from the press until its box closes — the commit the room sees —
 * then walking while the thumb is down, and standing otherwise.
 */
export const resolveHenPose = (
  frame: Pick<BrawlFrame, "tick" | "walking" | "peckUntilTick" | "hurtUntilTick">
): Exclude<HenPose, "ko"> => {
  if (frame.tick < frame.hurtUntilTick) {
    return "hurt";
  }

  if (frame.tick < frame.peckUntilTick) {
    return "peck";
  }

  return frame.walking === 0 ? "idle" : "walk";
};

/** Whether a peck is out at this frame: the `data-brawl-pecking` seam. */
export const isHenPecking = (frame: Pick<BrawlFrame, "tick" | "peckUntilTick">): boolean => {
  return frame.tick < frame.peckUntilTick;
};

/**
 * How solid the hen is drawn: flickering while she is invulnerable after a hit, so the room can
 * see the mercy window, and solid otherwise.
 */
export const resolveHenOpacity = (frame: Pick<BrawlFrame, "tick" | "invulnerableUntilTick" | "hits">): number => {
  const lastHit = frame.hits[frame.hits.length - 1];

  if (lastHit === undefined || frame.tick >= frame.invulnerableUntilTick) {
    return 1;
  }

  const since = Math.max(0, frame.tick - lastHit);

  return Math.floor((since / BRAWL_WORLD.tickHz) * FLASH_HZ * 2) % 2 === 1 ? 0.3 : 1;
};

/**
 * The hen's group: stood with her foot on the ground line at `x`, `lift` world units up off it,
 * turned to `facing`, `tilt` degrees about her foot.
 */
export const resolveHenTransform = ({
  x,
  facing,
  lift = 0,
  tilt = 0
}: {
  x: number;
  facing: -1 | 1;
  lift?: number;
  tilt?: number;
}): string => {
  const footX = Math.round(x * 100) / 100;
  const footY = Math.round((BRAWL_WORLD.groundY - lift) * 100) / 100;
  const turn = tilt === 0 ? "" : ` rotate(${Math.round(tilt * 10) / 10})`;

  return `translate(${footX} ${footY})${turn} scale(${facing * HEN_SCALE} ${HEN_SCALE})`;
};

/** Inside the hen's group: the figure's own units, its foot on the origin. */
export const HEN_FIGURE_TRANSFORM = `translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`;
