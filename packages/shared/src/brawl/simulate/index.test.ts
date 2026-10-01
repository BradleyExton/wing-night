import assert from "node:assert/strict";
import test from "node:test";

import type { BrawlBlock, BrawlFrame, BrawlGoon, BrawlGoonKind, BrawlInput, BrawlSide } from "../types.js";
import { BRAWL_WORLD, resolveBrawlBlock, resolveBrawlTickCap } from "../world/index.js";
import { advanceBrawl, createBrawlRunSkip, createBrawlRunStart, runBrawlRun, stepBrawl } from "./index.js";

const SEED = 20261001;
const COURSE = { seed: SEED, blocks: 3 };

// A hand-built block, so a test says what it is testing instead of hunting a seed for it.
const handBlock = (goons: { kind: BrawlGoonKind; side: BrawlSide; atTick: number }[]): BrawlBlock => {
  const spawns = goons.map((goon, index) => ({ ...goon, index }));

  return {
    index: 0,
    length: BRAWL_WORLD.width * 2,
    waves: [{ index: 0, lockX: 0, spawns }],
    handoffX: BRAWL_WORLD.width * 2 - BRAWL_WORLD.henMargin * 3,
    spawns,
    goonsTotal: spawns.reduce((total, spawn) => total + BRAWL_WORLD.goons[spawn.kind].worth, 0)
  };
};

type Decide = (frame: BrawlFrame) => { dir: -1 | 0 | 1; peck: boolean };

/**
 * Plays a block with a bot that reads each frame and decides, logging only what changed — the
 * shape of log the tablet sends. Returns the log and every frame it passed through.
 */
const play = (block: BrawlBlock, decide: Decide, ticks = resolveBrawlTickCap()) => {
  let frame = createBrawlRunStart(block);
  const inputs: BrawlInput[] = [];
  const frames: BrawlFrame[] = [frame];

  while (frame.outcome === null && frame.tick < ticks) {
    const { dir, peck } = decide(frame);
    const now: BrawlInput[] = [];

    if (dir !== frame.walking) {
      now.push({ tick: frame.tick, kind: "walk", dir });
    }

    if (peck) {
      now.push({ tick: frame.tick, kind: "peck" });
    }

    inputs.push(...now);
    frame = stepBrawl(frame, block, now);
    frames.push(frame);
  }

  return { inputs, frames, frame };
};

/** The masher: holds right from the first tick and taps the peck zone every ten ticks, whatever happens. */
const masher: Decide = (frame) => ({ dir: 1, peck: frame.tick % 10 === 0 });

const isFightable = (goon: BrawlGoon): boolean => goon.state !== "ko" && goon.state !== "entering";

/**
 * The brawler: turns to the nearest goon that has stepped in, walks up to it and pecks once it
 * is in reach and she is facing it; walks on when the street is clear.
 */
const brawler: Decide = (frame) => {
  const fightable = frame.goons.filter(isFightable);

  if (fightable.length === 0) {
    return { dir: frame.cameraLocked ? 0 : 1, peck: false };
  }

  const nearest = fightable.reduce((best, goon) => {
    return Math.abs(goon.x - frame.x) < Math.abs(best.x - frame.x) ? goon : best;
  });
  const side: -1 | 1 = nearest.x >= frame.x ? 1 : -1;

  if (Math.abs(nearest.x - frame.x) > 14) {
    return { dir: side, peck: false };
  }

  return frame.facing === side ? { dir: 0, peck: true } : { dir: side, peck: false };
};

test("does stand the hen on the line with three hearts and the camera locked on wave 0 when a block starts", () => {
  const block = resolveBrawlBlock(COURSE);
  const frame = createBrawlRunStart(block);

  assert.equal(frame.tick, 0);
  assert.equal(frame.hearts, BRAWL_WORLD.heartsMax);
  assert.equal(frame.cameraX, block.waves[0]?.lockX);
  assert.equal(frame.cameraLocked, true);
  assert.equal(frame.waveIndex, 0);
  assert.deepEqual(frame.goons, []);
  assert.equal(frame.outcome, null);
});

