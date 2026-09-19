import type {
  JoustAim,
  JoustArena,
  JoustBodyDescriptor,
  JoustFrame,
  JoustObstacle,
  JoustPerch,
  JoustVec2
} from "../types.js";

/**
 * The fixed geometry every lane shares. World units are arbitrary; the renderer maps the
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

/**
 * A pin is two bodies: a foot on the sand and a head on top of it, an upright stick between. The
 * three numbers are the CAST BIRD's own proportions at lane scale — `@wingnight/cast` says a
 * hen stands 61 of its units from sole to the middle of a costume head, and that head reads as 22
 * across — so what the room sees hit is what the integrator hit. The joust client pins that
 * agreement with a test; changing one of these without the other three is a bug.
 */
export const JOUST_PIN_FOOT_RADIUS = 1.6;
export const JOUST_PIN_HEAD_RADIUS = 4.2;
export const JOUST_PIN_HEIGHT = 11.6;

export const JOUST_SHOOTER_SHAFT_COUNT = 5;

const shooterShaft: JoustBodyDescriptor = {
  kind: "shooter-shaft",
  radius: SHOOTER_SHAFT_RADIUS
};
const pinFoot: JoustBodyDescriptor = { kind: "pin-foot", radius: JOUST_PIN_FOOT_RADIUS };
const pinHead: JoustBodyDescriptor = { kind: "pin-head", radius: JOUST_PIN_HEAD_RADIUS };

/** A perch's own timber: the slab birds stand on, and the two legs holding it up. */
export const JOUST_PERCH_THICKNESS = 3;
export const JOUST_PERCH_LEG_WIDTH = 2.6;
/** Legs hug the slab's ends, so the span between them is all standing room. */
export const JOUST_PERCH_LEG_INSET = 0.4;
/**
 * A tower's leg is a body, not a wall: a foot on the sand and a top under the slab, collided
 * against as the capsule it is drawn as — the same shape as a pin, only taller and far heavier.
 * That is what makes a tower something a shot can bring DOWN rather than only bounce off.
 */
export const JOUST_LEG_RADIUS = JOUST_PERCH_LEG_WIDTH / 2;

const legFoot: JoustBodyDescriptor = { kind: "leg-foot", radius: JOUST_LEG_RADIUS };
const legTop: JoustBodyDescriptor = { kind: "leg-top", radius: JOUST_LEG_RADIUS };

/** The shooter's own bodies, tail → head, then the two balls hung off the tail. */
const JOUST_SHOOTER_BODIES: readonly JoustBodyDescriptor[] = Object.freeze([
  ...Array.from({ length: JOUST_SHOOTER_SHAFT_COUNT }, () => shooterShaft),
  { kind: "shooter-head", radius: SHOOTER_HEAD_RADIUS },
  { kind: "shooter-ball", radius: SHOOTER_BALL_RADIUS },
  { kind: "shooter-ball", radius: SHOOTER_BALL_RADIUS }
]);

export const JOUST_SHOOTER_HEAD_INDEX = JOUST_SHOOTER_SHAFT_COUNT;
export const JOUST_SHOOTER_BALL_INDICES = [
  JOUST_SHOOTER_HEAD_INDEX + 1,
  JOUST_SHOOTER_HEAD_INDEX + 2
] as const;
export const JOUST_SHOOTER_BODY_COUNT = JOUST_SHOOTER_BODIES.length;

/** Where pin `pinIndex`'s foot sits in a frame; its head is the very next body. */
export const joustPinFootIndex = (pinIndex: number): number => {
  return JOUST_SHOOTER_BODY_COUNT + pinIndex * 2;
};

export const joustPinHeadIndex = (pinIndex: number): number => {
  return joustPinFootIndex(pinIndex) + 1;
};

/** Where leg `legIndex`'s foot sits in a frame of a lane racking `pinCount` pins; its top is next. */
export const joustLegFootIndex = (pinCount: number, legIndex: number): number => {
  return JOUST_SHOOTER_BODY_COUNT + Math.max(0, Math.trunc(pinCount)) * 2 + legIndex * 2;
};

