import type { BrawlCrewBlock, BrawlCrewFrame, BrawlGoonKind, BrawlSide } from "@wingnight/shared";

/**
 * Where one goon of the wave is, as the room counts it: not on the street yet, on it, or down.
 * `down` is the only one the score cares about; the other two tell the room how many are still
 * to come, and from which edge.
 */
export type BrawlWavePipState = "waiting" | "in" | "down";

export type BrawlWavePip = {
  spawnIndex: number;
  kind: BrawlGoonKind;
  /** The edge it steps in from: the room can call "GULL, LEFT, NEXT" before it is on the street. */
  side: BrawlSide;
  state: BrawlWavePipState;
};

export type BrawlWaveMeter = {
  /** The wave the meter counts: the one the camera is locked on, or the one just put down. */
  waveIndex: number;
  waveCount: number;
  pips: BrawlWavePip[];
  /** The wave is down and the camera has let go: GO ▶. */
  clear: boolean;
};

/**
 * The wave on the street as the wall's meter counts it down (docs/minigame-design-principles.md
 * §3: the room's job is to count the wave down and shout the last one). While the camera is
 * locked the meter is that wave, goon by goon — a goon that has stepped in and is no longer on
 * the street went down and was swept away. Once the camera lets go the meter holds the wave just
 * cleared, every pip lit, under GO. It is a count of goons and never a health bar; the crew's
 * size is not hidden in it, because the kit it was dealt is exactly what it shows. Pure.
 */
export const resolveWaveMeter = (
  frame: Pick<BrawlCrewFrame, "cameraLocked" | "waveIndex" | "spawned" | "goons">,
  block: Pick<BrawlCrewBlock, "waves">
): BrawlWaveMeter => {
  const waveCount = block.waves.length;
  const isFighting = frame.cameraLocked && frame.waveIndex < waveCount;
  const waveIndex = isFighting ? frame.waveIndex : Math.max(0, Math.min(frame.waveIndex - 1, waveCount - 1));
  const wave = block.waves[waveIndex];

  if (wave === undefined) {
    return { waveIndex: 0, waveCount, pips: [], clear: true };
  }

  const onStreet = new Map(frame.goons.map((goon) => [goon.spawnIndex, goon]));
  const pips = wave.spawns.map((spawn): BrawlWavePip => {
    const pip = { spawnIndex: spawn.index, kind: spawn.kind, side: spawn.side };

    if (!isFighting) {
      return { ...pip, state: "down" };
    }

    if (spawn.index >= frame.spawned) {
      return { ...pip, state: "waiting" };
    }

    const goon = onStreet.get(spawn.index);

    return { ...pip, state: goon === undefined || goon.state === "ko" || goon.state === "gone" ? "down" : "in" };
  });

  return { waveIndex, waveCount, pips, clear: !isFighting };
};

/**
 * The meter as one short string: which wave, whether it is clear, and each pip's state. A
 * surface re-renders its strip only when this changes — a goon steps in or goes down — never on
 * a frame where the count did not move.
 */
export const resolveWaveMeterSignature = (meter: BrawlWaveMeter): string => {
  return `${meter.waveIndex}/${meter.waveCount}:${meter.clear ? "go" : ""}:${meter.pips.map((pip) => pip.state[0]).join("")}`;
};
