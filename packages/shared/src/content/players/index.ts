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

export const isPlayersContentEntry = (
  value: unknown
): value is PlayersContentEntry => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("name" in value) || !isNonEmptyString(value.name)) {
    return false;
  }

  if (!("avatarSrc" in value)) {
    return true;
  }

  return isNonEmptyString(value.avatarSrc);
};

export const isPlayersContentFile = (
  value: unknown
): value is PlayersContentFile => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("players" in value) || !Array.isArray(value.players)) {
    return false;
  }

  return value.players.every((entry) => isPlayersContentEntry(entry));
};
