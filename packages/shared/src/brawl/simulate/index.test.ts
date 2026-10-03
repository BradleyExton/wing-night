import assert from "node:assert/strict";
import test from "node:test";

import type { BrawlBlock, BrawlFrame, BrawlGoon, BrawlGoonKind, BrawlHazard, BrawlInput, BrawlSide } from "../types.js";
import { BRAWL_WORLD, isBrawlGoonGuarded, resolveBrawlBlock, resolveBrawlTickCap } from "../world/index.js";
import { advanceBrawl, createBrawlRunSkip, createBrawlRunStart, isBrawlWaveClean, runBrawlRun, stepBrawl } from "./index.js";

const SEED = 20261001;
const COURSE = { seed: SEED, blocks: 3 };

// A hand-built block, so a test says what it is testing instead of hunting a seed for it.
const handBlock = (goons: { kind: BrawlGoonKind; side: BrawlSide; atTick: number }[], hazard: BrawlHazard | null = null): BrawlBlock => {
  const spawns = goons.map((goon, index) => ({ ...goon, index }));

  return {
    index: 0,
    length: BRAWL_WORLD.width * 2,
    waves: [{ index: 0, lockX: 0, spawns }],
    handoffX: BRAWL_WORLD.width * 2 - BRAWL_WORLD.henMargin * 3,
    spawns,
    hazard,
    hearts: BRAWL_WORLD.heartsMax,
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

const nearestOf = (frame: BrawlFrame): BrawlGoon | null => {
  const fightable = frame.goons.filter(isFightable);

  if (fightable.length === 0) {
    return null;
  }

  return fightable.reduce((best, goon) => {
    return Math.abs(goon.x - frame.x) < Math.abs(best.x - frame.x) ? goon : best;
  });
};

/**
 * The brawler: turns to the nearest goon that has stepped in, walks up to it and pecks once it
 * is in reach and she is facing it; walks on when the street is clear. She has learnt the two
 * new goons the way a player does: facing a swan is what stalls it (so turning to the nearest
 * goon is already the answer), and a helmet goose with its guard down is only clanked — she
 * stands facing it and pecks into the honk.
 */
const brawler: Decide = (frame) => {
  const nearest = nearestOf(frame);

  if (nearest === null) {
    return { dir: frame.cameraLocked ? 0 : 1, peck: false };
  }

  const side: -1 | 1 = nearest.x >= frame.x ? 1 : -1;

  if (Math.abs(nearest.x - frame.x) > 14) {
    return { dir: side, peck: false };
  }

  return frame.facing === side ? { dir: 0, peck: !isBrawlGoonGuarded(nearest) } : { dir: side, peck: false };
};

/**
 * The turner: a masher who turns. Holds the thumb toward the nearest goon that has stepped in —
 * which turns her to face it — and taps the peck zone every ten ticks whatever happens. No
 * timing, no reading the helmet; between waves she walks on.
 */
const turner: Decide = (frame) => {
  const nearest = nearestOf(frame);
  const peck = frame.tick % 10 === 0;

  if (nearest === null) {
    return { dir: frame.cameraLocked ? 0 : 1, peck };
  }

  return { dir: nearest.x >= frame.x ? 1 : -1, peck };
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

test("does stand her on the line with four hearts when the course says the team bought one", () => {
  const bought = { ...COURSE, block: 1, hearts: 4 };
  const block = resolveBrawlBlock(bought);

  assert.equal(createBrawlRunStart(block).hearts, 4);
  assert.equal(createBrawlRunSkip(block).hearts, 4);
  // The street is the same street: only the hearts moved.
  assert.deepEqual({ ...block, hearts: BRAWL_WORLD.heartsMax }, resolveBrawlBlock({ ...COURSE, block: 1 }));
});

test("does referee a bought block from four hearts, so a hen nobody steers takes one hit more to the bay", () => {
  const kept = runBrawlRun({ ...COURSE, block: 1 }, []);
  const bought = runBrawlRun({ ...COURSE, block: 1, hearts: 4 }, []);

  assert.equal(kept.outcome, "ko");
  assert.equal(kept.frame.hits.length, 3);
  assert.equal(bought.outcome, "ko");
  assert.equal(bought.frame.hits.length, 4);
  assert.ok(bought.endTick > kept.endTick, "the fourth heart bought her time on the street");
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
  const { frame, frames } = play(block, brawler, 900);
  const koTick = frames.findIndex((each) => each.kos.length > 0);

  assert.equal(frame.kos.length, 1);
  assert.ok(frame.landed.length >= 1);
  assert.deepEqual(frame.hits, []);
  // The goose is worth 1, and it was the whole wave: the wave goes down on the tick it falls, clean,
  // so the bonus is banked on the same frame.
  assert.equal(frames[koTick]?.goonsDown, 1 + BRAWL_WORLD.cleanWaveBonus);
  assert.deepEqual(frame.bonuses, [koTick]);
  assert.equal(frame.goonsDown, 1 + BRAWL_WORLD.cleanWaveBonus);
});

// A frame with the wave's one goose already down, so the next step is the wave going down.
const waveAboutToFall = (overrides: Partial<BrawlFrame>): { block: BrawlBlock; frame: BrawlFrame } => {
  const block = handBlock([{ kind: "goose", side: 1, atTick: 1 }]);
  const start = createBrawlRunStart(block);
  const fallen: BrawlGoon = {
    spawnIndex: 0,
    kind: "goose",
    x: start.x + 20,
    y: 0,
    vx: 0,
    vy: 0,
    facing: -1,
    hp: 0,
    state: "ko",
    koTick: 40,
    stateUntilTick: 40 + BRAWL_WORLD.koFallTicks
  };

  return { block, frame: { ...start, tick: 41, spawned: 1, goons: [fallen], goonsDown: 1, kos: [40], landed: [40], ...overrides } };
};

test("does bank the clean-wave bonus and the tick when the wave goes down with no hit since it opened", () => {
  const { block, frame } = waveAboutToFall({});

  assert.equal(isBrawlWaveClean(frame), true);

  const down = stepBrawl(frame, block, []);

  assert.equal(down.cameraLocked, false);
  assert.equal(down.waveIndex, 1);
  assert.equal(down.goonsDown, 1 + BRAWL_WORLD.cleanWaveBonus);
  assert.deepEqual(down.bonuses, [42]);
  // Once the camera has let go, the wave just fought still reads as the clean one it was.
  assert.equal(isBrawlWaveClean(down), true);
});

test("does bank no bonus when she was hit during the wave, and ignores a hit from the wave before", () => {
  const { block, frame } = waveAboutToFall({ hits: [30] });

  assert.equal(isBrawlWaveClean(frame), false);

  const bruised = stepBrawl(frame, block, []);

  assert.equal(bruised.cameraLocked, false);
  assert.equal(bruised.goonsDown, 1);
  assert.deepEqual(bruised.bonuses, []);

  // The same hit, but the wave in hand opened after it: that wave is clean.
  const { frame: later } = waveAboutToFall({ hits: [30], waveOpenedTick: 35 });

  assert.equal(isBrawlWaveClean(later), true);
  assert.deepEqual(stepBrawl(later, block, []).bonuses, [42]);
});

test("does send a KO'd goon flying its knockback and leave it to fall where it lands", () => {
  const block = handBlock([]);
  const start = createBrawlRunStart(block);
  const x = start.x + 10;
  const frame: BrawlFrame = {
    ...start,
    spawned: 1,
    goons: [{ spawnIndex: 0, kind: "goose", x, y: 0, vx: 0, vy: 0, facing: -1, hp: 1, state: "approach", stateUntilTick: 0, koTick: null }]
  };
  const pecked = advanceBrawl(frame, block, [{ tick: 0, kind: "peck" }], BRAWL_WORLD.peckDelayTicks + 1);
  const goose = pecked.goons[0];

  assert.equal(goose?.state, "ko");
  assert.equal(goose?.x, x + BRAWL_WORLD.goons.goose.knockback);
  assert.deepEqual(pecked.kos, [BRAWL_WORLD.peckDelayTicks]);
  // Its worth, and the clean bonus for the wave it was the last of.
  assert.equal(pecked.goonsDown, BRAWL_WORLD.goons.goose.worth + BRAWL_WORLD.cleanWaveBonus);
  assert.deepEqual(pecked.bumps, []);
});

const walker = (spawnIndex: number, kind: BrawlGoonKind, x: number, state: BrawlGoon["state"], hp = 1): BrawlGoon => ({
  spawnIndex,
  kind,
  x,
  y: kind === "gull" ? BRAWL_WORLD.gullCruiseY : 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp,
  state,
  // Long timed states, so a goon stands where it is put through the peck's delay.
  stateUntilTick: 1000,
  koTick: null
});

// Three goons to the right of her: the raccoon she pecks, one in the path it is shoved along,
// and a goose beyond that, in the SECOND goon's way but not the raccoon's.
const queuedFrame = (secondState: BrawlGoon["state"] = "recover", secondKind: BrawlGoonKind = "goose") => {
  const block = handBlock([]);
  const start = createBrawlRunStart(block);
  const { knockback, halfWidth } = BRAWL_WORLD.goons.raccoon;
  // The raccoon's path: from x+10 to x+20, widened by its half-width (6) and the other's.
  const pathRight = start.x + 10 + knockback + halfWidth;
  const frame: BrawlFrame = {
    ...start,
    spawned: 3,
    goons: [
      walker(0, "raccoon", start.x + 10, "telegraph", 2),
      // Its near edge sits 2 inside the path's end.
      walker(1, secondKind, pathRight + BRAWL_WORLD.goons[secondKind].halfWidth - 2, secondState),
      // Overlaps the second goon's box, but not the raccoon's path.
      walker(2, "goose", pathRight + 2 * BRAWL_WORLD.goons.goose.halfWidth + 2, "recover")
    ]
  };

  return { frame, pecked: advanceBrawl(frame, block, [{ tick: 0, kind: "peck" }], BRAWL_WORLD.peckDelayTicks + 1) };
};

test("does stun the goon a shoved one is bowled into, with no hp lost and no movement, and chains no further", () => {
  const { frame, pecked } = queuedFrame();
  const [raccoon, bowled, beyond] = pecked.goons;

  assert.equal(raccoon?.state, "stunned");
  assert.equal(raccoon?.x, (frame.goons[0]?.x ?? 0) + BRAWL_WORLD.goons.raccoon.knockback);
  assert.equal(bowled?.state, "stunned");
  assert.equal(bowled?.hp, 1);
  assert.equal(bowled?.x, frame.goons[1]?.x);
  assert.equal(bowled?.stateUntilTick, BRAWL_WORLD.peckDelayTicks + BRAWL_WORLD.goons.goose.stunTicks);
  // One pass: the bowled goose does not bowl the one behind it.
  assert.equal(beyond?.state, "recover");
  assert.equal(beyond?.stateUntilTick, 1000);
  assert.deepEqual(pecked.bumps, [BRAWL_WORLD.peckDelayTicks]);
  assert.deepEqual(pecked.landed, [BRAWL_WORLD.peckDelayTicks]);
  assert.equal(pecked.goonsDown, 0);
});

test("does bowl a goon in any standing state when it is in the path", () => {
  for (const state of ["approach", "telegraph", "attack", "recover"] as const) {
    assert.equal(queuedFrame(state).pecked.goons[1]?.state, "stunned", state);
  }
});

test("does not bowl a gull or a goon already reeling", () => {
  assert.equal(queuedFrame("approach", "gull").pecked.goons[1]?.state, "approach");

  const reeling = queuedFrame("stunned").pecked;

  assert.equal(reeling.goons[1]?.stateUntilTick, 1000, "a stunned goon kept its own reel");
  assert.deepEqual(reeling.bumps, []);
});

test("does not bowl a goon still walking in from off the tablet's frame", () => {
  const block = handBlock([]);
  const start = createBrawlRunStart(block);
  const { width } = BRAWL_WORLD;
  const raccoon = BRAWL_WORLD.goons.raccoon;
  // She is near the right edge and the raccoon is at it, so the shove pins it at the window's edge
  // and its path reaches past the edge — where a goose is still stepping in.
  const frame: BrawlFrame = {
    ...start,
    x: width - raccoon.halfWidth - 10,
    spawned: 2,
    goons: [
      walker(0, "raccoon", width - raccoon.halfWidth, "telegraph", 2),
      walker(1, "goose", width - BRAWL_WORLD.goons.goose.halfWidth + 3, "entering")
    ]
  };
  const pecked = advanceBrawl(frame, block, [{ tick: 0, kind: "peck" }], BRAWL_WORLD.peckDelayTicks + 1);
  const [shoved, entering] = pecked.goons;

  assert.equal(shoved?.state, "stunned");
  assert.equal(shoved?.x, width - raccoon.halfWidth, "the window pinned it");
  assert.equal(entering?.state, "entering");
  assert.ok((entering?.x ?? 0) + BRAWL_WORLD.goons.goose.halfWidth < (shoved?.x ?? 0) + 2 * raccoon.halfWidth, "it was in the path");
  assert.deepEqual(pecked.bumps, []);
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
  // Untouched, so every wave banked its bonus: a perfect block is exactly its total.
  assert.deepEqual(frame.hits, []);
  assert.equal(frame.bonuses.length, block.waves.length);
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
// raccoon and the boss — which is where turning round starts to matter. Knockback chaining
// (2026-10-02) moved these from 133 / 68 / 8 of 200 to 133 / 71 / 12: inside both bands. Tier 2
// (the swan, the helmet goose, the hazards and the wing) moved them to 133 / 84 / 14. With a wing
// eaten on contact it was 133 / 141 / 100 — a masher pinned at the window's edge stands where
// everything falls — so a wing is eaten standing still (`resolvePickups`).
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

// Turning pays: a masher who only adds facing the nearest goon clears more of every block than
// one who holds right. Measured at Tier 2: 182 / 146 / 93 of 200 against the masher's 133 / 84 / 14.
test("does let a turner who faces the nearest goon clear more streets than a masher on every block", () => {
  const SEEDS = 200;
  const clears = (bot: Decide, block: number): number => {
    let cleared = 0;

    for (let seed = 1; seed <= SEEDS; seed += 1) {
      if (play(resolveBrawlBlock({ seed, blocks: 3, block }), bot).frame.outcome === "cleared") {
        cleared += 1;
      }
    }

    return cleared;
  };

  for (let block = 0; block < 3; block += 1) {
    const turned = clears(turner, block);
    const mashed = clears(masher, block);

    assert.ok(turned > mashed, `block ${block}: the turner cleared ${turned}, the masher ${mashed}`);
  }
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

// ---- Tier 2: the swan, the helmet goose, the hazard and the wing --------------------------------

// A frame with the goons placed by hand on an empty hand block, the hen on the line facing right.
const placed = (goons: BrawlGoon[], overrides: Partial<BrawlFrame> = {}, hazard: BrawlHazard | null = null) => {
  const block = handBlock([], hazard);
  const start = createBrawlRunStart(block);

  return { block, frame: { ...start, spawned: goons.length, goons, ...overrides } };
};

const goonAt = (kind: BrawlGoonKind, x: number, state: BrawlGoon["state"], overrides: Partial<BrawlGoon> = {}): BrawlGoon => ({
  ...walker(0, kind, x, state, BRAWL_WORLD.goons[kind].hp),
  ...overrides
});

const PECK_LANDS = BRAWL_WORLD.peckDelayTicks + 1;
const peckAt0: BrawlInput[] = [{ tick: 0, kind: "peck" }];
const startX = BRAWL_WORLD.henStartX;

test("does stalk a swan in reach when the hen faces it, standing still and never attacking", () => {
  const swan = BRAWL_WORLD.goons.swan;
  const { block, frame } = placed([goonAt("swan", startX + swan.reach + 2, "approach", { stateUntilTick: 0 })]);
  const frames = [frame];

  for (let tick = 0; tick < 400; tick += 1) {
    frames.push(stepBrawl(frames[frames.length - 1] ?? frame, block, []));
  }

  const stalking = frames.findIndex((each) => each.goons[0]?.state === "stalk");
  const stalkedAt = frames[stalking]?.goons[0]?.x;

  assert.ok(stalking > 0, "the swan never stalked");
  assert.ok(Math.abs((stalkedAt ?? 0) - startX) <= swan.reach, "it stalls inside its reach");
  assert.ok(frames.slice(stalking).every((each) => each.goons[0]?.state === "stalk" && each.goons[0]?.x === stalkedAt));
  assert.deepEqual(frames[frames.length - 1]?.hits, []);
});

test("does hiss and then lunge when the hen turns her back on a stalking swan", () => {
  const swan = BRAWL_WORLD.goons.swan;
  const { block, frame } = placed([goonAt("swan", startX + swan.reach, "stalk", { stateUntilTick: 0 })]);
  // She turns away (one step left) and stands with her back to it.
  const turned = advanceBrawl(
    frame,
    block,
    [
      { tick: 0, kind: "walk", dir: -1 },
      { tick: 1, kind: "walk", dir: 0 }
    ],
    1
  );

  assert.equal(turned.facing, -1);
  assert.equal(turned.goons[0]?.state, "telegraph", "the turn that stepped her out of reach is still a turn away");

  const lunged = advanceBrawl(turned, block, [], 1 + swan.telegraphTicks + 1);

  assert.equal(lunged.goons[0]?.state, "attack");

  const bitten = advanceBrawl(lunged, block, [], 1 + swan.telegraphTicks + swan.attackTicks);

  assert.equal(bitten.hits.length, 1, "the lunge reached her back");
});

test("does commit a swan to the hiss once it starts, even when she turns to face it", () => {
  const swan = BRAWL_WORLD.goons.swan;
  const { block, frame } = placed([goonAt("swan", startX + swan.reach, "telegraph", { stateUntilTick: 20 })], { facing: -1 });
  // She turns back to face it mid-hiss: it does not go back to stalking.
  const faced = advanceBrawl(
    frame,
    block,
    [
      { tick: 0, kind: "walk", dir: 1 },
      { tick: 1, kind: "walk", dir: 0 }
    ],
    10
  );

  assert.equal(faced.facing, 1);
  assert.equal(faced.goons[0]?.state, "telegraph");
  assert.equal(advanceBrawl(faced, block, [], 21).goons[0]?.state, "attack");
});

test("does send a stalking swan back to closing on her when it is out of its reach", () => {
  const swan = BRAWL_WORLD.goons.swan;
  // She faces it, but she has been knocked back past its reach.
  const { block, frame } = placed([goonAt("swan", startX + swan.reach + 6, "stalk", { stateUntilTick: 0 })]);
  const next = stepBrawl(frame, block, []);

  assert.equal(next.goons[0]?.state, "approach");
});

test("does peck a stalking swan down from the front", () => {
  const swan = BRAWL_WORLD.goons.swan;
  const { block, frame } = placed([goonAt("swan", startX + swan.reach, "stalk", { stateUntilTick: 0 })]);
  const pecked = advanceBrawl(frame, block, peckAt0, PECK_LANDS);

  assert.equal(pecked.goons[0]?.state, "ko");
  assert.equal(pecked.goonsDown, swan.worth + BRAWL_WORLD.cleanWaveBonus);
});

// A helmet goose walking in, still outside its reach (so still guarded) when the peck opens — but
// inside the peck's box — lands at `HELMET_CLANKED_AT` in front of her.
const HELMET_WALKING_IN = startX + 18;
const HELMET_CLANKED_AT = HELMET_WALKING_IN - BRAWL_WORLD.peckDelayTicks * BRAWL_WORLD.goons.helmet.speed;

test("does clank a peck off a helmet goose with its guard down: no hp, a shove, no stun", () => {
  const helmet = BRAWL_WORLD.goons.helmet;

  for (const state of ["approach", "stunned"] as const) {
    const x = state === "approach" ? HELMET_WALKING_IN : startX + 12;
    const struckAt = state === "approach" ? HELMET_CLANKED_AT : x;
    const { block, frame } = placed([goonAt("helmet", x, state, { stateUntilTick: state === "approach" ? 0 : 1000 })]);
    const pecked = advanceBrawl(frame, block, peckAt0, PECK_LANDS);
    const goon = pecked.goons[0];

    assert.equal(isBrawlGoonGuarded({ kind: "helmet", state }), true, state);
    assert.equal(goon?.hp, helmet.hp, state);
    assert.equal(goon?.state, state, `${state}: a clank is not a stun`);
    // Shoved its knockback — and, not reeling, the walker is already a step back in on the next tick.
    assert.equal(goon?.x, struckAt + helmet.knockback - (state === "approach" ? helmet.speed : 0), `${state}: shoved its knockback`);
    assert.deepEqual(pecked.clanks, [{ tick: BRAWL_WORLD.peckDelayTicks, spawnIndex: 0 }], state);
    assert.deepEqual(pecked.landed, [BRAWL_WORLD.peckDelayTicks], `${state}: the clank spent the peck`);
    assert.deepEqual(pecked.kos, [], state);
    assert.equal(pecked.goonsDown, 0, state);
  }
});

test("does let a clank spend the peck, so the rest of its live window lands nothing", () => {
  const { block, frame } = placed([goonAt("helmet", HELMET_WALKING_IN, "approach", { stateUntilTick: 0 })]);
  const window = advanceBrawl(frame, block, peckAt0, BRAWL_WORLD.peckDelayTicks + BRAWL_WORLD.peckActiveTicks);

  assert.equal(window.clanks.length, 1);
  assert.equal(window.landed.length, 1);
});

test("does put a helmet goose down when the peck lands while its guard is up", () => {
  const helmet = BRAWL_WORLD.goons.helmet;

  for (const state of ["telegraph", "attack", "recover"] as const) {
    const { block, frame } = placed([goonAt("helmet", startX + 12, state)], { invulnerableUntilTick: 1000 });
    const pecked = advanceBrawl(frame, block, peckAt0, PECK_LANDS);

    assert.equal(isBrawlGoonGuarded({ kind: "helmet", state }), false, state);
    assert.equal(pecked.goons[0]?.state, "ko", state);
    assert.deepEqual(pecked.clanks, [], state);
    assert.equal(pecked.goonsDown, helmet.worth + BRAWL_WORLD.cleanWaveBonus, state);
  }

  assert.equal(isBrawlGoonGuarded({ kind: "goose", state: "approach" }), false, "only the helmet goose wears a guard");
});

// A hazard just past where a goon 12 in front of her lands when pecked.
const hazardAhead = (from: number, width: number = BRAWL_WORLD.hazardWidth): BrawlHazard => ({ kind: "bay", x: startX + from, width });

test("does dunk a goon a peck shoves into the hazard: down at once whatever its hp, its whole worth banked", () => {
  const raccoon = BRAWL_WORLD.goons.raccoon;
  const { block, frame } = placed([goonAt("raccoon", startX + 12, "telegraph")], {}, hazardAhead(12 + raccoon.knockback - 1));
  const pecked = advanceBrawl(frame, block, peckAt0, PECK_LANDS);
  const goon = pecked.goons[0];

  assert.equal(goon?.state, "ko", "two hp, one peck, in the bay");
  assert.equal(goon?.hp, 0);
  assert.deepEqual(pecked.dunks, [{ tick: BRAWL_WORLD.peckDelayTicks, spawnIndex: 0 }]);
  assert.deepEqual(pecked.kos, [BRAWL_WORLD.peckDelayTicks]);
  assert.equal(pecked.goonsDown, raccoon.worth + BRAWL_WORLD.cleanWaveBonus);
});

test("does dunk a goon a shove carries right across a narrow hazard, and a clanked helmet goose too", () => {
  const across = placed([goonAt("goose", startX + 12, "approach")], {}, hazardAhead(14, 2));

  assert.equal(advanceBrawl(across.frame, across.block, peckAt0, PECK_LANDS).dunks.length, 1);

  const clanked = placed(
    [goonAt("helmet", HELMET_WALKING_IN, "approach", { stateUntilTick: 0 })],
    {},
    hazardAhead(HELMET_CLANKED_AT - startX + 2, 2)
  );
  const pecked = advanceBrawl(clanked.frame, clanked.block, peckAt0, PECK_LANDS);

  assert.equal(pecked.clanks.length, 1);
  assert.equal(pecked.dunks.length, 1);
  assert.equal(pecked.goons[0]?.state, "ko");
  assert.equal(pecked.goonsDown, BRAWL_WORLD.goons.helmet.worth + BRAWL_WORLD.cleanWaveBonus);
});

test("does not dunk a shove that stops short of the hazard", () => {
  const raccoon = BRAWL_WORLD.goons.raccoon;
  const { block, frame } = placed([goonAt("raccoon", startX + 12, "telegraph")], {}, hazardAhead(12 + raccoon.knockback + 1));
  const pecked = advanceBrawl(frame, block, peckAt0, PECK_LANDS);

  assert.equal(pecked.goons[0]?.state, "stunned");
  assert.deepEqual(pecked.dunks, []);
});

test("does never dunk a gull or the boss", () => {
  const gull = placed([goonAt("gull", startX + 8, "attack", { y: 3 })], { invulnerableUntilTick: 1000 }, hazardAhead(8));
  const gullPecked = advanceBrawl(gull.frame, gull.block, peckAt0, PECK_LANDS);

  assert.deepEqual(gullPecked.dunks, []);
  assert.equal(gullPecked.kos.length, 1, "pecked down the ordinary way");

  const boss = placed([goonAt("boss", startX + 12, "telegraph")], {}, hazardAhead(12));
  const bossPecked = advanceBrawl(boss.frame, boss.block, peckAt0, PECK_LANDS);

  assert.equal(bossPecked.goons[0]?.state, "stunned", "shoved, but too heavy to go in");
  assert.equal(bossPecked.goons[0]?.hp, BRAWL_WORLD.goons.boss.hp - 1);
  assert.deepEqual(bossPecked.dunks, []);
});

test("does only dunk the goon a peck shoved: walking over the hazard or being bowled on it is safe", () => {
  // A goose walking toward her straight over the hazard.
  const walking = placed([goonAt("goose", startX + 60, "approach", { stateUntilTick: 0 })], {}, hazardAhead(20));
  const walked = advanceBrawl(walking.frame, walking.block, [], 95);

  assert.ok(walked.goons[0] !== undefined && walked.goons[0].x < startX + 20, "it walked across");
  assert.notEqual(walked.goons[0]?.state, "ko");
  assert.deepEqual(walked.dunks, []);

  // The raccoon she pecks is shoved short of it, and bowls a goose standing on it: stunned, not dunked.
  const { knockback, halfWidth } = BRAWL_WORLD.goons.raccoon;
  const bowled = placed(
    [goonAt("raccoon", startX + 10, "telegraph"), { ...goonAt("goose", startX + 10 + knockback + halfWidth + 2, "recover"), spawnIndex: 1 }],
    {},
    hazardAhead(10 + knockback + 2)
  );
  const pecked = advanceBrawl(bowled.frame, bowled.block, peckAt0, PECK_LANDS);

  assert.equal(pecked.goons[0]?.state, "stunned");
  assert.equal(pecked.goons[1]?.state, "stunned");
  assert.deepEqual(pecked.bumps, [BRAWL_WORLD.peckDelayTicks]);
  assert.deepEqual(pecked.dunks, []);
});

test("does drop a wing where a goon worth two goes down, and none for a goose", () => {
  const raccoon = placed([goonAt("raccoon", startX + 12, "telegraph", { hp: 1 })]);
  const pecked = advanceBrawl(raccoon.frame, raccoon.block, peckAt0, PECK_LANDS);
  const tick = BRAWL_WORLD.peckDelayTicks;

  assert.deepEqual(pecked.pickups, [{ x: startX + 12 + BRAWL_WORLD.goons.raccoon.knockback, untilTick: tick + BRAWL_WORLD.wingTicks }]);
  assert.deepEqual(pecked.drops, [tick]);

  const goose = placed([goonAt("goose", startX + 12, "approach")]);

  assert.deepEqual(advanceBrawl(goose.frame, goose.block, peckAt0, PECK_LANDS).pickups, []);
});

test("does drop a wing for a dunked goon, and keep it inside the window she can stand in", () => {
  const { width, henMargin } = BRAWL_WORLD;
  // A swan at the window's right edge, pecked into a hazard at the edge: the wing lands where she can reach it.
  const { block, frame } = placed(
    [goonAt("swan", width - 10, "stalk")],
    { x: width - 26 },
    { kind: "plinth", x: width - 6, width: 4 }
  );
  const pecked = advanceBrawl(frame, block, peckAt0, PECK_LANDS);

  assert.equal(pecked.dunks.length, 1);
  assert.equal(pecked.pickups[0]?.x, width - henMargin);
});

test("does drop one wing a wave at most, and none while one is on the street", () => {
  const twoRaccoons = placed([
    goonAt("raccoon", startX + 12, "telegraph", { hp: 1 }),
    { ...goonAt("raccoon", startX + 60, "recover", { hp: 1 }), spawnIndex: 1 }
  ]);
  const first = advanceBrawl(twoRaccoons.frame, twoRaccoons.block, peckAt0, PECK_LANDS);

  assert.equal(first.drops.length, 1);

  // The wing is gone (eaten, say), and she walks up and puts the second one down in the same wave: no second wing.
  const second = advanceBrawl(
    { ...first, pickups: [], x: startX + 48, peckCooldownUntilTick: 0 },
    twoRaccoons.block,
    [{ tick: first.tick, kind: "peck" }],
    first.tick + PECK_LANDS
  );

  assert.equal(second.kos.length, 2);
  assert.deepEqual(second.drops, first.drops);
  assert.deepEqual(second.pickups, []);

  // A new wave, but last wave's wing is still lying there: still none.
  const lying = placed([goonAt("raccoon", startX + 12, "telegraph", { hp: 1 })], {
    tick: 200,
    waveOpenedTick: 150,
    drops: [100],
    pickups: [{ x: 90, untilTick: 900 }],
    peckCooldownUntilTick: 0
  });
  const later = advanceBrawl(lying.frame, lying.block, [{ tick: 200, kind: "peck" }], 200 + PECK_LANDS);

  assert.equal(later.kos.length, 1);
  assert.deepEqual(later.drops, [100]);
  assert.deepEqual(later.pickups, [{ x: 90, untilTick: 900 }]);
});

test("does give her a heart back when she stands on a wing with one to fill", () => {
  const { block, frame } = placed([], { hearts: 2, pickups: [{ x: startX + 6, untilTick: 500 }] });
  const ate = stepBrawl(frame, block, []);

  assert.equal(ate.hearts, 3);
  assert.deepEqual(ate.pickups, []);
  assert.deepEqual(ate.wings, [1]);
});

test("does let a wing fill a bought fourth heart back, and never past the hearts the block started with", () => {
  const boughtBlock = { ...handBlock([]), hearts: 4 };
  const start = createBrawlRunStart(boughtBlock);
  const wing = { pickups: [{ x: startX + 6, untilTick: 500 }] };
  const ate = stepBrawl({ ...start, hearts: 3, ...wing }, boughtBlock, []);

  assert.equal(start.hearts, 4);
  assert.equal(ate.hearts, 4);
  assert.deepEqual(ate.wings, [1]);

  // Full at four: she stands on it and it stays. A block that kept the three tops out at three.
  assert.equal(stepBrawl({ ...start, ...wing }, boughtBlock, []).pickups.length, 1);

  const kept = placed([], { hearts: 3, ...wing });

  assert.equal(stepBrawl(kept.frame, kept.block, []).hearts, 3);
});

test("does leave the wing where it lies at full hearts, and when she only walks over it", () => {
  const full = placed([], { pickups: [{ x: startX + 6, untilTick: 500 }] });
  const walkedOver = advanceBrawl(full.frame, full.block, [], 20);

  assert.equal(walkedOver.hearts, BRAWL_WORLD.heartsMax);
  assert.equal(walkedOver.pickups.length, 1);

  // Two hearts, but the thumb is down: she walks right across it and it stays.
  const hurt = placed([], { hearts: 2, pickups: [{ x: startX + 6, untilTick: 500 }] });
  const crossed = advanceBrawl(hurt.frame, hurt.block, [{ tick: 0, kind: "walk", dir: 1 }], 20);

  assert.ok(crossed.x > startX + 6 + BRAWL_WORLD.henRadius + BRAWL_WORLD.wingReach, "she walked past it");
  assert.equal(crossed.hearts, 2);
  assert.equal(crossed.pickups.length, 1);
  assert.deepEqual(crossed.wings, []);
});

test("does let a wing go once its time is up, with nothing eaten", () => {
  const { block, frame } = placed([], { hearts: 2, pickups: [{ x: startX + 60, untilTick: 3 }] });

  assert.equal(advanceBrawl(frame, block, [], 2).pickups.length, 1);

  const gone = advanceBrawl(frame, block, [], 3);

  assert.deepEqual(gone.pickups, []);
  assert.equal(gone.hearts, 2);
  assert.deepEqual(gone.wings, []);
});
