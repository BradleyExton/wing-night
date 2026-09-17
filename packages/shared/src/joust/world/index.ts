import type {
  JoustAim,
  JoustArena,
  JoustBodyDescriptor,
  JoustFrame,
  JoustObstacle,
  JoustVec2
} from "../types.js";

/**
 * The fixed geometry every arena shares. World units are arbitrary; the renderer maps the
 * 160×90 box onto a 16:9 viewport, y grows downward like a screen, and the floor is a line a
 * little above the bottom edge so a body can visibly rest on it.
 */
export const JOUST_WORLD = {
  width: 160,
  height: 90,
  floorY: 78,
  /** The slingshot's fork — where the shooter's head sits at rest. */
  anchor: { x: 40, y: 46 } as JoustVec2,
  /** How far back a full pull takes the head, in world units. */
  pullRadius: 14,
  /**
   * The furthest DOWN a pull may go, as a fraction of the radius. The shooter trails behind the
   * head along the pull, so a steeper pull would plant its tail in the floor before launch and
   * the floor contact would eat the shot. At full power this caps the launch at about 45°.
   */
  maxPullDown: 0.7,
  /** Launch speed at a full pull, in world units per second. */
  maxLaunchSpeed: 140,
  /** World units per second squared, downward. */
  gravity: 118
} as const;

const SHOOTER_SPACING = 3;
const SHOOTER_SHAFT_RADIUS = 2.3;
const SHOOTER_HEAD_RADIUS = 3.3;
const SHOOTER_BALL_RADIUS = 2.5;
const CHAMP_SPACING = 3.4;
const CHAMP_SHAFT_RADIUS = 2.5;
const CHAMP_HEAD_RADIUS = 3.6;
const CHAMP_BALL_RADIUS = 2.6;

export const JOUST_SHOOTER_SHAFT_COUNT = 5;
export const JOUST_CHAMP_SHAFT_COUNT = 5;

const shooterShaft: JoustBodyDescriptor = {
  kind: "shooter-shaft",
  radius: SHOOTER_SHAFT_RADIUS
};
const champShaft: JoustBodyDescriptor = {
  kind: "champ-shaft",
  radius: CHAMP_SHAFT_RADIUS
};

/**
 * The one body order every frame, every renderer and the integrator agree on. Shooter first
 * (tail → head, then the two balls), then the champ (base → head, then its balls).
 */
export const JOUST_BODIES: readonly JoustBodyDescriptor[] = Object.freeze([
  ...Array.from({ length: JOUST_SHOOTER_SHAFT_COUNT }, () => shooterShaft),
  { kind: "shooter-head", radius: SHOOTER_HEAD_RADIUS },
  { kind: "shooter-ball", radius: SHOOTER_BALL_RADIUS },
  { kind: "shooter-ball", radius: SHOOTER_BALL_RADIUS },
  ...Array.from({ length: JOUST_CHAMP_SHAFT_COUNT }, () => champShaft),
  { kind: "champ-head", radius: CHAMP_HEAD_RADIUS },
  { kind: "champ-ball", radius: CHAMP_BALL_RADIUS },
  { kind: "champ-ball", radius: CHAMP_BALL_RADIUS }
]);

export const JOUST_SHOOTER_HEAD_INDEX = JOUST_SHOOTER_SHAFT_COUNT;
export const JOUST_SHOOTER_BALL_INDICES = [
  JOUST_SHOOTER_HEAD_INDEX + 1,
  JOUST_SHOOTER_HEAD_INDEX + 2
] as const;
export const JOUST_SHOOTER_BODY_COUNT = JOUST_SHOOTER_HEAD_INDEX + 3;
export const JOUST_CHAMP_BASE_INDEX = JOUST_SHOOTER_BODY_COUNT;
export const JOUST_CHAMP_HEAD_INDEX = JOUST_CHAMP_BASE_INDEX + JOUST_CHAMP_SHAFT_COUNT;
export const JOUST_CHAMP_BALL_INDICES = [
  JOUST_CHAMP_HEAD_INDEX + 1,
  JOUST_CHAMP_HEAD_INDEX + 2
] as const;
export const JOUST_BODY_COUNT = JOUST_BODIES.length;

const length = (vector: JoustVec2): number => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
};

/**
 * Caps a pull at the slingshot's radius and at its downward limit; anything inside both is kept
 * as-is. Non-finite input reads as a slack band.
 */
export const clampJoustAim = (aim: JoustAim): JoustAim => {
  if (!Number.isFinite(aim.x) || !Number.isFinite(aim.y)) {
    return { x: 0, y: 0 };
  }

  const loweredY = Math.min(aim.y, JOUST_WORLD.maxPullDown);
  const magnitude = length({ x: aim.x, y: loweredY });

  if (magnitude <= 1) {
    return { x: aim.x, y: loweredY };
  }

  return { x: aim.x / magnitude, y: loweredY / magnitude };
};

/**
 * The direction the shooter points — and flies — for a given pull: straight back along the
 * band. A slack band points it at the champ so the rest pose reads as "ready".
 */
export const resolveJoustHeading = (aim: JoustAim): JoustVec2 => {
  const clamped = clampJoustAim(aim);
  const magnitude = length(clamped);

  if (magnitude < 0.001) {
    return { x: 1, y: 0 };
  }

  return { x: -clamped.x / magnitude, y: -clamped.y / magnitude };
};

