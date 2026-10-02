import type { BrawlBlock, BrawlFrame, BrawlGoonKind, BrawlHazardKind } from "@wingnight/shared";

/**
 * What a replay of a block can announce between one drawn frame and the next. The loops are the
 * only things that read frames, and they should stay that way; instead of exposing frames they
 * report what changed, and whoever is listening (the TV's soundboard, a solo tablet's) decides
 * what that means (SCHLONIC's `mirrorEvents`).
 *
 * - `peck`: the right thumb opened a peck (the press, not the connection).
 * - `land`: a peck connected with a goon — and took something off it.
 * - `clank`: a peck bounced off a helmet goose's guard (`BrawlFrame.clanks`). Never a `land` too.
 * - `honk`: a goon started its telegraph — the honk, the crouch, the hover before the hit.
 * - `hiss`: a swan started its telegraph. A swan hisses; it never honks. Its `stalk` is silent.
 * - `boss`: the boss goose stepped onto the street. Once a block: there is only ever one.
 * - `hurt`: a goon's attack cost the hen a heart.
 * - `ko`: a goon went down.
 * - `dunk`: a goon went down into the block's hazard (`BrawlFrame.dunks`), the railing, the bay
 *   or the plinth. Never a `ko` too.
 * - `bump`: a shoved goon bowled another one over — a chained stun (`BrawlFrame.bumps`).
 * - `wing`: she ate a wing off the pavement and got a heart back (`BrawlFrame.wings`).
 * - `go`: a wave went down and the camera let go — the GO ▶ arrow.
 * - `clean`: that wave went down with no hit on her, and the bonus is banked (`BrawlFrame.bonuses`).
 */
export type BrawlMirrorEvent =
  | { kind: "peck" }
  | { kind: "land" }
  | { kind: "clank" }
  | { kind: "honk"; goonKind: BrawlGoonKind }
  | { kind: "hiss" }
  | { kind: "boss" }
  | { kind: "hurt" }
  | { kind: "ko"; goonKind: BrawlGoonKind }
  | { kind: "dunk"; hazard: BrawlHazardKind }
  | { kind: "bump" }
  | { kind: "wing" }
  | { kind: "go" }
  | { kind: "clean" };

export type BrawlMirrorEventHandler = (event: BrawlMirrorEvent) => void;

/** How many entries a list gained between two frames; nought when it went backwards (a rebuild). */
const grew = (previous: readonly unknown[], next: readonly unknown[]): number => {
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

  // The bonus is banked on the tick the wave goes down, so it rings right behind GO.
  for (let index = 0; index < grew(previous.bonuses, next.bonuses); index += 1) {
    events.push({ kind: "clean" });
  }

  const before = new Map(previous.goons.map((goon) => [goon.spawnIndex, goon]));
  // Every goon dunked since the last frame went down too, but into the hazard: it is told as a
  // dunk and not as a fall, so the fall is only told for the rest.
  const dunked = new Set(next.dunks.slice(previous.dunks.length).map((dunk) => dunk.spawnIndex));
  const downed: BrawlGoonKind[] = [];

  for (const goon of next.goons) {
    const was = before.get(goon.spawnIndex);

    if (goon.kind === "boss" && was === undefined) {
      events.push({ kind: "boss" });
    }

    if (goon.state === "telegraph" && was?.state !== "telegraph") {
      events.push(goon.kind === "swan" ? { kind: "hiss" } : { kind: "honk", goonKind: goon.kind });
    }

    if (goon.state === "ko" && was !== undefined && was.state !== "ko" && !dunked.has(goon.spawnIndex)) {
      downed.push(goon.kind);
    }
  }

  if (next.peckUntilTick > previous.peckUntilTick) {
    events.push({ kind: "peck" });
  }

  // A clank spends the peck, so it is in `landed` as well: it is told as a clank, not a land.
  const clanks = grew(previous.clanks, next.clanks);

  for (let index = 0; index < clanks; index += 1) {
    events.push({ kind: "clank" });
  }

  for (let index = 0; index < grew(previous.landed, next.landed) - clanks; index += 1) {
    events.push({ kind: "land" });
  }

  const dunks = grew(previous.dunks, next.dunks);

  for (let index = 0; index < dunks; index += 1) {
    events.push({ kind: "dunk", hazard: block.hazard?.kind ?? "bay" });
  }

  for (let index = 0; index < grew(previous.kos, next.kos) - dunks; index += 1) {
    events.push({ kind: "ko", goonKind: downed[index] ?? "goose" });
  }

  for (let index = 0; index < grew(previous.bumps, next.bumps); index += 1) {
    events.push({ kind: "bump" });
  }

  for (let index = 0; index < grew(previous.hits, next.hits); index += 1) {
    events.push({ kind: "hurt" });
  }

  for (let index = 0; index < grew(previous.wings, next.wings); index += 1) {
    events.push({ kind: "wing" });
  }

  return events;
};
