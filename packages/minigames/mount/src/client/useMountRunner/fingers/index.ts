import type { MountInputSample, MountLimb, MountState, MountVec } from "@wingnight/shared";

import { isMoveDue } from "../../limbTouch/index.js";

type Finger = {
  limb: MountLimb;
  /** Where the finger is, on the input grid. */
  point: MountVec;
  /** A move the throttle held back, logged as soon as the limb may move again. */
  pending: MountVec | null;
  lastMoveTick: number | null;
};

/**
 * The fingers on the glass during one climb, each owning one limb, and the one place samples are
 * written to the log (spec §0.4): `grab-start` when a finger lands, at most one `move` per limb
 * every `moveSampleTicks` while it moves (a move the throttle holds back waits for its tick and is
 * never lost), and `release` when it lifts. Everything is logged at the state's own tick, the next
 * one the sim will step, so the log is non-decreasing by construction.
 */
export type RunFingers = {
  ownedLimbs: () => Set<MountLimb>;
  count: () => number;
  grab: (pointerId: number, limb: MountLimb, point: MountVec, state: MountState, log: MountInputSample[]) => void;
  move: (pointerId: number, point: MountVec, state: MountState, log: MountInputSample[]) => void;
  release: (pointerId: number, state: MountState, log: MountInputSample[]) => void;
  /** Forgets a finger without logging anything: the climb is over or the limb was taken from it. */
  drop: (pointerId: number) => void;
  /** Every finger loses its limb: a fall, or the end of the climb. */
  clear: () => void;
  /** Logs every held-back move whose limb may move again at the state's tick. */
  logDueMoves: (state: MountState, log: MountInputSample[]) => void;
};

const isRecovering = (state: MountState): boolean => state.tick < state.recoveringUntilTick;

export const createRunFingers = (): RunFingers => {
  const fingers = new Map<number, Finger>();

  const logMove = (finger: Finger, point: MountVec, state: MountState, log: MountInputSample[]): void => {
    log.push({ tick: state.tick, limb: finger.limb, kind: "move", x: point.x, y: point.y });
    finger.lastMoveTick = state.tick;
    finger.pending = null;
  };

  return {
    ownedLimbs: () => new Set(Array.from(fingers.values(), (finger) => finger.limb)),
    count: () => fingers.size,
    grab: (pointerId, limb, point, state, log): void => {
      log.push({ tick: state.tick, limb, kind: "grab-start", x: point.x, y: point.y });
      fingers.set(pointerId, { limb, point, pending: null, lastMoveTick: null });
    },
    move: (pointerId, point, state, log): void => {
      const finger = fingers.get(pointerId);

      if (finger === undefined || (finger.point.x === point.x && finger.point.y === point.y)) {
        return;
      }

      finger.point = point;

      if (!isRecovering(state) && isMoveDue(finger.lastMoveTick, state.tick)) {
        logMove(finger, point, state, log);
      } else {
        finger.pending = point;
      }
    },
    release: (pointerId, state, log): void => {
      const finger = fingers.get(pointerId);

      if (finger === undefined) {
        return;
      }

      fingers.delete(pointerId);

      if (isRecovering(state)) {
        return;
      }

      if (finger.pending !== null && isMoveDue(finger.lastMoveTick, state.tick)) {
        logMove(finger, finger.pending, state, log);
      }

      log.push({ tick: state.tick, limb: finger.limb, kind: "release", x: finger.point.x, y: finger.point.y });
    },
    drop: (pointerId): void => {
      fingers.delete(pointerId);
    },
    clear: (): void => {
      fingers.clear();
    },
    logDueMoves: (state, log): void => {
      if (isRecovering(state)) {
        return;
      }

      for (const finger of fingers.values()) {
        if (finger.pending !== null && isMoveDue(finger.lastMoveTick, state.tick)) {
          logMove(finger, finger.pending, state, log);
        }
      }
    }
  };
};
