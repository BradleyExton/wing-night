import assert from "node:assert/strict";
import test from "node:test";
import { advanceBrawlCrew, createBrawlCrewStart, resolveBrawlCrewBlock, type BrawlCrewFrame } from "@wingnight/shared";

import { resolveWaveMeter, resolveWaveMeterSignature } from "./index.js";

const block = resolveBrawlCrewBlock({ seed: 20261001, blocks: 3, block: 0, crew: 3 });
const start = createBrawlCrewStart(block);

test("does count the first wave goon by goon, every one of them still to come, with the edge each steps in from", () => {
  const meter = resolveWaveMeter(start, block);
  const wave = block.waves[0];

  assert.equal(meter.waveIndex, 0);
  assert.equal(meter.waveCount, block.waves.length);
  assert.equal(meter.clear, false);
  assert.deepEqual(
    meter.pips.map((pip) => [pip.spawnIndex, pip.side, pip.state]),
    wave?.spawns.map((spawn) => [spawn.index, spawn.side, "waiting"])
  );
});

test("does furnish the meter for the crew it was dealt for: more pips for more hens", () => {
  const solo = resolveBrawlCrewBlock({ seed: 20261001, blocks: 3, block: 0, crew: 1 });

  assert.ok(resolveWaveMeter(start, block).pips.length > resolveWaveMeter(createBrawlCrewStart(solo), solo).pips.length);
});

test("does stand a goon that has stepped in on the street and light one that has gone down", () => {
  const fought = advanceBrawlCrew(start, block, [], 240);
  const meter = resolveWaveMeter(fought, block);

  assert.ok(fought.spawned > 0, "nobody stepped in");
  assert.ok(meter.pips.some((pip) => pip.state === "in"));
  assert.ok(meter.pips.filter((pip) => pip.state !== "waiting").length === Math.min(fought.spawned, meter.pips.length));

  const first = fought.goons[0];
  const swept: BrawlCrewFrame = { ...fought, goons: fought.goons.filter((goon) => goon !== first) };

  assert.equal(resolveWaveMeter(swept, block).pips.find((pip) => pip.spawnIndex === first?.spawnIndex)?.state, "down");
  assert.equal(
    resolveWaveMeter({ ...fought, goons: fought.goons.map((goon) => (goon === first ? { ...goon, state: "ko" as const } : goon)) }, block).pips.find(
      (pip) => pip.spawnIndex === first?.spawnIndex
    )?.state,
    "down"
  );
});

test("does hold the wave just cleared, every pip lit, under GO once the camera lets go", () => {
  const walkingOn: BrawlCrewFrame = { ...start, waveIndex: 1, cameraLocked: false, spawned: block.waves[0]?.spawns.length ?? 0, goons: [] };
  const meter = resolveWaveMeter(walkingOn, block);

  assert.equal(meter.waveIndex, 0);
  assert.equal(meter.clear, true);
  assert.ok(meter.pips.every((pip) => pip.state === "down"));
});

test("does count the next wave from its own first goon once the camera locks again", () => {
  const next: BrawlCrewFrame = { ...start, waveIndex: 1, cameraLocked: true, spawned: block.waves[0]?.spawns.length ?? 0, goons: [] };
  const meter = resolveWaveMeter(next, block);

  assert.equal(meter.waveIndex, 1);
  assert.ok(meter.pips.every((pip) => pip.state === "waiting"));
});

test("does keep its signature while the count stands and change it when a goon steps in or goes down", () => {
  const before = resolveWaveMeterSignature(resolveWaveMeter(start, block));

  const later: BrawlCrewFrame = { ...start, tick: 9 };

  assert.equal(resolveWaveMeterSignature(resolveWaveMeter(later, block)), before);
  assert.notEqual(resolveWaveMeterSignature(resolveWaveMeter(advanceBrawlCrew(start, block, [], 240), block)), before);
});