test("does settle a skipped block on the line with the bell rung and nothing banked", () => {
  const frame = createBrawlRunSkip(resolveBrawlBlock(COURSE));

  assert.equal(frame.outcome, "timeout");
  assert.equal(frame.goonsDown, 0);
  assert.deepEqual(stepBrawl(frame, resolveBrawlBlock(COURSE), []), frame);
});

test("does run to the cap or the bay with nothing down when nobody touches the tablet", () => {
  const run = runBrawlRun(COURSE, []);

  assert.ok(run.outcome === "timeout" || run.outcome === "ko", `ended ${run.outcome}`);
  assert.equal(run.goons, 0);
  assert.ok(run.frame.hits.length > 0, "the geese left a standing hen alone");
  assert.ok(run.endTick <= resolveBrawlTickCap());
});

test("does end the block on the bell when the cap comes round with the hen still standing", () => {
  // Nobody comes: the wave is down before it starts, and a hen who never walks on is still there at the cap.
  const block = { ...handBlock([]), waves: [{ index: 0, lockX: 0, spawns: [] }] };
  const frame = advanceBrawl(createBrawlRunStart(block), block, [], resolveBrawlTickCap() + 50);

  assert.equal(frame.outcome, "timeout");
  assert.equal(frame.tick, resolveBrawlTickCap());
  assert.equal(frame.hearts, BRAWL_WORLD.heartsMax);
});

test("does put a goose down when the hen walks up to it and pecks once it is in reach", () => {
  const block = handBlock([{ kind: "goose", side: 1, atTick: 10 }]);
  const { frame } = play(block, brawler, 900);

  assert.equal(frame.goonsDown, 1);
  assert.equal(frame.kos.length, 1);
  assert.ok(frame.landed.length >= 1);
  assert.deepEqual(frame.hits, []);
});

test("does lock the camera through a wave and let it go once the wave is down", () => {
  const block = resolveBrawlBlock(COURSE);
  const { frames } = play(block, brawler);
  const waveDown = frames.findIndex((frame) => frame.waveIndex === 1);
  const relocked = frames.findIndex((frame, tick) => tick > waveDown && frame.cameraLocked);

  assert.ok(waveDown > 0, "wave 0 never went down");
  assert.ok(frames.slice(0, waveDown).every((frame) => frame.cameraLocked && frame.cameraX === 0));
  assert.equal(frames[waveDown]?.cameraLocked, false);
  assert.ok(relocked > waveDown, "the camera never locked on wave 1");
  assert.equal(frames[relocked]?.cameraX, block.waves[1]?.lockX);
  assert.equal(frames[relocked]?.waveOpenedTick, relocked);

  // Between the two it only ever moved right, and never faster than it is allowed to.
  for (let tick = waveDown + 1; tick <= relocked; tick += 1) {
    const moved = (frames[tick]?.cameraX ?? 0) - (frames[tick - 1]?.cameraX ?? 0);

    assert.ok(moved >= 0 && moved <= BRAWL_WORLD.cameraUnlockSpeed + 1e-9, `the camera moved ${moved} at ${tick}`);
  }
});

test("does keep the hen inside the camera's window whichever way she walks", () => {
  const block = resolveBrawlBlock(COURSE);
  const inWindow = (frame: BrawlFrame): boolean => {
    return (
      frame.x >= frame.cameraX + BRAWL_WORLD.henMargin - 1e-9 &&
      frame.x <= frame.cameraX + BRAWL_WORLD.width - BRAWL_WORLD.henMargin + 1e-9
    );
  };

  for (const dir of [-1, 1] as const) {
    const { frames } = play(block, () => ({ dir, peck: false }), 600);

    assert.ok(frames.every(inWindow), `walking ${dir} left the window`);
  }

  const { frames } = play(block, brawler);

  assert.ok(frames.every(inWindow), "the brawler left the window");
});