export const joustLegTopIndex = (pinCount: number, legIndex: number): number => {
  return joustLegFootIndex(pinCount, legIndex) + 1;
};

/**
 * The one body order every frame, every renderer and the integrator agree on: the shooter,
 * then a foot/head pair per standing pin in lane order, then a foot/top pair per leg of every
 * tower still standing. The length follows the rack, so a turn that has already felled four
 * players simulates four bodies lighter — and legs come LAST so felling a player never moves
 * a tower's bodies, and bringing a tower down never moves a pin's.
 */
export const resolveJoustBodies = (
  pinCount: number,
  legCount = 0
): readonly JoustBodyDescriptor[] => {
  const safeCount = Math.max(0, Math.trunc(pinCount));
  const safeLegCount = Math.max(0, Math.trunc(legCount));

  return [
    ...JOUST_SHOOTER_BODIES,
    ...Array.from({ length: safeCount * 2 }, (_unused, index) =>
      index % 2 === 0 ? pinFoot : pinHead
    ),
    ...Array.from({ length: safeLegCount * 2 }, (_unused, index) =>
      index % 2 === 0 ? legFoot : legTop
    )
  ];
};

/** Nearest the slingshot a perch may reach, and the last column that keeps a bird fully on screen. */
export const JOUST_RACK_LEFT = JOUST_WORLD.anchor.x + 14;
export const JOUST_RACK_RIGHT = JOUST_WORLD.width - 4;
/** The highest a perch may lift a player: any higher and their head leaves the world. */
export const JOUST_RACK_TOP = 22;

/** How far a player's feet stay from the end of their own shelf. */
export const JOUST_PERCH_MARGIN = JOUST_PIN_HEAD_RADIUS + 1;
/**
 * The gap between neighbours in an uncrowded rack: a shade wider than a bird's head, so a full
 * lane is shoulder to shoulder without anyone standing inside anyone else.
 */
export const JOUST_PIN_SPACING = 9;

/** A perch at floor level IS the sand; anything higher is built, and what is built is solid. */
export const isGroundPerch = (perch: JoustPerch): boolean => {
  return perch.y >= JOUST_WORLD.floorY - 0.001;
};

/** The plank a built perch's players stand on; the sand has none. */
export const resolvePerchSlab = (perch: JoustPerch): JoustObstacle | null => {
  if (isGroundPerch(perch)) {
    return null;
  }

  return {
    x: perch.x,
    y: perch.y,
    width: perch.width,
    height: JOUST_PERCH_THICKNESS
  };
};

/** One leg of a tower: where it stands, and the two body centres it is simulated as. */
export type JoustLeg = {
  readonly perchIndex: number;
  readonly x: number;
  readonly footY: number;
  readonly topY: number;
};

/** The legs holding a slab up, as boxes: the footprint the slot dealer keeps players out of. */
const resolvePerchLegBoxes = (perch: JoustPerch): JoustObstacle[] => {
  const legTop = perch.y + JOUST_PERCH_THICKNESS;
  const legHeight = JOUST_WORLD.floorY - legTop;

  if (isGroundPerch(perch) || legHeight <= 0) {
    return [];
  }

  return [
    {
      x: perch.x + JOUST_PERCH_LEG_INSET,
      y: legTop,
      width: JOUST_PERCH_LEG_WIDTH,
      height: legHeight
    },
    {
      x: perch.x + perch.width - JOUST_PERCH_LEG_INSET - JOUST_PERCH_LEG_WIDTH,
      y: legTop,
      width: JOUST_PERCH_LEG_WIDTH,
      height: legHeight
    }
  ];
};

/**
 * The timber one perch is made of, as boxes. Generated rather than authored so a lane cannot
 * draw a platform and forget to make it solid. This is the LAYOUT view of a tower — what the slot
 * dealer keeps players clear of and what content validation measures; the integrator collides
 * the slab as a segment and the legs as bodies (`resolveJoustLegs`).
 */
export const resolvePerchBoxes = (perch: JoustPerch): JoustObstacle[] => {
  const slab = resolvePerchSlab(perch);

  return slab === null ? [] : [slab, ...resolvePerchLegBoxes(perch)];
};

