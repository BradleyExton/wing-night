import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { AnamorphLab } from "./index";

// AC#3's actual proof. Reaching this file at all means importing the lab module
// under `tsx --test` — no DOM, no Vite — so a bare `window` or `import.meta.env`
// read at module scope throws here rather than passing green because nothing
// imports it. WN-3 lost 16 HostControlPanel tests to exactly that, and a green
// `pnpm test` alone would not have caught it: nothing in apps/client/src imports
// App, whose own render scope already reads bare `window.location.pathname`.
test("imports the lab module without a DOM present", () => {
  assert.equal(typeof AnamorphLab, "function");
  assert.equal(typeof globalThis.window, "undefined");
});

test("renders the lab at render scope without touching window", () => {
  const html = renderToStaticMarkup(<AnamorphLab />);

  assert.match(html, /<canvas/);
  assert.match(html, /ANAMORPH Feel Lab/);
});

test("renders a live control for each of the four feel questions", () => {
  const html = renderToStaticMarkup(<AnamorphLab />);

  assert.match(html, /1 · Jitter magnitude/);
  assert.match(html, /2 · Legibility curve/);
  assert.match(html, /3 · Antipodal mirror/);
  assert.match(html, /4 · Control idiom/);
  assert.match(html, /4b · Tablet preview/);
});

test("offers both options on every question that is a choice", () => {
  const html = renderToStaticMarkup(<AnamorphLab />);

  assert.match(html, /Linear ramp/);
  assert.match(html, /Late hard snap/);
  assert.match(html, /Resolves \(parallel\)/);
  assert.match(html, /Broken \(eye ray\)/);
  assert.match(html, /Two dials/);
  assert.match(html, /Drag to orbit/);
  assert.match(html, /TV only/);
  assert.match(html, /TV \+ preview/);
});

test("shows the yaw and pitch dials when the idiom is dials", () => {
  const html = renderToStaticMarkup(<AnamorphLab />);

  // Dials are the default idiom, so both range inputs render up front.
  assert.match(html, /aria-label="Yaw"/);
  assert.match(html, /aria-label="Pitch"/);
});

test("keeps the hidden true angle off the page while telemetry is off", () => {
  const html = renderToStaticMarkup(<AnamorphLab />);

  // Telemetry defaults off so the first look at a seed is an honest feel test.
  assert.doesNotMatch(html, /True angle/);
  assert.doesNotMatch(html, /Angular error/);
});
