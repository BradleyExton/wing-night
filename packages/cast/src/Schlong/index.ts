// The other cast member: the schlong. JOUST fires one down the lane and
// FAPPY stands a row of them up from the sand, and both draw it from here so
// the two are the same creature — a soft body along a spine, ending in a
// glans, with a face on the head.
//
// Everything is pure geometry in the caller's own units: a spine of points
// (tail first, the head's centre last) comes in and SVG path strings come
// out. JOUST hands over its physics bodies as the spine and FAPPY bends one
// from the sand to the head each frame, so the drawing follows whatever moved
// it and never has a pose of its own. Nothing here touches the sims.
export type SchlongVec2 = {
  x: number;
  y: number;
};

export type SchlongProportions = {
  /** Half-width of the shaft. */
  shaftRadius: number;
  /** Radius of the glans; the last spine point is its centre. */
  headRadius: number;
};

export type SchlongPaths = {
  /** The whole body, shaft and glans, as one closed outline. */
  body: string;
  /** A highlight down the lit side of the shaft and a spot on the head. */
  gloss: string;
  /** The rim where the glans meets the shaft. */
  corona: string;
  /** The slit at the very tip. */
  slit: string;
  /**
   * Two veins wandering up the shaft, one each side of the spine, stopping short of the rim.
   * Open subpaths, for a thin stroke over the body.
   */
  veins: string;
  /** The head's centre — where the face goes. */
  head: SchlongVec2;
  /** Unit vector the head points in. */
  direction: SchlongVec2;
};

export type SchlongFace = {
  eyeRadius: number;
  leftEye: SchlongVec2;
  rightEye: SchlongVec2;
  pupilRadius: number;
  /** Where the pupils sit relative to their eyes, towards whatever it is looking at. */
  pupilOffset: SchlongVec2;
  mouth: string;
};

/** How many points the curve between two spine points is drawn through. */
const SAMPLES_PER_SEGMENT = 8;
const CAP_SAMPLES = 8;
/** The glans flares out over this many head radii behind its centre. */
const HEAD_LENGTH_RATIO = 1.6;
/** The neck, just behind the rim, is this much of the shaft's half-width. */
const NECK_RATIO = 0.82;
/** The tail thins to this fraction of the shaft over `TAIL_LENGTH_RATIO` shaft radii. */
const TAIL_TAPER = 0.72;
const TAIL_LENGTH_RATIO = 2.5;
/** The gloss rides this far up the lit side of the shaft, at this width. */
const GLOSS_OFFSET = 0.42;
const GLOSS_WIDTH = 0.2;
const HEAD_GLOSS_RADIUS = 0.3;
/** A vein wanders between these fractions of the half-width, one wave every so many shaft radii. */
const VEIN_INNER = 0.22;
const VEIN_SWING = 0.34;
const VEIN_WAVELENGTH_RADII = 2.6;
/** Veins start this many shaft radii up from the tail and stop this far short of the rim. */
const VEIN_START_RADII = 1.2;
const VEIN_END_RADII = 0.5;
/** Light comes from up and to the left, like the rest of the desert. */
const LIGHT: SchlongVec2 = { x: -0.6, y: -0.8 };

const round = (value: number): number => Math.round(value * 100) / 100;

const point = (at: SchlongVec2): string => `${round(at.x)} ${round(at.y)}`;

const catmullRom = (
  p0: SchlongVec2,
  p1: SchlongVec2,
  p2: SchlongVec2,
  p3: SchlongVec2,
  t: number
): SchlongVec2 => {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
  };
};

/** A smooth curve through every spine point, tail first, head centre last. */
const sampleSpine = (spine: readonly SchlongVec2[]): SchlongVec2[] => {
  if (spine.length < 2) {
    return spine.map((at) => ({ x: at.x, y: at.y }));
  }

  const samples: SchlongVec2[] = [];
  const last = spine.length - 1;

  for (let index = 0; index < last; index += 1) {
    const p0 = spine[Math.max(index - 1, 0)] ?? spine[index]!;
    const p1 = spine[index]!;
    const p2 = spine[index + 1]!;
    const p3 = spine[Math.min(index + 2, last)] ?? p2;

    for (let step = 0; step < SAMPLES_PER_SEGMENT; step += 1) {
      samples.push(catmullRom(p0, p1, p2, p3, step / SAMPLES_PER_SEGMENT));
    }
  }

  samples.push({ x: spine[last]!.x, y: spine[last]!.y });

  return samples;
};

