import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicFinaleX } from "@wingnight/shared";

/**
 * What a replay of a run can announce between one drawn frame and the next. The loops are the
 * only things that read frames, and they should stay that way; instead of exposing frames they
 * report what changed, and whoever is listening (the soundboard, the shake) decides what that
 * means.
 */
export type SchlonicMirrorEvent =
  | { kind: "wing"; wingsInHand: number }
  | { kind: "spring" }
  | { kind: "pop" }
  | { kind: "hit" }
  | { kind: "finale" }
  | { kind: "cleared" }
  | { kind: "fell" }
  | { kind: "wiped" };

export type SchlonicMirrorEventHandler = (event: SchlonicMirrorEvent) => void;

/**
 * Pure: what happened between the frame last drawn and the one being drawn now, in the order
 * the room experiences it. Every counter here only grows within a run, so a plain difference is
 * enough and stays correct when a replay re-simulates from the top. `outcome` is set once on
 * the terminal frame and never cleared, so guarding on the previous frame's null keeps an
 * ending from being announced twice.
 *
 * Several wings in one step are one chime, at the handful the step ended on — a replay can
 * jump a few ticks after a late log and a burst would sound like a machine gun. A badnik popped
 * is a prop taken that is not a wing. A springboard leaves no mark on the frame but its
 * velocity: nothing else throws the bird up that hard.
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

  if (next.hits.length > previous.hits.length) {
    events.push({ kind: "hit" });
  }

  const taken = next.takenProps.slice(previous.takenProps.length);
  const tookWing = taken.some((index) => zone.props[index]?.kind === "wing");
  const tookBadnik = taken.some((index) => zone.props[index]?.kind === "badnik");

  if (tookBadnik) {
    events.push({ kind: "pop" });
  }

  if (tookWing && next.wings > previous.wings) {
    events.push({ kind: "wing", wingsInHand: next.wings });
  }

  if (next.vy === SCHLONIC_WORLD.springVelocity && previous.vy !== SCHLONIC_WORLD.springVelocity) {
    events.push({ kind: "spring" });
  }

  // The last stretch begins: the post is two chunks off.
  const finaleX = resolveSchlonicFinaleX(zone);

  if (previous.x < finaleX && next.x >= finaleX) {
    events.push({ kind: "finale" });
  }

  if (previous.outcome === null && next.outcome !== null) {
    events.push({ kind: next.outcome });
  }

  return events;
};
