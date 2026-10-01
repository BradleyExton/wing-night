import type { BrawlBlock, BrawlFrame, BrawlGoonKind } from "@wingnight/shared";

/**
 * Where one goon of the wave is, as the room counts it: not on the street yet, on it, or down.
 * `down` is the only one the score cares about; the other two tell the room how many are still
 * to come.
 */
export type BrawlWavePipState = "waiting" | "in" | "down";

export type BrawlWavePip = {
  spawnIndex: number;
  kind: BrawlGoonKind;
  state: BrawlWavePipState;
  down: boolean;
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
 * The wave on the street as the TV's meter counts it down (docs/minigame-design-principles.md §3:
 * the room's job is to count the wave down and shout the last one). While the camera is locked
 * the meter is that wave, goon by goon — a goon that has stepped in and is no longer on the
 * street went down and was tidied away. Once the camera lets go the meter holds the wave just
 * cleared, every pip lit, under GO. Pure.
 */
export const resolveWaveMeter = (frame: BrawlFrame, block: BrawlBlock): BrawlWaveMeter => {
  const waveCount = block.waves.length;
  const isFighting = frame.cameraLocked && frame.waveIndex < waveCount;
  const waveIndex = isFighting ? frame.waveIndex : Math.max(0, Math.min(frame.waveIndex - 1, waveCount - 1));
  const wave = block.waves[waveIndex];

  if (wave === undefined) {
    return { waveIndex: 0, waveCount, pips: [], clear: true };
  }

  const onStreet = new Map(frame.goons.map((goon) => [goon.spawnIndex, goon]));
  const pips = wave.spawns.map((spawn): BrawlWavePip => {
    if (!isFighting) {
      return { spawnIndex: spawn.index, kind: spawn.kind, state: "down", down: true };
    }

    if (spawn.index >= frame.spawned) {
      return { spawnIndex: spawn.index, kind: spawn.kind, state: "waiting", down: false };
    }

    const goon = onStreet.get(spawn.index);
    const isDown = goon === undefined || goon.state === "ko" || goon.state === "gone";

    return { spawnIndex: spawn.index, kind: spawn.kind, state: isDown ? "down" : "in", down: isDown };
  });

  return { waveIndex, waveCount, pips, clear: !isFighting };
};

const resolveSignature = (meter: BrawlWaveMeter): string => {
  return `${meter.waveIndex}:${meter.clear ? "go" : ""}:${meter.pips.map((pip) => pip.state[0]).join("")}`;
};

const lastSignatures = new WeakMap<HTMLElement, string>();

const setIfChanged = (element: Element, name: string, value: string): void => {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
};

/**
 * Writes the meter into the strip the surface rendered: which wave's group is current
 * (`data-current`), each pip of it lit or not (`data-lit`, with its `data-state`), and GO on the
 * strip itself (`data-brawl-wave-clear`). Run from the paint loop sixty times a second, so a frame
 * that changes nothing touches nothing.
 */
export const paintWaveMeter = (element: HTMLElement | null, meter: BrawlWaveMeter): void => {
  if (element === null) {
    return;
  }

  const signature = resolveSignature(meter);

  if (lastSignatures.get(element) === signature) {
    return;
  }

  lastSignatures.set(element, signature);
  setIfChanged(element, "data-brawl-wave", `${meter.waveIndex}`);
  setIfChanged(element, "data-brawl-wave-clear", meter.clear ? "true" : "false");
  setIfChanged(element, "data-brawl-wave-down", `${meter.pips.filter((pip) => pip.down).length}`);

  for (const group of Array.from(element.querySelectorAll("[data-brawl-wave-group]"))) {
    setIfChanged(group, "data-current", group.getAttribute("data-brawl-wave-group") === `${meter.waveIndex}` ? "true" : "false");
  }

  const states = new Map(meter.pips.map((pip) => [`${pip.spawnIndex}`, pip]));

  for (const pip of Array.from(element.querySelectorAll("[data-brawl-wave-pip]"))) {
    const state = states.get(pip.getAttribute("data-brawl-wave-pip") ?? "");

    if (state !== undefined) {
      setIfChanged(pip, "data-state", state.state);
      setIfChanged(pip, "data-lit", state.down ? "true" : "false");
    }
  }
};
