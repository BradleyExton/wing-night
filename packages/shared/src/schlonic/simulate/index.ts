import type {
  SchlonicFrame,
  SchlonicInput,
  SchlonicProp,
  SchlonicRun,
  SchlonicZone,
  SchlonicZoneCourse
} from "../types.js";
import {
  SCHLONIC_WORLD,
  isSchlonicInPit,
  resolveSchlonicGroundSlope,
  resolveSchlonicGroundY,
  resolveSchlonicTickCap,
  resolveSchlonicZone
} from "../world/index.js";

/** How far either side of the runner a prop has to be before it can be touched at all. */
const CONTACT_WINDOW = 24;

/** The frame a run starts from: the runner standing on the line with nothing in hand. */
export const createSchlonicRunStart = (zone: SchlonicZone): SchlonicFrame => {
  const x = SCHLONIC_WORLD.runnerX;

  return {
    tick: 0,
    x,
    y: resolveSchlonicGroundY(zone, x) - SCHLONIC_WORLD.runnerRadius,
    vx: 0,
    vy: 0,
    grounded: true,
    holding: false,
    wings: 0,
    takenProps: [],
    hits: [],
    invulnerableUntilTick: 0,
    outcome: null
  };
};

/** The frame a run settles on when nobody ran it: standing on the line, already over. */
export const createSchlonicRunSkip = (zone: SchlonicZone): SchlonicFrame => {
  return { ...createSchlonicRunStart(zone), outcome: "wiped" };
};

type Contact = {
  wings: number;
  taken: number[];
  vy: number | null;
  isHit: boolean;
};

const isTouching = (frame: SchlonicFrame, prop: SchlonicProp, halfWidth: number, height: number): boolean => {
  const { runnerRadius } = SCHLONIC_WORLD;

  if (frame.x + runnerRadius < prop.x - halfWidth || frame.x - runnerRadius > prop.x + halfWidth) {
    return false;
  }

  return frame.y + runnerRadius > prop.y - height && frame.y - runnerRadius < prop.y;
};

/**
 * Everything the runner touched at its new position. Wings are taken, a badnik is popped by
 * anything airborne (the bird is a ball the moment its feet leave the ground, which is the whole
 * point of jumping on one) and pays for it, a springboard throws it at the high line, and a thorn
 * bed hurts however you arrive.
 */
const resolveContacts = (frame: SchlonicFrame, zone: SchlonicZone): Contact => {
  const { runnerRadius, wingRadius, spikeWidth, spikeHeight, badnikWidth, badnikHeight, springWidth, springHeight } =
    SCHLONIC_WORLD;
  const contact: Contact = { wings: frame.wings, taken: [], vy: null, isHit: false };
  const isInvulnerable = frame.tick < frame.invulnerableUntilTick;

  for (const prop of zone.props) {
    if (prop.x < frame.x - CONTACT_WINDOW || prop.x > frame.x + CONTACT_WINDOW) {
      continue;
    }

    if (frame.takenProps.includes(prop.index) || contact.taken.includes(prop.index)) {
      continue;
    }

    if (prop.kind === "wing") {
      const reach = runnerRadius + wingRadius;

      if (
        frame.x + reach > prop.x &&
        frame.x - reach < prop.x &&
        frame.y + reach > prop.y &&
        frame.y - reach < prop.y
      ) {
        contact.wings += 1;
        contact.taken.push(prop.index);
      }

      continue;
    }

    if (prop.kind === "spring") {
      if (frame.vy >= 0 && isTouching(frame, prop, springWidth / 2, springHeight)) {
        contact.vy = SCHLONIC_WORLD.springVelocity;
      }

      continue;
    }

    if (prop.kind === "badnik") {
      if (!isTouching(frame, prop, badnikWidth / 2, badnikHeight)) {
        continue;
      }

      if (!frame.grounded) {
        // A bird in a ball: it lands on the thing rather than walking into it.
        contact.wings += SCHLONIC_WORLD.badnikWings;
        contact.taken.push(prop.index);
        contact.vy = SCHLONIC_WORLD.badnikBounceVelocity;
        continue;
      }

      contact.isHit = contact.isHit || !isInvulnerable;
      continue;
    }

    if (isTouching(frame, prop, spikeWidth / 2, spikeHeight)) {
      contact.isHit = contact.isHit || !isInvulnerable;
    }
  }

  return contact;
};

/**
 * The whole physics, one tick. A terminal frame steps to itself, so callers can advance past the
 * outcome without guarding. Speed comes off the ground — a downhill is worth more than the legs
 * are — a press off the floor jumps and holding it climbs higher, a pit is the end of the run,
 * and a hit costs half the handful. Nothing but a hit taken with nothing in hand ends a run
 * short of the post: the wings are the health bar, which is why greed is the game.
 */
