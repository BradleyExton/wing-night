import assert from "node:assert/strict";
import test from "node:test";

import { resolveExhibitNumber } from "./index.js";

test("names the exhibit on the page while its guess is still open", () => {
  assert.equal(
    resolveExhibitNumber({
      promptsCompletedThisTurn: 0,
      promptsPerTurn: 3,
      isSubmitted: false
    }),
    1
  );

  assert.equal(
    resolveExhibitNumber({
      promptsCompletedThisTurn: 2,
      promptsPerTurn: 3,
      isSubmitted: false
    }),
    3
  );
});

// The reveal beat: the guess is scored but the page has not turned, so the
// header must still name the exhibit whose result the room is looking at.
test("keeps naming the scored exhibit while its result is on the page", () => {
  assert.equal(
    resolveExhibitNumber({
      promptsCompletedThisTurn: 1,
      promptsPerTurn: 3,
      isSubmitted: true
    }),
    1
  );

  assert.equal(
    resolveExhibitNumber({
      promptsCompletedThisTurn: 3,
      promptsPerTurn: 3,
      isSubmitted: true
    }),
    3
  );
});

test("never counts past the turn's last exhibit or below the first", () => {
  assert.equal(
    resolveExhibitNumber({
      promptsCompletedThisTurn: 3,
      promptsPerTurn: 3,
      isSubmitted: false
    }),
    3
  );

  assert.equal(
    resolveExhibitNumber({
      promptsCompletedThisTurn: 0,
      promptsPerTurn: 3,
      isSubmitted: true
    }),
    1
  );
});