/**
 * Every leg in the lane that is still holding something up, two per built perch in perch order,
 * skipping towers already in rubble. A shelf hung so low its legs would be shorter than they are
 * wide gets none: its slab sits on the sand and is a wall, not a tower.
 */
export const resolveJoustLegs = (
  perches: readonly JoustPerch[],
  collapsedPerchIndices: readonly number[] = []
): JoustLeg[] => {
  const collapsed = new Set(collapsedPerchIndices);

  return perches.flatMap((perch, perchIndex): JoustLeg[] => {
    if (collapsed.has(perchIndex)) {
      return [];
    }

    return resolvePerchLegBoxes(perch).map((box) => ({
      perchIndex,
      x: box.x + box.width / 2,
      footY: JOUST_WORLD.floorY - JOUST_LEG_RADIUS,
      topY: box.y + JOUST_LEG_RADIUS
    }));
  });
};

/** Whether a perch is a tower a shot could bring down, rather than sand or a slab on the sand. */
export const isCollapsiblePerch = (perch: JoustPerch): boolean => {
  return resolvePerchLegBoxes(perch).length > 0;
};

/**
 * What a player stood on this perch is worth when they go over: one on the sand, like bowling,
 * and more the higher the shelf — every `JOUST_PERCH_POINTS_TIER` units up adds one, to a cap.
 * The tower is the harder target and the bigger prize, which is what makes it a choice.
 */
export const JOUST_PERCH_POINTS_TIER = 20;
export const JOUST_PERCH_POINTS_MAX = 3;

export const resolveJoustPerchPoints = (perch: JoustPerch | null): number => {
  if (perch === null || isGroundPerch(perch)) {
    return 1;
  }

  const rise = JOUST_WORLD.floorY - perch.y;

  return Math.min(JOUST_PERCH_POINTS_MAX, 1 + Math.floor(rise / JOUST_PERCH_POINTS_TIER));
};

/**
 * Which perch a pin planted at `foot` is standing on, or null for bare sand nobody authored (the
 * crowded-roster fallback rows). Read off the geometry rather than carried on the pin, so the
 * integrator, the scorer and the renderer can never disagree about whose tower a player is on.
 */
export const resolveJoustPinPerchIndex = (
  foot: JoustVec2,
  perches: readonly JoustPerch[]
): number | null => {
  const index = perches.findIndex(
    (perch) =>
      Math.abs(perch.y - JOUST_PIN_FOOT_RADIUS - foot.y) < 0.01 &&
      foot.x >= perch.x - 0.01 &&
      foot.x <= perch.x + perch.width + 0.01
  );

  return index === -1 ? null : index;
};

const overlaps = (low: number, high: number, boxLow: number, boxHigh: number): boolean => {
  return low < boxHigh && high > boxLow;
};

/**
 * Every spot on one perch a player can actually stand: a row at `JOUST_PIN_SPACING`, which is a
 * shade wider than a bird's own head, minus any spot a tower's leg is already occupying. Spacing
 * is never squeezed below that — birds dealt closer than their heads are wide shove each other
 * over on the first step, and the whole rack comes down before the shot is even fired.
 */
export const resolvePerchSlots = (
  perch: JoustPerch,
  timber: readonly JoustObstacle[]
): JoustVec2[] => {
  const footY = perch.y - JOUST_PIN_FOOT_RADIUS;
  const first = perch.x + JOUST_PERCH_MARGIN;
  const last = perch.x + perch.width - JOUST_PERCH_MARGIN;
  const headY = footY - JOUST_PIN_HEIGHT - JOUST_PIN_HEAD_RADIUS;
  const slots: JoustVec2[] = [];

  for (let x = first; x <= last + 1e-9; x += JOUST_PIN_SPACING) {
    const blocked = timber.some((box) =>
      overlaps(x - JOUST_PIN_HEAD_RADIUS, x + JOUST_PIN_HEAD_RADIUS, box.x, box.x + box.width) &&
      overlaps(headY, footY, box.y, box.y + box.height)
    );

    if (!blocked) {
      slots.push({ x, y: footY });
    }
  }

  return slots;
};

