import { describe, expect, it } from 'vitest';
import { formatEventDate, getPhaseColorClass, getPhaseLabel } from '../rooms';

describe('rooms utils', () => {
  it('returns friendly labels for known phases', () => {
    expect(getPhaseLabel('DRAFT')).toBe('Draft');
    expect(getPhaseLabel('GAME_END')).toBe('Completed');
  });

  it('returns the raw phase for unknown values', () => {
    expect(getPhaseLabel('CUSTOM')).toBe('CUSTOM');
  });

  it('returns phase color classes', () => {
    expect(getPhaseColorClass('DRAFT')).toBe('text-gray-400');
    expect(getPhaseColorClass('GAME_END')).toBe('text-green-400');
    expect(getPhaseColorClass('LOBBY')).toBe('text-primary');
  });

  it('formats event dates consistently', () => {
    const date = new Date(2025, 0, 2);
    expect(formatEventDate(date)).toBe('Jan 2, 2025');
    expect(formatEventDate(null)).toBeNull();
  });
});
