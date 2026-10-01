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

const round = (value: number): number => Math.round(value * 100) / 100;

/** The camera a `fill` fit resolves to inside a box of this size (any unit — only the aspect counts). */
export const resolveFillCamera = (
  fit: BrawlFillCameraFit,
  box: { width: number; height: number } | null
): BrawlCamera => {
  const aspect = box === null || box.height <= 0 ? 0 : box.width / box.height;

  return {
    x: fit.x ?? 0,
    y: fit.y ?? 0,
    width: Math.max(fit.minWidth, round(fit.height * aspect)),
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
