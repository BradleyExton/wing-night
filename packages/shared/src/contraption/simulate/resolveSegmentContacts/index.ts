import type { Segment, Vec2 } from "../../types.js";

/**
 * The state a body carries between integration steps: its centre, and the centre it held one step
 * ago. Position-Verlet keeps velocity implicit as the difference between the two, so a contact
 * response is written by moving `previous` rather than by storing a velocity alongside it.
 */
export type BodyStep = {
  readonly x: number;
  readonly y: number;
  readonly previousX: number;
  readonly previousY: number;
};

export type ContactMaterial = {
  readonly radius: number;
  readonly restitution: number;
  readonly slip: number;
};

const clampUnit = (value: number): number => {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

/**
 * Used only when a centre lands exactly on the segment, where the centre-to-surface direction is
 * undefined. The segment's own perpendicular is a deterministic stand-in; a segment with zero
 * length has no perpendicular either, so those bodies get pushed straight up.
 */
const perpendicularOf = (segment: Segment): Vec2 => {
  const alongX = segment.to.x - segment.from.x;
  const alongY = segment.to.y - segment.from.y;
  const length = Math.sqrt(alongX * alongX + alongY * alongY);
  if (length === 0) {
    return { x: 0, y: -1 };
  }
  return { x: -alongY / length, y: alongX / length };
};

const resolveOne = (
  step: BodyStep,
  material: ContactMaterial,
  segment: Segment
): BodyStep => {
  const alongX = segment.to.x - segment.from.x;
  const alongY = segment.to.y - segment.from.y;
  const alongLengthSquared = alongX * alongX + alongY * alongY;
  const offsetX = step.x - segment.from.x;
  const offsetY = step.y - segment.from.y;
  const travel =
    alongLengthSquared === 0
      ? 0
      : clampUnit((offsetX * alongX + offsetY * alongY) / alongLengthSquared);
  const gapX = step.x - (segment.from.x + alongX * travel);
  const gapY = step.y - (segment.from.y + alongY * travel);
  const gapSquared = gapX * gapX + gapY * gapY;
  if (gapSquared >= material.radius * material.radius) {
    return step;
  }

  const gap = Math.sqrt(gapSquared);
  const normal =
    gap > 0 ? { x: gapX / gap, y: gapY / gap } : perpendicularOf(segment);
  const penetration = material.radius - gap;

  // Shift the current AND previous centres by the same amount, so lifting the body clear of the
  // surface does not itself register as velocity on the next step.
  const x = step.x + normal.x * penetration;
  const y = step.y + normal.y * penetration;
  const previousX = step.previousX + normal.x * penetration;
  const previousY = step.previousY + normal.y * penetration;

  const velocityX = x - previousX;
  const velocityY = y - previousY;
  const approach = velocityX * normal.x + velocityY * normal.y;
  if (approach >= 0) {
    return { x, y, previousX, previousY };
  }

  const tangentX = velocityX - approach * normal.x;
  const tangentY = velocityY - approach * normal.y;
  const bouncedX = tangentX * material.slip - normal.x * approach * material.restitution;
  const bouncedY = tangentY * material.slip - normal.y * approach * material.restitution;
  return { x, y, previousX: x - bouncedX, previousY: y - bouncedY };
};

/**
 * Settles one body against every static segment, in layout order. Segments are immovable, so the
 * pass is one-directional and order-stable: the same layout always resolves the same way.
 */
export const resolveSegmentContacts = (
  step: BodyStep,
  material: ContactMaterial,
  segments: readonly Segment[]
): BodyStep => {
  return segments.reduce<BodyStep>((carried, segment) => {
    return resolveOne(carried, material, segment);
  }, step);
};
