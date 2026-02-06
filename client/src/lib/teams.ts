import type { Team } from '../types';

export function sortTeamsByScore(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    const scoreDelta = b.score - a.score;
    if (scoreDelta !== 0) return scoreDelta;

    const aCreated = Date.parse(a.createdAt);
    const bCreated = Date.parse(b.createdAt);
    if (!Number.isNaN(aCreated) && !Number.isNaN(bCreated) && aCreated !== bCreated) {
      return aCreated - bCreated;
    }

    return a.id.localeCompare(b.id);
  });
}
