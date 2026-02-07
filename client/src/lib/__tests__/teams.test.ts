import { describe, expect, it } from 'vitest';
import { getTeamBorderClass, sortTeamsByScore, TEAM_BORDER_COLORS } from '../teams';

describe('teams utils', () => {
  it('sorts by score descending', () => {
    const teams = [
      { id: 'b', score: 10 },
      { id: 'a', score: 30 },
      { id: 'c', score: 20 },
    ];
    const result = sortTeamsByScore(teams);
    expect(result.map(t => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('breaks ties by createdAt then id', () => {
    const teams = [
      { id: 'b', score: 10, createdAt: '2025-01-02T10:00:00Z' },
      { id: 'a', score: 10, createdAt: '2025-01-01T10:00:00Z' },
      { id: 'c', score: 10 },
    ];
    const result = sortTeamsByScore(teams);
    expect(result.map(t => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns a deterministic border class for a team id', () => {
    const className = getTeamBorderClass('team-1');
    expect(TEAM_BORDER_COLORS).toContain(className);
    expect(getTeamBorderClass('team-1')).toBe(className);
  });
});
