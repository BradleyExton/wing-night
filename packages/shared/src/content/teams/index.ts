export type TeamsContentEntry = {
  name: string;
};

export type TeamsContentFile = {
  teams: TeamsContentEntry[];
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isTeamsContentEntry = (value: unknown): value is TeamsContentEntry => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("name" in value) || !isNonEmptyString(value.name)) {
    return false;
  }

  return true;
};

export const isTeamsContentFile = (value: unknown): value is TeamsContentFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("teams" in value) || !Array.isArray(value.teams)) {
    return false;
  }

  return value.teams.every((entry) => isTeamsContentEntry(entry));
};
