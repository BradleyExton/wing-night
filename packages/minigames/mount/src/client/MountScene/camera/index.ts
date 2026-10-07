import {
  MOUNT_PARTICLES,
  MOUNT_WORLD,
  resolveMountCrown,
  resolveMountPileBounds,
  type MountPile,
  type MountPose,
  type MountVec
} from "@wingnight/shared";

/** The window a surface draws of the world, in world units (y down, the floor at y 0): a viewBox. */
export type MountCamera = { x: number; y: number; width: number; height: number };

/**
 * How a surface frames the climb (spec §0.5, after `BrawlScene/camera`). `follow` is the tablet's
 * close-up: the sim's 240×150 box riding the climber's torso. `fit-all` is the room's: the whole
 * pile, the start stance, the climber and the line, however tall the mountain has got.
 */
export type MountCameraFit = { kind: "follow" } | { kind: "fit-all" };

export const TABLET_CAMERA_FIT: MountCameraFit = { kind: "follow" };
export const TV_CAMERA_FIT: MountCameraFit = { kind: "fit-all" };

/**
 * How much boardwalk shows under the floor line. Enough that a hen standing on the floor stands
 * clear of the tablet's bottom-left buttons (the `actions` row floats over the body), never a
 * horizon of dirt.
 */
export const GROUND_SHOWN = 26;
/** The room's margin around everything it frames. */
export const FIT_MARGIN = 20;
/** The room's camera is never shorter than this, so the bare goose is not a close-up. */
export const FIT_MIN_HEIGHT = 220;
/** Room above the line for the holder's name tag, so the fit-all never crops it. */
export const LINE_HEADROOM = 22;

const HEAD_REACH = MOUNT_WORLD.rig.head.r;

/** The aspect a surface assumes before its box has been measured: the tablet's 16:10, the TV's 16:9. */
export const FALLBACK_ASPECT: Record<MountCameraFit["kind"], number> = { follow: 16 / 10, "fit-all": 16 / 9 };

/** The middle of the torso's four particles: what the tablet's close-up follows. */
export const resolveTorsoCentre = (pose: MountPose): MountVec => ({
  x: (pose.rump.x + pose.neck.x + pose.hipLeft.x + pose.hipRight.x) / 4,
  y: (pose.rump.y + pose.neck.y + pose.hipLeft.y + pose.hipRight.y) / 4
});

/**
 * The tablet's close-up: the sim's view box centred on `focus`, widened to the box's aspect so
 * nothing is stretched (a box squarer than 16:10 gets taller instead), and held down so the floor
 * never rises above the bottom edge.
 */
export const resolveFollowCamera = (focus: MountVec, aspect: number): MountCamera => {
  const { width: viewWidth, height: viewHeight } = MOUNT_WORLD.view;
  const wide = aspect >= viewWidth / viewHeight;
  const width = wide ? viewHeight * aspect : viewWidth;
  const height = wide ? viewHeight : viewWidth / aspect;
  const y = Math.min(focus.y - height / 2, GROUND_SHOWN - height);

  return { x: focus.x - width / 2, y, width, height };
};

export type MountExtent = { minX: number; maxX: number; minY: number };

/** Everything the room must see: the pile, every pose handed in (the start stance, the climber) and the line. */
export const resolveMountExtent = (pile: MountPile, poses: readonly MountPose[]): MountExtent => {
  const bounds = resolveMountPileBounds(pile);
  let { minX, maxX, minY } = bounds;

  for (const pose of poses) {
    for (const particle of MOUNT_PARTICLES) {
      minX = Math.min(minX, pose[particle].x - HEAD_REACH);
      maxX = Math.max(maxX, pose[particle].x + HEAD_REACH);
      minY = Math.min(minY, pose[particle].y - HEAD_REACH);
    }

    minY = Math.min(minY, resolveMountCrown(pose).y);
  }

  minY = Math.min(minY, MOUNT_WORLD.floorY - pile.highLine.height - LINE_HEADROOM);

  return { minX, maxX, minY };
};

/**
 * The room's camera: the extent plus a margin, never shorter than `FIT_MIN_HEIGHT`, widened (or
 * heightened) to the box's aspect about the extent's middle, its bottom on the ground.
 */
export const resolveFitCamera = (extent: MountExtent, aspect: number): MountCamera => {
  const bottom = GROUND_SHOWN;
  const top = extent.minY - FIT_MARGIN;
  const contentWidth = extent.maxX - extent.minX + FIT_MARGIN * 2;
  const contentHeight = Math.max(FIT_MIN_HEIGHT, bottom - top);
  const width = Math.max(contentWidth, contentHeight * aspect);
  const height = width / aspect;
  const centreX = (extent.minX + extent.maxX) / 2;

  return { x: centreX - width / 2, y: bottom - height, width, height };
};

/** A step of `share` of the way from `from` to `to`: the scene's ease, once a frame. */
export const easeCamera = (from: MountCamera, to: MountCamera, share: number): MountCamera => ({
  x: from.x + (to.x - from.x) * share,
  y: from.y + (to.y - from.y) * share,
  width: from.width + (to.width - from.width) * share,
  height: from.height + (to.height - from.height) * share
});

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** The viewBox attribute for a camera. */
export const resolveViewBox = (camera: MountCamera): string => {
  return `${round2(camera.x)} ${round2(camera.y)} ${round2(camera.width)} ${round2(camera.height)}`;
};

/** The camera as the scene's `data-mount-camera` carries it: `x y w h`, whole world units. */
export const formatMountCamera = (camera: MountCamera): string => {
  return [camera.x, camera.y, camera.width, camera.height].map((value) => `${Math.round(value)}`).join(" ");
};
