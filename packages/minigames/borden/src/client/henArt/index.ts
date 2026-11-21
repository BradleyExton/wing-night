import type { CharacterPose, CharacterSpray } from "@wingnight/cast";
import { BORDEN_STICKS, isBordenHenAirborne, isBordenHenDucking, type BordenHen } from "@wingnight/shared";

/** How one hen is drawn on one frame: her pose, and the stream leaving her beak (none while she is not up). */
export type BordenHenArt = { pose: CharacterPose; spray: CharacterSpray | null };

/**
 * The stream's turn, in the cast's terms: degrees clockwise from straight ahead, so up is -90 and
 * down is 90. Ahead is always the way she faces, because a stick with any sideways lean turns her
 * that way (the sim's `facing`); ducked, or with the stick at rest, she sprays straight ahead.
 */
export const resolveBordenSprayAngle = (hen: Pick<BordenHen, "stick" | "state" | "y" | "vy">): number => {
  const step = BORDEN_STICKS[hen.stick];

  if (isBordenHenDucking(hen) || (step.x === 0 && step.y === 0)) {
    return 0;
  }

  if (step.x === 0) {
    return step.y === 1 ? -90 : 90;
  }

  return step.y === 0 ? 0 : step.y === 1 ? -45 : 45;
};

/**
 * Which of the cast's poses a hen is in: down is the knockout, away sits still, a hit reels her for
 * the sim's `hurtTicks`, off the ground she flies, the stick down ducks her, a sideways stick walks
 * her, and otherwise she idles. She sprays whenever she is up, hot sauce once she has a hot bottle.
 */
export const resolveBordenHenArt = (hen: BordenHen, tick: number): BordenHenArt => {
  if (hen.state === "down") {
    return { pose: "ko", spray: null };
  }

  if (hen.state === "away") {
    return { pose: "still", spray: null };
  }

  const spray: CharacterSpray = { angle: resolveBordenSprayAngle(hen), tone: hen.bottle === "mild" ? "mild" : "hot" };

  if (tick < hen.hurtUntilTick) {
    return { pose: "hurt", spray };
  }

  if (isBordenHenAirborne(hen)) {
    return { pose: "fly", spray };
  }

  if (isBordenHenDucking(hen)) {
    return { pose: "duck", spray };
  }

  return { pose: BORDEN_STICKS[hen.stick].x === 0 ? "idle" : "walk", spray };
};
