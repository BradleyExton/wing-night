import type { BrawlBlock } from "@wingnight/shared";

/**
 * Which stretch of Barrie a block is (docs/minigames/brawl-spec.md §0.8): Dunlop Street first,
 * then the waterfront, then Centennial Beach ending at the Spirit Catcher — and every block past
 * the third is the beach again, because the course only gets harder, not longer in Barrie.
 */
export type BrawlSetting = "dunlop" | "waterfront" | "beach";

export const resolveBrawlSetting = (blockIndex: number): BrawlSetting => {
  if (blockIndex <= 0) {
    return "dunlop";
  }

  return blockIndex === 1 ? "waterfront" : "beach";
};

/**
 * The street's bands, in world units down the screen. The hen and the goons all stand on
 * `BRAWL_WORLD.groundY` (70), on the near side of the street; everything behind them — the road,
 * the far kerb and the buildings across it — sits higher up the frame, smaller, so the fight is
 * the nearest thing in the picture.
 */
export const STREET_BANDS = {
  /** Where the buildings across the road stand. */
  farKerbY: 47,
  roadTop: 50,
  laneY: 54.5,
  roadBottom: 59.5,
  /** The near kerb's lip, and the near sidewalk the fight is on, to the bottom of the box. */
  kerbBottom: 60.7,
  bottom: 96,
  /** The water's far edge (Oro's shore) and its near edge, on the waterfront and the beach. */
  horizonY: 33,
  waterfrontShoreY: 50,
  beachShoreY: 56,
  /** The boardwalk's railing on the waterfront. */
  railTop: 54.5,
  boardwalkTop: 61
} as const;

/** How far either side of a block the street is drawn: past both ends, and past a wide TV camera. */
export const resolveStreetExtent = (block: Pick<BrawlBlock, "length">): { left: number; right: number } => {
  return { left: -200, right: block.length + 360 };
};

/** Every `step` units across the extent, from the first multiple of `step` inside it. */
export const resolveStops = (extent: { left: number; right: number }, step: number, offset = 0): number[] => {
  const stops: number[] = [];

  for (let x = Math.ceil((extent.left - offset) / step) * step + offset; x <= extent.right; x += step) {
    stops.push(x);
  }

  return stops;
};

/**
 * The water's glints: short level strokes of the lamps and the moon on the bay, laid out from a
 * fixed little hash so every screen draws the same water.
 */
export const resolveGlints = (
  extent: { left: number; right: number },
  top: number,
  bottom: number
): { x: number; y: number; width: number }[] => {
  const glints: { x: number; y: number; width: number }[] = [];
  let seed = 7;

  for (let x = extent.left; x < extent.right; x += 9) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const share = (seed % 1000) / 1000;

    glints.push({
      x: x + share * 6,
      y: Math.round((top + 1 + share * (bottom - top - 2)) * 10) / 10,
      width: 1.5 + (seed % 7) * 0.5
    });
  }

  return glints;
};
