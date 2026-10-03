import assert from "node:assert/strict";
import test from "node:test";

import type { BrawlGoonKind } from "../types.js";
import {
  BRAWL_WORLD,
  isBrawlGoonGuarded,
  resolveBrawlBlock,
  resolveBrawlBlockWorth,
  resolveBrawlCourseTotal,
  resolveBrawlGoonBox,
  resolveBrawlHeartsCap,
  resolveBrawlHeartsCarried,
  resolveBrawlHeartsTotal,
  resolveBrawlStartHearts,
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
    assert.ok(block.spawns.every((spawn) => spawn.kind === "goose" || spawn.kind === "gull"), "no swan, no helmet in the easy block");
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

// The mix is a rule and only the order is dealt: every seed fields the same kit, wave by wave.
const KIT: Record<number, Partial<Record<BrawlGoonKind, number>>[]> = {
  0: [{ goose: 3 }, { goose: 3, gull: 1 }],
  1: [
    { goose: 2, gull: 1, swan: 1 },
    { goose: 3, gull: 1, raccoon: 1 }
  ],
  2: [
    { goose: 1, gull: 1, raccoon: 1, helmet: 1 },
    { goose: 1, gull: 2, raccoon: 1, swan: 1 },
    { gull: 1, helmet: 1, boss: 1 }
  ],
  3: [
    { goose: 2, gull: 1, raccoon: 1, helmet: 1 },
    { goose: 2, gull: 2, raccoon: 1, swan: 1 },
    { goose: 1, gull: 1, helmet: 1, boss: 1 }
  ]
};
const KINDS: BrawlGoonKind[] = ["goose", "gull", "raccoon", "swan", "helmet", "boss"];

test("does field the swan in block 1's first wave and the helmet goose from block 2 when it deals the course", () => {
  for (let seed = 0; seed < 40; seed += 1) {
    for (const [index, waves] of Object.entries(KIT)) {
      waves.forEach((kit, wave) => {
        const kinds = kindsOf(Number(index), wave, seed);

        for (const kind of KINDS) {
          assert.equal(count(kinds, kind), kit[kind] ?? 0, `seed ${seed} block ${index} wave ${wave}: ${kind}`);
        }
      });
    }
  }
});

test("does deal the new goons into seeded slots, not always the same ones", () => {
  const slotsOf = (kind: BrawlGoonKind, block: number, wave: number): Set<number> => {
    const slots = new Set<number>();

    for (let seed = 0; seed < 40; seed += 1) {
      slots.add(kindsOf(block, wave, seed).indexOf(kind));
    }

    return slots;
  };

  assert.ok(slotsOf("swan", 1, 0).size > 1);
  assert.ok(slotsOf("helmet", 2, 0).size > 1);
});

test("does give every block one hazard of its setting, inside wave 1's window and never wave 0's", () => {
  const { width, hazardWidth } = BRAWL_WORLD;
  const sides = new Set<string>();

  for (let seed = 0; seed < 200; seed += 1) {
    for (let index = 0; index < 4; index += 1) {
      const block = blockOf(index, seed);
      const hazard = block.hazard;
      const lockX = block.waves[1]?.lockX ?? Number.NaN;

      assert.ok(hazard !== null, `seed ${seed} block ${index} has a hazard`);
      assert.equal(hazard.kind, index === 0 ? "railing" : index === 1 ? "bay" : "plinth");
      assert.equal(hazard.width, hazardWidth);
      // Wave 1's window, clear of wave 0's.
      assert.ok(hazard.x >= lockX && hazard.x + hazard.width <= lockX + width, `seed ${seed} block ${index} in wave 1's window`);
      assert.ok(hazard.x >= (block.waves[0]?.lockX ?? 0) + width, `seed ${seed} block ${index} clear of wave 0`);
      // The left or the right third: never where she walks in (about 40% of the window), and off the edges goons step in at.
      const left = hazard.x - lockX;
      const right = left + hazard.width;

      assert.ok(right <= width / 3 || left >= (2 * width) / 3, `seed ${seed} block ${index} in an outer third (${left}..${right})`);
      assert.ok(left >= 14 && right <= width - 14, `seed ${seed} block ${index} off the edges`);
      assert.ok(right < width * BRAWL_WORLD.cameraLeadShare || left > width * BRAWL_WORLD.cameraLeadShare);
      sides.add(right <= width / 3 ? "left" : "right");
    }
  }

  assert.deepEqual([...sides].sort(), ["left", "right"], "the seed picks the side");
  assert.deepEqual(blockOf(1).hazard, blockOf(1).hazard);
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

test("does price a block at the worth of its goons plus a clean bonus a wave when it totals them", () => {
  const block = blockOf(2);
  const worth = block.spawns.reduce((total, spawn) => total + BRAWL_WORLD.goons[spawn.kind].worth, 0);

  assert.equal(block.goonsTotal, worth + block.waves.length * BRAWL_WORLD.cleanWaveBonus);
  // Fixed by the kit, whatever the seed: 7, 11 and 20 goon worth over two, two and three waves.
  assert.equal(blockOf(0).goonsTotal, 7 + 2 * 2);
  assert.equal(blockOf(1).goonsTotal, 11 + 2 * 2);
  assert.equal(blockOf(2).goonsTotal, 20 + 3 * 2);
});

test("does bank the hearts only when the block was cleared when it prices a refereed block", () => {
  assert.equal(resolveBrawlBlockWorth({ outcome: "cleared", goons: 11, hearts: 3 }), 11 + 3 * BRAWL_WORLD.heartWorth);
  assert.equal(resolveBrawlBlockWorth({ outcome: "cleared", goons: 11, hearts: 0 }), 11);
  assert.equal(resolveBrawlBlockWorth({ outcome: "ko", goons: 5, hearts: 0 }), 5);
  // The bell rings on a standing hen, but she did not walk off: nothing for the hearts.
  assert.equal(resolveBrawlBlockWorth({ outcome: "timeout", goons: 5, hearts: 2 }), 5);
  assert.equal(resolveBrawlHeartsTotal(), BRAWL_WORLD.heartsMax * BRAWL_WORLD.heartWorth);
});

test("does sum every block's worth and hearts when it totals the course", () => {
  const expected = [0, 1, 2].reduce((total, block) => total + blockOf(block, SEED, 3).goonsTotal + resolveBrawlHeartsTotal(), 0);

  assert.equal(resolveBrawlCourseTotal({ seed: SEED, blocks: 3 }), expected);
  assert.equal(resolveBrawlCourseTotal({ seed: SEED, blocks: 1 }), blockOf(0).goonsTotal + resolveBrawlHeartsTotal());
  // 38 goon worth, 7 waves at 2, and three blocks of three hearts: the number on the TV.
  assert.equal(resolveBrawlCourseTotal({ seed: SEED, blocks: 3 }), 61);
  // The sandbox's two blocks.
  assert.equal(resolveBrawlCourseTotal({ seed: SEED, blocks: 2 }), 32);
});

test("does make the boss a goose with four hp, double reach and four worth when it is dealt", () => {
  const { goose, boss, raccoon } = BRAWL_WORLD.goons;

  assert.equal(boss.hp, 4);
  assert.equal(boss.worth, 4);
  assert.equal(boss.reach, goose.reach * 2);
  assert.equal(raccoon.hp, 2);
  assert.equal(raccoon.lunge, raccoon.speed * 2);
});

test("does make the swan a bigger, slower bird worth two and the helmet goose a goose worth two", () => {
  const { goose, swan, helmet } = BRAWL_WORLD.goons;

  assert.deepEqual(
    { hp: swan.hp, worth: swan.worth, halfWidth: swan.halfWidth, height: swan.height, speed: swan.speed, reach: swan.reach },
    { hp: 1, worth: 2, halfWidth: 6, height: 18, speed: 0.35, reach: 18 }
  );
  assert.ok(swan.height > goose.height && swan.speed < goose.speed);
  assert.deepEqual({ ...helmet, worth: goose.worth }, goose);
  assert.equal(helmet.worth, 2);
});

test("does guard a helmet goose while it walks and reels, and drop the guard for the honk, the lunge and the slump", () => {
  for (const state of ["entering", "approach", "stunned", "ko", "gone"] as const) {
    assert.equal(isBrawlGoonGuarded({ kind: "helmet", state }), true, state);
  }

  for (const state of ["telegraph", "attack", "recover"] as const) {
    assert.equal(isBrawlGoonGuarded({ kind: "helmet", state }), false, state);
  }

  for (const kind of ["goose", "gull", "raccoon", "swan", "boss"] as const) {
    assert.equal(isBrawlGoonGuarded({ kind, state: "approach" }), false, kind);
  }
});

test("does cap the hearts a wing restores at the hearts she starts with", () => {
  assert.equal(resolveBrawlHeartsCap(resolveBrawlBlock({ seed: SEED, blocks: 3, block: 1 })), BRAWL_WORLD.heartsMax);
  assert.equal(resolveBrawlHeartsCap(resolveBrawlBlock({ seed: SEED, blocks: 3, block: 1, hearts: 4 })), 4);
  assert.equal(BRAWL_WORLD.wingTicks, 360);
});

test("does start a block on three hearts, or four when the team bought one at the handoff", () => {
  assert.equal(resolveBrawlStartHearts(false), 3);
  assert.equal(resolveBrawlStartHearts(true), 4);
  assert.equal(resolveBrawlBlock({ seed: SEED, blocks: 3, block: 2 }).hearts, BRAWL_WORLD.heartsMax);
  assert.equal(resolveBrawlBlock({ seed: SEED, blocks: 3, block: 2, hearts: resolveBrawlStartHearts(true) }).hearts, 4);
  // A course can never start her with nothing.
  assert.equal(resolveBrawlBlock({ seed: SEED, hearts: 0 }).hearts, 1);
});

test("does bank no more than three carried hearts when she walks off a bought block with four", () => {
  assert.equal(resolveBrawlHeartsCarried(4), 3);
  assert.equal(resolveBrawlHeartsCarried(2), 2);
  assert.equal(resolveBrawlBlockWorth({ outcome: "cleared", goons: 15, hearts: 4 }), 15 + 3 * BRAWL_WORLD.heartWorth);
  assert.equal(resolveBrawlBlockWorth({ outcome: "cleared", goons: 15, hearts: 3 }), 15 + 3 * BRAWL_WORLD.heartWorth);
  // The course's whole worth does not move: three hearts a block, bought or not.
  assert.equal(resolveBrawlCourseTotal({ seed: SEED, blocks: 3 }), 61);
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
