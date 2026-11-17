import { isBrawlGoonGuarded } from "../../world/index.js";
import type { BrawlCrewBlock, BrawlCrewFrame, BrawlCrewGoon, BrawlCrewHen, BrawlCrewInput, BrawlCrewWalk } from "../types.js";
import { BRAWL_CREW_WORLD } from "../world/index.js";

/**
 * Hens that play themselves: what the balance tests pin the street against, and what the dev
 * sandbox puts on a button so one person can see a full crew (docs/minigames/brawl-crew-spec.md
 * §0.8 step 7, §0.9). A bot reads the frame and says where its thumbs are; `resolveBrawlCrewBotInputs`
 * turns that into the inputs a pad would have sent — only what changed.
 */
export type BrawlCrewBotThumbs = { dir: BrawlCrewWalk; held: boolean };

export type BrawlCrewBot = (frame: BrawlCrewFrame, block: BrawlCrewBlock, slot: number) => BrawlCrewBotThumbs;

const WORLD = BRAWL_CREW_WORLD;

const STAND: BrawlCrewBotThumbs = { dir: 0, held: false };

/** The stick direction for a step along the street and a step across it. */
const DIR_BY_STEP: Record<string, BrawlCrewWalk> = {
  "0,0": 0,
  "1,0": 1,
  "1,1": 2,
  "0,1": 3,
  "-1,1": 4,
  "-1,0": 5,
  "-1,-1": 6,
  "0,-1": 7,
  "1,-1": 8
};

const resolveDir = (x: -1 | 0 | 1, z: -1 | 0 | 1): BrawlCrewWalk => DIR_BY_STEP[`${x},${z}`] ?? 0;

const signOf = (value: number): -1 | 0 | 1 => (value > 0 ? 1 : value < 0 ? -1 : 0);

/** The masher: holds right and holds the peck from the first tick, whatever happens. The floor. */
export const brawlCrewMasher: BrawlCrewBot = () => ({ dir: 1, held: true });

const isFightable = (goon: BrawlCrewGoon): boolean => {
  return goon.state !== "ko" && goon.state !== "gone" && goon.state !== "entering";
};

/** Her goon: the nearest one she can fight, one that is on her counted nearer than one that is not. */
const resolveNearest = (hen: BrawlCrewHen, goons: readonly BrawlCrewGoon[]): BrawlCrewGoon | null => {
  let best: BrawlCrewGoon | null = null;
  let bestScore = 0;

  for (const goon of goons) {
    if (!isFightable(goon)) {
      continue;
    }

    const score = Math.abs(goon.x - hen.x) + Math.abs(goon.z - hen.z) * 2 + (goon.target === hen.slot ? 0 : 20);

    if (best === null || score < bestScore) {
      best = goon;
      bestScore = score;
    }
  }

  return best;
};

/** The downed teammate this hen is the nearest up hen to, if there is one: hers to get up. */
const resolveFallen = (hen: BrawlCrewHen, hens: readonly BrawlCrewHen[]): BrawlCrewHen | null => {
  const distance = (from: BrawlCrewHen, to: BrawlCrewHen): number => Math.abs(from.x - to.x) + Math.abs(from.z - to.z);

  for (const fallen of hens) {
    if (fallen.state !== "down") {
      continue;
    }

    const isNearest = hens.every((other) => {
      return other.state !== "up" || other.slot === hen.slot || distance(other, fallen) > distance(hen, fallen) ||
        (distance(other, fallen) === distance(hen, fallen) && other.slot > hen.slot);
    });

    if (isNearest) {
      return fallen;
    }
  }

  return null;
};

/**
 * The brawler: a player who has learnt the game. She goes to the downed teammate nearest her and
 * stands over her; otherwise she gets onto her nearest goon's line, turns to face it, walks into
 * reach and pecks in time with her cooldown — holding off a helmet goose until its guard is up in
 * the honk. Between waves she walks on.
 */
export const brawlCrewBrawler: BrawlCrewBot = (frame, block, slot) => {
  const hen = frame.hens[slot];

  if (hen === undefined || hen.state === "down") {
    return STAND;
  }

  const fallen = resolveFallen(hen, frame.hens);

  if (fallen !== null) {
    const dx = fallen.x - hen.x;
    const dz = fallen.z - hen.z;
    const isOver = Math.abs(dx) <= WORLD.reviveReach - 2 && Math.abs(dz) <= WORLD.peckDepthBand - 2;

    return isOver ? STAND : { dir: resolveDir(Math.abs(dx) > WORLD.reviveReach - 4 ? signOf(dx) : 0, Math.abs(dz) > 2 ? signOf(dz) : 0), held: false };
  }

  const goon = resolveNearest(hen, frame.goons);

  if (goon === null) {
    const isWalkingOn = !frame.cameraLocked || frame.waveIndex >= block.waves.length;

    return isWalkingOn ? { dir: 1, held: false } : STAND;
  }

  const dx = goon.x - hen.x;
  const dz = goon.z - hen.z;
  const side: -1 | 1 = dx >= 0 ? 1 : -1;
  const reach = WORLD.henRadius + WORLD.peckReach + WORLD.goons[goon.kind].halfWidth - 3;
  const isInReach = Math.abs(dx) <= reach;
  const isOnLine = Math.abs(dz) <= WORLD.peckDepthBand - 2;

  if (!isInReach || !isOnLine) {
    return { dir: resolveDir(isInReach ? 0 : side, Math.abs(dz) > 2 ? signOf(dz) : 0), held: false };
  }

  if (hen.facing !== side) {
    return { dir: resolveDir(side, 0), held: false };
  }

  // She presses in time with the cooldown rather than leaving the thumb down: a fresh press opens
  // a peck a rest sooner than a held one repeats (`peckHoldRestTicks`).
  return { dir: 0, held: !isBrawlGoonGuarded(goon) && frame.tick >= hen.peckCooldownUntilTick };
};

/**
 * What the crew's pads would send this tick for these bots: a walk where a bot's stick is not
 * where the frame has it, a peck where its thumb is not. One bot per slot; a slot with no bot
 * sends nothing.
 */
export const resolveBrawlCrewBotInputs = (
  frame: BrawlCrewFrame,
  block: BrawlCrewBlock,
  bots: readonly (BrawlCrewBot | null)[]
): BrawlCrewInput[] => {
  const inputs: BrawlCrewInput[] = [];

  frame.hens.forEach((hen) => {
    const bot = bots[hen.slot];

    if (bot === null || bot === undefined) {
      return;
    }

    const thumbs = bot(frame, block, hen.slot);

    if (thumbs.dir !== hen.walk) {
      inputs.push({ tick: frame.tick, hen: hen.slot, kind: "walk", dir: thumbs.dir });
    }

    if (thumbs.held !== hen.peckHeld) {
      inputs.push({ tick: frame.tick, hen: hen.slot, kind: "peck", held: thumbs.held });
    }
  });

  return inputs;
};
