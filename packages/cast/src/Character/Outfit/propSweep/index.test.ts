import assert from "node:assert/strict";
import test from "node:test";

import { pathSubpaths, resolveSweepPoints, type SweepPoint } from "./index.js";

const bounds = (points: SweepPoint[]): number[] =>
  [
    Math.min(...points.map(([x]) => x)),
    Math.max(...points.map(([x]) => x)),
    Math.min(...points.map(([, y]) => y)),
    Math.max(...points.map(([, y]) => y))
  ].map((n) => Math.round(n * 100) / 100);

test("does walk an arc round its ellipse, not through its radii", () => {
  // lava-disc a's disc: two half arcs, 74 wide and 14 tall about y 72.5.
  assert.deepEqual(bounds(pathSubpaths("M 2 72.5 A 37 7 0 1 0 76 72.5 A 37 7 0 1 0 2 72.5 Z").flat()), [2, 76, 65.5, 79.5]);
});

test("does stay on a curve when its control points reach further", () => {
  assert.deepEqual(bounds(pathSubpaths("M 0 0 C 0 10 10 10 10 0 Z").flat()), [0, 10, 0, 7.5]);
});

test("does read relative commands from the current point", () => {
  assert.deepEqual(bounds(pathSubpaths("m 2 3 l 10 0 v 5 h -10 z").flat()), [2, 12, 3, 8]);
});

test("does sample a straight edge along its length, not just its ends", () => {
  const points = resolveSweepPoints('<path d="M 0 0 L 24 0"></path>');

  assert.ok(points.some(([x]) => x > 11 && x < 13));
});

test("does carry a shape through every transform above it", () => {
  const markup = '<g transform="translate(10 0) rotate(90)"><circle cx="0" cy="0" r="2"></circle><rect x="0" y="0" width="4" height="1"></rect></g>';

  assert.deepEqual(bounds(resolveSweepPoints(markup)), [8, 12, -2, 4]);
});

test("does measure a clipped shape only where it shows when it is clipped", () => {
  const markup =
    '<defs><clipPath id="c"><path d="M 0 0 L 10 0 L 10 10 L 0 10 Z"></path></clipPath></defs>' +
    '<g clip-path="url(#c)"><path class="fill-bg" d="M 5 5 L 30 5 L 30 30 L 5 30 Z"></path></g>';

  assert.deepEqual(bounds(resolveSweepPoints(markup)), [5, 10, 5, 10]);
});

test("does not measure a clip's own outline inside an unfilled stroke when it is clipped", () => {
  const markup =
    '<defs><clipPath id="c"><path d="M 0 0 L 10 0 L 10 10 L 0 10 Z"></path></clipPath></defs>' +
    '<g clip-path="url(#c)"><path class="fill-none stroke-bg" d="M 1 5 L 25 5"></path></g>';

  // Sampled every 2 units from x 1: the ones inside the clip run 1 to 9.
  assert.deepEqual(bounds(resolveSweepPoints(markup)), [1, 9, 5, 5]);
});
