import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

/**
 * What the TV's mirror of a run can announce between one drawn frame and the next.
 *
 * The mirror is the only thing in the package that reads frames, and it should stay that way —
 * FAPPY's rule. Instead of exposing frames, the mirror reports what changed in them, and whoever
 * is listening (today: the soundboard) decides what that means.
 */
export type SchlonicMirrorEvent =
  | "jumped"
  | "sprung"
  | "landed"
  | "wingTaken"
  | "badnikPopped"
  | "hit"
  | "cleared"
  | "wiped"
  | "fell";

export type SchlonicMirrorEventHandler = (event: SchlonicMirrorEvent, wingsInHand: number) => void;

// A springboard throws the runner faster than its own legs can: anything upward past the
// midpoint of the two is the spring, whatever it was doing a tick before.
const SPRING_VELOCITY_THRESHOLD =
  (SCHLONIC_WORLD.jumpVelocity + SCHLONIC_WORLD.springVelocity) / 2;

/**
 * Pure: what happened between the frame the mirror last drew and the one it is drawing now, in
 * the order the room experiences it. Every counter here only grows within a run, so a plain
 * difference is enough, and it stays correct when the mirror re-simulates a run from the top.
 * `outcome` is set once on the terminal frame and never cleared, so guarding on the previous
 * frame's null keeps an ending from being announced twice.
 */
export const resolveMirrorEvents = (
  previous: SchlonicFrame,
  next: SchlonicFrame,
  zone: SchlonicZone
): SchlonicMirrorEvent[] => {
  const events: SchlonicMirrorEvent[] = [];

  if (next.tick <= previous.tick) {
    return events;
  }

  if (next.vy <= SPRING_VELOCITY_THRESHOLD && previous.vy > SPRING_VELOCITY_THRESHOLD) {
    events.push("sprung");
  } else if (previous.grounded && !next.grounded && next.vy < 0) {
    events.push("jumped");
  }

  if (!previous.grounded && next.grounded && next.outcome === null) {
    events.push("landed");
  }

  for (const index of next.takenProps) {
    if (previous.takenProps.includes(index)) {
      continue;
    }

    const kind = zone.props[index]?.kind;

    if (kind === "wing") {
      events.push("wingTaken");
    } else if (kind === "badnik") {
      events.push("badnikPopped");
    }
  }

  if (next.hits.length > previous.hits.length) {
    events.push("hit");
  }

  if (previous.outcome === null && next.outcome !== null) {
    events.push(next.outcome);
  }

  return events;
};