test("does cost one heart and no more when a lunge overlaps her for several ticks", () => {
  const block = handBlock([{ kind: "goose", side: 1, atTick: 1 }]);
  const { frames } = play(block, () => ({ dir: 0, peck: false }), 600);
  const hitTick = frames.findIndex((frame) => frame.hits.length > 0);
  const hit = frames[hitTick];

  assert.ok(hit !== undefined, "the goose never landed");
  assert.equal(hit.hearts, BRAWL_WORLD.heartsMax - 1);
  assert.equal(hit.invulnerableUntilTick, hitTick + BRAWL_WORLD.invulnerableTicks);
  assert.equal(hit.hurtUntilTick, hitTick + BRAWL_WORLD.hurtTicks);

  // The knockback shoves her off it, but the lunge carries on and runs through her again while
  // she is still invulnerable: that costs nothing.
  const window = frames.slice(hitTick + 1, hitTick + BRAWL_WORLD.invulnerableTicks);
  const overlapping = window.filter((frame) => {
    return frame.goons.some((goon) => {
      return (
        goon.state === "attack" &&
        Math.abs(goon.x - frame.x) < BRAWL_WORLD.henRadius + BRAWL_WORLD.goons.goose.halfWidth
      );
    });
  });

  assert.ok(overlapping.length > 0, "the lunge never came back over her");
  assert.ok(window.every((frame) => frame.hearts === BRAWL_WORLD.heartsMax - 1));
});

test("does carry her to the bay when the third hit lands", () => {
  const block = handBlock([
    { kind: "goose", side: 1, atTick: 1 },
    { kind: "goose", side: -1, atTick: 1 },
    { kind: "goose", side: 1, atTick: 200 }
  ]);
  const { frame } = play(block, () => ({ dir: 0, peck: false }));

  assert.equal(frame.outcome, "ko");
  assert.equal(frame.hearts, 0);
  assert.equal(frame.hits.length, BRAWL_WORLD.heartsMax);
  assert.deepEqual(stepBrawl(frame, block, []), frame);
});

test("does let one peck put down one goon when two stand in its box", () => {
  const block = handBlock([]);
  const start = createBrawlRunStart(block);
  const goose = (spawnIndex: number, x: number): BrawlGoon => ({
    spawnIndex,
    kind: "goose",
    x,
    y: 0,
    vx: 0,
    vy: 0,
    facing: -1,
    hp: 1,
    state: "recover",
    stateUntilTick: 1000,
    koTick: null
  });
  const frame: BrawlFrame = { ...start, spawned: 2, goons: [goose(0, start.x + 12), goose(1, start.x + 8)] };
  const toTick = BRAWL_WORLD.peckDelayTicks + BRAWL_WORLD.peckActiveTicks;
  const pecked = advanceBrawl(frame, block, [{ tick: 0, kind: "peck" }], toTick);

  assert.equal(pecked.kos.length, 1);
  assert.equal(pecked.goons.find((goon) => goon.state === "ko")?.spawnIndex, 1);
});

test("does only hit a gull while it is low enough to peck", () => {
  const block = handBlock([]);
  const start = createBrawlRunStart(block);
  const gullAt = (y: number): BrawlFrame => ({
    ...start,
    spawned: 1,
    goons: [
      {
        spawnIndex: 0,
        kind: "gull",
        x: start.x + 8,
        y,
        vx: 0,
        vy: 0,
        facing: -1,
        hp: 1,
        // Mid-dive, so it holds its height while the peck comes out.
        state: "attack",
        stateUntilTick: 1000,
        koTick: null
      }
    ]
  });
  // She is invulnerable throughout, so the dive passing her cannot knock the beak shut.
  const pecksDown = (y: number): number => {
    const frame = { ...gullAt(y), invulnerableUntilTick: 1000 };

    return advanceBrawl(frame, block, [{ tick: 0, kind: "peck" }], BRAWL_WORLD.peckDelayTicks + 1).kos.length;
  };

  assert.equal(pecksDown(BRAWL_WORLD.gullCruiseY), 0);
  assert.equal(pecksDown(3), 1);
});

