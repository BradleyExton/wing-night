import { JOUST_WORLD } from "../../joust/world/index.js";
import type { JoustObstacle } from "../../joust/types.js";
import { validatePromptPackFile } from "../promptPack/index.js";
import type { ValidationIssue } from "../validationIssue/index.js";

/** How close to the slingshot a champ may stand: anything nearer is a tap, not a shot. */
export const JOUST_MIN_TARGET_X = JOUST_WORLD.anchor.x + 40;
/** Keeps the champ's balls on screen. */
export const JOUST_MAX_TARGET_X = JOUST_WORLD.width - 8;

// One arena in the pack: where the champ stands and what's in the way. Obstacle rectangles are
// top-left anchored in world units (160 wide, floor at 78 — see JOUST_WORLD), and the renderer
// draws every one of them as a cactus.
export type JoustPrompt = {
  id: string;
  name: string;
  targetX: number;
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

export const validateJoustPrompt = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = (["id", "name"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  if (
    !isFiniteNumber(value.targetX) ||
    !isWithin(value.targetX, JOUST_MIN_TARGET_X, JOUST_MAX_TARGET_X)
  ) {
    issues.push({
      path: "targetX",
      message: `must be a number between ${JOUST_MIN_TARGET_X} and ${JOUST_MAX_TARGET_X}`
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
