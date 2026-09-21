import type { SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

/**
 * The zone's ground as drawable paths. The sim reads the ground as a heightfield with holes in
 * it; this is the same ground as an outline, cut into one run per stretch of solid floor so a
 * pit is a real gap with two lips rather than a hole painted onto a continuous shape.
 *
 * Geometry only, in world units, and built once per zone: the scene scrolls it with a transform
 * and never rebuilds it.
 */
export type GroundSegment = {
  /** The walking surface, for the turf stroke along the top. */
  topPath: string;
  /** The same run closed down to the bottom of the box, for the soil underneath. */
  fillPath: string;
  /** A band following the surface down, for the sand the bay's bluffs are cut out of. */
  bluffPath: string;
  fromX: number;
  toX: number;
};

/** How deep the sand runs under the turf before the bluff gives way to clay. */
export const BLUFF_DEPTH = 6;

const round = (value: number): number => Math.round(value * 100) / 100;

/** The heightfield read straight, with no regard for holes — the pits are cut in afterwards. */
const solidGroundY = (heights: readonly number[], x: number): number => {
  const position = x / SCHLONIC_WORLD.sampleStep;
  const sample = Math.floor(position);
  const last = heights.length - 1;

  if (sample < 0) {
    return heights[0] ?? SCHLONIC_WORLD.groundBaseY;
  }

  if (sample >= last) {
    return heights[last] ?? SCHLONIC_WORLD.groundBaseY;
  }

  const from = heights[sample] ?? SCHLONIC_WORLD.groundBaseY;
  const to = heights[sample + 1] ?? from;

  return from + (to - from) * (position - sample);
};

const toSegment = (points: readonly { x: number; y: number }[], bottomY: number): GroundSegment | null => {
  const first = points[0];
  const last = points[points.length - 1];

  if (first === undefined || last === undefined || points.length < 2) {
    return null;
  }

  const topPath = `M ${points.map((point) => `${round(point.x)} ${round(point.y)}`).join(" L ")}`;

  const underside = [...points]
    .reverse()
    .map((point) => `L ${round(point.x)} ${round(point.y + BLUFF_DEPTH)}`)
    .join(" ");

  return {
    topPath,
    fillPath: `${topPath} L ${round(last.x)} ${bottomY} L ${round(first.x)} ${bottomY} Z`,
    bluffPath: `${topPath} ${underside} Z`,
    fromX: first.x,
    toX: last.x
  };
};

export const resolveGroundSegments = (
  zone: SchlonicZone,
  bottomY: number = SCHLONIC_WORLD.height
): GroundSegment[] => {
  const step = SCHLONIC_WORLD.sampleStep;
  const lips = new Set(zone.pits.map((pit) => pit.fromX));
  const resumes = new Set(zone.pits.map((pit) => pit.toX));
  const xs = [
    ...new Set([
      ...zone.heights.map((_unused, sample) => sample * step),
      ...zone.pits.flatMap((pit) => [pit.fromX, pit.toX])
    ])
  ].sort((left, right) => left - right);
  const isInsideAPit = (x: number): boolean => {
    return zone.pits.some((pit) => x > pit.fromX && x < pit.toX);
  };
  const segments: GroundSegment[] = [];
  let points: { x: number; y: number }[] = [];

  const close = (): void => {
    const segment = toSegment(points, bottomY);

    if (segment !== null) {
      segments.push(segment);
    }

    points = [];
  };

  for (const x of xs) {
    if (isInsideAPit(x)) {
      continue;
    }

    if (resumes.has(x) && points.length > 0) {
      close();
    }

    points.push({ x, y: solidGroundY(zone.heights, x) });

    if (lips.has(x)) {
      close();
    }
  }

  close();

  return segments;
};
