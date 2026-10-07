import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { GeoMinigamePlayerView } from "@wingnight/shared";

import { PlayerGeoSurface } from "./index.js";

const card = (overrides: Partial<GeoMinigamePlayerView> = {}): GeoMinigamePlayerView => ({
  minigame: "GEO",
  promptId: "geo-1",
  promptTitle: "The bridge with the blue lights",
  photoNumber: 1,
  promptsPerTurn: 2,
  status: "open",
  pin: null,
  result: null,
  ...overrides
});

const render = (view: GeoMinigamePlayerView): string =>
  renderToStaticMarkup(<PlayerGeoSurface minigamePlayerView={view} onDispatchAction={(): void => {}} />);

test("does ask for a pin when the photo is open and the phone has none down", () => {
  const html = render(card());

  assert.match(html, /data-phone-answer-status="open"/);
  assert.match(html, /data-phone-answer-pinned="false"/);
  assert.match(html, /Photo 1 \/ 2/);
  assert.match(html, /Tap the map to drop your pin/);
});

test("does say the pin is in when the phone has pinned", () => {
  assert.match(render(card({ pin: { lat: 1, lng: 2 } })), /Your pin is in/);
});

test("does tell the phone how its pin measured when the photo is locked", () => {
  const html = render(card({ status: "locked", pin: { lat: 1, lng: 2 }, result: { distanceKm: 4.2, pointsAwarded: 2, isBest: true } }));

  assert.match(html, /data-phone-answer-status="locked"/);
  assert.match(html, /✓ Best pin on the team/);
  assert.match(html, /\+2/);
});
