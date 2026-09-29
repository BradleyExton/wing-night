import assert from "node:assert/strict";
import test from "node:test";
import type { MinigameHostView } from "@wingnight/shared";

import { dunlopDashGame, fappyBirdGame, resolveTeaserGame, slingshlongGame } from "./index";

// Only the fields each outcome reads; the rest of a view is the runtime's business.
const asView = (fields: Record<string, unknown>): MinigameHostView => fields as MinigameHostView;

test("finds a game by its page path", () => {
  assert.equal(resolveTeaserGame("/dunlop-dash"), dunlopDashGame);
  assert.equal(resolveTeaserGame("/fappy-bird"), fappyBirdGame);
  assert.equal(resolveTeaserGame("/slingshlong"), slingshlongGame);
  assert.equal(resolveTeaserGame("/card"), null);
});

test("reads a Dunlop Dash turn only once the street is clear, scored in wings", () => {
  assert.equal(dunlopDashGame.resolveOutcome(asView({ minigame: "SCHLONIC", phase: "running", wingsBanked: 9 })), null);
  assert.deepEqual(
    dunlopDashGame.resolveOutcome(asView({ minigame: "SCHLONIC", phase: "finished", wingsBanked: 42 })),
    { kicker: "Street clear", headline: "42 wings", result: 42 }
  );
});

test("scores a finished relay by its time and a timed-out one not at all", () => {
  assert.deepEqual(
    fappyBirdGame.resolveOutcome(asView({ minigame: "FAPPY", phase: "finished", elapsedMs: 63_400 })),
    { kicker: "Through", headline: "1:03.4", result: 63_400 }
  );
  assert.equal(
    fappyBirdGame.resolveOutcome(asView({ minigame: "FAPPY", phase: "timedOut", elapsedMs: null }))?.result,
    null
  );
  assert.equal(fappyBirdGame.resolveOutcome(asView({ minigame: "FAPPY", phase: "flying", elapsedMs: null })), null);
});

test("scores a Slingshlong turn by its points once every shot is taken, and names a cleared rack", () => {
  const shots = [
    { points: 3, isRackCleared: false },
    { points: 5, isRackCleared: true }
  ];

  assert.equal(slingshlongGame.resolveOutcome(asView({ minigame: "JOUST", phase: "resolved", shots })), null);
  assert.deepEqual(slingshlongGame.resolveOutcome(asView({ minigame: "JOUST", phase: "done", shots })), {
    kicker: "Rack cleared",
    headline: "8 points",
    result: 8
  });
});

test("counts more wings and a faster relay as the better turn", () => {
  assert.equal(dunlopDashGame.beats(50, 42), true);
  assert.equal(dunlopDashGame.beats(42, 42), false);
  assert.equal(fappyBirdGame.beats(58_000, 63_400), true);
  assert.equal(fappyBirdGame.beats(70_000, 63_400), false);
});
