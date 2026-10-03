import type { MountState } from "@wingnight/shared";

/**
 * What a replay of a climb can announce between one drawn state and the next (BRAWL's
 * `mirrorEvents`): the loops are the only things that read states, and they report what changed;
 * whoever is listening (the TV's soundboard, a solo tablet's) decides what it sounds like.
 *
 * - `grab`: a let-go limb stuck to something.
 * - `slip`: a grabbed limb was touched loose.
 * - `thud`: the hen hit the floor and was set upright at the start.
 */
export type MountMirrorEvent = { kind: "grab" } | { kind: "slip" } | { kind: "thud" };

export type MountMirrorEventHandler = (event: MountMirrorEvent) => void;

/** The two endings, announced as their beat starts: the line moving, the clock at nought. */
export type MountBeatEvent = { kind: "mount" } | { kind: "time" };

export type MountDisplayEvent = MountMirrorEvent | MountBeatEvent;

export type MountDisplayEventHandler = (event: MountDisplayEvent) => void;

const grew = (previous: readonly unknown[], next: readonly unknown[]): number => {
  return Math.max(0, next.length - previous.length);
};

/**
 * Everything that happened between two states of one climb, in the order a room would hear it. A
 * mirror that rebuilt from the top hands a `next` earlier than `previous`, and that announces
 * nothing rather than a burst.
 */
export const resolveMirrorEvents = (previous: MountState, next: MountState): MountMirrorEvent[] => {
  const events: MountMirrorEvent[] = [];

  if (next.tick < previous.tick) {
    return events;
  }

  for (let index = 0; index < grew(previous.letGoes, next.letGoes); index += 1) {
    events.push({ kind: "slip" });
  }

  for (let index = 0; index < grew(previous.grabs, next.grabs); index += 1) {
    events.push({ kind: "grab" });
  }

  for (let index = 0; index < grew(previous.falls, next.falls); index += 1) {
    events.push({ kind: "thud" });
  }

  return events;
};
