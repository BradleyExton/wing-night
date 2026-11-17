import type { BrawlCrewFrame, BrawlCrewInput, BrawlCrewWalk } from "@wingnight/shared";

// PROTOTYPE — throwaway. The people's thumbs: two sets of keys and one touch pad, turned into the
// crew sim's own inputs — a walk when the stick moves, a peck when the thumb goes down or up.

export type BackRoomThumb = {
  dir: BrawlCrewWalk;
  held: boolean;
  /** A press since the last tick, so a tap shorter than a tick still pecks. */
  pressed: boolean;
};

export type BackRoomStick = { cx: number; cy: number; x: number; y: number };

export const createBackRoomThumbs = (): BackRoomThumb[] => [
  { dir: 0, held: false, pressed: false },
  { dir: 0, held: false, pressed: false }
];

const DIRS: Record<string, BrawlCrewWalk> = {
  "0,0": 0,
  "1,0": 1,
  "1,1": 2,
  "0,1": 3,
  "-1,1": 4,
  "-1,0": 5,
  "-1,-1": 6,
  "0,-1": 7,
  "1,-1": 8
};

/** What the sim has not heard yet: each person's stick and beak, where they differ from her hen's. */
export const resolveBackRoomThumbInputs = (
  frame: BrawlCrewFrame,
  thumbs: BackRoomThumb[],
  humans: number
): BrawlCrewInput[] => {
  const inputs: BrawlCrewInput[] = [];

  for (let slot = 0; slot < humans; slot += 1) {
    const thumb = thumbs[slot];
    const hen = frame.hens[slot];

    if (thumb === undefined || hen === undefined) {
      continue;
    }

    const held = thumb.held || thumb.pressed;

    thumb.pressed = false;

    if (thumb.dir !== hen.walk) {
      inputs.push({ tick: frame.tick, hen: slot, kind: "walk", dir: thumb.dir });
    }

    if (held !== hen.peckHeld) {
      inputs.push({ tick: frame.tick, hen: slot, kind: "peck", held });
    }
  }

  return inputs;
};

const KEYS: readonly { walk: Record<string, { x: number; z: number }>; peck: string }[] = [
  { walk: { w: { x: 0, z: -1 }, s: { x: 0, z: 1 }, a: { x: -1, z: 0 }, d: { x: 1, z: 0 } }, peck: " " },
  {
    walk: {
      arrowup: { x: 0, z: -1 },
      arrowdown: { x: 0, z: 1 },
      arrowleft: { x: -1, z: 0 },
      arrowright: { x: 1, z: 0 }
    },
    peck: "enter"
  }
];

/**
 * The keys. With one person both sets drive her; with two, W A S D and Space are player one and
 * the arrows and Enter are player two. Returns the unwiring.
 */
