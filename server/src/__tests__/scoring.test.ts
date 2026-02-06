import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateRoundResults } from '../lib/scoring.js';

test('calculateRoundResults computes wing/game/total points and placements', () => {
  const teams = [
    { id: 'team-a', players: [{ id: 'p1' }, { id: 'p2' }] },
    { id: 'team-b', players: [{ id: 'p3' }] },
  ];

  const wingResults = [
    { playerId: 'p1', completed: true },
    { playerId: 'p2', completed: false },
    { playerId: 'p3', completed: true },
  ];

  const gameState = {
    roundScores: {
      'team-a': 100,
      'team-b': 0,
    },
  };

  const results = calculateRoundResults(teams, wingResults, gameState);

  assert.equal(results.length, 2);

  const teamA = results.find((r) => r.teamId === 'team-a');
  const teamB = results.find((r) => r.teamId === 'team-b');

  assert.deepEqual(teamA, {
    teamId: 'team-a',
    wingPoints: 50,
    gamePoints: 100,
    totalPoints: 150,
    placement: 1,
  });

  assert.deepEqual(teamB, {
    teamId: 'team-b',
    wingPoints: 50,
    gamePoints: 0,
    totalPoints: 50,
    placement: 2,
  });
});


test('calculateRoundResults ties are deterministic', () => {
  const teams = [
    { id: 'team-b', players: [{ id: 'p1' }] },
    { id: 'team-a', players: [{ id: 'p2' }] },
  ];

  const wingResults = [
    { playerId: 'p1', completed: true },
    { playerId: 'p2', completed: true },
  ];

  const results = calculateRoundResults(teams, wingResults, { roundScores: {} });

  assert.equal(results[0].teamId, 'team-a');
  assert.equal(results[0].placement, 1);
  assert.equal(results[1].teamId, 'team-b');
  assert.equal(results[1].placement, 2);
});
