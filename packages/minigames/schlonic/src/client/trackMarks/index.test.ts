import assert from "node:assert/strict";
import test from "node:test";
import {
  SCHLONIC_WORLD,
  createSchlonicRunStart,
  resolveSchlonicCourse,
  resolveSchlonicLegFromX,
  resolveSchlonicZone
} from "@wingnight/shared";

import {
  paintZoneTrack,
  resolveTrackHandoffs,
  resolveTrackMarks,
  resolveTrackPercent
} from "./index.js";

const ZONE = resolveSchlonicZone({ seed: 20260919, chunks: 22 });
const TRACK = { course: ZONE, fromX: 0 };

test("puts the start line at nought and the post at a hundred", () => {
  assert.equal(resolveTrackPercent(ZONE, SCHLONIC_WORLD.runnerX), 0);
  assert.equal(resolveTrackPercent(ZONE, ZONE.goalX), 100);
  // Past the post is still the post; behind the line is still the line.
  assert.equal(resolveTrackPercent(ZONE, ZONE.goalX + 500), 100);
  assert.equal(resolveTrackPercent(ZONE, 0), 0);
});

test("marks every hazard and every hole, and no wing", () => {
  const marks = resolveTrackMarks(ZONE);
  const kit = ZONE.props.filter((prop) => prop.kind !== "wing" && prop.kind !== "rail");

  assert.equal(marks.hazards.length, kit.length);
  assert.equal(marks.pits.length, ZONE.pits.length);
  // In zone order, and inside the bar.
  const percents = marks.hazards.map((hazard) => hazard.percent);

  assert.deepEqual(percents, [...percents].sort((left, right) => left - right));
  assert.ok(percents.every((percent) => percent > 0 && percent < 100));
  assert.ok(marks.pits.every((pit) => pit.widthPercent > 0));
});

test("marks every rail as a span of its own, apart from the hazards", () => {
  const marks = resolveTrackMarks(ZONE);
  const rails = ZONE.props.filter((prop) => prop.kind === "rail");

  assert.ok(rails.length > 0, "the party zone should have a rail to mark");
  assert.equal(marks.rails.length, rails.length);
  assert.ok(marks.rails.every((rail) => rail.widthPercent > 0 && rail.fromPercent > 0 && rail.fromPercent < 100));
  assert.ok(marks.hazards.every((hazard) => (hazard.kind as string) !== "rail"));
});

test("writes the live pin as one custom property and one data attribute", () => {
  const writes: string[] = [];
  const root = {
    dataset: {} as Record<string, string>,
    style: {
      setProperty: (name: string, value: string): void => {
        writes.push(`${name}=${value}`);
      }
    }
  } as unknown as HTMLElement;
  const start = createSchlonicRunStart(ZONE);

  paintZoneTrack(root, TRACK, start);
  paintZoneTrack(root, TRACK, start);
  paintZoneTrack(root, TRACK, { ...start, x: ZONE.goalX });

  // The same frame twice is one write: this runs sixty times a second.
  assert.deepEqual(writes, ["--schlonic-track-run=0%", "--schlonic-track-run=100%"]);
  assert.equal(root.dataset.schlonicTrackPercent, "100");
  // Nothing to paint into is not an error.
  paintZoneTrack(null, TRACK, start);
});

test("moves the ghost's pin on the same bar, and only when it moves", () => {
  const writes: string[] = [];
  const root = {
    dataset: {} as Record<string, string>,
    style: {
      setProperty: (name: string, value: string): void => {
        writes.push(`${name}=${value}`);
      }
    }
  } as unknown as HTMLElement;
  const start = createSchlonicRunStart(ZONE);
  const halfway = { ...start, x: SCHLONIC_WORLD.runnerX + (ZONE.goalX - SCHLONIC_WORLD.runnerX) / 2 };

  paintZoneTrack(root, TRACK, start, halfway);
  paintZoneTrack(root, TRACK, start, halfway);
  paintZoneTrack(root, TRACK, start, null);

  assert.deepEqual(writes, [
    "--schlonic-track-run=0%",
    "--schlonic-track-ghost=50%",
    "--schlonic-track-ghost=0%"
  ]);
  assert.equal(root.dataset.schlonicTrackGhostPercent, "");
});

test("marks a handoff where every leg but the first starts, and none on a street of one leg", () => {
  const course = resolveSchlonicCourse({ seed: 4, chunks: 8, legs: 3 });
  const legWidth = 8 * SCHLONIC_WORLD.chunkWidth;
  const handoffs = resolveTrackHandoffs(course, legWidth);

  assert.deepEqual(
    handoffs.map((handoff) => handoff.leg),
    [1, 2]
  );
  assert.deepEqual(
    handoffs.map((handoff) => handoff.percent),
    [resolveTrackPercent(course, legWidth), resolveTrackPercent(course, legWidth * 2)]
  );
  assert.deepEqual(resolveTrackHandoffs(ZONE, ZONE.goalX), []);
  assert.deepEqual(resolveTrackMarks(course, legWidth).handoffs, handoffs);
  assert.deepEqual(resolveTrackMarks(ZONE).handoffs, []);
});

test("puts a leg's pin on its own stretch of the street", () => {
  const legs = 3;
  const chunks = 8;
  const course = resolveSchlonicCourse({ seed: 4, chunks, legs });
  const legCourse = { seed: 4, chunks, legs, leg: 1 };
  const leg = resolveSchlonicZone(legCourse);
  const track = { course, fromX: resolveSchlonicLegFromX(legCourse) };
  const writes: string[] = [];
  const root = {
    dataset: {} as Record<string, string>,
    style: {
      setProperty: (name: string, value: string): void => {
        writes.push(`${name}=${value}`);
      }
    }
  } as unknown as HTMLElement;

  // On the second leg's line: a third of the way down the street, not on the start line.
  paintZoneTrack(root, track, createSchlonicRunStart(leg));

  const onTheLine = Number(root.dataset.schlonicTrackPercent);

  assert.ok(onTheLine > 30 && onTheLine < 36, `the second leg's line sits at ${onTheLine}%`);

  // Its post is the third leg's line.
  paintZoneTrack(root, track, { ...createSchlonicRunStart(leg), x: leg.goalX });
  assert.equal(root.dataset.schlonicTrackPercent, `${resolveTrackPercent(course, 2 * chunks * SCHLONIC_WORLD.chunkWidth)}`);
});
