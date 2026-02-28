import type { Team } from "@wingnight/shared";

export const resolveSortedStandings = (teams: Team[]): Team[] => {
  return [...teams].sort((leftTeam, rightTeam) => {
    if (rightTeam.totalScore !== leftTeam.totalScore) {
      return rightTeam.totalScore - leftTeam.totalScore;
    }

    return leftTeam.name.localeCompare(rightTeam.name);
  });
};
