import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { FappyMinigameLeg } from "@wingnight/shared";

import { LegHistory } from "./index.js";

const leg = (overrides: Partial<FappyMinigameLeg>): FappyMinigameLeg => ({
  legIndex: 0,
  player: null,
  seed: 1,
  status: "ready",
  attempt: 0,
  checkpointGate: 0,
  flapTicks: [],
  crashes: 0,
  skipped: false,
  knockedEagles: [],
  lastRun: null,
  ...overrides
});

const LEGS = [
  leg({ legIndex: 0, status: "cleared", crashes: 2 }),
  leg({ legIndex: 1, status: "ready" }),
  leg({ legIndex: 2, status: "ready" })
];

test("does mark a cleared leg and count what it cost", () => {
  const html = renderToStaticMarkup(<LegHistory legs={LEGS} activeLegIndex={1} />);

  assert.match(html, /✓/);
  assert.match(html, /2×/);
});

test("does light the leg in hand and leave the ones still to fly plain", () => {
  const chips =
    renderToStaticMarkup(<LegHistory legs={LEGS} activeLegIndex={1} />).match(
      /<span class="[^"]*"/g
    ) ?? [];

  assert.equal(chips.filter((chip) => chip.includes("border-primary")).length, 1);
});

test("does light nothing once the relay is over", () => {
  const html = renderToStaticMarkup(<LegHistory legs={LEGS} activeLegIndex={null} />);

  assert.doesNotMatch(html, /border-primary/);
});
