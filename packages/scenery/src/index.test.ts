import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AllandaleStation, Marina, SpiritCatcher, TownCluster } from "./index.js";
import type { SceneryPalette } from "./index.js";

// One colour per slot, each unique, so a render can be read back for exactly which slot painted
// what — a landmark that carried a colour of its own would show up as a hex none of these are.
const PALETTE: SceneryPalette = {
  steel: "#010101",
  steelDark: "#020202",
  mound: "#030303",
  wall: "#040404",
  wallDark: "#050505",
  glass: "#060606",
  brick: "#070707",
  brickDark: "#080808",
  roof: "#090909",
  platform: "#0a0a0a",
  dock: "#0b0b0b",
  dockDark: "#0c0c0c",
  hull: "#0d0d0d",
  mast: "#0e0e0e",
  sail: "#0f0f0f"
};

type Landmark = ComponentType<{
  x: number;
  baseY: number;
  palette: SceneryPalette;
  halfSpan?: number;
}>;

const LANDMARKS: Landmark[] = [SpiritCatcher, TownCluster, AllandaleStation, Marina];

const stand = (landmark: Landmark, props: { x: number; baseY: number; halfSpan?: number }): string =>
  renderToStaticMarkup(createElement("svg", null, createElement(landmark, { ...props, palette: PALETTE })));

const hexesIn = (html: string): Set<string> => new Set(html.match(/#[0-9a-f]{6}/g) ?? []);

test("does paint every landmark only in the colours it was handed", () => {
  const own = new Set(Object.values(PALETTE));

  for (const landmark of LANDMARKS) {
    for (const hex of hexesIn(stand(landmark, { x: 0, baseY: 0 }))) {
      assert.ok(own.has(hex), `${landmark.name} painted ${hex}, which no scene handed over`);
    }
  }
});

test("does stand each landmark under its own marker so a scene can find it", () => {
  assert.match(stand(SpiritCatcher, { x: 0, baseY: 0 }), /data-scenery-spirit-catcher/);
  assert.match(stand(TownCluster, { x: 0, baseY: 0 }), /data-scenery-town/);
  assert.match(stand(AllandaleStation, { x: 0, baseY: 0 }), /data-scenery-station/);
  assert.match(stand(Marina, { x: 0, baseY: 0 }), /data-scenery-marina/);
});

test("does draw the Spirit Catcher wider than it is tall, and scale it by its half-span", () => {
  const extent = (halfSpan: number): { width: number; height: number } => {
    const html = stand(SpiritCatcher, { x: 100, baseY: 100, halfSpan });
    const pairs = [...html.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((match) => ({
      x: Number(match[1]),
      y: Number(match[2])
    }));
    const xs = pairs.map((pair) => pair.x);
    const ys = pairs.map((pair) => pair.y);

    return { width: Math.max(...xs) - Math.min(...xs), height: 100 - Math.min(...ys) };
  };
  const full = extent(17.5);
  const half = extent(8.75);

  assert.ok(full.width > full.height, "the thunderbird is broader than it is high");
  assert.ok(Math.abs(full.width / 2 - half.width) < 0.01, "half the span is half the width");
  assert.ok(Math.abs(full.height / 2 - half.height) < 0.01, "and half the height");
});

test("does light the town's floors in the glass colour and nothing else", () => {
  const html = stand(TownCluster, { x: 0, baseY: 50 });
  const lit = html.match(new RegExp(`fill="${PALETTE.glass}"`, "g")) ?? [];

  // Three towers and City Hall each carry a column of lit floors; the spire carries none.
  assert.equal(lit.length, 4);
});