/** Launch velocity in world units per second: the heading scaled by how far the band was pulled. */
export const resolveJoustLaunchVelocity = (aim: JoustAim): JoustVec2 => {
  const clamped = clampJoustAim(aim);
  const heading = resolveJoustHeading(clamped);
  const speed = length(clamped) * JOUST_WORLD.maxLaunchSpeed;

  return { x: heading.x * speed, y: heading.y * speed };
};

/** Where the shooter's bodies sit while the band is pulled, before anything moves. */
export const resolveShooterRestPositions = (aim: JoustAim): JoustVec2[] => {
  const clamped = clampJoustAim(aim);
  const heading = resolveJoustHeading(clamped);
  const head: JoustVec2 = {
    x: JOUST_WORLD.anchor.x + clamped.x * JOUST_WORLD.pullRadius,
    y: JOUST_WORLD.anchor.y + clamped.y * JOUST_WORLD.pullRadius
  };
  const positions: JoustVec2[] = [];

  for (let index = 0; index < JOUST_SHOOTER_SHAFT_COUNT; index += 1) {
    const distance = (JOUST_SHOOTER_SHAFT_COUNT - index) * SHOOTER_SPACING;
    positions.push({
      x: head.x - heading.x * distance,
      y: head.y - heading.y * distance
    });
  }

  positions.push(head);

  const tail = positions[0] ?? head;
  const perpendicular: JoustVec2 = { x: -heading.y, y: heading.x };
  const ballBack = 1.4;
  const ballSide = 2.4;

  positions.push({
    x: tail.x - heading.x * ballBack + perpendicular.x * ballSide,
    y: tail.y - heading.y * ballBack + perpendicular.y * ballSide
  });
  positions.push({
    x: tail.x - heading.x * ballBack - perpendicular.x * ballSide,
    y: tail.y - heading.y * ballBack - perpendicular.y * ballSide
  });

  return positions;
};

/** Where the champ stands before it's hit: upright on the floor at the arena's target column. */
export const resolveChampRestPositions = (arena: JoustArena): JoustVec2[] => {
  const positions: JoustVec2[] = [];
  const baseY = JOUST_WORLD.floorY - CHAMP_SHAFT_RADIUS;

  for (let index = 0; index < JOUST_CHAMP_SHAFT_COUNT; index += 1) {
    positions.push({ x: arena.targetX, y: baseY - index * CHAMP_SPACING });
  }

  positions.push({
    x: arena.targetX,
    y: baseY - JOUST_CHAMP_SHAFT_COUNT * CHAMP_SPACING - 0.6
  });
  positions.push({
    x: arena.targetX - 2.7,
    y: JOUST_WORLD.floorY - CHAMP_BALL_RADIUS
  });
  positions.push({
    x: arena.targetX + 2.7,
    y: JOUST_WORLD.floorY - CHAMP_BALL_RADIUS
  });

  return positions;
};

/** The full body set at rest for a pull — what both surfaces draw while the team is aiming. */
export const resolveJoustRestPositions = (
  arena: JoustArena,
  aim: JoustAim
): JoustVec2[] => {
  return [...resolveShooterRestPositions(aim), ...resolveChampRestPositions(arena)];
};

export const toJoustFrame = (positions: readonly JoustVec2[]): JoustFrame => {
  const frame: number[] = [];

  for (const position of positions) {
    frame.push(Math.round(position.x * 100) / 100, Math.round(position.y * 100) / 100);
  }

  return frame;
};

export const readJoustFramePosition = (
  frame: JoustFrame,
  bodyIndex: number
): JoustVec2 => {
  return {
    x: frame[bodyIndex * 2] ?? 0,
    y: frame[bodyIndex * 2 + 1] ?? 0
  };
};

/** The rest pose as a frame, so renderers draw the aiming scene through the same path as a track. */
export const resolveJoustRestFrame = (arena: JoustArena, aim: JoustAim): JoustFrame => {
  return toJoustFrame(resolveJoustRestPositions(arena, aim));
};

export type JoustSegment = {
  readonly from: JoustVec2;
  readonly to: JoustVec2;
};

const obstacleSegments = (obstacle: JoustObstacle): JoustSegment[] => {
  const left = obstacle.x;
  const right = obstacle.x + obstacle.width;
  const top = obstacle.y;
  const bottom = obstacle.y + obstacle.height;

  return [
    { from: { x: left, y: top }, to: { x: right, y: top } },
    { from: { x: right, y: top }, to: { x: right, y: bottom } },
    { from: { x: right, y: bottom }, to: { x: left, y: bottom } },
    { from: { x: left, y: bottom }, to: { x: left, y: top } }
  ];
};

/** The floor, the back wall, and every obstacle edge — all the static geometry a shot can hit. */
export const resolveJoustSegments = (arena: JoustArena): JoustSegment[] => {
  const farLeft = -20;
  const farRight = JOUST_WORLD.width + 40;

  return [
    {
      from: { x: farLeft, y: JOUST_WORLD.floorY },
      to: { x: farRight, y: JOUST_WORLD.floorY }
    },
    // Well behind the slingshot, so a fully drawn shooter never touches it; it only stops a
    // shot fired backwards from leaving the world entirely.
    { from: { x: -30, y: -60 }, to: { x: -30, y: JOUST_WORLD.floorY } },
    ...arena.obstacles.flatMap(obstacleSegments)
  ];
};
