import assert from "node:assert/strict";
import test from "node:test";
import type { BrawlFrame, BrawlGoon } from "@wingnight/shared";
import { createBrawlRunStart, resolveBrawlBlock } from "@wingnight/shared";

import { paintWaveMeter, resolveWaveMeter } from "./index.js";

// The sandbox's course: block 0 opens on three geese, then four.
const block = resolveBrawlBlock({ seed: 20261001, blocks: 2, block: 0 });
const start = createBrawlRunStart(block);

const goonFor = (spawnIndex: number, state: BrawlGoon["state"]): BrawlGoon => ({
  spawnIndex,
  kind: block.spawns[spawnIndex]?.kind ?? "goose",
  x: 100,
  y: 0,
  vx: 0,
  vy: 0,
  facing: -1,
  hp: 1,
  state,
  stateUntilTick: 0,
  koTick: state === "ko" ? 10 : null
});

const firstWave = block.waves[0]?.spawns ?? [];

test("does count every goon of the opening wave as still to come when the block is on the line", () => {
  const meter = resolveWaveMeter(start, block);

  assert.equal(meter.waveIndex, 0);
  assert.equal(meter.waveCount, block.waves.length);
  assert.equal(meter.pips.length, firstWave.length);
  assert.ok(meter.pips.every((pip) => pip.state === "waiting" && !pip.down));
  assert.equal(meter.clear, false);
});

test("does light a goon that fell or was tidied away and not one still standing when the wave is fought", () => {
  const frame: BrawlFrame = {
    ...start,
    tick: 200,
    spawned: 2,
    goons: [goonFor(1, "ko")]
  };
  const meter = resolveWaveMeter(frame, block);

  // Spawn 0 stepped in and is gone (down), spawn 1 is falling (down), spawn 2 has not arrived.
  assert.deepEqual(
    meter.pips.map((pip) => pip.state),
    ["down", "down", "waiting"]
  );

  const standing = resolveWaveMeter({ ...frame, goons: [goonFor(0, "telegraph"), goonFor(1, "ko")] }, block);

  assert.deepEqual(
    standing.pips.map((pip) => pip.down),
    [false, true, false]
  );
});

test("does hold the wave just put down fully lit under GO when the camera lets go", () => {
  const frame: BrawlFrame = { ...start, tick: 400, cameraLocked: false, waveIndex: 1, spawned: firstWave.length };
  const meter = resolveWaveMeter(frame, block);

  assert.equal(meter.waveIndex, 0);
  assert.equal(meter.clear, true);
  assert.equal(meter.pips.length, firstWave.length);
  assert.ok(meter.pips.every((pip) => pip.down));

  const last = resolveWaveMeter({ ...frame, waveIndex: block.waves.length }, block);

  assert.equal(last.waveIndex, block.waves.length - 1);
  assert.equal(last.clear, true);
});

type FakeElement = {
  attributes: Map<string, string>;
  children: FakeElement[];
  getAttribute: (name: string) => string | null;
  setAttribute: (name: string, value: string) => void;
  querySelectorAll: (selector: string) => FakeElement[];
};

const createElement = (attributes: Record<string, string>, children: FakeElement[] = []): FakeElement => {
  const map = new Map(Object.entries(attributes));
  const element: FakeElement = {
    attributes: map,
    children,
    getAttribute: (name) => map.get(name) ?? null,
    setAttribute: (name, value) => {
      map.set(name, value);
    },
    querySelectorAll: (selector) => {
      const name = selector.slice(1, -1);
      const found: FakeElement[] = [];
      const walk = (node: FakeElement): void => {
        for (const child of node.children) {
          if (child.attributes.has(name)) {
            found.push(child);
          }

          walk(child);
        }
      };

      walk(element);
      return found;
    }
  };

  return element;
};

test("does mark the current wave's group, light its fallen pips and raise GO when it is painted", () => {
  const pips = firstWave.map((spawn) => createElement({ "data-brawl-wave-pip": `${spawn.index}` }));
  const groups = [createElement({ "data-brawl-wave-group": "0" }, pips), createElement({ "data-brawl-wave-group": "1" })];
  const strip = createElement({}, groups);
  const frame: BrawlFrame = { ...start, tick: 200, spawned: 2, goons: [goonFor(1, "approach")] };

  paintWaveMeter(strip as unknown as HTMLElement, resolveWaveMeter(frame, block));

  assert.equal(groups[0]?.getAttribute("data-current"), "true");
  assert.equal(groups[1]?.getAttribute("data-current"), "false");
  assert.deepEqual(
    pips.map((pip) => pip.getAttribute("data-lit")),
    ["true", "false", "false"]
  );
  assert.equal(strip.getAttribute("data-brawl-wave-clear"), "false");
  assert.equal(strip.getAttribute("data-brawl-wave-down"), "1");

  paintWaveMeter(
    strip as unknown as HTMLElement,
    resolveWaveMeter({ ...frame, cameraLocked: false, waveIndex: 1, goons: [] }, block)
  );

  assert.equal(strip.getAttribute("data-brawl-wave-clear"), "true");
  assert.ok(pips.every((pip) => pip.getAttribute("data-lit") === "true"));
});

test("does nothing when there is no strip to write into", () => {
  assert.doesNotThrow(() => {
    paintWaveMeter(null, resolveWaveMeter(start, block));
  });
});
