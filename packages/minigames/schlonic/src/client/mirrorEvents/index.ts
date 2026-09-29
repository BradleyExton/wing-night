import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD, resolveSchlonicFinaleX } from "@wingnight/shared";

import { AIR_CLEARANCE, resolveRunnerClearance } from "../runnerClearance/index.js";

/**
 * What a replay of a run can announce between one drawn frame and the next — and, once a run
 * has gone wrong, what its punchline announces as the beat plays it (`thud`, `chitter`,
 * `chomp`, `burp`: `SchlonicScene/punchlineTimeline`). The loops are the only things that read
 * frames, and they should stay that way; instead of exposing frames they report what changed,
 * and whoever is listening (the soundboard, the shake) decides what that means.
 */
export type SchlonicMirrorEvent =
  | { kind: "wing"; wingsInHand: number }
  | { kind: "ollie" }
  | { kind: "land" }
  | { kind: "grindStart" }
  | { kind: "grind" }
  | { kind: "grindStop" }
  | { kind: "spring" }
  | { kind: "slam" }
  | { kind: "hit" }
  | { kind: "finale" }
  | { kind: "cleared" }
  | { kind: "fell" }
  | { kind: "wiped" }
  | { kind: "thud" }
  | { kind: "chitter" }
  | { kind: "chomp" }
  | { kind: "burp" };

export type SchlonicMirrorEventHandler = (event: SchlonicMirrorEvent) => void;

/** A grind scrapes once every this many units of rail: about every sixth of a second at speed. */
export const GRIND_SCRAPE_UNITS = 8;

/**
 * The most air the runner has had since its feet were last down, carried by the caller from one
 * drawn frame to the next: 0 on the ground, and the highest `resolveRunnerClearance` seen since.
 * A landing is only a landing after real air, and a single frame cannot say whether it had any.
 */
export const resolveAirPeak = (previousPeak: number, frame: SchlonicFrame, zone: SchlonicZone): number => {
  return frame.grounded ? 0 : Math.max(previousPeak, resolveRunnerClearance(zone, frame));
};

/** The board's own noises between two frames (see `resolveMirrorEvents`). */
const resolveBoardEvents = (
  previous: SchlonicFrame,
  next: SchlonicFrame,
  isThrown: boolean,
  airPeak: number
): SchlonicMirrorEvent[] => {
  const events: SchlonicMirrorEvent[] = [];
  const wasGrinding = previous.grindingRail !== null;
  const isGrinding = next.grindingRail !== null;

  // The jump's own launch speed, and nothing else at it: off the floor, off a rail, or off the
  // coyote window's edge after rolling off a ledge.
  if (next.vy === SCHLONIC_WORLD.jumpVelocity && previous.vy !== SCHLONIC_WORLD.jumpVelocity && !isThrown) {
    events.push({ kind: "ollie" });
  }

  if (!previous.slamming && next.slamming) {
    events.push({ kind: "slam" });
  }

  if (!wasGrinding && isGrinding) {
    events.push({ kind: "grindStart" });
  } else if (
    wasGrinding &&
    isGrinding &&
    Math.floor(previous.x / GRIND_SCRAPE_UNITS) !== Math.floor(next.x / GRIND_SCRAPE_UNITS)
  ) {
    events.push({ kind: "grind" });
  }

  if (wasGrinding && !isGrinding) {
    events.push({ kind: "grindStop" });
  }

  if (!previous.grounded && next.grounded && !isGrinding && airPeak > AIR_CLEARANCE) {
    events.push({ kind: "land" });
  }

  return events;
};

/**
 * Pure: what happened between the frame last drawn and the one being drawn now, in the order
 * the room experiences it. Every counter here only grows within a run, so a plain difference is
 * enough and stays correct when a replay re-simulates from the top. `outcome` is set once on
 * the terminal frame and never cleared, so guarding on the previous frame's null keeps an
 * ending from being announced twice.
 *
 * Several wings in one step are one chime, at the handful the step ended on — a replay can
 * jump a few ticks after a late log and a burst would sound like a machine gun. A kicker
 * leaves no mark on the frame but its velocity: nothing else throws the bird up that hard, and
 * the cue it sounds is still called `spring`, which is the name the pack's recorded takes are
 * filed under.
 *
 * The board has its own voice. An ollie is the feet leaving the ground on the way up with
 * nothing else to explain it — not a hit's knock-back or a kicker's launch, and not a walk off
 * a ledge, which leaves at no speed. A landing is the feet coming down on the
 * street after real air — `airPeak` (`resolveAirPeak`, up to and including `previous`) past
 * `AIR_CLEARANCE` — because the sim lets a board rolling down a hill skip off the paving and
 * touch down again every few ticks, and a clack for each would rattle the TV down every slope.
 * Coming down on a rail is the start of a grind instead, which scrapes every few units along it
 * and rings off the end. A bailing hen has no board under it, so it makes none of them.
 */
export const resolveMirrorEvents = (
  previous: SchlonicFrame,
  next: SchlonicFrame,
  zone: SchlonicZone,
  airPeak: number
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

  if (tookWing && next.wings > previous.wings) {
    events.push({ kind: "wing", wingsInHand: next.wings });
  }

  const isSprung = next.vy === SCHLONIC_WORLD.kickerVelocity && previous.vy !== SCHLONIC_WORLD.kickerVelocity;

  if (isSprung) {
    events.push({ kind: "spring" });
  }

  const isHit = next.hits.length > previous.hits.length;
  const isOnBoard = next.tick >= next.invulnerableUntilTick;

  if (isOnBoard) {
    events.push(...resolveBoardEvents(previous, next, isHit || isSprung, airPeak));
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