type Rib = {
  centre: SchlongVec2;
  tangent: SchlongVec2;
  normal: SchlongVec2;
  fromTail: number;
};

/** Every sample with the direction the body runs in there, and how far along it is. */
const resolveRibs = (samples: readonly SchlongVec2[]): Rib[] => {
  const ribs: Rib[] = [];
  let fromTail = 0;
  let tangent: SchlongVec2 = { x: 1, y: 0 };

  for (let index = 0; index < samples.length; index += 1) {
    const here = samples[index]!;
    const previous = samples[index - 1] ?? here;
    const next = samples[index + 1] ?? here;
    const deltaX = next.x - previous.x;
    const deltaY = next.y - previous.y;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (length > 1e-9) {
      tangent = { x: deltaX / length, y: deltaY / length };
    }

    if (index > 0) {
      fromTail += Math.sqrt((here.x - previous.x) ** 2 + (here.y - previous.y) ** 2);
    }

    ribs.push({
      centre: here,
      tangent,
      normal: { x: -tangent.y, y: tangent.x },
      fromTail
    });
  }

  return ribs;
};

const resolveHalfWidth = (
  fromTip: number,
  fromTail: number,
  { shaftRadius, headRadius }: SchlongProportions
): number => {
  const headLength = HEAD_LENGTH_RATIO * headRadius;
  const neck = NECK_RATIO * shaftRadius;

  // The glans: a quarter-ellipse from the rim out to the tip, so it bulges
  // past the shaft and meets it at a proper edge.
  if (fromTip < headLength) {
    const along = fromTip / headLength;

    return neck + (headRadius - neck) * Math.sqrt(Math.max(0, 1 - along * along));
  }

  const tailLength = TAIL_LENGTH_RATIO * shaftRadius;

  if (fromTail < tailLength) {
    return shaftRadius * (TAIL_TAPER + (1 - TAIL_TAPER) * (fromTail / tailLength));
  }

  return shaftRadius;
};

/** A semicircle of points from `from` round through `via` to `-from`, about `centre`. */
const capPoints = (
  centre: SchlongVec2,
  from: SchlongVec2,
  via: SchlongVec2,
  radius: number
): SchlongVec2[] => {
  const points: SchlongVec2[] = [];

  for (let step = 1; step < CAP_SAMPLES; step += 1) {
    const angle = (Math.PI * step) / CAP_SAMPLES;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    points.push({
      x: centre.x + (from.x * cos + via.x * sin) * radius,
      y: centre.y + (from.y * cos + via.y * sin) * radius
    });
  }

  return points;
};

/** A closed outline around a run of ribs, each with its own half-width, capped at both ends. */
const outline = (ribs: readonly Rib[], halfWidths: readonly number[]): string => {
  const first = ribs[0];
  const last = ribs[ribs.length - 1];

  if (first === undefined || last === undefined) {
    return "";
  }

  const left: SchlongVec2[] = [];
  const right: SchlongVec2[] = [];

  for (let index = 0; index < ribs.length; index += 1) {
    const rib = ribs[index]!;
    const halfWidth = halfWidths[index] ?? 0;

    left.push({ x: rib.centre.x + rib.normal.x * halfWidth, y: rib.centre.y + rib.normal.y * halfWidth });
    right.push({ x: rib.centre.x - rib.normal.x * halfWidth, y: rib.centre.y - rib.normal.y * halfWidth });
  }

  const tipCap = capPoints(last.centre, last.normal, last.tangent, halfWidths[ribs.length - 1] ?? 0);
  const tailCap = capPoints(
    first.centre,
    { x: -first.normal.x, y: -first.normal.y },
    { x: -first.tangent.x, y: -first.tangent.y },
    halfWidths[0] ?? 0
  );
  const ring = [...left, ...tipCap, ...right.reverse(), ...tailCap];

  return `M ${ring.map(point).join(" L ")} Z`;
};

