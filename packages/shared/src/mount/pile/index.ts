import { createMulberry32, pickInteger } from "../../seededRandom/index.js";
import type {
  MountClimbResult,
  MountClimbRules,
  MountGooseStance,
  MountPile,
  MountPose,
  MountShape,
  MountVec
} from "../types.js";
import { placeCrown, resolvePoseShapes } from "../rig/index.js";
import { MOUNT_WORLD } from "../world/index.js";

/** The order the seed deals from. Fixed: reordering it re-deals every round's goose. */
const GOOSE_STANCES: readonly MountGooseStance[] = ["stand", "honk", "preen"];

/** The round's first pile: the plinth, the goose in the stance the seed deals, the line at its top. */
export const createMountPile = (seed: number): MountPile => {
  const random = createMulberry32(seed);
  const goose = GOOSE_STANCES[pickInteger(random, 0, GOOSE_STANCES.length - 1)] ?? "stand";
  const { top, topX } = MOUNT_WORLD.goose[goose];

  return { seed, goose, hens: [], highLine: { height: top, x: topX, playerId: null } };
};

/** A climb's clock in ticks: (climbSeconds + secondsPerHen × hensOnPile) × tickHz. */
export const resolveMountClimbTicks = (rules: MountClimbRules, hensOnPile: number): number => {
  return (rules.climbSeconds + rules.secondsPerHen * hensOnPile) * MOUNT_WORLD.tickHz;
};

const resolvePlinthShapes = (): MountShape[] => {
  const { halfWidth, height, edgeRadius } = MOUNT_WORLD.plinth;
  const surface = { kind: "plinth" } as const;
  const topLeft = { x: -halfWidth, y: -height };
  const topRight = { x: halfWidth, y: -height };

  return [
    { kind: "capsule", a: topLeft, b: topRight, r: edgeRadius, surface },
    { kind: "capsule", a: topLeft, b: { x: -halfWidth, y: MOUNT_WORLD.floorY }, r: edgeRadius, surface },
    { kind: "capsule", a: topRight, b: { x: halfWidth, y: MOUNT_WORLD.floorY }, r: edgeRadius, surface }
  ];
};

/** The pile as static shapes: plinth, goose, and each stuck hen's body, head, legs and near wing. */
export const resolveMountPileMesh = (pile: MountPile): MountShape[] => {
  const shapes = [...resolvePlinthShapes(), ...MOUNT_WORLD.goose[pile.goose].shapes];

  for (const hen of pile.hens) {
    shapes.push(...resolvePoseShapes(hen.pose, { kind: "hen", pileIndex: hen.pileIndex }));
  }

  return shapes;
};

/** A shape's box: leftmost, rightmost, top and bottom, radius included. */
export const resolveMountShapeBox = (shape: MountShape): { minX: number; maxX: number; minY: number; maxY: number } => {
  if (shape.kind === "circle") {
    return { minX: shape.c.x - shape.r, maxX: shape.c.x + shape.r, minY: shape.c.y - shape.r, maxY: shape.c.y + shape.r };
  }

  return {
    minX: Math.min(shape.a.x, shape.b.x) - shape.r,
    maxX: Math.max(shape.a.x, shape.b.x) + shape.r,
    minY: Math.min(shape.a.y, shape.b.y) - shape.r,
    maxY: Math.max(shape.a.y, shape.b.y) + shape.r
  };
};

/** The pile's extent, for the TV's fit-all camera and the start stance: leftmost, rightmost, top. */
export const resolveMountPileBounds = (pile: MountPile): { minX: number; maxX: number; minY: number } => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;

  for (const shape of resolveMountPileMesh(pile)) {
    const box = resolveMountShapeBox(shape);
    minX = Math.min(minX, box.minX);
    maxX = Math.max(maxX, box.maxX);
    minY = Math.min(minY, box.minY);
  }

  return { minX, maxX, minY };
};

/** Where a pose's crown is, and how high. */
export const resolveMountCrown = (pose: MountPose): MountVec => placeCrown(pose.neck, pose.beak);

/** The pile with a finished climb's hen added; on a mount the line moves to its crown. */
export const addMountHen = (pile: MountPile, result: MountClimbResult): MountPile => {
  const pileIndex = pile.hens.length;
  const hen = { ...result.hen, pileIndex };

  if (!result.hen.mounted) {
    return { ...pile, hens: [...pile.hens, hen] };
  }

  const crown = resolveMountCrown(hen.pose);

  return {
    ...pile,
    hens: [...pile.hens, hen],
    highLine: { height: MOUNT_WORLD.floorY - crown.y, x: crown.x, playerId: hen.playerId }
  };
};
