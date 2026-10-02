import type { BrawlGoon } from "@wingnight/shared";
import { BRAWL_WORLD } from "@wingnight/shared";

/**
 * Staged depth (docs/minigames/brawl-spec.md §0.8): a picture of depth, never an input. The sim
 * is one line; the scene stands the goons that are still far from the hen on three depth lines —
 * behind her line, on it, in front of it — and walks each onto her line as it closes, so it is
 * on her line well before it can honk or lunge. Nobody whiffs on depth, because there is none.
 */

/** Past its reach by this much, a goon is still all the way on her line. World units. */
export const DEPTH_NEAR = 10;

/** Over this much more distance it steps from her line out to its own. World units. */
export const DEPTH_RAMP = 40;

/** How far a whole depth line sits off hers, down the screen for nearer. World units. */
export const DEPTH_STEP = 5;

/** How much bigger a goon a whole line nearer is drawn, and smaller a line further. */
export const DEPTH_SCALE = 0.06;

/** Which depth line a goon mills on: −1 behind her line, 0 on it, 1 in front. From the spawn, so both screens agree. */
export const resolveGoonLane = (spawnIndex: number): -1 | 0 | 1 => {
  return (((spawnIndex * 7) % 3) - 1) as -1 | 0 | 1;
};

/** How far onto its own line a goon this far from the hen stands: 0 on her line, 1 all the way out. */
export const resolveDepthShare = (distance: number, reach: number): number => {
  return Math.min(1, Math.max(0, (distance - reach - DEPTH_NEAR) / DEPTH_RAMP));
};

/**
 * Where a goon is drawn in depth, as lane × share: −1 a whole line behind her, 1 a whole line in
 * front. A gull is airborne and has no line. A stalking swan is in its reach, facing her down, so
 * it is on her line. A goon reeling or down keeps the depth it was hit at (`held`, the last depth
 * drawn) — it was in reach, so that is her line anyway.
 */
export const resolveGoonDepth = (
  goon: Pick<BrawlGoon, "spawnIndex" | "kind" | "x" | "state">,
  henX: number,
  held: number | undefined
): number => {
  if (goon.kind === "gull" || goon.state === "stalk") {
    return 0;
  }

  if (held !== undefined && (goon.state === "stunned" || goon.state === "ko" || goon.state === "gone")) {
    return held;
  }

  const lane = resolveGoonLane(goon.spawnIndex);

  if (lane === 0) {
    return 0;
  }

  return lane * resolveDepthShare(Math.abs(goon.x - henX), BRAWL_WORLD.goons[goon.kind].reach);
};

/**
 * The order to draw goons in, far line first, so a nearer goon draws over a further one; ties
 * keep spawn order. The layer re-renders only when this order changes, never as a depth slides.
 */
export const resolveDepthOrder = (depths: ReadonlyMap<number, number>): number[] => {
  return [...depths.entries()]
    .sort(([leftIndex, left], [rightIndex, right]) => left - right || leftIndex - rightIndex)
    .map(([spawnIndex]) => spawnIndex);
};