/**
 * The veins: for each side of the spine, one open polyline that rides the shaft ribs at a
 * half-width that swings in and out along the way, and a short spur that forks off the first
 * one two thirds of the way up. Nothing on the head; the rim is where they stop.
 */
const veinPaths = (
  ribs: readonly Rib[],
  halfWidths: readonly number[],
  length: number,
  { shaftRadius, headRadius }: SchlongProportions
): string => {
  const from = VEIN_START_RADII * shaftRadius;
  const to = length - HEAD_LENGTH_RATIO * headRadius - VEIN_END_RADII * shaftRadius;

  if (to - from < shaftRadius) {
    return "";
  }

  const wave = (Math.PI * 2) / (VEIN_WAVELENGTH_RADII * shaftRadius);
  const sides: string[] = [];

  for (const side of [1, -1]) {
    const points: SchlongVec2[] = [];

    for (let index = 0; index < ribs.length; index += 2) {
      const rib = ribs[index]!;

      if (rib.fromTail < from || rib.fromTail > to) {
        continue;
      }

      const swing = VEIN_INNER + VEIN_SWING * (0.5 + 0.5 * Math.sin(rib.fromTail * wave + side * 1.3));
      const offset = (halfWidths[index] ?? 0) * swing * side;

      points.push({ x: rib.centre.x + rib.normal.x * offset, y: rib.centre.y + rib.normal.y * offset });
    }

    if (points.length > 1) {
      sides.push(`M ${points.map(point).join(" L ")}`);
    }

    // The spur: off the first vein two thirds of the way up, out towards the
    // edge and a little further along.
    const forkAt = points[Math.floor(points.length * 0.66)];
    const forkIndex = ribs.findIndex((rib) => rib.fromTail >= from + (to - from) * 0.66);
    const forkRib = ribs[forkIndex];

    if (side === 1 && forkAt !== undefined && forkRib !== undefined) {
      const reach = (halfWidths[forkIndex] ?? 0) * 0.78;
      const along = shaftRadius * 0.9;
      const tip = {
        x: forkRib.centre.x + forkRib.normal.x * reach + forkRib.tangent.x * along,
        y: forkRib.centre.y + forkRib.normal.y * reach + forkRib.tangent.y * along
      };
      const bend = {
        x: forkAt.x + (tip.x - forkAt.x) * 0.5 + forkRib.normal.x * reach * 0.2,
        y: forkAt.y + (tip.y - forkAt.y) * 0.5 + forkRib.normal.y * reach * 0.2
      };

      sides.push(`M ${point(forkAt)} Q ${point(bend)} ${point(tip)}`);
    }
  }

  return sides.join(" ");
};

const circlePath = (centre: SchlongVec2, radius: number): string => {
  const r = round(radius);

  return `M ${round(centre.x - radius)} ${round(centre.y)} a ${r} ${r} 0 1 0 ${round(radius * 2)} 0 a ${r} ${r} 0 1 0 ${round(-radius * 2)} 0 Z`;
};

/** The normal on whichever side of the body faces the light. */
const litNormal = (rib: Rib): SchlongVec2 => {
  const facing = rib.normal.x * LIGHT.x + rib.normal.y * LIGHT.y;

  return facing >= 0 ? rib.normal : { x: -rib.normal.x, y: -rib.normal.y };
};

/**
 * The drawing for a spine. The spine's last point is the head's centre — a
 * physics head body, in JOUST — and the glans is drawn as a cap of
 * `headRadius` around it, so the thing the room sees hit is the circle the
 * integrator hit. A spine with no length at all still draws a head.
 */