/** Every spot in the whole lane, perch by perch. */
export const resolveLaneSlots = (perches: readonly JoustPerch[]): JoustVec2[][] => {
  const timber = perches.flatMap(resolvePerchBoxes);

  return perches.map((perch) => resolvePerchSlots(perch, timber));
};

/**
 * What the lane ends up being for a given rack: the structures actually built, and a standing spot
 * per player. The two come back together because they have to agree — a rack too big for the
 * lane's shelves is stood on the bare sand instead, and the renderer must not then draw towers
 * with nobody on them.
 */
export type JoustRackLayout = {
  readonly perches: readonly JoustPerch[];
  readonly feet: readonly JoustVec2[];
};

/** The whole floor of the lane, for when the shelves cannot seat the room. */
const bareGroundPerch = (): JoustPerch => ({
  x: JOUST_RACK_LEFT,
  y: JOUST_WORLD.floorY,
  width: JOUST_RACK_RIGHT - JOUST_RACK_LEFT
});

/**
 * A single row across the sand, only as tight as it has to be and never tighter than a bird is
 * wide. The last resort for a roster bigger than any lane was built for.
 */
const crowdedGroundRow = (pinCount: number): JoustVec2[] => {
  const footY = JOUST_WORLD.floorY - JOUST_PIN_FOOT_RADIUS;
  // Every inch there is: from just clear of the slingshot to the last column that keeps a head on
  // screen. Wider than the lane proper, because this is the row that has to hold everybody.
  const from = JOUST_WORLD.anchor.x + 8;
  const to = JOUST_WORLD.width - JOUST_PIN_HEAD_RADIUS - 2;
  const room = to - from;
  // Never below a bird's own width: two players inside each other shove the whole row over before
  // the shot is fired, which is worse than one of them standing past the edge.
  const tightest = JOUST_PIN_HEAD_RADIUS * 2 + 0.2;
  const spacing =
    pinCount <= 1 ? 0 : Math.max(tightest, Math.min(JOUST_PIN_SPACING, room / (pinCount - 1)));
  const span = spacing * (pinCount - 1);
  const left = from + Math.max(0, room - span) / 2;

  return Array.from({ length: pinCount }, (_unused, index) => ({
    x: left + index * spacing,
    y: footY
  }));
};

// Taking the MIDDLE of a perch's spots keeps a half-filled shelf looking stood-on rather than
// shoved against one end.
const dealAcross = (laneSlots: readonly JoustVec2[][], pinCount: number): JoustVec2[] => {
  const taken = laneSlots.map(() => 0);

  for (let placed = 0; placed < pinCount; placed += 1) {
    let emptiest = -1;
    let bestRatio = Number.POSITIVE_INFINITY;

    for (let index = 0; index < laneSlots.length; index += 1) {
      const room = laneSlots[index]?.length ?? 0;
      const here = taken[index] ?? 0;

      if (here >= room) {
        continue;
      }

      if (here / room < bestRatio) {
        bestRatio = here / room;
        emptiest = index;
      }
    }

    if (emptiest === -1) {
      break;
    }

    taken[emptiest] = (taken[emptiest] ?? 0) + 1;
  }

  return laneSlots.flatMap((slots, index) => {
    const count = taken[index] ?? 0;
    const from = Math.floor((slots.length - count) / 2);

    return slots.slice(from, from + count);
  });
};

/**
 * Where every player in the rack stands, and on what. Birds are dealt to the perch that is
 * emptiest relative to its own standing room, so a wide floor takes the crowd, a shelf up top
 * still gets somebody, and any roster size lands on a lane that looks built rather than lined up.
 *
 * A pure function of the FULL lineup: a player felled on shot one leaves their spot behind.
 */
