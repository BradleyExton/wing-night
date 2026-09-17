import {
  toTeamMatchKey,
  type Player,
  type PlayersContentEntry,
  type Team
} from "@wingnight/shared";

type SeatPresetRostersInput = {
  // Index-aligned with `players`, which is guaranteed by `toPlayers` deriving
  // ids positionally from these same entries.
  playerEntries: readonly PlayersContentEntry[];
  players: readonly Player[];
  teams: readonly Team[];
};

// Joins the two roster files into seated teams: a player entry naming a team
// lands in that team's `playerIds`, in `players.json` order.
//
// Pure, and the join belongs HERE rather than in either loader, because neither
// loader can see the other's file — `loadPlayers` has no teams and `loadTeams`
// has no players.
//
// A name matching no team THROWS, rather than leaving the player unassigned.
// `AGENTS.md` §8 is explicit that invalid content blocks start with a clear
// error, and the silent alternative is worse in exactly the situation this
// feature exists for: a typo would surface as one guest quietly missing from a
// team at the party, which is when nobody is reading server logs. The wizard
// blocks the same mistake before it reaches disk (`validateRosterAssignments`),
// so this throw is the backstop for a hand-edited file, not the first line of
// defence.
export const seatPresetRosters = ({
  playerEntries,
  players,
  teams
}: SeatPresetRostersInput): Team[] => {
  const seatedTeams = teams.map((team) => ({ ...team, playerIds: [...team.playerIds] }));
  const teamByMatchKey = new Map(
    seatedTeams.map((team) => [toTeamMatchKey(team.name), team])
  );
  const unmatchedAssignments: string[] = [];

  playerEntries.forEach((entry, entryIndex) => {
    const declaredTeam = entry.team?.trim();
    const player = players[entryIndex];

    if (declaredTeam === undefined || declaredTeam.length === 0 || player === undefined) {
      return;
    }

    const team = teamByMatchKey.get(toTeamMatchKey(declaredTeam));

    if (team === undefined) {
      unmatchedAssignments.push(`"${entry.name.trim()}" → "${declaredTeam}"`);

      return;
    }

    team.playerIds.push(player.id);
  });

  if (unmatchedAssignments.length > 0) {
    throw new Error(
      `Invalid players content: ${unmatchedAssignments.join(", ")} names a team that teams.json does not declare. Known teams: ${seatedTeams
        .map((team) => `"${team.name}"`)
        .join(", ")}.`
    );
  }

  return seatedTeams;
};
