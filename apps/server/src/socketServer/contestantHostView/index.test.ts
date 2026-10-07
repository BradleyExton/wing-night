import assert from "node:assert/strict";
import test from "node:test";

import { Phase, type ContestantTurn, type MinigameHostView } from "@wingnight/shared";

import { resolveContestantHostViewDelivery } from "./index.js";

const FAPPY_VIEW = {
  minigame: "FAPPY",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: {}
} as unknown as MinigameHostView;

const TRIVIA_VIEW: MinigameHostView = {
  minigame: "TRIVIA",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: {},
  attemptsRemaining: 1,
  promptCursor: 0,
  currentPrompt: { id: "prompt-1", question: "Who?", answer: "The answer" }
};

const PHONE_TURN: ContestantTurn = {
  minigame: "FAPPY",
  deviceMode: "phones",
  legIndex: 0,
  contestantPlayerId: "player-1",
  nextContestantPlayerId: "player-2",
  controller: "phone",
  tabletLegIndexes: [],
  droppedPlayerId: null
};

const room = (overrides: Partial<Parameters<typeof resolveContestantHostViewDelivery>[0]> = {}) => ({
  phase: Phase.MINIGAME_PLAY,
  contestantTurn: PHONE_TURN,
  minigameHostView: FAPPY_VIEW,
  ...overrides
});

test("does deliver the arcade host view to the contestant when their phone holds the leg", () => {
  assert.deepEqual(resolveContestantHostViewDelivery(room()), {
    playerId: "player-1",
    payload: { minigameHostView: FAPPY_VIEW }
  });
});

test("does deliver nothing outside play, in tablet mode, or while the tablet holds the leg", () => {
  for (const overrides of [
    { phase: Phase.MINIGAME_INTRO },
    { phase: Phase.TURN_RESULTS },
    { contestantTurn: null },
    { contestantTurn: { ...PHONE_TURN, deviceMode: "tablet" as const, controller: "tablet" as const } },
    { contestantTurn: { ...PHONE_TURN, controller: "tablet" as const, tabletLegIndexes: [0] } },
    { contestantTurn: { ...PHONE_TURN, controller: "tablet" as const, droppedPlayerId: "player-1" } },
    { contestantTurn: { ...PHONE_TURN, contestantPlayerId: null } },
    { minigameHostView: null }
  ]) {
    assert.equal(resolveContestantHostViewDelivery(room(overrides)), null, JSON.stringify(overrides));
  }
});

// A host view that carries an answer never reaches a phone, whatever the turn claims.
test("does deliver nothing for a game outside the four arcade relays or a mismatched one", () => {
  assert.equal(resolveContestantHostViewDelivery(room({ minigameHostView: TRIVIA_VIEW })), null);
  assert.equal(
    resolveContestantHostViewDelivery(room({ contestantTurn: { ...PHONE_TURN, minigame: "JOUST" } })),
    null
  );
});
