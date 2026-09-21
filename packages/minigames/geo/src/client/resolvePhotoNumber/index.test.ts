import assert from "node:assert/strict";
import test from "node:test";

import { resolvePhotoNumber } from "./index.js";

test("names the photo on screen while its guess is still open", () => {
  assert.equal(
    resolvePhotoNumber({
      promptsCompletedThisTurn: 0,
      promptsPerTurn: 3,
      isSubmitted: false
    }),
    1
  );

  assert.equal(
    resolvePhotoNumber({
      promptsCompletedThisTurn: 2,
      promptsPerTurn: 3,
      isSubmitted: false
    }),
    3
  );
});

// The reveal beat: the guess is scored but the turn has not moved on, so the
// counter must still name the photo whose result the room is looking at.
test("keeps naming the scored photo while its result is on screen", () => {
  assert.equal(
    resolvePhotoNumber({
      promptsCompletedThisTurn: 1,
      promptsPerTurn: 3,
      isSubmitted: true
    }),
    1
  );

  assert.equal(
    resolvePhotoNumber({
      promptsCompletedThisTurn: 3,
      promptsPerTurn: 3,
      isSubmitted: true
    }),
    3
  );
});

test("never counts past the turn's last photo or below the first", () => {
  assert.equal(
    resolvePhotoNumber({
      promptsCompletedThisTurn: 3,
      promptsPerTurn: 3,
      isSubmitted: false
    }),
    3
  );

  assert.equal(
    resolvePhotoNumber({
      promptsCompletedThisTurn: 0,
      promptsPerTurn: 3,
      isSubmitted: true
    }),
    1
  );
});
