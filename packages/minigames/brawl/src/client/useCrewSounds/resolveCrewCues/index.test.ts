import assert from "node:assert/strict";
import test from "node:test";
import { createBrawlCrewStart, resolveBrawlCrewBlock, type BrawlCrewFrame, type BrawlCrewGoon, type BrawlCrewHen } from "@wingnight/shared";

import { BRAWL_HONK_GOON_INTENSITY } from "../../audio/index.js";
import { resolveCrewCues } from "./index.js";

const start = createBrawlCrewStart(resolveBrawlCrewBlock({ seed: 20261001, blocks: 3, block: 0, crew: 2 }));
const goon = (overrides: Partial<BrawlCrewGoon> = {}): BrawlCrewGoon => ({
  spawnIndex: 4,
  kind: "goose",
  x: 80,
  z: 10,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: 1,
  state: "approach",
  stateUntilTick: 0,
  koTick: null,
  target: 0,
  ...overrides
});
const frame = (overrides: Partial<BrawlCrewFrame> = {}): BrawlCrewFrame => ({ ...start, ...overrides });
const names = (cues: { cue: string }[]): string[] => cues.map((cue) => cue.cue);
const heard = (before: BrawlCrewFrame, after: BrawlCrewFrame) => {
  const { memory } = resolveCrewCues(null, "0:1000", before, [], "railing");

  return resolveCrewCues(memory, "0:1000", after, [], "railing").cues;
};

test("does ring each thing the sim says happened in its own voice, and say nothing for a dropped wing", () => {
  const events = (["hit", "landed", "ko", "clank", "bump", "drop", "wing", "down", "revive", "bonus"] as const).map((kind) => ({ tick: 5, kind, hen: 0 }));

  assert.deepEqual(names(resolveCrewCues(null, "0:1000", frame(), events, "railing").cues), [
    "hurt",
    "land",
    "ko",
    "clank",
    "bump",
    "wing",
    "down",
    "revive",
    "clean"
  ]);
});

test("does splash a goon dunked into the bay and clatter one over the railing or onto the plinth", () => {
  const dunk = [{ tick: 5, kind: "dunk" as const, hen: 0, spawnIndex: 4 }];

  assert.deepEqual(names(resolveCrewCues(null, "0:1000", frame(), dunk, "bay").cues), ["splash"]);
  assert.deepEqual(names(resolveCrewCues(null, "0:1000", frame(), dunk, "railing").cues), ["dunk"]);
  assert.deepEqual(names(resolveCrewCues(null, "0:1000", frame(), dunk, "plinth").cues), ["dunk"]);
});

test("does tick once for each beak that comes out, whoever's it is", () => {
  const pecking = start.hens.map((hen: BrawlCrewHen) => (hen.slot === 1 ? { ...hen, peckUntilTick: 24 } : hen));

  assert.deepEqual(names(heard(frame(), frame({ tick: 10, hens: pecking }))), ["peck"]);
  assert.deepEqual(names(heard(frame({ tick: 10, hens: pecking }), frame({ tick: 11, hens: pecking }))), []);
});

test("does honk when a goon starts its telegraph, once, hiss for a swan and honk lowest for the boss", () => {
  const walking = frame({ goons: [goon(), goon({ spawnIndex: 5, kind: "swan" }), goon({ spawnIndex: 6, kind: "boss" })] });
  const honking = frame({ tick: 1, goons: walking.goons.map((entry) => ({ ...entry, state: "telegraph" as const })) });

  assert.deepEqual(heard(walking, honking), [{ cue: "honk", intensity: BRAWL_HONK_GOON_INTENSITY }, { cue: "hiss" }, { cue: "honk", intensity: 1 }]);
  assert.deepEqual(heard(honking, frame({ ...honking, tick: 2 })), []);
});

test("does sound the boss stepping on, GO when the camera lets go, and each ending once", () => {
  assert.deepEqual(names(heard(frame(), frame({ goons: [goon({ kind: "boss", state: "entering" })] }))), ["boss"]);
  assert.deepEqual(names(heard(frame(), frame({ cameraLocked: false }))), ["go"]);
  assert.deepEqual(names(heard(frame(), frame({ outcome: "cleared", cameraLocked: false }))), ["handoff"]);
  assert.deepEqual(names(heard(frame(), frame({ outcome: "wipe" }))), ["bay"]);
  assert.deepEqual(names(heard(frame(), frame({ outcome: "timeout" }))), ["bell"]);
  assert.deepEqual(names(heard(frame({ outcome: "wipe" }), frame({ outcome: "wipe" }))), []);
});

test("does make no sound from a change on the first frame it sees of a fight", () => {
  const underWay = frame({ tick: 900, cameraLocked: false, goons: [goon({ state: "telegraph" }), goon({ spawnIndex: 9, kind: "boss" })] });

  assert.deepEqual(resolveCrewCues(null, "0:1000", underWay, [], "railing").cues, []);

  const { memory } = resolveCrewCues(null, "0:1000", frame(), [], "railing");

  assert.deepEqual(resolveCrewCues(memory, "1:5000", underWay, [], "railing").cues, []);
});
