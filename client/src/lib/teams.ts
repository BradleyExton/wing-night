import type { Team } from '../types';

type TeamLike = {
  id: string;
  score: number;
  createdAt?: string;
};

const TEAM_BORDER_COLORS = [
  'border-l-orange-500',
  'border-l-green-500',
  'border-l-blue-500',
  'border-l-purple-500',
  'border-l-amber-500',
  'border-l-cyan-500',
];

export function sortTeamsByScore<T extends TeamLike>(teams: T[]): T[] {
  return [...teams].sort((a, b) => {
    const scoreDelta = b.score - a.score;
    if (scoreDelta !== 0) return scoreDelta;

    if (a.createdAt && b.createdAt) {
      const aCreated = Date.parse(a.createdAt);
      const bCreated = Date.parse(b.createdAt);
      if (!Number.isNaN(aCreated) && !Number.isNaN(bCreated) && aCreated !== bCreated) {
        return aCreated - bCreated;
      }
    }

    return a.id.localeCompare(b.id);
  });
}

export function getTeamBorderClass(teamId: string): string {
  const index = Math.abs(parseInt(teamId, 36)) % TEAM_BORDER_COLORS.length;
  return TEAM_BORDER_COLORS[index];
}

export { TEAM_BORDER_COLORS };
