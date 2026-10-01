import { BRAWL_WORLD, type BrawlGoonKind, type BrawlGoonState } from "@wingnight/shared";

import type { BrawlGoonPalette } from "../palette.js";

/**
 * What every goon drawing is handed. `x` and `y` are the goon's foot point in world units — `x`
 * along the block, `y` its height ABOVE the ground line (nought for everything but a gull in the
 * air), the sim's own convention — and the drawing is centred on `x`. `facing` is the way it is
 * looking, `+1` down the street to the right. `tick` is the sim's, so the walk cycle, the honk's
 * pulse and the stars' orbit are a pure function of the frame and the tablet and the TV agree.
 */
export type GoonProps = {
  x: number;
  y: number;
  facing: -1 | 1;
  state: BrawlGoonState;
  tick: number;
  palette: BrawlGoonPalette;
};

/** A walk frame lasts this many ticks: two frames a stride, about four steps a second. */
export const GOON_WALK_FRAME_TICKS = 8;

/** One revolution of the stars round a dazed head, in ticks. */
export const GOON_STAR_ORBIT_TICKS = 72;

/** The honk's pulse: the lines throb out on this beat while the goon telegraphs. */
export const GOON_HONK_PULSE_TICKS = 6;

/** A tick a drawing can do arithmetic on: anything that is not a finite number is the first tick. */
export const resolveDrawTick = (tick: number): number => (Number.isFinite(tick) ? Math.max(0, Math.floor(tick)) : 0);

/** Which of the two walk frames a tick is on. */
export const resolveWalkFrame = (tick: number): 0 | 1 =>
  Math.floor(resolveDrawTick(tick) / GOON_WALK_FRAME_TICKS) % 2 === 0 ? 0 : 1;

/** Which half of the honk's throb a tick is on. */
export const resolveHonkBeat = (tick: number): 0 | 1 =>
  Math.floor(resolveDrawTick(tick) / GOON_HONK_PULSE_TICKS) % 2 === 0 ? 0 : 1;

/** Walking in from the edge and closing on the hen are the same walk. */
export const isWalkingState = (state: BrawlGoonState): boolean => state === "entering" || state === "approach";

/** Two decimals is finer than a TV pixel, and keeps the markup short. */
export const roundUnit = (value: number): number => Math.round(value * 100) / 100;

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/** A point `length` from `from` at `degrees` off straight UP, clockwise (forward is positive). */
export const resolveReach = (
  from: { x: number; y: number },
  length: number,
  degrees: number
): { x: number; y: number } => ({
  x: roundUnit(from.x + length * Math.sin(radians(degrees))),
  y: roundUnit(from.y - length * Math.cos(radians(degrees)))
});

/**
 * Where to stand a drawing: on the ground line (`BRAWL_WORLD.groundY`, the world's y running down
 * the screen) less the goon's own height above it, flipped to its facing, and scaled from the
 * units it is drawn in to the box the sim gives that kind (`BRAWL_WORLD.goons`). Scaling off the
 * sim's own box is what keeps the drawing and the hit box one size while the sim is tuned.
 */
export const resolveGoonPlacement = ({
  x,
  y,
  facing,
  kind,
  artHeight
}: {
  x: number;
  y: number;
  facing: -1 | 1;
  kind: BrawlGoonKind;
  artHeight: number;
}): string => {
  const scale = roundUnit(BRAWL_WORLD.goons[kind].height / artHeight);
  const footX = Number.isFinite(x) ? roundUnit(x) : 0;
  const footY = roundUnit(BRAWL_WORLD.groundY - (Number.isFinite(y) ? y : 0));

  return `translate(${footX} ${footY}) scale(${facing === -1 ? -scale : scale} ${scale})`;
};

/**
 * The stars round a dazed head: `count` of them on an ellipse about (`cx`, `cy`), evenly spaced
 * and turning with the tick. The far half of the orbit is drawn smaller, so the ring reads as a
 * ring and not a row.
 */
export const resolveStarOrbit = ({
  cx,
  cy,
  rx,
  ry,
  count,
  tick
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  count: number;
  tick: number;
}): { x: number; y: number; scale: number }[] => {
  const turn = (resolveDrawTick(tick) % GOON_STAR_ORBIT_TICKS) / GOON_STAR_ORBIT_TICKS;

  return Array.from({ length: count }, (_, index) => {
    const angle = 2 * Math.PI * (turn + index / count);

    return {
      x: roundUnit(cx + rx * Math.cos(angle)),
      y: roundUnit(cy + ry * Math.sin(angle)),
      scale: roundUnit(0.75 + 0.25 * Math.sin(angle))
    };
  });
};

export type Point = { x: number; y: number };

/** `point` turned `degrees` clockwise about `about` — SVG's own sense of a positive rotate. */
export const rotatePoint = (point: Point, degrees: number, about: Point = { x: 0, y: 0 }): Point => {
  const angle = (degrees * Math.PI) / 180;
  const dx = point.x - about.x;
  const dy = point.y - about.y;

  return {
    x: roundUnit(about.x + dx * Math.cos(angle) - dy * Math.sin(angle)),
    y: roundUnit(about.y + dx * Math.sin(angle) + dy * Math.cos(angle))
  };
};

/**
 * A tapered, bent limb as one filled outline — a neck, a tail, a raccoon's leg — from `from`
 * through the bend at `bend` to `to`, `fromWidth` wide at the root and `toWidth` at the end.
 * Filled rather than stroked so it takes the same fill class and outline as the body it grows
 * out of.
 */
export const resolveLimbPath = (from: Point, bend: Point, to: Point, fromWidth: number, toWidth: number): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const side = (point: Point, half: number, sign: number): string =>
    `${roundUnit(point.x + sign * nx * half)} ${roundUnit(point.y + sign * ny * half)}`;
  const midWidth = (fromWidth + toWidth) / 4;

  return [
    `M ${side(from, fromWidth / 2, 1)}`,
    `Q ${side(bend, midWidth, 1)} ${side(to, toWidth / 2, 1)}`,
    `L ${side(to, toWidth / 2, -1)}`,
    `Q ${side(bend, midWidth, -1)} ${side(from, fromWidth / 2, -1)}`,
    "Z"
  ].join(" ");
};
