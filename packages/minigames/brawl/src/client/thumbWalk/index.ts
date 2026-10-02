import type { BrawlWalkDir } from "../useBrawlRunner/index.js";

/**
 * How far, in CSS pixels, the walk thumb has to pull back against the way the hen is walking
 * before she turns. Small enough that a turn is a flick, big enough that a thumb rolling on the
 * glass does not turn her (docs/research/tablet-brawler-controls.md, scheme B).
 */
export const TURN_PX = 30;

/**
 * The walk thumb (scheme B): one pointer owns the pad. Where it lands is the centre, and the hen
 * walks the way she faces. While it is held, the centre trails the thumb in the walking
 * direction, so a pull back of `TURN_PX` from wherever the thumb has got to turns her, and the
 * turn re-centres on the spot, so a second pull back turns her again. Lifting stops her.
 */
export type ThumbWalkState = {
  /** The pointer that owns the pad, or null when no thumb is down. */
  pointerId: number | null;
  /** The thumb's centre, in client x: where it landed or last turned, trailed forward since. */
  centreX: number;
  dir: BrawlWalkDir;
};

export type ThumbWalkEvent =
  | { kind: "down"; pointerId: number; x: number; facing: -1 | 1 }
  | { kind: "move"; pointerId: number; x: number }
  | { kind: "up"; pointerId: number };

export const THUMB_WALK_IDLE: ThumbWalkState = { pointerId: null, centreX: 0, dir: 0 };

const resolveMove = (state: ThumbWalkState, x: number): ThumbWalkState => {
  if (state.dir === 0) {
    return state;
  }

  const offset = (x - state.centreX) * state.dir;

  // Pulled back past the dead band: turn, and the turn is the new centre.
  if (offset < -TURN_PX) {
    return { ...state, centreX: x, dir: state.dir === 1 ? -1 : 1 };
  }

  // Pushed on the way she is going: the centre trails the thumb, so "back" is always measured
  // from where the thumb has got to rather than where it first landed.
  if (offset > 0) {
    return { ...state, centreX: x };
  }

  // Inside the dead band: she keeps walking the way she was. It never stops her.
  return state;
};

/**
 * The next state of the walk thumb. A second pointer on an owned pad, and a move or lift from a
 * pointer that does not own it, change nothing — the same object comes back, so a caller can
 * tell "nothing happened" by identity.
 */
export const resolveThumbWalk = (state: ThumbWalkState, event: ThumbWalkEvent): ThumbWalkState => {
  if (event.kind === "down") {
    return state.pointerId === null ? { pointerId: event.pointerId, centreX: event.x, dir: event.facing } : state;
  }

  if (state.pointerId !== event.pointerId) {
    return state;
  }

  return event.kind === "up" ? THUMB_WALK_IDLE : resolveMove(state, event.x);
};
