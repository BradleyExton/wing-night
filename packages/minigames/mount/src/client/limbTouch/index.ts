import { MOUNT_LIMBS, MOUNT_WORLD, type MountLimb, type MountPose, type MountVec } from "@wingnight/shared";

/** A point on the log's grid: each coordinate a multiple of `inputQuantum` (the reducer refuses anything else). */
export const quantiseMountPoint = (point: MountVec): MountVec => {
  const quantum = MOUNT_WORLD.inputQuantum;

  return { x: Math.round(point.x / quantum) * quantum, y: Math.round(point.y / quantum) * quantum };
};

/**
 * The limb a touch takes (spec §0.5): the nearest tip within `touchRadius` that no other finger
 * already owns, so two thumbs can hold two limbs. Null for a touch on nothing.
 */
export const pickMountLimb = (
  point: MountVec,
  pose: MountPose,
  owned: ReadonlySet<MountLimb>
): MountLimb | null => {
  let best: MountLimb | null = null;
  let bestDistance = MOUNT_WORLD.touchRadius;

  for (const limb of MOUNT_LIMBS) {
    if (owned.has(limb)) {
      continue;
    }

    const distance = Math.hypot(pose[limb].x - point.x, pose[limb].y - point.y);

    if (distance <= bestDistance) {
      best = limb;
      bestDistance = distance;
    }
  }

  return best;
};

/** Whether a limb may log another `move` at `tick`: at most one every `moveSampleTicks`. */
export const isMoveDue = (lastMoveTick: number | null, tick: number): boolean => {
  return lastMoveTick === null || tick >= lastMoveTick + MOUNT_WORLD.moveSampleTicks;
};
