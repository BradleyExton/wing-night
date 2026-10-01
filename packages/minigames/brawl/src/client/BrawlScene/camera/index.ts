import { BRAWL_WORLD } from "@wingnight/shared";

/**
 * The window a surface draws of the street, in world units: the SVG viewBox. Unlike SCHLONIC's
 * (where the runner is pinned and the zone scrolls under it), BRAWL's sim owns a camera of its
 * own — `frame.cameraX`, locked per wave — and the scene scrolls the street by it. So a camera
 * here is measured from the sim's camera's left edge: `x: 0` is the left edge the tablet sees,
 * and a wider window either reaches further down the street (`x` 0, a bigger `width`) or splits
 * its extra either side (a negative `x`).
 */
export type BrawlCamera = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * How a surface fits its camera into the box it has. `fixed` is a camera of one size,
 * letterboxed into the box; `fill` takes the box's whole area and widens the camera to match its
 * aspect, so a wider screen simply sees more street. `x` and `y` default to the sim camera's own
 * corner.
 */
export type BrawlFillCameraFit = {
  kind: "fill";
  x?: number;
  y?: number;
  height: number;
  minWidth: number;
  /** Put the width past `minWidth` on both sides of the sim's window rather than all to the right. */
  split?: boolean;
};

export type BrawlCameraFit = { kind: "fixed"; camera: BrawlCamera } | BrawlFillCameraFit;

/** The tablet's camera: the sim's own 160×90 box, exactly the window the hen is held inside. */
export const TABLET_CAMERA: BrawlCamera = {
  x: 0,
  y: 0,
  width: BRAWL_WORLD.width,
  height: BRAWL_WORLD.height
};

export const TABLET_CAMERA_FIT: BrawlCameraFit = { kind: "fixed", camera: TABLET_CAMERA };

/**
 * The TV's camera: the tablet's box widened to the arena's aspect, the extra street split either
 * side of it (docs/minigames/brawl-spec.md §3). Goons step onto the street `BRAWL_WORLD.spawnLead`
 * past the tablet's edges and walk in, so on the wall every one of them is in view before it
 * reaches the holder's frame, from the left as much as the right — the room is the hen's lookout
 * and "BEHIND YOU" is the team's job. Never narrower than the tablet's box.
 */
export const TV_CAMERA_FIT: BrawlFillCameraFit = {
  kind: "fill",
  x: 0,
  y: 0,
  height: BRAWL_WORLD.height,
  minWidth: BRAWL_WORLD.width,
  split: true
};

const round = (value: number): number => Math.round(value * 100) / 100;

/** The camera a `fill` fit resolves to inside a box of this size (any unit — only the aspect counts). */
export const resolveFillCamera = (
  fit: BrawlFillCameraFit,
  box: { width: number; height: number } | null
): BrawlCamera => {
  const aspect = box === null || box.height <= 0 ? 0 : box.width / box.height;
  const width = Math.max(fit.minWidth, round(fit.height * aspect));
  const extra = fit.split === true ? round((width - fit.minWidth) / 2) : 0;

  return {
    x: (fit.x ?? 0) - extra,
    y: fit.y ?? 0,
    width,
    height: fit.height
  };
};

export const resolveCamera = (
  fit: BrawlCameraFit,
  box: { width: number; height: number } | null
): BrawlCamera => {
  return fit.kind === "fixed" ? fit.camera : resolveFillCamera(fit, box);
};

/** The viewBox attribute for a camera. */
export const resolveViewBox = (camera: BrawlCamera): string => {
  return `${camera.x} ${camera.y} ${camera.width} ${camera.height}`;
};
