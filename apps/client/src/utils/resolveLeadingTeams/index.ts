import type { Team } from "@wingnight/shared";

export const resolveLeadingTeams = (sortedStandings: Team[]): Team[] => {
  const topTeam = sortedStandings[0];

  if (topTeam === undefined) {
    return [];
  }

  return sortedStandings.filter(
    (team) => team.totalScore === topTeam.totalScore
  );
};
