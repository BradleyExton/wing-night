import type { FappyFrame } from "@wingnight/shared";

/**
 * What the TV's replay of an attempt can announce between one drawn frame and the next.
 *
 * The mirror is the only thing in the package that reads frames, and it should stay that way:
 * a second reader would need its own clock, its own copy of the flap log and its own answer to
 * a log that arrives late. So instead of exposing frames, the mirror reports what changed in
 * them, and whoever is listening (today: the soundboard) decides what that means.
 */
export type FappyMirrorEvent =
  | "flap"
  | "gateCleared"
  | "eagleBumped"
  | "splat"
  | "crashed"
  | "landed";

export type FappyMirrorEventHandler = (event: FappyMirrorEvent) => void;

/**
 * Pure: what happened between the frame the mirror last drew and the one it is drawing now, in
 * the order the room experiences it.
 *
 * Flaps come from the log rather than the frame, because a frame carries no record of one: the
 * sim consumes the flap logged AT tick T while stepping from T to T+1, so the flaps a step
 * spent are the ones in `[previous.tick, next.tick)`. Several in one step is still one fwip —
 * the mirror can jump a few ticks after a late log and a burst would sound like a machine gun.
 *
 * Everything else is a counter that only grows within an attempt, so a plain difference is
 * enough, and it stays correct when the mirror re-simulates a run from the top. `outcome` is
 * set once on the terminal frame and never cleared, so guarding on the previous frame's null
 * keeps a crash or a landing from being announced twice.
 */
export const resolveMirrorEvents = (
  previous: FappyFrame,
  next: FappyFrame,
  flapTicks: readonly number[]
): FappyMirrorEvent[] => {
  const events: FappyMirrorEvent[] = [];

  if (
    next.tick > previous.tick &&
    flapTicks.some((tick) => tick >= previous.tick && tick < next.tick)
  ) {
    events.push("flap");
  }

  for (let cleared = previous.gatesCleared; cleared < next.gatesCleared; cleared += 1) {
    events.push("gateCleared");
  }

  if (next.knockedEagles.length > previous.knockedEagles.length) {
    events.push("eagleBumped");
  }

  if (next.splats.length > previous.splats.length) {
    events.push("splat");
  }

  if (previous.outcome === null && next.outcome === "crashed") {
    events.push("crashed");
  }

  if (previous.outcome === null && next.outcome === "cleared") {
    events.push("landed");
  }

  return events;
};
