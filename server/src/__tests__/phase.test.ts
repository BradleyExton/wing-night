import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPhaseUpdate } from '../lib/phase.js';

test('getPhaseUpdate increments round number on first ROUND_INTRO', () => {
  const update = getPhaseUpdate({ phase: 'GAME_INTRO', currentRoundNumber: 0 }, 'ROUND_INTRO');
  assert.equal(update.phase, 'ROUND_INTRO');
  assert.equal(update.currentRoundNumber, 1);
});

test('getPhaseUpdate increments round number after ROUND_RESULTS', () => {
  const update = getPhaseUpdate({ phase: 'ROUND_RESULTS', currentRoundNumber: 3 }, 'ROUND_INTRO');
  assert.equal(update.phase, 'ROUND_INTRO');
  assert.equal(update.currentRoundNumber, 4);
});

test('getPhaseUpdate does not change round number for other phases', () => {
  const update = getPhaseUpdate({ phase: 'LOBBY', currentRoundNumber: 2 }, 'TEAM_SETUP');
  assert.equal(update.phase, 'TEAM_SETUP');
  assert.equal(update.currentRoundNumber, undefined);
});
