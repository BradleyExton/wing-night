import { isBordenFoeLive, isBordenHenAirborne } from "../simulate/index.js";
import type { BordenFoe, BordenFrame, BordenHen, BordenInput, BordenStick, BordenStretch } from "../types.js";
import { BORDEN_WORLD } from "../world/index.js";

/**
 * Hens that play themselves: what the balance tests pin the base against, and what a dev page can
 * put on a button so one person can see a pair (docs/minigames/base-borden-spec.md §0.8). A bot
 * reads the frame and says where its thumbs are; `resolveBordenBotInputs` turns that into what a
 * pad would have sent: only what changed.
 *
 * A bot reads a shot's speed off the shot itself, never from where it was a frame ago: a page that
 * steps two ticks in one frame doubles an estimate and fires the bot early (the jump lab's lesson).
 */
export type BordenBotThumbs = { dir: BordenStick; jump: boolean };

export type BordenBot = (frame: BordenFrame, stretch: BordenStretch, slot: number) => BordenBotThumbs;

const WORLD = BORDEN_WORLD;

const REST: BordenBotThumbs = { dir: 0, jump: false };

/** She jumps when a low threat is this many ticks from touching her: in the air before it, down after. */
const JUMP_LEAD_TICKS = 8;
/** She ducks a high shot from this far out, and stops running when anything is this close. */
const DUCK_LEAD_TICKS = 24;
const STEADY_LEAD_TICKS = 30;
/** How far ahead she stops to spray something down. */
const TURRET_RANGE = 90;
const HEAVY_RANGE = 100;
const GOOSE_RANGE = 90;

/** The masher: holds right from the first tick and never jumps. The floor. */
export const bordenMasher: BordenBot = () => ({ dir: 1, jump: false });

type Threat = { ticks: number; low: boolean; side: -1 | 1 };

/**
 * Everything coming at her, as ticks until it touches her box: shots not yet settled for her, and
 * geese and rolling tanks on their way in. `low` is jumped; the rest is ducked.
 */
const resolveThreats = (frame: BordenFrame, hen: BordenHen): Threat[] => {
  const threats: Threat[] = [];
  const reach = WORLD.henHalfWidth - WORLD.forgiveness;

  for (const shot of frame.shots) {
    const side: -1 | 1 = shot.x > hen.x ? 1 : -1;

    if (shot.settled.includes(hen.slot) || shot.vx * side >= 0) {
      continue;
    }

    const gap = Math.abs(shot.x - hen.x) - reach - shot.radius;

    threats.push({ ticks: gap / Math.abs(shot.vx), low: shot.y < WORLD.highShotHeight, side });
  }

  for (const foe of frame.foes) {
    const isRolling = foe.kind === "goose" || (foe.kind === "tank" && !foe.parked);

    if (!isBordenFoeLive(foe) || !isRolling || foe.touched.includes(hen.slot) || foe.x < hen.x) {
      continue;
    }

    const gap = foe.x - hen.x - reach - WORLD.foes[foe.kind].halfWidth;

    threats.push({ ticks: gap / Math.abs(foe.vx), low: true, side: 1 });
  }

  return threats.sort((left, right) => left.ticks - right.ticks);
};

const resolveTarget = (frame: BordenFrame, hen: BordenHen): BordenFoe | null => {
  let best: BordenFoe | null = null;

  for (const foe of frame.foes) {
    const ahead = foe.x - hen.x;
    const range = foe.kind === "turret" ? TURRET_RANGE : foe.kind === "goose" ? GOOSE_RANGE : HEAVY_RANGE;
    const isInWindow = foe.x <= frame.cameraX + WORLD.width;

    if (!isBordenFoeLive(foe) || ahead < 0 || ahead > range || !isInWindow) {
      continue;
    }

    if (best === null || foe.x < best.x) {
      best = foe;
    }
  }

  return best;
};

/** Down and facing a side: the stick's diagonal that ducks her that way. */
const duckToward = (side: -1 | 1): BordenStick => (side === 1 ? 2 : 4);

/**
 * The runner: a player who has learnt the base. She jumps the low shots and the geese she has not
 * sprayed, ducks the high shots, goes back to stand over her partner when she is down, and stops to
 * spray down what is ahead of her: ducked for a low turret or a goose, standing for the rest. With
 * nothing to do she runs on.
 */
export const bordenRunner: BordenBot = (frame, _stretch, slot) => {
  const hen = frame.hens[slot];

  if (hen === undefined || hen.state === "down") {
    return REST;
  }

  const grounded = !isBordenHenAirborne(hen);
  const threat = resolveThreats(frame, hen)[0];

  if (threat !== undefined && threat.ticks <= STEADY_LEAD_TICKS) {
    if (threat.low) {
      const isPressing = grounded && threat.ticks <= JUMP_LEAD_TICKS && hen.jumpWantedUntilTick < frame.tick;

      return { dir: 0, jump: isPressing };
    }

    if (threat.ticks <= DUCK_LEAD_TICKS) {
      return { dir: duckToward(threat.side), jump: false };
    }

    return REST;
  }

  if (!grounded) {
    return REST;
  }

  const fallen = frame.hens.find((other) => other.slot !== slot && other.state === "down");

  if (fallen !== undefined) {
    const dx = fallen.x - hen.x;

    if (Math.abs(dx) <= WORLD.reviveReach - 2) {
      return REST;
    }

    return { dir: dx > 0 ? 1 : 5, jump: false };
  }

  const target = resolveTarget(frame, hen);

  if (target === null) {
    return { dir: 1, jump: false };
  }

  const isLow = target.kind === "goose" || (target.kind === "turret" && target.level === "low");

  if (isLow) {
    return { dir: duckToward(1), jump: false };
  }

  // Standing, she sprays the way she faces: turn right first if she is not already.
  return { dir: hen.facing === 1 ? 0 : 1, jump: false };
};

/**
 * What the pair's pads would send this tick for these bots: a stick where a bot's is not where the
 * frame has it, and a jump where a bot presses. One bot per slot; a slot with no bot sends nothing.
 */
export const resolveBordenBotInputs = (
  frame: BordenFrame,
  stretch: BordenStretch,
  bots: readonly (BordenBot | null)[]
): BordenInput[] => {
  const inputs: BordenInput[] = [];

  for (const hen of frame.hens) {
    const bot = bots[hen.slot];

    if (bot === null || bot === undefined) {
      continue;
    }

    const thumbs = bot(frame, stretch, hen.slot);

    if (thumbs.dir !== hen.stick) {
      inputs.push({ tick: frame.tick, hen: hen.slot, kind: "stick", dir: thumbs.dir });
    }

    if (thumbs.jump) {
      inputs.push({ tick: frame.tick, hen: hen.slot, kind: "jump" });
    }
  }

  return inputs;
};
