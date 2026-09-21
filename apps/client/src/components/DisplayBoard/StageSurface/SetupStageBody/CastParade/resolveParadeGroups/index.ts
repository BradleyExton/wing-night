import type { Player, Team, TeamTheme } from "@wingnight/shared";
import type { CharacterApparel, CharacterDance, CharacterSilhouette } from "@wingnight/cast";

import { resolveTeamTheme } from "../../../../../../utils/resolveTeamTheme";

// Who parades together. A group is a team's rostered players in their team's
// look; players seated nowhere yet parade as one group of their own, in the
// cast's warm neutral, so nobody is missing from the floor while the host is
// still seating the room. Pairs are consecutive groups: the first walks in
// from the left, the second from the right, and an odd last group walks in
// alone.
export type ParadeGroup = {
  id: string;
  players: Player[];
  apparel: CharacterApparel | undefined;
  silhouette: CharacterSilhouette | undefined;
  dance: CharacterDance | undefined;
  // `null` means the unseated group: the caller paints it in its own muted fill.
  fillClassName: string | null;
};

export type ParadePair = readonly [ParadeGroup] | readonly [ParadeGroup, ParadeGroup];

export const UNSEATED_GROUP_ID = "unseated";

export const resolveParadeGroups = (
  players: Player[],
  teams: Team[],
  teamThemeByTeamId: Map<string, TeamTheme>
): ParadeGroup[] => {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const seated = new Set<string>();
  const groups: ParadeGroup[] = [];

  for (const team of teams) {
    const members = team.playerIds
      .map((playerId) => playerById.get(playerId))
      .filter((player): player is Player => player !== undefined);

    if (members.length === 0) {
      continue;
    }

    for (const member of members) {
      seated.add(member.id);
    }

    const theme = teamThemeByTeamId.get(team.id) ?? resolveTeamTheme(team);

    groups.push({
      id: team.id,
      players: members,
      apparel: theme.apparel,
      silhouette: theme.silhouette,
      dance: theme.dance,
      fillClassName: theme.colorVariant.characterFillClassName
    });
  }

  const unseated = players.filter((player) => !seated.has(player.id));

  if (unseated.length > 0) {
    groups.push({
      id: UNSEATED_GROUP_ID,
      players: unseated,
      apparel: undefined,
      silhouette: undefined,
      dance: undefined,
      fillClassName: null
    });
  }

  return groups;
};

export const resolveParadePairs = (groups: ParadeGroup[]): ParadePair[] => {
  const pairs: ParadePair[] = [];

  for (let index = 0; index < groups.length; index += 2) {
    const left = groups[index];
    const right = groups[index + 1];

    if (left === undefined) {
      break;
    }

    pairs.push(right === undefined ? [left] : [left, right]);
  }

  return pairs;
};
