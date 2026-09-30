import { isRecord, isTeamColorToken, type Player, type Team } from "@wingnight/shared";

// The roster the online teaser draws with: the night's players and teams, as
// tools/build-teaser wrote them to `/teaser-roster.json`. The file is the site's
// own, but it is still read off the network, so it is checked rather than cast —
// a malformed one leaves the teaser on the minigame's bundled fixture instead of
// a lobby of undefined names.
export type TeaserRoster = {
  players: Player[];
  teams: Team[];
};

export const TEASER_ROSTER_PATH = "/teaser-roster.json";

const toPlayer = (value: unknown): Player | null => {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }

  return typeof value.avatarSrc === "string"
    ? { id: value.id, name: value.name, avatarSrc: value.avatarSrc }
    : { id: value.id, name: value.name };
};

const toTeam = (value: unknown): Team | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !Array.isArray(value.playerIds) ||
    !value.playerIds.every((playerId) => typeof playerId === "string")
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    playerIds: [...(value.playerIds as string[])],
    totalScore: 0,
    ...(typeof value.genre === "string" ? { genre: value.genre } : {}),
    ...(isTeamColorToken(value.color) ? { color: value.color } : {})
  };
};

export const parseTeaserRoster = (value: unknown): TeaserRoster | null => {
  if (!isRecord(value) || !Array.isArray(value.players) || !Array.isArray(value.teams)) {
    return null;
  }

  const players = value.players.map(toPlayer);
  const teams = value.teams.map(toTeam);

  if (players.some((player) => player === null) || teams.some((team) => team === null)) {
    return null;
  }

  const seatedTeams = (teams as Team[]).filter((team) => team.playerIds.length > 0);

  return seatedTeams.length === 0 ? null : { players: players as Player[], teams: seatedTeams };
};
