import assert from "node:assert/strict";
import test from "node:test";

import type { BrawlGoonKind } from "../types.js";
import {
  BRAWL_WORLD,
  resolveBrawlBlock,
  resolveBrawlCourseTotal,
  resolveBrawlGoonBox,
  resolveBrawlTickCap
} from "./index.js";

const SEED = 20261001;

const blockOf = (block: number, seed = SEED, blocks = 4) => resolveBrawlBlock({ seed, blocks, block });

const kindsOf = (block: number, wave: number, seed = SEED): BrawlGoonKind[] => {
  return blockOf(block, seed).waves[wave]?.spawns.map((spawn) => spawn.kind) ?? [];
};

const count = (kinds: BrawlGoonKind[], kind: BrawlGoonKind): number => kinds.filter((each) => each === kind).length;

test("does lay the same block twice when the seed is the same", () => {
  assert.deepEqual(blockOf(0), blockOf(0));
  assert.deepEqual(blockOf(2), blockOf(2));
});

test("does lay a different street when the block index or the seed changes", () => {
  const streetOf = (block: number, seed: number) => {
    return blockOf(block, seed).spawns.map((spawn) => `${spawn.kind}${spawn.side}@${spawn.atTick}`);
  };

  assert.notDeepEqual(streetOf(0, SEED), streetOf(1, SEED));
  assert.notDeepEqual(streetOf(0, SEED), streetOf(0, SEED + 1));
});

test("does lay a block the same whatever the course's length when the index is the same", () => {
  assert.deepEqual(blockOf(2, SEED, 3), blockOf(2, SEED, 5));
});

test("does clamp the block to the course when the index runs past it", () => {
  assert.equal(resolveBrawlBlock({ seed: SEED }).index, 0);
  assert.equal(resolveBrawlBlock({ seed: SEED, blocks: 3, block: 9 }).index, 2);
  assert.equal(resolveBrawlBlock({ seed: SEED, blocks: 3, block: -1 }).index, 0);
});

test("does open block 0 on three geese and then four geese and gulls when it is the first block", () => {
  for (let seed = 0; seed < 40; seed += 1) {
    const block = blockOf(0, seed);

    assert.deepEqual(
      block.waves.map((wave) => wave.spawns.length),
      [3, 4]
    );
    assert.deepEqual(kindsOf(0, 0, seed), ["goose", "goose", "goose"]);
    assert.ok(block.spawns.every((spawn) => spawn.kind === "goose" || spawn.kind === "gull"));
  }
});

test("does put one raccoon in block 1's second wave when the raccoon arrives", () => {
  for (let seed = 0; seed < 40; seed += 1) {
    assert.deepEqual(
      blockOf(1, seed).waves.map((wave) => wave.spawns.length),
      [4, 5]
    );
    assert.equal(count(kindsOf(1, 0, seed), "raccoon"), 0);
    assert.equal(count(kindsOf(1, 1, seed), "raccoon"), 1);
  }
});

test("does close block 2 on the boss alone when it is the last spawn", () => {
  for (let seed = 0; seed < 40; seed += 1) {
    const block = blockOf(2, seed);
    const last = block.spawns[block.spawns.length - 1];

    assert.deepEqual(
      block.waves.map((wave) => wave.spawns.length),
      [4, 5, 3]
    );
    assert.equal(last?.kind, "boss");
    assert.equal(count(block.spawns.map((spawn) => spawn.kind), "boss"), 1);
  }
});

test("does repeat block 2's shape with one more goon a wave when the course runs past it", () => {
  const block = blockOf(3);

  assert.deepEqual(
    block.waves.map((wave) => wave.spawns.length),
    [5, 6, 4]
  );
  assert.equal(block.spawns[block.spawns.length - 1]?.kind, "boss");
});

test("does bring every wave in from both sides when it has more than one goon", () => {
  for (let seed = 0; seed < 60; seed += 1) {
    for (let index = 0; index < 4; index += 1) {
      for (const wave of blockOf(index, seed).waves) {
        const regulars = wave.spawns.filter((spawn) => spawn.kind !== "boss");
        const sides = new Set(regulars.map((spawn) => spawn.side));

        assert.equal(sides.size, regulars.length > 1 ? 2 : 1, `seed ${seed} block ${index} wave ${wave.index}`);
      }
    }
  }
});

test("does spread a wave over about four seconds when its goons step in", () => {
  for (let seed = 0; seed < 40; seed += 1) {
    for (let index = 0; index < 3; index += 1) {
      for (const wave of blockOf(index, seed).waves) {
        const ticks = wave.spawns.filter((spawn) => spawn.kind !== "boss").map((spawn) => spawn.atTick);

        ticks.forEach((tick, slot) => {
          assert.ok(slot === 0 || tick > (ticks[slot - 1] ?? 0), `seed ${seed} stepped two goons in on one tick`);
        });
        assert.ok((ticks[ticks.length - 1] ?? 0) - (ticks[0] ?? 0) <= 4.5 * BRAWL_WORLD.tickHz);
      }
    }
  }
});

test("does measure the street in camera widths when it lays out the locks and the handoff", () => {
  const block = blockOf(2);

  assert.equal(block.length, (block.waves.length + 1) * BRAWL_WORLD.width);
  assert.deepEqual(
    block.waves.map((wave) => wave.lockX),
    block.waves.map((wave) => wave.index * BRAWL_WORLD.width)
  );
  assert.equal(block.handoffX, block.length - BRAWL_WORLD.henMargin * 3);
  assert.deepEqual(
    block.spawns.map((spawn) => spawn.index),
    block.spawns.map((_, index) => index)
  );
});

test("does price a block at the worth of its goons when it totals them", () => {
  const block = blockOf(2);
  const worth = block.spawns.reduce((total, spawn) => total + BRAWL_WORLD.goons[spawn.kind].worth, 0);

  assert.equal(block.goonsTotal, worth);
  assert.equal(blockOf(0).goonsTotal, 7);
});

test("does sum every block's worth when it totals the course", () => {
  const expected = [0, 1, 2].reduce((total, block) => total + blockOf(block, SEED, 3).goonsTotal, 0);

  assert.equal(resolveBrawlCourseTotal({ seed: SEED, blocks: 3 }), expected);
  assert.equal(resolveBrawlCourseTotal({ seed: SEED, blocks: 1 }), blockOf(0).goonsTotal);
});

test("does make the boss a goose with four hp, double reach and four worth when it is dealt", () => {
  const { goose, boss, raccoon } = BRAWL_WORLD.goons;

  assert.equal(boss.hp, 4);
  assert.equal(boss.worth, 4);
  assert.equal(boss.reach, goose.reach * 2);
  assert.equal(raccoon.hp, 2);
  assert.equal(raccoon.lunge, raccoon.speed * 2);
});

test("does never let a press cut the last peck short when the cooldown is tuned", () => {
  assert.ok(BRAWL_WORLD.peckCooldownTicks >= BRAWL_WORLD.peckDelayTicks + BRAWL_WORLD.peckActiveTicks);
});

test("does hand the goon box and the tick cap out when asked", () => {
  assert.deepEqual(resolveBrawlGoonBox("boss"), {
    halfWidth: BRAWL_WORLD.goons.boss.halfWidth,
    height: BRAWL_WORLD.goons.boss.height
  });
  assert.equal(resolveBrawlTickCap(), 75 * 60);
});
