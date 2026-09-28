import assert from "node:assert/strict";
import test from "node:test";
import { SCHLONIC_WORLD, createSchlonicRunStart, resolveSchlonicZone } from "@wingnight/shared";

import {
  paintZoneTrack,
  resolveTrackDistancePercent,
  resolveTrackMarks,
  resolveTrackPercent
} from "./index.js";

const ZONE = resolveSchlonicZone({ seed: 20260919, chunks: 22 });

test("puts the start line at nought and the post at a hundred", () => {
  assert.equal(resolveTrackPercent(ZONE, SCHLONIC_WORLD.runnerX), 0);
  assert.equal(resolveTrackPercent(ZONE, ZONE.goalX), 100);
  // Past the post is still the post; behind the line is still the line.
  assert.equal(resolveTrackPercent(ZONE, ZONE.goalX + 500), 100);
  assert.equal(resolveTrackPercent(ZONE, 0), 0);
});

test("measures a refereed distance on the same scale as a live x", () => {
  const distance = 300;

  assert.equal(
    resolveTrackDistancePercent(ZONE, distance),
    resolveTrackPercent(ZONE, SCHLONIC_WORLD.runnerX + distance)
  );
});

test("marks every hazard and every hole, and no wing", () => {
  const marks = resolveTrackMarks(ZONE);
  const kit = ZONE.props.filter((prop) => prop.kind !== "wing");

  assert.equal(marks.hazards.length, kit.length);
  assert.equal(marks.pits.length, ZONE.pits.length);
  // In zone order, and inside the bar.
  const percents = marks.hazards.map((hazard) => hazard.percent);

  assert.deepEqual(percents, [...percents].sort((left, right) => left - right));
  assert.ok(percents.every((percent) => percent > 0 && percent < 100));
  assert.ok(marks.pits.every((pit) => pit.widthPercent > 0));
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

  paintZoneTrack(root, ZONE, start);
  paintZoneTrack(root, ZONE, start);
  paintZoneTrack(root, ZONE, { ...start, x: ZONE.goalX });

  // The same frame twice is one write: this runs sixty times a second.
  assert.deepEqual(writes, ["--schlonic-track-run=0%", "--schlonic-track-run=100%"]);
  assert.equal(root.dataset.schlonicTrackPercent, "100");
  // Nothing to paint into is not an error.
  paintZoneTrack(null, ZONE, start);
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

  paintZoneTrack(root, ZONE, start, halfway);
  paintZoneTrack(root, ZONE, start, halfway);
  paintZoneTrack(root, ZONE, start, null);

  assert.deepEqual(writes, [
    "--schlonic-track-run=0%",
    "--schlonic-track-ghost=50%",
    "--schlonic-track-ghost=0%"
  ]);
  assert.equal(root.dataset.schlonicTrackGhostPercent, "");
});
