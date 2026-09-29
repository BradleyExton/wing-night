import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_STAGE_EMOJIS,
  reconcileStageEmojis,
  resolveFreshHeroKey,
  resolveVisibleWindow,
  type StageEmoji
} from "./index.js";

const tap = (previous: StageEmoji[], emojiSequence: string[]): StageEmoji[] => {
  return reconcileStageEmojis(previous, emojiSequence, { isFirstReading: false });
};

const onStage = (stage: StageEmoji[]): StageEmoji[] => {
  return stage.filter((entry) => !entry.isLeaving);
};

test("shows only the last six emoji of a longer clue", () => {
  const clue = ["🐶", "🍕", "🔥", "👀", "🎬", "🚗", "💀", "🌊"];

  assert.deepEqual(
    resolveVisibleWindow(clue).map((entry) => entry.emoji),
    clue.slice(-MAX_STAGE_EMOJIS)
  );
});

test("centres the row on the stage when a clue grows", () => {
  const stage = tap(tap([], ["🐶"]), ["🐶", "🍕", "🔥"]);

  assert.deepEqual(
    onStage(stage).map((entry) => entry.slot),
    [-1, 0, 1]
  );
});

test("pops the emoji just tapped as the hero and leaves the earlier entrance alone", () => {
  const firstTap = tap([], ["🐶"]);
  const secondTap = tap(firstTap, ["🐶", "🍕"]);

  assert.equal(firstTap[0]?.entrance, "hero");
  assert.deepEqual(
    secondTap.map((entry) => entry.entrance),
    ["hero", "hero"]
  );
  assert.equal(secondTap[1]?.emoji, "🍕");
});

test("settles a board the display joined mid-clue instead of popping it", () => {
  const stage = reconcileStageEmojis([], ["🐶", "🍕", "🔥"], { isFirstReading: true });

  assert.deepEqual(
    stage.map((entry) => entry.entrance),
    ["settle", "settle", "settle"]
  );
});

test("sends the oldest emoji off when a seventh is tapped", () => {
  const six = ["🐶", "🍕", "🔥", "👀", "🎬", "🚗"];
  const stage = tap(tap([], six), [...six, "💀"]);
  const leaving = stage.filter((entry) => entry.isLeaving);

  assert.deepEqual(
    leaving.map((entry) => entry.emoji),
    ["🐶"]
  );
  assert.equal(stage[0]?.emoji, "🐶");
  assert.equal(leaving[0]?.slot, -2.5);
  assert.equal(onStage(stage).length, MAX_STAGE_EMOJIS);
});

test("slides the pushed-off emoji back in without a hero pop after Back", () => {
  const seven = ["🐶", "🍕", "🔥", "👀", "🎬", "🚗", "💀"];
  const stage = tap(tap([], seven), seven.slice(0, 6));
  const returned = stage.find((entry) => entry.emoji === "🐶" && !entry.isLeaving);
  const removed = stage.find((entry) => entry.emoji === "💀");

  assert.equal(returned?.entrance, "settle");
  assert.equal(removed?.isLeaving, true);
});

test("pops a retap after Back as a fresh hero", () => {
  const afterBack = tap(tap([], ["🐶", "🍕"]), ["🐶"]);
  const retapped = tap(afterBack, ["🐶", "🔥"]);
  const newest = onStage(retapped).at(-1);

  assert.equal(newest?.emoji, "🔥");
  assert.equal(newest?.entrance, "hero");
});

test("clears every emoji off the stage when the clue empties", () => {
  const stage = tap(tap([], ["🐶", "🍕"]), []);

  assert.equal(onStage(stage).length, 0);
  assert.equal(stage.length, 2);
});

test("rings out a fresh tap but not the hero a Back leaves at the end", () => {
  const oneTap = tap([], ["🐶"]);
  const twoTaps = tap(oneTap, ["🐶", "🍕"]);
  const afterBack = tap(twoTaps, ["🐶"]);

  assert.equal(resolveFreshHeroKey(oneTap, twoTaps), "1:🍕");
  assert.equal(resolveFreshHeroKey(twoTaps, afterBack), null);
});

test("keeps the stage in clue order so a Back never reorders the row", () => {
  const seven = ["🐶", "🍕", "🔥", "👀", "🎬", "🚗", "💀"];
  const before = tap([], seven);
  const after = tap(before, seven.slice(0, 6));
  const keysBefore = before.map((entry) => entry.key);
  const survivors = after.map((entry) => entry.key).filter((key) => keysBefore.includes(key));

  assert.deepEqual(survivors, keysBefore);
});

test("shrinks a cleared row away at the size it stood at", () => {
  const cleared = tap(tap([], ["🐶", "🍕", "🔥"]), []);

  assert.deepEqual(
    cleared.map((entry) => entry.rowLength),
    [3, 3, 3]
  );
});
