import type { BrawlBlock, BrawlFrame, BrawlGoonKind } from "@wingnight/shared";

/**
 * What a replay of a block can announce between one drawn frame and the next. The loops are the
 * only things that read frames, and they should stay that way; instead of exposing frames they
 * report what changed, and whoever is listening (the TV's soundboard, a solo tablet's) decides
 * what that means (SCHLONIC's `mirrorEvents`).
 *
 * - `peck`: the right thumb opened a peck (the press, not the connection).
 * - `land`: a peck connected with a goon.
 * - `honk`: a goon started its telegraph — the honk, the crouch, the hover before the hit.
 * - `boss`: the boss goose stepped onto the street. Once a block: there is only ever one.
 * - `hurt`: a goon's attack cost the hen a heart.
 * - `ko`: a goon went down.
 * - `go`: a wave went down and the camera let go — the GO ▶ arrow.
 */
export type BrawlMirrorEvent =
  | { kind: "peck" }
  | { kind: "land" }
  | { kind: "honk"; goonKind: BrawlGoonKind }
  | { kind: "boss" }
  | { kind: "hurt" }
  | { kind: "ko"; goonKind: BrawlGoonKind }
  | { kind: "go" };

export type BrawlMirrorEventHandler = (event: BrawlMirrorEvent) => void;

/** How many entries a tick list gained between two frames; nought when it went backwards (a rebuild). */
const grew = (previous: readonly number[], next: readonly number[]): number => {
  return Math.max(0, next.length - previous.length);
};

/**
 * Everything that happened between two frames of the same block, in the order a room would hear
 * it. `previous` is the last frame the caller drew, `next` the one it is about to; a mirror that
 * rebuilt from the top hands a `next` earlier than `previous`, and the lists going backwards then
 * announce nothing rather than a burst.
 */
export const resolveMirrorEvents = (
  previous: BrawlFrame,
  next: BrawlFrame,
  block: BrawlBlock
): BrawlMirrorEvent[] => {
  const events: BrawlMirrorEvent[] = [];

  if (next.tick < previous.tick) {
    return events;
  }

  if (previous.cameraLocked && !next.cameraLocked && next.waveIndex <= block.waves.length) {
    events.push({ kind: "go" });
  }

  const before = new Map(previous.goons.map((goon) => [goon.spawnIndex, goon]));
  const downed: BrawlGoonKind[] = [];

  for (const goon of next.goons) {
    const was = before.get(goon.spawnIndex);

    if (goon.kind === "boss" && was === undefined) {
      events.push({ kind: "boss" });
    }

    if (goon.state === "telegraph" && was?.state !== "telegraph") {
      events.push({ kind: "honk", goonKind: goon.kind });
    }

    if (goon.state === "ko" && was !== undefined && was.state !== "ko") {
      downed.push(goon.kind);
    }
  }

  if (next.peckUntilTick > previous.peckUntilTick) {
    events.push({ kind: "peck" });
  }

  for (let index = 0; index < grew(previous.landed, next.landed); index += 1) {
    events.push({ kind: "land" });
  }

  for (let index = 0; index < grew(previous.kos, next.kos); index += 1) {
    events.push({ kind: "ko", goonKind: downed[index] ?? "goose" });
  }

  for (let index = 0; index < grew(previous.hits, next.hits); index += 1) {
    events.push({ kind: "hurt" });
  }

  return events;
};