export const wireBackRoomKeys = (thumbs: BackRoomThumb[], humans: () => number, onAnyInput: () => void): (() => void) => {
  const down = new Set<string>();

  const resolveSlot = (set: number): number => (humans() >= 2 ? set : 0);

  const sync = (): void => {
    const steps = [
      { x: 0, z: 0 },
      { x: 0, z: 0 }
    ];
    const held = [false, false];

    KEYS.forEach((keys, set) => {
      const slot = resolveSlot(set);
      const step = steps[slot];

      for (const key of down) {
        const walk = keys.walk[key];

        if (walk !== undefined && step !== undefined) {
          step.x += walk.x;
          step.z += walk.z;
        }
      }

      held[slot] = (held[slot] ?? false) || down.has(keys.peck);
    });

    thumbs.forEach((thumb, slot) => {
      const step = steps[slot] ?? { x: 0, z: 0 };

      thumb.dir = DIRS[`${Math.sign(step.x)},${Math.sign(step.z)}`] ?? 0;
      thumb.held = held[slot] ?? false;
    });
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    const set = KEYS.findIndex((keys) => keys.peck === key || keys.walk[key] !== undefined);

    if (set === -1 || event.repeat) {
      if (set !== -1) {
        event.preventDefault();
      }

      return;
    }

    // Space would click a focused button, and the arrows would scroll the page.
    event.preventDefault();

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    down.add(key);
    sync();

    const thumb = thumbs[resolveSlot(set)];

    if (thumb !== undefined && KEYS[set]?.peck === key) {
      thumb.pressed = true;
    }

    onAnyInput();
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (down.delete(event.key.toLowerCase())) {
      sync();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return (): void => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
};

// The real pad's stick, copied from packages/minigames/brawl/src/client/CrewPad/resolveStick so the
// thing being felt here — how easy it is to stand still — is the game's own dead zone and ring.
const STICK_DEAD_PX = 12;
const STICK_RADIUS_PX = 56;
const AXIS_RATIO = 2.414;

const resolveStickDir = (dx: number, dy: number): BrawlCrewWalk => {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);

  if (ax * ax + ay * ay < STICK_DEAD_PX * STICK_DEAD_PX) {
    return 0;
  }

  if (ax > ay * AXIS_RATIO) {
    return dx > 0 ? 1 : 5;
  }

  if (ay > ax * AXIS_RATIO) {
    return dy > 0 ? 3 : 7;
  }

  if (dx > 0) {
    return dy > 0 ? 2 : 8;
  }

  return dy > 0 ? 4 : 6;
};

/**
 * The street as player one's pad: a pointer on its left half is a floating eight-way stick, one on
 * its right half is the peck. `onStick` hears where the ring is, for the painter. Returns the
 * unwiring.
 */
export const wireBackRoomTouch = (
  element: HTMLElement,
  thumb: BackRoomThumb,
  onStick: (stick: BackRoomStick | null) => void,
  onAnyInput: () => void
): (() => void) => {
  let stickPointer: number | null = null;
  let centre = { x: 0, y: 0 };
  const peckPointers = new Set<number>();

  const local = (event: PointerEvent): { x: number; y: number; width: number } => {
    const box = element.getBoundingClientRect();

    return { x: event.clientX - box.left, y: event.clientY - box.top, width: box.width };
  };

  const onDown = (event: PointerEvent): void => {
    const point = local(event);

    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    onAnyInput();

    if (point.x >= point.width / 2) {
      peckPointers.add(event.pointerId);
      thumb.held = true;
      thumb.pressed = true;

      return;
    }

    if (stickPointer === null) {
      stickPointer = event.pointerId;
      centre = { x: point.x, y: point.y };
      thumb.dir = 0;
      onStick({ cx: centre.x, cy: centre.y, x: point.x, y: point.y });
    }
  };

  const onMove = (event: PointerEvent): void => {
    if (event.pointerId !== stickPointer) {
      return;
    }

    const point = local(event);
    const dx = point.x - centre.x;
    const dy = point.y - centre.y;
    const distance = Math.hypot(dx, dy);

    // A thumb that outruns the ring drags the centre along a radius behind it.
    if (distance > STICK_RADIUS_PX) {
      const overshoot = (distance - STICK_RADIUS_PX) / distance;

      centre = { x: centre.x + dx * overshoot, y: centre.y + dy * overshoot };
    }

    thumb.dir = resolveStickDir(point.x - centre.x, point.y - centre.y);
    onStick({ cx: centre.x, cy: centre.y, x: point.x, y: point.y });
  };

  const onUp = (event: PointerEvent): void => {
    if (event.pointerId === stickPointer) {
      stickPointer = null;
      thumb.dir = 0;
      onStick(null);
    }

    if (peckPointers.delete(event.pointerId) && peckPointers.size === 0) {
      thumb.held = false;
    }
  };

  element.addEventListener("pointerdown", onDown);
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerup", onUp);
  element.addEventListener("pointercancel", onUp);

  return (): void => {
    element.removeEventListener("pointerdown", onDown);
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerup", onUp);
    element.removeEventListener("pointercancel", onUp);
  };
};

export const BACK_ROOM_STICK_RADIUS_PX = STICK_RADIUS_PX;