export const resolveSchlongPaths = (
  spine: readonly SchlongVec2[],
  proportions: SchlongProportions
): SchlongPaths => {
  const ribs = resolveRibs(sampleSpine(spine));
  const last = ribs[ribs.length - 1];
  const length = last?.fromTail ?? 0;

  if (last === undefined || length < 1e-6) {
    const head = last?.centre ?? { x: 0, y: 0 };
    const direction = last?.tangent ?? { x: 1, y: 0 };

    return {
      body: circlePath(head, proportions.headRadius),
      gloss: "",
      corona: "",
      slit: "",
      veins: "",
      head,
      direction
    };
  }

  const halfWidths = ribs.map((rib) => resolveHalfWidth(length - rib.fromTail, rib.fromTail, proportions));
  const headLength = HEAD_LENGTH_RATIO * proportions.headRadius;
  const shaftRibs: Rib[] = [];
  const shaftWidths: number[] = [];

  for (let index = 0; index < ribs.length; index += 1) {
    const rib = ribs[index]!;

    if (length - rib.fromTail <= headLength) {
      break;
    }

    const halfWidth = halfWidths[index] ?? 0;
    const lit = litNormal(rib);

    shaftRibs.push({
      ...rib,
      centre: {
        x: rib.centre.x + lit.x * halfWidth * GLOSS_OFFSET,
        y: rib.centre.y + lit.y * halfWidth * GLOSS_OFFSET
      }
    });
    shaftWidths.push(halfWidth * GLOSS_WIDTH);
  }

  const head = last.centre;
  const direction = last.tangent;
  const headLit = litNormal(last);
  const headGloss = circlePath(
    {
      x: head.x + headLit.x * proportions.headRadius * 0.34 + direction.x * proportions.headRadius * 0.16,
      y: head.y + headLit.y * proportions.headRadius * 0.34 + direction.y * proportions.headRadius * 0.16
    },
    proportions.headRadius * HEAD_GLOSS_RADIUS
  );
  const neck = ribs.find((rib) => length - rib.fromTail <= headLength) ?? last;
  const neckWidth = resolveHalfWidth(length - neck.fromTail, neck.fromTail, proportions);
  const bow = proportions.headRadius * 0.45;
  const corona = `M ${point({
    x: neck.centre.x + neck.normal.x * neckWidth,
    y: neck.centre.y + neck.normal.y * neckWidth
  })} Q ${point({
    x: neck.centre.x + neck.tangent.x * bow,
    y: neck.centre.y + neck.tangent.y * bow
  })} ${point({
    x: neck.centre.x - neck.normal.x * neckWidth,
    y: neck.centre.y - neck.normal.y * neckWidth
  })}`;
  const slit = `M ${point({
    x: head.x + direction.x * proportions.headRadius * 0.5,
    y: head.y + direction.y * proportions.headRadius * 0.5
  })} L ${point({
    x: head.x + direction.x * proportions.headRadius * 0.86,
    y: head.y + direction.y * proportions.headRadius * 0.86
  })}`;

  return {
    body: outline(ribs, halfWidths),
    gloss: `${shaftRibs.length > 1 ? outline(shaftRibs, shaftWidths) : ""} ${headGloss}`.trim(),
    corona,
    slit,
    veins: veinPaths(ribs, halfWidths, length, proportions),
    head,
    direction
  };
};

/** How far a pupil may leave its eye's centre, as a fraction of the head. */
const PUPIL_TRAVEL = 0.11;

/**
 * The face, in screen space on the head: two eyes side by side and a smile
 * under them, however the body is pointing — it is a cartoon, and it looks at
 * the room. `lookAt` turns the pupils towards something (the rack, the bird
 * coming down the corridor); null looks straight out.
 */
export const resolveSchlongFace = (
  head: SchlongVec2,
  headRadius: number,
  lookAt: SchlongVec2 | null
): SchlongFace => {
  const eyeRadius = headRadius * 0.27;
  const leftEye = { x: head.x - headRadius * 0.4, y: head.y - headRadius * 0.2 };
  const rightEye = { x: head.x + headRadius * 0.4, y: head.y - headRadius * 0.2 };
  let pupilOffset: SchlongVec2 = { x: 0, y: 0 };

  if (lookAt !== null) {
    const deltaX = lookAt.x - head.x;
    const deltaY = lookAt.y - head.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 1e-9) {
      const travel = headRadius * PUPIL_TRAVEL;

      pupilOffset = { x: (deltaX / distance) * travel, y: (deltaY / distance) * travel };
    }
  }

  return {
    eyeRadius,
    leftEye,
    rightEye,
    pupilRadius: eyeRadius * 0.5,
    pupilOffset,
    mouth: `M ${point({ x: head.x - headRadius * 0.3, y: head.y + headRadius * 0.28 })} Q ${point({
      x: head.x,
      y: head.y + headRadius * 0.58
    })} ${point({ x: head.x + headRadius * 0.3, y: head.y + headRadius * 0.28 })}`
  };
};
