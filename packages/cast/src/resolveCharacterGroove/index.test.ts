import assert from "node:assert/strict";
import test from "node:test";

import {
  CHARACTER_BEAT_LAGS,
  CHARACTER_BOUNCES,
  CHARACTER_FOOTWORKS,
  resolveCharacterGrooveClassName
} from "./index.js";

const readMs = (groove: string, property: string): number => {
  const match = new RegExp(`\\[${property}:(-?\\d+)ms\\]`).exec(groove);

  assert.ok(match !== null, `${property} was missing from ${groove}`);
  return Number(match[1]);
};

const names = ["Alex", "Morgan", "Sam", "Jo", "Rob", "Casey", "Pat", "Ash", "Robin", "Kit", "Dana", "Fran"];

test("does give every bird all eight timings, whichever three tables it drew from", () => {
  for (const name of names) {
    const groove = resolveCharacterGrooveClassName(name);

    for (const property of [
      "--cast-jig-ms",
      "--cast-jig-delay",
      "--cast-step-phase",
      "--cast-step-phase-far",
      "--cast-jive-ms",
      "--cast-jive-delay",
      "--cast-groove-ms",
      "--cast-groove-delay"
    ]) {
      readMs(groove, property);
    }
  }
});

test("does keep the footwork quick enough to read as dancing", () => {
  for (const footwork of CHARACTER_FOOTWORKS) {
    const jigMs = readMs(footwork, "--cast-jig-ms");

    assert.ok(jigMs >= 200 && jigMs <= 340, "feet this slow are pacing, not dancing");
  }
});

test("does hold the far leg half a stride behind the near one in every footwork", () => {
  for (const footwork of CHARACTER_FOOTWORKS) {
    assert.equal(
      readMs(footwork, "--cast-step-phase") - readMs(footwork, "--cast-step-phase-far"),
      250
    );
  }
});

test("does phase every loop rather than delay it, so no bird stands still waiting to start", () => {
  for (const footwork of CHARACTER_FOOTWORKS) {
    const delay = readMs(footwork, "--cast-jig-delay");

    assert.ok(delay <= 0 && Math.abs(delay) < readMs(footwork, "--cast-jig-ms"));
  }

  for (const bounce of CHARACTER_BOUNCES) {
    const delay = readMs(bounce, "--cast-jive-delay");

    assert.ok(delay <= 0 && Math.abs(delay) < readMs(bounce, "--cast-jive-ms"));
  }
});

test("does land the beat late or on it, never early, and always within half a beat", () => {
  for (const lag of CHARACTER_BEAT_LAGS) {
    const delay = readMs(lag, "--cast-groove-delay");

    assert.ok(delay >= 0, "a bird cannot land a beat before it is played");
    assert.ok(delay <= 250, "a bird this late is dancing to the previous bar");
  }
});

test("does give the same player the same groove every time it is asked", () => {
  assert.equal(
    resolveCharacterGrooveClassName("Morgan"),
    resolveCharacterGrooveClassName(" morgan ")
  );
});

test("does draw feet, bounce and lag independently, so a floor is not one animal on one clock", () => {
  // A party's worth of names, so what is measured is the resolver spreading a
  // roster rather than a dozen hand-picked names happening to disagree.
  const roster = Array.from({ length: 400 }, (_, index) => `player-${index}`);
  const grooves = roster.map(resolveCharacterGrooveClassName);

  for (const table of [CHARACTER_FOOTWORKS, CHARACTER_BOUNCES, CHARACTER_BEAT_LAGS]) {
    for (const row of table) {
      assert.ok(grooves.some((groove) => groove.includes(row)), `nothing ever draws ${row}`);
    }
  }

  // Three independent draws is 180 grooves out of three short tables. A
  // roster will never cover all of them, but anything near it means the three
  // are genuinely independent and not moving together.
  assert.ok(
    new Set(grooves).size > 120,
    "the three draws are riding the same bits, so the floor has far fewer grooves than it should"
  );
});
