import { CHARACTER_FOOT, CHARACTER_STAND_HEIGHT } from "@wingnight/cast";
import { BRAWL_CREW_WORLD, isBrawlCrewHenPecking, type BrawlCrewHen } from "@wingnight/shared";

/**
 * The cast poses a hen is ever drawn in. Each is mounted once and shown by the paint loop, so a
 * peck swaps a `display` rather than re-rendering the figure — which is what keeps a costume
 * head's halo filter rasterised once (Dunlop Dash's rule). `still` is a hen who has sat out.
 */
export const HEN_POSES = ["idle", "walk", "peck", "hurt", "ko", "still"] as const;

export type HenPose = (typeof HEN_POSES)[number];

/**
 * The cast's 80×72 figure drawn at this scale in world units: foot to the middle of the head is
 * the sim's `henHeight`, the Slingshlong trick — the drawn bird and the box the sim fights with
 * are the same creature, give or take the bobblehead above it.
 */
export const HEN_SCALE = BRAWL_CREW_WORLD.henHeight / CHARACTER_STAND_HEIGHT;

/** How fast a hen flickers through her mercy window after a hit. */
const FLICKER_TICKS = 4;

/**
 * What a hen is doing at one tick, as a pose. Down and away are states and win over everything;
 * then reeling (a hit knocks the beak shut), then the peck from the press until its box closes —
 * the commit the room sees — then walking while the stick is held, and standing otherwise.
 */
export const resolveHenPose = (
  hen: Pick<BrawlCrewHen, "state" | "hurtUntilTick" | "peckUntilTick" | "walk">,
  tick: number
): HenPose => {
  if (hen.state === "down") {
    return "ko";
  }

  if (hen.state === "away") {
    return "still";
  }

  if (tick < hen.hurtUntilTick) {
    return "hurt";
  }

  if (isBrawlCrewHenPecking(hen, tick)) {
    return "peck";
  }

  return hen.walk === 0 ? "idle" : "walk";
};

/**
 * How solid a hen is drawn: dimmed while she sits out, flickering while she is invulnerable
 * after a hit or a revive so the room can see the mercy window, and solid otherwise.
 */
export const resolveHenOpacity = (hen: Pick<BrawlCrewHen, "state" | "invulnerableUntilTick">, tick: number): number => {
  if (hen.state === "away") {
    return 0.4;
  }

  if (hen.state === "up" && tick < hen.invulnerableUntilTick && Math.floor(tick / FLICKER_TICKS) % 2 === 1) {
    return 0.35;
  }

  return 1;
};

/** How far through the count over a downed hen a teammate is, nought to one; nought when nobody is. */
export const resolveReviveShare = (hen: Pick<BrawlCrewHen, "state" | "reviveSinceTick">, tick: number): number => {
  if (hen.state !== "down" || hen.reviveSinceTick === null) {
    return 0;
  }

  return Math.min(1, Math.max(0, (tick - hen.reviveSinceTick) / BRAWL_CREW_WORLD.reviveTicks));
};

/**
 * The bird inside her own group, whose origin is her foot on the street: `lift` world units up
 * off it, turned to `facing`, `tilt` degrees about her foot.
 */
export const resolveHenBodyTransform = ({ facing, lift = 0, tilt = 0 }: { facing: -1 | 1; lift?: number; tilt?: number }): string => {
  const up = lift === 0 ? "" : `translate(0 ${Math.round(-lift * 100) / 100}) `;
  const turn = tilt === 0 ? "" : `rotate(${Math.round(tilt * 10) / 10}) `;

  return `${up}${turn}scale(${facing * HEN_SCALE} ${HEN_SCALE})`;
};

/** Inside the hen's body group: the figure's own units, its foot on the origin. */
export const HEN_FIGURE_TRANSFORM = `translate(${-CHARACTER_FOOT.x} ${-CHARACTER_FOOT.y})`;
