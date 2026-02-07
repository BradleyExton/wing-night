import { describe, expect, it } from 'vitest';
import { getCurrentRound } from '../rounds';

describe('rounds utils', () => {
  it('returns the matching round by number', () => {
    const rounds = [
      { roundNumber: 1, name: 'One' },
      { roundNumber: 2, name: 'Two' },
    ];
    expect(getCurrentRound(rounds, 2)?.name).toBe('Two');
  });

  it('returns undefined when no match', () => {
    const rounds = [{ roundNumber: 1 }];
    expect(getCurrentRound(rounds, 3)).toBeUndefined();
  });
});
