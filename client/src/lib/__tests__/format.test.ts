import { describe, expect, it } from 'vitest';
import { formatCount, formatPlayerCount, formatPoints } from '../format';

describe('format utils', () => {
  it('formats singular and plural counts', () => {
    expect(formatCount(1, 'item')).toBe('1 item');
    expect(formatCount(2, 'item')).toBe('2 items');
    expect(formatCount(2, 'person', 'people')).toBe('2 people');
  });

  it('formats player counts', () => {
    expect(formatPlayerCount(0)).toBe('0 players');
    expect(formatPlayerCount(1)).toBe('1 player');
  });

  it('formats points', () => {
    expect(formatPoints(1)).toBe('1 point');
    expect(formatPoints(3)).toBe('3 points');
  });
});