test("does dive a gull through her height and back to its cruise when it attacks", () => {
  const block = handBlock([{ kind: "gull", side: 1, atTick: 1 }]);
  const { frames } = play(block, () => ({ dir: 0, peck: false }), 600);
  const diving = frames.flatMap((frame) => frame.goons.filter((goon) => goon.state === "attack"));
  const lowest = Math.min(...diving.map((goon) => goon.y));
  const recovering = frames.flatMap((frame) => frame.goons.filter((goon) => goon.state === "recover"));

  assert.ok(diving.length > 0, "the gull never dived");
  assert.ok(lowest < BRAWL_WORLD.henHeight / 2, `the dive bottomed out at ${lowest}`);
  assert.ok(recovering.every((goon) => goon.y === BRAWL_WORLD.gullCruiseY));
  assert.ok(frames.some((frame) => frame.hits.length > 0), "the dive went over her head");
});

test("does charge a raccoon at twice its walking speed when it attacks", () => {
  const block = handBlock([{ kind: "raccoon", side: 1, atTick: 1 }]);
  const { frames } = play(block, () => ({ dir: 0, peck: false }), 600);
  const charging = frames.flatMap((frame) => frame.goons.filter((goon) => goon.state === "attack"));
  const { speed } = BRAWL_WORLD.goons.raccoon;

  assert.ok(charging.length > 0, "the raccoon never charged");
  assert.ok(charging.every((goon) => Math.abs(goon.vx) === speed * 2));
});

test("does stun a goon a peck does not finish, and shove it away from her", () => {
  const block = handBlock([]);
  const start = createBrawlRunStart(block);
  const x = start.x + 10;
  const frame: BrawlFrame = {
    ...start,
    spawned: 1,
    goons: [
      {
        spawnIndex: 0,
        kind: "raccoon",
        x,
        y: 0,
        vx: 0,
        vy: 0,
        facing: -1,
        hp: 2,
        state: "telegraph",
        stateUntilTick: 1000,
        koTick: null
      }
    ]
  };
  const pecked = advanceBrawl(frame, block, [{ tick: 0, kind: "peck" }], BRAWL_WORLD.peckDelayTicks + 1);
  const raccoon = pecked.goons[0];

  assert.equal(raccoon?.state, "stunned");
  assert.equal(raccoon?.hp, 1);
  assert.equal(raccoon?.x, x + BRAWL_WORLD.goons.raccoon.knockback);
  assert.equal(pecked.goonsDown, 0);
  assert.deepEqual(pecked.landed, [BRAWL_WORLD.peckDelayTicks]);
});

test("does drop a fallen goon from the street once its fall has played", () => {
  const block = handBlock([{ kind: "goose", side: 1, atTick: 10 }]);
  const { frames } = play(block, brawler, 900);
  const koTick = frames.findIndex((frame) => frame.kos.length > 0);

  assert.equal(frames[koTick]?.goons[0]?.state, "ko");
  assert.equal(frames[koTick]?.goons[0]?.koTick, koTick);
  assert.equal(frames[koTick + BRAWL_WORLD.koFallTicks]?.goons.length, 0);
});

test("does clear the block when the last wave is down and she reaches the handoff", () => {
  const block = resolveBrawlBlock(COURSE);
  const { frame } = play(block, brawler);

  assert.equal(frame.outcome, "cleared");
  assert.equal(frame.waveIndex, block.waves.length);
  assert.ok(frame.x >= block.handoffX);
  assert.equal(frame.goonsDown, block.goonsTotal);
});

