import {
  prefixIssuePaths,
  type ValidationIssue
} from "../validationIssue/index.js";

export type TeamsContentEntry = {
  name: string;
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

export const validateTeamsContentEntry = (value: unknown): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  if (!isNonEmptyString(value.name)) {
    return [{ path: "name", message: "must be a non-empty string" }];
  }

  return [];
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
