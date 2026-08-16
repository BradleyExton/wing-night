import {
  prefixIssuePaths,
  type ValidationIssue
} from "../validationIssue/index.js";

export type TeamsContentEntry = {
  name: string;
  genre?: string;
  anthems?: string[];
};

export type TeamsContentFile = {
  teams: TeamsContentEntry[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isNonEmptyStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every(isNonEmptyString);
};

export const validateTeamsContentEntry = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  if (!isNonEmptyString(value.name)) {
    issues.push({ path: "name", message: "must be a non-empty string" });
  }

  // Presence, not definedness — the same idiom `avatarSrc` uses in the players
  // validator. This validator is shared with contentWriter's save gate, so an
  // invalid value must fail identically on read and on write.
  if ("genre" in value && !isNonEmptyString(value.genre)) {
    issues.push({
      path: "genre",
      message: "must be a non-empty string when present"
    });
  }

  if ("anthems" in value && !isNonEmptyStringArray(value.anthems)) {
    issues.push({
      path: "anthems",
      message: "must be an array of non-empty strings when present"
    });
  }

  return issues;
};

export const validateTeamsContentFile = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  if (!Array.isArray(value.teams)) {
    return [{ path: "teams", message: "must be an array" }];
  }

  return value.teams.flatMap((entry, index) =>
    prefixIssuePaths(validateTeamsContentEntry(entry), `teams[${index}]`)
  );
};

export const isTeamsContentEntry = (value: unknown): value is TeamsContentEntry => {
  return validateTeamsContentEntry(value).length === 0;
};

export const isTeamsContentFile = (value: unknown): value is TeamsContentFile => {
  return validateTeamsContentFile(value).length === 0;
};