test("does referee the log to the tablet's own frame, bit for bit, however it is stepped", () => {
  const course = { ...COURSE, block: 2 };
  const block = resolveBrawlBlock(course);
  const { inputs, frame } = play(block, brawler);
  const refereed = runBrawlRun(course, inputs);

  assert.deepEqual(refereed.frame, frame);
  assert.equal(refereed.outcome, frame.outcome);
  assert.equal(refereed.goons, frame.goonsDown);

  let piecemeal = createBrawlRunStart(block);

  for (let tick = 7; piecemeal.outcome === null; tick += 7) {
    piecemeal = advanceBrawl(piecemeal, block, inputs, tick);
  }

  assert.deepEqual(piecemeal, frame);
});

test("does ignore an input logged before the frame's tick rather than apply it late", () => {
  const block = resolveBrawlBlock(COURSE);
  const at100 = advanceBrawl(createBrawlRunStart(block), block, [], 100);
  const late: BrawlInput[] = [
    { tick: 50, kind: "walk", dir: 1 },
    { tick: 60, kind: "peck" }
  ];

  assert.deepEqual(advanceBrawl(at100, block, late, 300), advanceBrawl(at100, block, [], 300));
  assert.deepEqual(stepBrawl(at100, block, late), stepBrawl(at100, block, []));
});

test("does take block 0's first wave down inside twenty seconds when the sandbox's seed is mashed", () => {
  const block = resolveBrawlBlock({ ...COURSE, block: 0 });
  const { frames } = play(block, masher);
  const waveDown = frames.findIndex((each) => each.waveIndex >= 1);

  assert.ok(waveDown > 0 && waveDown <= 20 * BRAWL_WORLD.tickHz, `wave 0 went down at ${waveDown}`);
});

// The balance pin, measured over streets rather than one seed's luck: a mash gets most teams
// through the easy block with something lost, and almost nobody through the block with the
// raccoon and the boss — which is where turning round starts to matter.
test("does let a masher through most block 0 streets and almost no block 2 streets", () => {
  const SEEDS = 200;
  const clears = (block: number): { cleared: number; hearts: number } => {
    let cleared = 0;
    let hearts = 0;

    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { frame } = play(resolveBrawlBlock({ seed, blocks: 3, block }), masher);

      if (frame.outcome === "cleared") {
        cleared += 1;
        hearts += frame.hearts;
      }
    }

    return { cleared, hearts: cleared === 0 ? 0 : hearts / cleared };
  };
  const easy = clears(0);
  const hard = clears(2);

  assert.ok(easy.cleared >= SEEDS * 0.55, `block 0 cleared on ${easy.cleared} of ${SEEDS}`);
  assert.ok(easy.hearts < BRAWL_WORLD.heartsMax - 0.5, `block 0 cleared on ${easy.hearts} hearts on average`);
  assert.ok(hard.cleared <= SEEDS * 0.1, `block 2 cleared on ${hard.cleared} of ${SEEDS}`);
});

test("does cost a masher at least two hearts when block 2 brings the raccoon and the boss", () => {
  const block = resolveBrawlBlock({ ...COURSE, block: 2 });
  const { frame } = play(block, masher);

  assert.ok(BRAWL_WORLD.heartsMax - frame.hearts >= 2, `the masher ended ${frame.outcome} on ${frame.hearts} hearts`);
});

test("does let a brawler who turns to the nearest goon clear every block of the course", () => {
  for (let index = 0; index < 3; index += 1) {
    const { frame } = play(resolveBrawlBlock({ ...COURSE, block: index }), brawler);

    assert.equal(frame.outcome, "cleared", `block ${index} ended ${frame.outcome}`);
  }
});

test("does re-run a whole block from the top well inside the TV's budget", () => {
  const course = { ...COURSE, block: 2 };
  const { inputs } = play(resolveBrawlBlock(course), brawler);

  runBrawlRun(course, inputs);

  const started = performance.now();

  for (let run = 0; run < 5; run += 1) {
    runBrawlRun(course, inputs);
  }

  const each = (performance.now() - started) / 5;

  assert.ok(each < 50, `a re-run took ${each.toFixed(1)} ms`);
});
