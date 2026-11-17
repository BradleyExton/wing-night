import assert from "node:assert/strict";
import test from "node:test";
import { createBrawlCrewStart, resolveBrawlCrewBlock, type BrawlCrewEvent, type BrawlCrewFrame } from "@wingnight/shared";

import { FRESH_EVENT_TICKS, SAME_EVENT_TICKS, createCrewEventReader } from "./index.js";

const start = createBrawlCrewStart(resolveBrawlCrewBlock({ seed: 20261001, blocks: 2, block: 0, crew: 2 }));
const frame = (tick: number, events: BrawlCrewEvent[]): BrawlCrewFrame => ({ ...start, tick, events });
const hit = (tick: number, hen = 0, spawnIndex = 3): BrawlCrewEvent => ({ tick, kind: "hit", hen, spawnIndex });

test("does hand an event out once, however many frames carry it", () => {
  const reader = createCrewEventReader();

  assert.deepEqual(reader.read("0:1000", frame(100, [])), []);
  assert.deepEqual(reader.read("0:1000", frame(101, [hit(101)])), [hit(101)]);
  assert.deepEqual(reader.read("0:1000", frame(102, [hit(101)])), []);
  assert.deepEqual(reader.read("0:1000", frame(160, [hit(101)])), []);
});

test("does not ring an event again when the server's frame puts it a tick or two off the screen's own", () => {
  const reader = createCrewEventReader();

  reader.read("0:1000", frame(100, []));
  assert.equal(reader.read("0:1000", frame(101, [hit(101)])).length, 1);
  // The server's reading re-anchors the screen: the same hit, stamped two ticks later.
  assert.deepEqual(reader.read("0:1000", frame(104, [hit(103)])), []);
  assert.deepEqual(reader.read("0:1000", frame(105, [hit(103)])), []);
});

test("does ring the same goon hitting the same hen again once it is a new hit", () => {
  const reader = createCrewEventReader();

  reader.read("0:1000", frame(100, []));
  reader.read("0:1000", frame(101, [hit(101)]));
  assert.deepEqual(reader.read("0:1000", frame(200, [hit(101), hit(101 + SAME_EVENT_TICKS + 90)])), [hit(101 + SAME_EVENT_TICKS + 90)]);
});

test("does tell two hens hit on one tick apart, and a hit from a landed peck", () => {
  const reader = createCrewEventReader();
  const landed: BrawlCrewEvent = { tick: 101, kind: "landed", hen: 0, spawnIndex: 3 };

  reader.read("0:1000", frame(100, []));
  assert.deepEqual(reader.read("0:1000", frame(101, [hit(101, 0), hit(101, 1), landed])), [hit(101, 0), hit(101, 1), landed]);
});

test("does ring only what is happening when a screen first sees a fight already under way", () => {
  const reader = createCrewEventReader();
  const old = hit(400 - FRESH_EVENT_TICKS - 1, 0);
  const now = hit(398, 1);

  assert.deepEqual(reader.read("0:1000", frame(400, [old, now])), [now]);
  assert.deepEqual(reader.read("0:1000", frame(401, [old, now])), []);
});

test("does forget the last fight when the street changes", () => {
  const reader = createCrewEventReader();

  reader.read("0:1000", frame(100, []));
  reader.read("0:1000", frame(101, [hit(101)]));
  assert.deepEqual(reader.read("1:9000", frame(101, [hit(101)])), [hit(101)]);
});
