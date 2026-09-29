import { SCHLONIC_WORLD } from "@wingnight/shared";

/**
 * The window a surface draws of the world, in world units: the SVG viewBox. The runner is
 * always drawn at `SCHLONIC_WORLD.runnerX` and the zone scrolls under it, so a camera never
 * moves — it only says how much of the world either side of the runner a screen gets to see.
 * Everything to the right of the runner is lead: the zone the viewer sees before the runner
 * reaches it.
 */
export type SchlonicCamera = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * How a surface fits its camera into the box it has. `fixed` is a camera of one size,
 * letterboxed into the box; `fill` takes the box's whole area and widens the camera to
 * match its aspect, so a wider screen simply sees further down the street.
 */
export type SchlonicFillCameraFit = {
  kind: "fill";
  x: number;
  y: number;
  height: number;
  minWidth: number;
};

export type SchlonicCameraFit = { kind: "fixed"; camera: SchlonicCamera } | SchlonicFillCameraFit;

/** The tablet's camera: the sim's own 16:9 box, the runner 46 units in from the left edge. */
export const TABLET_CAMERA: SchlonicCamera = {
  x: 0,
  y: 0,
  width: SCHLONIC_WORLD.width,
  height: SCHLONIC_WORLD.height
};

export const TABLET_CAMERA_FIT: SchlonicCameraFit = { kind: "fixed", camera: TABLET_CAMERA };

/**
 * The TV's camera. The room's seat is not a mirror of the tablet's (docs/minigame-design-
 * principles.md §3): the wall fills its whole arena, keeps the runner close to the left edge,
 * and shows the street further ahead than the tablet does — a hazard is on the TV a beat or more
 * before it is on the tablet, which makes the couch the runner's lookout and "JUMP!" the whole
 * team's job. A little more sky above and ground below than the tablet's box, because a
 * springboard throws the bird to the top of the world and the wall has the height to spare.
 */
export const TV_CAMERA_FIT: SchlonicFillCameraFit = {
  kind: "fill",
  x: 12,
  y: -6,
  height: 100,
  minWidth: 200
};

const round = (value: number): number => Math.round(value * 100) / 100;

/** The camera a `fill` fit resolves to inside a box of this size (any unit — only the aspect counts). */
export const resolveFillCamera = (
  fit: SchlonicFillCameraFit,
  box: { width: number; height: number } | null
): SchlonicCamera => {
  const aspect = box === null || box.height <= 0 ? 0 : box.width / box.height;

  return {
    x: fit.x,
    y: fit.y,
    width: Math.max(fit.minWidth, round(fit.height * aspect)),
    height: fit.height
  };
};

export const resolveCamera = (
  fit: SchlonicCameraFit,
  box: { width: number; height: number } | null
): SchlonicCamera => {
  return fit.kind === "fixed" ? fit.camera : resolveFillCamera(fit, box);
};

/** How much zone a camera shows ahead of the runner, in world units. */
export const resolveCameraLead = (camera: SchlonicCamera): number => {
  return camera.x + camera.width - SCHLONIC_WORLD.runnerX;
};

/** The same lead as seconds of running at the legs' top speed: what the viewer's warning is worth. */
export const resolveCameraLeadSeconds = (camera: SchlonicCamera): number => {
  return resolveCameraLead(camera) / (SCHLONIC_WORLD.topSpeed * SCHLONIC_WORLD.tickHz);
};
