import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlFrame, BrawlGoon } from "@wingnight/shared";
import { createBrawlRunStart, resolveBrawlBlock } from "@wingnight/shared";

import { resolveMirrorEvents } from "./index.js";

const block = resolveBrawlBlock({ seed: 20261001, blocks: 3, block: 2 });
const start = createBrawlRunStart(block);

const goon = (overrides: Partial<BrawlGoon> = {}): BrawlGoon => ({
  spawnIndex: 0,
  kind: "goose",
  x: 100,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: 1,
  state: "approach",
  stateUntilTick: 0,
  koTick: null,
  ...overrides
});

const at = (frame: BrawlFrame, overrides: Partial<BrawlFrame>): BrawlFrame => ({ ...frame, ...overrides });

test("does announce nothing when nothing changed between two frames", () => {
  assert.deepEqual(resolveMirrorEvents(start, at(start, { tick: 1 }), block), []);
});

test("does announce a peck when the right thumb opens one, and a land when it connects", () => {
  const pecked = at(start, { tick: 1, peckUntilTick: 15 });

  assert.deepEqual(resolveMirrorEvents(start, pecked, block), [{ kind: "peck" }]);
  assert.deepEqual(resolveMirrorEvents(pecked, at(pecked, { tick: 6, landed: [6] }), block), [{ kind: "land" }]);
});

test("does not announce a peck when a hit knocks the beak shut", () => {
  const pecked = at(start, { tick: 10, peckUntilTick: 20 });

  assert.deepEqual(resolveMirrorEvents(pecked, at(pecked, { tick: 11, peckUntilTick: 11, hits: [11] }), block), [
    { kind: "hurt" }
  ]);
});

test("does announce a honk once when a goon starts its telegraph", () => {
  const walking = at(start, { tick: 50, goons: [goon()] });
  const honking = at(walking, { tick: 51, goons: [goon({ state: "telegraph" })] });

  assert.deepEqual(resolveMirrorEvents(walking, honking, block), [{ kind: "honk", goonKind: "goose" }]);
  assert.deepEqual(resolveMirrorEvents(honking, at(honking, { tick: 52 }), block), []);
});

test("does announce the boss once when it steps onto the street", () => {
  const boss = goon({ spawnIndex: 11, kind: "boss", state: "entering" });
  const arrived = at(start, { tick: 400, goons: [boss] });

  assert.deepEqual(resolveMirrorEvents(start, arrived, block), [{ kind: "boss" }]);
  assert.deepEqual(resolveMirrorEvents(arrived, at(arrived, { tick: 401 }), block), []);
});

test("does announce a goon going down with its kind, and a hit on the hen", () => {
  const before = at(start, { tick: 80, goons: [goon({ kind: "raccoon", state: "stunned" })] });
  const after = at(before, {
    tick: 81,
    goons: [goon({ kind: "raccoon", state: "ko" })],
    kos: [81],
    landed: [81],
    hits: [81]
  });

  assert.deepEqual(resolveMirrorEvents(before, after, block), [
    { kind: "land" },
    { kind: "ko", goonKind: "raccoon" },
    { kind: "hurt" }
  ]);
});

test("does announce GO when a wave goes down and the camera lets go", () => {
  const locked = at(start, { tick: 300 });

  assert.deepEqual(resolveMirrorEvents(locked, at(locked, { tick: 301, cameraLocked: false, waveIndex: 1 }), block), [
    { kind: "go" }
  ]);
});

test("does announce nothing when a rebuilt replay hands back an earlier frame", () => {
  const late = at(start, { tick: 500, hits: [100, 300], kos: [200] });

  assert.deepEqual(resolveMirrorEvents(late, at(start, { tick: 2 }), block), []);
});
