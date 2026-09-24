import {
  JOUST_PIN_HEAD_RADIUS,
  JOUST_RACK_LEFT,
  JOUST_RACK_RIGHT,
  JOUST_RACK_TOP,
  JOUST_WORLD,
  resolveLaneSlots
} from "../../joust/world/index.js";
import { JOUST_OBSTACLE_KINDS } from "../../joust/types.js";
import type { JoustObstacle, JoustPerch } from "../../joust/types.js";
import { validatePromptPackFile } from "../promptPack/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

/** The ends of the lane a perch has to live between, and the highest it may lift anybody. */
export const JOUST_MIN_PERCH_X = JOUST_RACK_LEFT;
export const JOUST_MAX_PERCH_X = JOUST_RACK_RIGHT;
export const JOUST_MIN_PERCH_Y = JOUST_RACK_TOP;
/** Narrower than this and nobody fits on it. */
export const JOUST_MIN_PERCH_WIDTH = JOUST_PIN_HEAD_RADIUS * 2;
/**
 * The party this game is built for: fifteen at the table. Teams are dealt three or four deep, and
 * the rack is everybody who is NOT on the shooting team — so the SMALLEST team faces the BIGGEST
 * rack. Three shooting leaves twelve standing, and that is the number a lane has to hold.
 */
const JOUST_TUNED_ROSTER_SIZE = 15;
const JOUST_SMALLEST_TEAM_SIZE = 3;
/**
 * Two spare chairs on top. A lane authored right at twelve breaks the night the moment two more
 * people show up, and nobody re-authors lanes at a party — the headroom is what makes the floor
 * survive a roster that grows.
 */
const JOUST_ROSTER_HEADROOM = 2;

/**
 * How many players a lane must seat on its OWN perches before it may ship.
 *
 * A lane cannot know the night's roster, and two things quietly shrink one: a shelf hung too low
 * shades out the sand beneath it, and a tower's legs eat the spots they stand on. Seat fewer than
 * the rack and `resolveJoustRackLayout` abandons the lane entirely — every tower gone, everybody
 * dumped on one bare row worth a point each, birds overlapping. That fallback is a last resort for
 * a roster nobody built for, not a thing to discover on the TV mid-party.
 *
 * So the floor is the worst rack a tuned night can produce, plus room to grow:
 * (15 roster + 2 headroom) − 3 on the smallest shooting team = 14. The shipped sample lanes seat
 * 15, 15, 15 and 17. DO NOT LOWER THIS to make a lane pass — widen the lane's shelves, or raise
 * the one hanging over the sand.
 */
export const JOUST_MIN_LANE_CAPACITY =
  JOUST_TUNED_ROSTER_SIZE + JOUST_ROSTER_HEADROOM - JOUST_SMALLEST_TEAM_SIZE;

// One lane in the pack: the structures players are stood on, and what else is in the way. How
// MANY players stand there is not content — it is however many are not on the shooting team that
// night, dealt across the perches — so a lane is authored as SHELVES, not as positions. A perch
// at the floor is the sand; a higher one grows its own slab and legs and is solid. Obstacle
// rectangles are top-left anchored in world units (160 wide, floor at 78 — see JOUST_WORLD), and
// the renderer draws every one of them as a beach prop — its optional `kind` says which.
export type JoustPrompt = {
  id: string;
  name: string;
  perches: JoustPerch[];
  obstacles: JoustObstacle[];
};

