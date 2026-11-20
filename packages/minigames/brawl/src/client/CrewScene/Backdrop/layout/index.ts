import { BRAWL_CREW_WORLD, type BrawlCrewBlock } from "@wingnight/shared";

/**
 * Which stretch of Barrie a block is (docs/minigames/brawl-crew-spec.md §0.7): Dunlop Street
 * first, then the waterfront, then Centennial Beach ending at the Spirit Catcher — and every block
 * past the third is the beach again, because the course only gets harder, not longer in Barrie.
 */
export type BrawlSetting = "dunlop" | "waterfront" | "beach";

export const resolveBrawlSetting = (blockIndex: number): BrawlSetting => {
  if (blockIndex <= 0) {
    return "dunlop";
  }

  return blockIndex === 1 ? "waterfront" : "beach";
};

/**
 * The street's bands, in world units down the 192×108 window. The fight is on a BAND, not a line:
 * a figure at depth `z` (0 at the back, `BRAWL_CREW_WORLD.depth` nearest the camera) has its feet
 * at `bandBackY + z`. The band's back is the sim's own ground line, which is where every goon
 * drawing already stands itself, so a goon at the back of the band needs no move at all.
 *
 * On Dunlop the band is the road itself — the crew fights down the middle of the street, between
 * the far kerb and the near one. On the waterfront it is the boardwalk's planks, on the beach the
 * sand. Everything behind the band's back edge is scenery nobody can walk on.
 */
export const STREET_BANDS = {
  bandBackY: BRAWL_CREW_WORLD.groundY,
  bandFrontY: BRAWL_CREW_WORLD.groundY + BRAWL_CREW_WORLD.depth,
  /** Drawn well past the window's bottom, so a box of an odd shape never shows the page under it. */
  bottom: 124,
  /** Dunlop: where the fronts across the road stand, the far sidewalk, and the road between the kerbs. */
  farKerbY: 60,
  roadTop: 66,
  laneY: 86,
  roadBottom: 104,
  kerbBottom: 105.4,
  /** The water's far edge (Oro's shore) and its near edge, on the waterfront and the beach. */
  horizonY: 36,
  waterfrontShoreY: 56,
  beachShoreY: 63,
  /** The boardwalk's railing along its back edge on the waterfront, and where the planks begin. */
  railTop: 57,
  boardwalkTop: 65.5
} as const;

/** The screen y of a figure's feet at depth `z`: the only depth cue a flat brawler gets. */
export const resolveGroundY = (z: number): number => STREET_BANDS.bandBackY + z;

/** How far either side of a block the street is drawn: past both ends, and past a wide wall. */
export const resolveStreetExtent = (block: Pick<BrawlCrewBlock, "length">): { left: number; right: number } => {
  return { left: -240, right: block.length + 420 };
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
