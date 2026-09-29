import assert from "node:assert/strict";
import test from "node:test";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  AllandaleStation,
  Crossovers,
  Marina,
  QUEENS_HOTEL,
  QueensHotel,
  resolveQueensPatioX,
  resolveSouldiersDoorX,
  SOULDIERS_SKATE_SHOP,
  SouldiersSkateShop,
  SpiritCatcher,
  Storefronts,
  TownCluster,
  WaterfrontCondos
} from "./index.js";
import type { CityPalette } from "./index.js";

// One colour per slot, each unique, so a render can be read back for exactly which slot painted
// what — a landmark that carried a colour of its own would show up as a hex none of these are.
const PALETTE: CityPalette = {
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
  sail: "#0f0f0f",
  trim: "#101010",
  pane: "#111111",
  signGreen: "#121212",
  signGreenLight: "#131313",
  signInk: "#141414",
  signLetter: "#151515",
  buff: "#161616",
  buffDark: "#171717",
  cornice: "#181818",
  flag: "#191919",
  signRed: "#1a1a1a",
  signYellow: "#1b1b1b",
  signBoard: "#1c1c1c",
  towerGlass: "#1d1d1d",
  awning: "#1e1e1e",
  tower: "#1f1f1f",
  towerDark: "#202020"
};

type Landmark = ComponentType<{
  x: number;
  baseY: number;
  palette: CityPalette;
  halfSpan?: number;
  scale?: number;
  seed?: number;
}>;

const LANDMARKS: Landmark[] = [
  SpiritCatcher,
  TownCluster,
  AllandaleStation,
  Marina,
  SouldiersSkateShop,
  QueensHotel,
  Crossovers,
  WaterfrontCondos,
  Storefronts
];

const stand = (
  landmark: Landmark,
  props: { x: number; baseY: number; halfSpan?: number; scale?: number; seed?: number }
): string => renderToStaticMarkup(createElement("svg", null, createElement(landmark, { ...props, palette: PALETTE })));

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
  assert.match(stand(SouldiersSkateShop, { x: 0, baseY: 0 }), /data-scenery-souldiers/);
  assert.match(stand(QueensHotel, { x: 0, baseY: 0 }), /data-scenery-queens/);
  assert.match(stand(Crossovers, { x: 0, baseY: 0 }), /data-scenery-crossovers/);
  assert.match(stand(WaterfrontCondos, { x: 0, baseY: 0 }), /data-scenery-condos/);
  assert.match(stand(Storefronts, { x: 0, baseY: 0 }), /data-scenery-storefronts/);
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

test("does stand a street landmark at its caller's spot and size when handed a scale", () => {
  for (const landmark of [SouldiersSkateShop, QueensHotel, Crossovers, WaterfrontCondos, Storefronts]) {
    assert.match(stand(landmark, { x: 12, baseY: 64, scale: 0.5 }), /transform="translate\(12 64\) scale\(0.5\)"/);
  }
});

test("does open the Souldiers door inside the shop, and move it with the shop when stood bigger", () => {
  const { width, doorX, doorWidth, doorHeight } = SOULDIERS_SKATE_SHOP;
  const html = stand(SouldiersSkateShop, { x: 0, baseY: 0 });

  assert.ok(doorX - doorWidth / 2 > 0 && doorX + doorWidth / 2 < width, "the door is in the wall");
  // The door leaf is drawn exactly where the anchor says, so a runner stood there is in it.
  assert.match(html, new RegExp(`x="${doorX - doorWidth / 2}" y="${-doorHeight}" width="${doorWidth}"`));
  assert.equal(resolveSouldiersDoorX(10), 10 + doorX);
  assert.equal(resolveSouldiersDoorX(10, 2), 10 + doorX * 2);
});

test("does letter BAR over the Queen's patio, where the goal post is told to stand", () => {
  const { width, barX } = QUEENS_HOTEL;
  const html = stand(QueensHotel, { x: 0, baseY: 0 });

  assert.ok(barX > 0 && barX < width, "the patio is on the hotel's front");
  assert.match(html, new RegExp(`<text x="${barX}"[^>]*>BAR</text>`));
  assert.equal(resolveQueensPatioX(100, 0.5), 100 + barX * 0.5);
});

test("does hang HENS on the Crossover's banner and never the real sign's word", () => {
  const html = stand(Crossovers, { x: 0, baseY: 0 });

  assert.match(html, />HENS HENS HENS</);
  assert.match(html, />FREE WINGS</);
  assert.doesNotMatch(html, /GIRLS/i);
});

test("does glaze both condo towers down both corners and the middle", () => {
  const html = stand(WaterfrontCondos, { x: 0, baseY: 0 });
  const stacks = html.match(new RegExp(`fill="${PALETTE.towerGlass}"`, "g")) ?? [];

  assert.equal(stacks.length, 6);
});

test("does lay the same Dunlop Street for a seed every time, and a different one for another seed", () => {
  const street = (seed: number): string => stand(Storefronts, { x: 0, baseY: 0, seed });

  assert.equal(street(3), street(3));
  assert.ok(new Set([0, 1, 2, 3, 4, 5].map(street)).size > 3, "the seeds lay different streets");
});
