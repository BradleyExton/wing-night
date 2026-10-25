import assert from "node:assert/strict";
import test from "node:test";

import {
  BEATS_PER_BAR,
  DEFAULT_BAR_MS,
  LINEUP_MOVE_START_BEAT,
  PARADE_MOVE_EVERY_BARS,
  resolveBarMs,
  resolveLineupMoves,
  resolveLineupMovesEndBeat,
  resolveMoveBarOffset,
  resolveOutfitMove,
  resolveParadeMoves,
  type MoveDancer
} from "./index";

const NAMES = ["Alex", "Caitlin", "Dan", "Rosie", "Morgan", "Darren", "Steve B", "Sarah", "Jazz", "Priya"];

// The bars, out of the first `bars`, in which the bird at `index` plays.
const barsPlayed = (line: readonly MoveDancer[], index: number, bars = 24): number[] =>
  Array.from({ length: bars }, (_, bar) => bar).filter((bar) => resolveParadeMoves(line, bar)[index] !== undefined);

// Two names whose Moves fall on the same bar, and two that do not.
const findNames = (sameBar: boolean): [string, string] => {
  for (const first of NAMES) {
    for (const second of NAMES) {
      if (first !== second && (resolveMoveBarOffset(first) === resolveMoveBarOffset(second)) === sameBar) {
        return [first, second];
      }
    }
  }

  throw new Error("no such pair in NAMES");
};

test("does fire a bird's Move once every eight bars, for one bar, on a bar its name picks", () => {
  const line: MoveDancer[] = [{ name: "Alex", move: "horns-pump" }];
  const offset = resolveMoveBarOffset("Alex");

  assert.deepEqual(barsPlayed(line, 0), [offset, offset + 8, offset + 16]);
  assert.equal(resolveParadeMoves(line, offset)[0], "horns-pump");
  assert.equal(resolveParadeMoves(line, offset + 1)[0], undefined, "a Move hands the pose back after its bar");
});

test("does pick the same bar for a name whatever its case or the roster around it", () => {
  assert.equal(resolveMoveBarOffset("brad "), resolveMoveBarOffset("Brad"));

  const alone = barsPlayed([{ name: "Rosie", move: "heart-point" }], 0);
  const inALine = barsPlayed(
    [
      { name: "Dan", move: "sporty-hop" },
      { name: "Rosie", move: "heart-point" }
    ],
    1
  );

  assert.deepEqual(inALine, alone);
});

test("does ripple the line rather than sync it when names pick different bars", () => {
  const offsets = new Set(NAMES.map(resolveMoveBarOffset));

  assert.ok(offsets.size >= 4, `ten names landed on only ${offsets.size} of the eight bars`);
  assert.ok([...offsets].every((offset) => offset >= 0 && offset < PARADE_MOVE_EVERY_BARS));
});

test("does leave a bird with no Move on its pose", () => {
  const line: MoveDancer[] = [{ name: "Alex", move: undefined }];

  assert.deepEqual(barsPlayed(line, 0), []);
});

test("does play the Bump's answer on the bird behind in the same bar", () => {
  const [front, behind] = findNames(false);
  const line: MoveDancer[] = [
    { name: front, move: "the-bump" },
    { name: behind, move: "night-fever" }
  ];
  const bar = resolveMoveBarOffset(front);

  assert.deepEqual(resolveParadeMoves(line, bar), ["the-bump", "the-bump-answer"]);
  assert.deepEqual(barsPlayed(line, 1, 8).sort(), [bar, resolveMoveBarOffset(behind)].sort());
});

test("does let the bird behind play its own Move a bar late when the Bump's answer took its bar", () => {
  const [front, behind] = findNames(true);
  const line: MoveDancer[] = [
    { name: front, move: "the-bump" },
    { name: behind, move: "night-fever" }
  ];
  const bar = resolveMoveBarOffset(front);

  assert.deepEqual(resolveParadeMoves(line, bar), ["the-bump", "the-bump-answer"]);
  assert.deepEqual(resolveParadeMoves(line, bar + 1), [undefined, "night-fever"]);
  assert.deepEqual(resolveParadeMoves(line, bar + 2), [undefined, undefined]);
});

test("does let the back of the line bump with nobody to answer it", () => {
  const line: MoveDancer[] = [
    { name: "Caitlin", move: undefined },
    { name: "Alex", move: "the-bump" }
  ];
  const bar = resolveMoveBarOffset("Alex");

  assert.deepEqual(resolveParadeMoves(line, bar), [undefined, "the-bump"]);
});

test("does fit every bird's Move into its visit when slow music leaves fewer than eight bars", () => {
  const line: MoveDancer[] = NAMES.map((name) => ({ name, move: "chicken-dance" }));
  const barsOnFloor = 5;
  const playedIn = (index: number): number[] =>
    Array.from({ length: barsOnFloor }, (_, bar) => bar).filter(
      (bar) => resolveParadeMoves(line, bar, barsOnFloor)[index] !== undefined
    );

  line.forEach((dancer, index) => {
    assert.deepEqual(playedIn(index), [resolveMoveBarOffset(dancer.name) % barsOnFloor], dancer.name);
  });
});

test("does play nothing before the line's first bar", () => {
  assert.deepEqual(resolveParadeMoves([{ name: "Alex", move: "horns-pump" }], -1), [undefined]);
});

test("does play each lineup seat's Move once, a beat after the seat before it", () => {
  const seats: MoveDancer[] = [
    { name: "Alex", move: "horns-pump" },
    { name: "Caitlin", move: undefined },
    { name: "Dan", move: "chicken-dance" }
  ];
  const beats = Array.from({ length: resolveLineupMovesEndBeat(seats.length) + 4 }, (_, beat) => beat);
  const playedOn = (index: number): number[] => beats.filter((beat) => resolveLineupMoves(seats, beat)[index] !== undefined);

  assert.deepEqual(playedOn(0), [0, 1, 2, 3].map((beat) => LINEUP_MOVE_START_BEAT + beat));
  assert.deepEqual(playedOn(1), []);
  assert.deepEqual(playedOn(2), [2, 3, 4, 5].map((beat) => LINEUP_MOVE_START_BEAT + beat));
  assert.equal(resolveLineupMoves(seats, LINEUP_MOVE_START_BEAT + 2)[2], "chicken-dance");
  assert.ok(
    beats
      .filter((beat) => beat >= resolveLineupMovesEndBeat(seats.length))
      .every((beat) => resolveLineupMoves(seats, beat).every((play) => play === undefined)),
    "a seat played after the wave had passed"
  );
});

test("does read only a Move the cast can play off an outfit", () => {
  assert.equal(resolveOutfitMove({ move: { item: "the-bump" } }), "the-bump");
  assert.equal(resolveOutfitMove({ move: { item: "moonwalk" } }), undefined);
  assert.equal(resolveOutfitMove({ top: { item: "battle-vest-a" } }), undefined);
  assert.equal(resolveOutfitMove(undefined), undefined);
});

test("does time a bar to the median of the room's last beats", () => {
  assert.equal(resolveBarMs([500, 500, 510, 490, 500]), 500 * BEATS_PER_BAR);
  assert.equal(resolveBarMs([470, 470, 940, 470]), 470 * BEATS_PER_BAR, "a missed kick does not slow the bar");
});

test("does fall back to the lobby's 120 bpm bar when no beat gap is usable", () => {
  assert.equal(resolveBarMs([]), DEFAULT_BAR_MS);
  assert.equal(resolveBarMs([90, 4000]), DEFAULT_BAR_MS);
});
