import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ContraptionLab } from "./index";

// AC#5's actual proof. Reaching this file at all means importing the lab module under `tsx --test`
// — no DOM, no Vite — so a bare `window` or `import.meta.env` read at module OR render scope throws
// here. A green `pnpm test` alone would not have caught it: nothing in apps/client/src imports App,
// whose own render scope already reads bare `window.location.pathname`, so an unimported module's
// bare `window` sails through. gate1 called that "false comfort" and it is.
test("imports the lab module without a DOM present", () => {
  assert.equal(typeof ContraptionLab, "function");
  assert.equal(typeof globalThis.window, "undefined");
});

test("renders the lab at render scope without touching window", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  assert.match(html, /<canvas/);
  assert.match(html, /CONTRAPTION Feel Lab/);
});

test("renders a live control for each of WN-15's four questions", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  assert.match(html, /1 · Failure readability/);
  assert.match(html, /2 · Piece set and count/);
  assert.match(html, /3 · One shot vs best-of-N/);
  assert.match(html, /4 · Sim length/);
});

test("offers both readings of the best-of-N question", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  assert.match(html, /Seed only/);
  assert.match(html, /Team rebuilds/);
});

test("offers every piece set on the piece-count question", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  assert.match(html, /2 pieces/);
  assert.match(html, /4 pieces/);
  assert.match(html, /6 pieces/);
  assert.match(html, /WN-17 benchmark/);
});

test("steps the readability aids from bare through annotated", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  assert.match(html, /Bare/);
  assert.match(html, /Trail \+ contacts/);
});

// The readability question's headline: the verdict is on the page in words, not left to be read
// off a coordinate. The default route is a solved one, so it lands.
test("states the run's verdict in the room's terms when the default route runs", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  assert.match(html, /LANDED — in the bucket/);
});

// Ties the sim-length question to WN-15's architecture call (a) keyframe track vs (b) re-simulate:
// lengthening a run has a wire cost, and the lab shows it while you drive the duration.
test("reports the track's wire cost alongside the sim-length control", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  assert.match(html, /Track bytes \(JSON, 2dp\)/);
  assert.match(html, /Keyframes/);
});

test("names the body-contact limitation the piece-set question runs into", () => {
  const html = renderToStaticMarkup(<ContraptionLab />);

  // Marbles cannot deflect the wing, so "clever solution" means ramp geometry and nothing else.
  assert.match(html, /never with each other/);
});
