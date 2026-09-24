import type { JoustShooterProfile } from "../../../joust/types.js";
import type { ValidationIssue } from "../../validationIssue/index.js";

/**
 * The three inks one kind of projectile is drawn in: its body, its outline and its gloss. Drawing
 * content, like the sand and the cacti, so exempt from the two-accent budget — but a pack author
 * should keep them off the eight team colours, because the cast hens in the lane wear those.
 */
export type JoustShooterColor = {
  fill: string;
  dark: string;
  light: string;
};

/**
 * One kind of projectile the shooter can load. `profile` is a diff against the Standard profile
 * (`JOUST_STANDARD_SHOOTER_PROFILE`): a kind that leaves a lever out flies with today's value for
 * it. `usesPerTurn` absent means the team may fire it as often as it likes.
 */
export type JoustShooterKind = {
  id: string;
  name: string;
  blurb: string;
  color: JoustShooterColor;
  usesPerTurn?: number;
  profile?: Partial<JoustShooterProfile>;
};

/**
 * The band each lever is allowed inside. These are not taste: outside them the integrator stops
 * being sane. A shaft wider than the pull radius plants itself in the floor at rest; a mass share
 * of 0 is a body nothing can move and 1 is a body that moves nothing; restitution near 1 never
 * settles, so the track runs to its cap on every shot; a launch scale past 1.4 clears the world
 * before the first keyframe, and under 0.5 never reaches the rack at all.
 */
export const JOUST_SHOOTER_PROFILE_RANGES: Readonly<
  Record<keyof JoustShooterProfile, readonly [min: number, max: number]>
> = {
  shaftRadius: [0.8, 5],
  headRadius: [1, 7],
  ballRadius: [0.5, 5],
  linkSpacing: [1.5, 6],
  massShare: [0.01, 1],
  legShare: [0.01, 1],
  restitution: [0, 0.95],
  slip: [0, 1],
  bendStiffness: [0, 1],
  damping: [0.9, 1],
  launchSpeedScale: [0.5, 1.4]
};

const PROFILE_KEYS = Object.keys(JOUST_SHOOTER_PROFILE_RANGES) as (keyof JoustShooterProfile)[];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

export const validateJoustShooterProfile = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  for (const key of Object.keys(value)) {
    if (!PROFILE_KEYS.includes(key as keyof JoustShooterProfile)) {
      issues.push({
        path: key,
        message: `is not a profile lever (expected one of ${PROFILE_KEYS.join(", ")})`
      });
    }
  }

  for (const key of PROFILE_KEYS) {
    if (!(key in value) || value[key] === undefined) {
      continue;
    }

    const lever = value[key];
    const [min, max] = JOUST_SHOOTER_PROFILE_RANGES[key];

    if (!isFiniteNumber(lever)) {
      issues.push({ path: key, message: "must be a finite number" });
    } else if (lever < min || lever > max) {
      issues.push({ path: key, message: `must be between ${min} and ${max}` });
    }
  }

  return issues;
};

const validateColor = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object with fill, dark and light" }];
  }

  return (["fill", "dark", "light"] as const)
    .filter((ink) => typeof value[ink] !== "string" || !HEX_COLOR.test(value[ink]))
    .map((ink) => ({ path: ink, message: "must be a #rrggbb colour" }));
};

const prefixed = (prefix: string, issues: ValidationIssue[]): ValidationIssue[] => {
  return issues.map((issue) => ({
    path: issue.path === "" ? prefix : `${prefix}.${issue.path}`,
    message: issue.message
  }));
};

export const validateJoustShooter = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = (["id", "name", "blurb"] as const)
    .filter((field) => !isNonEmptyString(value[field]))
    .map((field) => ({ path: field, message: "must be a non-empty string" }));

  issues.push(...prefixed("color", validateColor(value.color)));

  if ("usesPerTurn" in value && value.usesPerTurn !== undefined) {
    if (!Number.isInteger(value.usesPerTurn) || (value.usesPerTurn as number) < 1) {
      issues.push({ path: "usesPerTurn", message: "must be a positive integer, or left out" });
    }
  }

  if ("profile" in value && value.profile !== undefined) {
    issues.push(...prefixed("profile", validateJoustShooterProfile(value.profile)));
  }

  return issues;
};

/**
 * The whole `shooters` array of a JOUST content file. An absent array is fine — the game then
 * loads the Standard kind alone and the picker stays hidden — but a present one must be a
 * non-empty array of well-formed kinds with unique ids, because a picker over a broken loadout
 * is worse than none.
 */
export const validateJoustShooters = (value: unknown): ValidationIssue[] => {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return [{ path: "shooters", message: "must be an array of shooter kinds, or left out" }];
  }

  if (value.length === 0) {
    return [{ path: "shooters", message: "must contain at least one kind, or be left out" }];
  }

  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  value.forEach((kind, index) => {
    issues.push(...prefixed(`shooters[${index}]`, validateJoustShooter(kind)));

    const id = isObjectLike(kind) && typeof kind.id === "string" ? kind.id : null;

    if (id === null) {
      return;
    }

    if (seenIds.has(id)) {
      issues.push({
        path: `shooters[${index}].id`,
        message: `must be unique within the pack ("${id}" is already used)`
      });
      return;
    }

    seenIds.add(id);
  });

  return issues;
};

export const isJoustShooter = (value: unknown): value is JoustShooterKind => {
  return validateJoustShooter(value).length === 0;
};