export const stepSchlonic = (
  frame: SchlonicFrame,
  zone: SchlonicZone,
  input: { pressed: boolean; holding: boolean }
): SchlonicFrame => {
  if (frame.outcome !== null) {
    return frame;
  }

  const {
    runnerRadius,
    gravity,
    holdGravityShare,
    jumpVelocity,
    maxFallVelocity,
    topSpeed,
    acceleration,
    drag,
    slopeAcceleration,
    minSpeed,
    pitDeathY,
    invulnerableTicks,
    hitSpeedShare,
    hitBounceVelocity
  } = SCHLONIC_WORLD;
  const tick = frame.tick + 1;
  const isJumping = input.pressed && frame.grounded;

  let vx = frame.vx + (frame.grounded ? resolveSchlonicGroundSlope(zone, frame.x) * slopeAcceleration : 0);

  vx = vx < topSpeed ? Math.min(topSpeed, vx + acceleration) : Math.max(topSpeed, vx - drag);
  vx = Math.max(minSpeed, vx);

  let vy: number;

  if (isJumping) {
    vy = jumpVelocity;
  } else {
    const pull = input.holding && frame.vy < 0 ? gravity * holdGravityShare : gravity;

    vy = Math.min(frame.vy + pull, maxFallVelocity);
  }

  const x = frame.x + vx;
  let y = frame.y + vy;
  let grounded = false;
  const groundY = resolveSchlonicGroundY(zone, x);
  const standY = groundY - runnerRadius;

  if (!isJumping && y >= standY) {
    y = standY;
    vy = 0;
    grounded = true;
  }

  if (y - runnerRadius < 0) {
    y = runnerRadius;
    vy = 0;
  }

  const moved: SchlonicFrame = {
    ...frame,
    tick,
    x,
    y,
    vx,
    vy,
    grounded,
    holding: input.holding
  };

  if (y > pitDeathY || isSchlonicInPit(zone, x, y)) {
    return { ...moved, wings: 0, outcome: "fell" };
  }

  const contact = resolveContacts(moved, zone);
  const settled: SchlonicFrame = {
    ...moved,
    vy: contact.vy ?? moved.vy,
    grounded: contact.vy === null ? moved.grounded : false,
    wings: contact.wings,
    takenProps: contact.taken.length === 0 ? moved.takenProps : [...moved.takenProps, ...contact.taken]
  };

  if (contact.isHit) {
    if (settled.wings <= 0) {
      return { ...settled, wings: 0, hits: [...settled.hits, tick], outcome: "wiped" };
    }

    return {
      ...settled,
      wings: Math.floor(settled.wings / 2),
      vx: Math.max(minSpeed, settled.vx * hitSpeedShare),
      vy: hitBounceVelocity,
      grounded: false,
      hits: [...settled.hits, tick],
      invulnerableUntilTick: tick + invulnerableTicks
    };
  }

  if (settled.x >= zone.goalX) {
    return { ...settled, outcome: "cleared" };
  }

  return settled;
};

/**
 * Steps `frame` up to `toTick`, replaying the button from `inputs` as it goes. A press logged at
 * tick T applies to the step that produces T + 1 — the same rule the tablet used when it logged
 * the tap at its current tick. Events before the frame are already baked in and only set which
 * way the button was left.
 */
export const advanceSchlonic = (
  frame: SchlonicFrame,
  zone: SchlonicZone,
  inputs: readonly SchlonicInput[],
  toTick: number
): SchlonicFrame => {
  let current = frame;
  let cursor = 0;
  let holding = frame.holding;

  while (cursor < inputs.length && (inputs[cursor]?.tick ?? 0) < current.tick) {
    holding = inputs[cursor]?.down ?? holding;
    cursor += 1;
  }

  while (current.tick < toTick && current.outcome === null) {
    let pressed = false;

    while (cursor < inputs.length && inputs[cursor]?.tick === current.tick) {
      const down = inputs[cursor]?.down ?? false;

      pressed = pressed || down;
      holding = down;
      cursor += 1;
    }

    current = stepSchlonic(current, zone, { pressed, holding });
  }

  return { ...current, holding };
};

/**
 * Runs one run's log to its outcome. This is the referee: the server scores from nothing else.
 */
export const runSchlonicRun = (
  course: SchlonicZoneCourse,
  inputs: readonly SchlonicInput[]
): SchlonicRun => {
  const zone = resolveSchlonicZone(course);
  const frame = advanceSchlonic(
    createSchlonicRunStart(zone),
    zone,
    inputs,
    resolveSchlonicTickCap(zone)
  );

  return {
    outcome: frame.outcome ?? "running",
    endTick: frame.tick,
    // A run that ended badly comes home with nothing: the wings were the health bar.
    wings: frame.outcome === "cleared" ? frame.wings : 0,
    distance: Math.max(0, Math.min(zone.goalX, frame.x) - SCHLONIC_WORLD.runnerX),
    frame
  };
};
