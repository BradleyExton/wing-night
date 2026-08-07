import {
  prefixIssuePaths,
  type ValidationIssue
} from "../validationIssue/index.js";

export type PlayersContentEntry = {
  name: string;
  avatarSrc?: string;
};

export type PlayersContentFile = {
  players: PlayersContentEntry[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isObjectLike = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

export const validatePlayersContentEntry = (
  value: unknown
): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  const issues: ValidationIssue[] = [];

  if (!isNonEmptyString(value.name)) {
    issues.push({ path: "name", message: "must be a non-empty string" });
  }

  // Presence, not definedness: an explicit `avatarSrc: undefined` has always
  // been rejected here, so the key test stays `in` rather than `!== undefined`.
  if ("avatarSrc" in value && !isNonEmptyString(value.avatarSrc)) {
    issues.push({
      path: "avatarSrc",
      message: "must be a non-empty string when present"
    });
  }

  return issues;
};

export const validatePlayersContentFile = (
  value: unknown
): ValidationIssue[] => {
  if (!isObjectLike(value)) {
    return [{ path: "", message: "must be an object" }];
  }

  if (!Array.isArray(value.players)) {
    return [{ path: "players", message: "must be an array" }];
  }

  return value.players.flatMap((entry, index) =>
    prefixIssuePaths(validatePlayersContentEntry(entry), `players[${index}]`)
  );
};

export const isPlayersContentEntry = (
  value: unknown
): value is PlayersContentEntry => {
  return validatePlayersContentEntry(value).length === 0;
};

export const isPlayersContentFile = (
  value: unknown
): value is PlayersContentFile => {
  return validatePlayersContentFile(value).length === 0;
};