export const resolveJoustRackLayout = (
  perches: readonly JoustPerch[],
  pinCount: number
): JoustRackLayout => {
  const safeCount = Math.max(0, Math.trunc(pinCount));

  if (safeCount === 0) {
    return { perches, feet: [] };
  }

  const laneSlots = resolveLaneSlots(perches);
  const capacity = laneSlots.reduce((total, slots) => total + slots.length, 0);

  if (capacity >= safeCount) {
    return { perches, feet: dealAcross(laneSlots, safeCount) };
  }

  const ground = bareGroundPerch();
  const groundSlots = resolvePerchSlots(ground, []);

  if (groundSlots.length >= safeCount) {
    return { perches: [ground], feet: dealAcross([groundSlots], safeCount) };
  }

  return { perches: [ground], feet: crowdedGroundRow(safeCount) };
};

/** Just the standing spots, for callers that already know what was built. */
export const resolveJoustRackSlots = (
  perches: readonly JoustPerch[],
  pinCount: number
): JoustVec2[] => {
  return [...resolveJoustRackLayout(perches, pinCount).feet];
};

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
 * band. A slack band points it down the lane so the rest pose reads as "ready".
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

/** Where the rack stands before anything hits it: upright on its own spot, wherever that is. */
export const resolvePinRestPositions = (arena: JoustArena): JoustVec2[] => {
  return arena.pinFeet.flatMap((foot): JoustVec2[] => [
    { x: foot.x, y: foot.y },
    { x: foot.x, y: foot.y - JOUST_PIN_HEIGHT }
  ]);
};

/** Every standing tower's legs, bolt upright, foot then top, in `resolveJoustLegs` order. */
export const resolveLegRestPositions = (arena: JoustArena): JoustVec2[] => {
  return resolveJoustLegs(arena.perches, arena.collapsedPerchIndices ?? []).flatMap(
    (leg): JoustVec2[] => [
      { x: leg.x, y: leg.footY },
      { x: leg.x, y: leg.topY }
    ]
  );
};

/** The full body set at rest for a pull — what both surfaces draw while the team is aiming. */
export const resolveJoustRestPositions = (
  arena: JoustArena,
  aim: JoustAim
): JoustVec2[] => {
  return [
    ...resolveShooterRestPositions(aim),
    ...resolvePinRestPositions(arena),
    ...resolveLegRestPositions(arena)
  ];
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

/**
 * How far a pin has leaned, as a fraction of its own height: 0 is bolt upright and 1 is flat on
 * the sand. Shared by the integrator, which latches a topple, and the renderer, which draws the
 * lean — one definition, so the TV never shows a pin standing that the score says is down.
 */
export const resolveJoustLeanTilt = (foot: JoustVec2, top: JoustVec2, height: number): number => {
  return height <= 0 ? 0 : Math.abs(top.x - foot.x) / height;
};

export const resolveJoustPinTilt = (foot: JoustVec2, head: JoustVec2): number => {
  return resolveJoustLeanTilt(foot, head, JOUST_PIN_HEIGHT);
};

/** Past this lean a pin is over and never gets back up. */
export const JOUST_TOPPLE_TILT = 0.45;
/**
 * Past this lean, as a fraction of its own height, a tower's leg has folded: the slab it held
 * stops being a floor and everyone on it is going down with it.
 */
export const JOUST_TOWER_TOPPLE_TILT = 0.4;

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

/**
 * The floor, the back wall, and every obstacle edge: the geometry that is there whatever happens
 * to the towers. Slabs are kept apart (`resolvePerchSlabSegments`) because a slab stops being
 * solid the moment its legs fold.
 */
export const resolveJoustStaticSegments = (arena: JoustArena): JoustSegment[] => {
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

/** The four edges of one perch's slab, or none for the sand. */
export const resolvePerchSlabSegments = (perch: JoustPerch): JoustSegment[] => {
  const slab = resolvePerchSlab(perch);

  return slab === null ? [] : obstacleSegments(slab);
};

/** Everything a shot can hit in a lane as it stands: the static geometry plus every standing slab. */
export const resolveJoustSegments = (arena: JoustArena): JoustSegment[] => {
  const collapsed = new Set(arena.collapsedPerchIndices ?? []);

  return [
    ...resolveJoustStaticSegments(arena),
    ...arena.perches.flatMap((perch, perchIndex) =>
      collapsed.has(perchIndex) ? [] : resolvePerchSlabSegments(perch)
    )
  ];
};
