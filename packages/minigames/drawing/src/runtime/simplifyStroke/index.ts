import type { DrawingPoint } from "@wingnight/shared";

// Ramer–Douglas–Peucker tolerance, in the same normalized 0–1 units the
// points are stored in. `sanitizeDrawingPoint` already quantizes coordinates
// to a 0.001 grid, so this is exactly one quantization step: a point can only
// be dropped when the straight line through its neighbours passes within the
// smallest offset the wire can even express. On a 1920x1200 board that is at
// most 1.92px horizontally and 1.2px vertically — sub-pixel-ish on both axes,
// and perfect-freehand is already smoothing the samples at streamline 0.45,
// so the baked stroke redraws as the same line.
//
// The tolerance is a radius in normalized space, not in pixels, and the board
// is 16:10 — so the same epsilon buys a little more slack along x than along
// y. That asymmetry is deliberate and left alone: the quantization grid it is
// pinned to has exactly the same shape, so correcting one axis would only
// push the tolerance below the resolution the points are stored at.
export const STROKE_SIMPLIFY_EPSILON = 0.001;

// Distance from `point` to the segment `start`–`end`. A zero-length segment
// (the artist came back to where they started) has no perpendicular, so it
// degenerates to the distance from that single position.
const distanceToSegment = (
  point: DrawingPoint,
  start: DrawingPoint,
  end: DrawingPoint
): number => {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

  if (segmentLengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  return (
    Math.abs(
      segmentY * point.x - segmentX * point.y + end.x * start.y - end.y * start.x
    ) / Math.sqrt(segmentLengthSquared)
  );
};

// Ramer–Douglas–Peucker, bottom-up over an explicit range stack rather than
// recursion: a stroke is a chain of pointer samples and a pathological one
// splits once per point, which is a call depth the runtime should not be
// spending on a party tablet's scribble.
//
// The first and last points are never candidates for removal, so a tap (one
// point) still bakes down to a dot, and a two-point stroke keeps both ends.
export const simplifyStroke = (
  points: DrawingPoint[],
  epsilon: number = STROKE_SIMPLIFY_EPSILON
): DrawingPoint[] => {
  if (points.length <= 2) {
    return [...points];
  }

  const isKept = points.map((_point, index) => {
    return index === 0 || index === points.length - 1;
  });
  const pendingRanges: Array<[number, number]> = [[0, points.length - 1]];

  while (pendingRanges.length > 0) {
    const range = pendingRanges.pop();

    if (range === undefined) {
      continue;
    }

    const [startIndex, endIndex] = range;
    const start = points[startIndex];
    const end = points[endIndex];

    if (start === undefined || end === undefined) {
      continue;
    }

    let farthestIndex = -1;
    let farthestDistance = epsilon;

    for (let index = startIndex + 1; index < endIndex; index += 1) {
      const candidate = points[index];

      if (candidate === undefined) {
        continue;
      }

      const distance = distanceToSegment(candidate, start, end);

      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthestIndex = index;
      }
    }

    // Nothing in this range strays far enough from the chord to be worth a
    // point on the wire, so the chord replaces it whole.
    if (farthestIndex === -1) {
      continue;
    }

    isKept[farthestIndex] = true;
    pendingRanges.push([startIndex, farthestIndex], [farthestIndex, endIndex]);
  }

  return points.filter((_point, index) => isKept[index] === true);
};