export type JoustContentFile = {
  prompts: JoustPrompt[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isWithin = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

export const validateJoustObstacle = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  for (const field of ["x", "y", "width", "height"] as const) {
    if (!isFiniteNumber(value[field])) {
      issues.push({ path: field, message: "must be a finite number" });
    }
  }

  // `kind` is skin, and optional: a pack may leave it off, but may not invent one.
  if (
    value.kind !== undefined &&
    !JOUST_OBSTACLE_KINDS.some((kind) => kind === value.kind)
  ) {
    issues.push({ path: "kind", message: `must be one of ${JOUST_OBSTACLE_KINDS.join(", ")}` });
  }

  if (issues.length > 0) {
    return issues;
  }

  const x = value.x as number;
  const y = value.y as number;
  const width = value.width as number;
  const height = value.height as number;

  if (width <= 0) {
    issues.push({ path: "width", message: "must be greater than 0" });
  }

  if (height <= 0) {
    issues.push({ path: "height", message: "must be greater than 0" });
  }

  if (!isWithin(x, 0, JOUST_WORLD.width) || !isWithin(x + width, 0, JOUST_WORLD.width)) {
    issues.push({
      path: "x",
      message: `must keep the obstacle between 0 and ${JOUST_WORLD.width}`
    });
  }

  if (!isWithin(y, 0, JOUST_WORLD.floorY) || !isWithin(y + height, 0, JOUST_WORLD.floorY)) {
    issues.push({
      path: "y",
      message: `must keep the obstacle between 0 and the floor at ${JOUST_WORLD.floorY}`
    });
  }

  return issues;
};

export const validateJoustPerch = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  for (const field of ["x", "y", "width"] as const) {
    if (!isFiniteNumber(value[field])) {
      issues.push({ path: field, message: "must be a finite number" });
    }
  }

  if (issues.length > 0) {
    return issues;
  }

  const x = value.x as number;
  const y = value.y as number;
  const width = value.width as number;

  if (width < JOUST_MIN_PERCH_WIDTH) {
    issues.push({
      path: "width",
      message: `must be at least ${JOUST_MIN_PERCH_WIDTH} so a player fits on it`
    });
  }

  if (!isWithin(x, JOUST_MIN_PERCH_X, JOUST_MAX_PERCH_X) || x + width > JOUST_MAX_PERCH_X) {
    issues.push({
      path: "x",
      message: `must keep the perch between ${JOUST_MIN_PERCH_X} and ${JOUST_MAX_PERCH_X}`
    });
  }

  if (!isWithin(y, JOUST_MIN_PERCH_Y, JOUST_WORLD.floorY)) {
    issues.push({
      path: "y",
      message: `must be between ${JOUST_MIN_PERCH_Y} and the floor at ${JOUST_WORLD.floorY}`
    });
  }

  return issues;
};

export const validateJoustPrompt = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = (["id", "name"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  if (!Array.isArray(value.perches) || value.perches.length === 0) {
    issues.push({ path: "perches", message: "must be a non-empty array" });
  } else {
    value.perches.forEach((perch, index) => {
      for (const issue of validateJoustPerch(perch)) {
        issues.push({
          path: issue.path === "" ? `perches[${index}]` : `perches[${index}].${issue.path}`,
          message: issue.message
        });
      }
    });
  }

  if (!Array.isArray(value.obstacles)) {
    issues.push({ path: "obstacles", message: "must be an array" });
    return issues;
  }

  value.obstacles.forEach((obstacle, index) => {
    for (const issue of validateJoustObstacle(obstacle)) {
      issues.push({
        path: issue.path === "" ? `obstacles[${index}]` : `obstacles[${index}].${issue.path}`,
        message: issue.message
      });
    }
  });

  if (issues.length === 0) {
    const capacity = resolveLaneSlots(value.perches as JoustPerch[]).reduce(
      (total, slots) => total + slots.length,
      0
    );

    if (capacity < JOUST_MIN_LANE_CAPACITY) {
      issues.push({
        path: "perches",
        message: `must seat at least ${JOUST_MIN_LANE_CAPACITY} players between them, but this lane seats ${capacity} — a shelf may be hanging too low over the sand, or a tower's legs may be standing where players would`
      });
    }
  }

  return issues;
};

export const validateJoustContentFile = (value: unknown): ValidationIssue[] => {
  return validatePromptPackFile(value, validateJoustPrompt);
};

export const isJoustPrompt = (value: unknown): value is JoustPrompt => {
  return validateJoustPrompt(value).length === 0;
};

export const isJoustContentFile = (value: unknown): value is JoustContentFile => {
  return validateJoustContentFile(value).length === 0;
};
