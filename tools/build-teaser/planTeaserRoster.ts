// The roster the online teaser ships: the night's own players and teams, reduced to what the
// lobby parade and the minigames draw with, and seated the way the server seats them at boot
// (players.json order, `player-N` / `team-N` ids, a player's `team` matched to a team name
// case-insensitively). Pure over the parsed files, so the planning is testable without a pack.

export type PlayerEntry = { name: string; team?: string; avatarSrc?: string };
export type TeamEntry = { name: string; genre?: string; color?: string };

export type TeaserPlayer = { id: string; name: string; avatarSrc?: string };
export type TeaserTeam = {
  id: string;
  name: string;
  playerIds: string[];
  totalScore: number;
  genre?: string;
  color?: string;
};

export type TeaserRoster = { players: TeaserPlayer[]; teams: TeaserTeam[] };

export type TeaserRosterPlan = {
  roster: TeaserRoster;
  // Pack-relative head paths (`avatars/rob.png`) to copy into the site, one per player who has
  // one. The site serves each at `/content-assets/<path>`, the path the party server uses.
  avatarSrcs: string[];
};

const toTeamMatchKey = (name: string): string => name.trim().toLowerCase();

export const planTeaserRoster = (
  playerEntries: readonly PlayerEntry[],
  teamEntries: readonly TeamEntry[]
): TeaserRosterPlan => {
  const teams: TeaserTeam[] = teamEntries.map((entry, index) => ({
    id: `team-${index + 1}`,
    name: entry.name.trim(),
    playerIds: [],
    totalScore: 0,
    ...(entry.genre === undefined ? {} : { genre: entry.genre.trim() }),
    ...(entry.color === undefined ? {} : { color: entry.color })
  }));
  const teamByMatchKey = new Map(teams.map((team) => [toTeamMatchKey(team.name), team]));
  const players: TeaserPlayer[] = [];
  const avatarSrcs: string[] = [];

  playerEntries.forEach((entry, index) => {
    const avatarSrc = entry.avatarSrc?.trim();
    const player: TeaserPlayer = {
      id: `player-${index + 1}`,
      name: entry.name.trim(),
      ...(avatarSrc ? { avatarSrc } : {})
    };

    players.push(player);

    if (avatarSrc) {
      avatarSrcs.push(avatarSrc);
    }

    const team = entry.team === undefined ? undefined : teamByMatchKey.get(toTeamMatchKey(entry.team));

    team?.playerIds.push(player.id);
  });

  return { roster: { players, teams }, avatarSrcs };
};
