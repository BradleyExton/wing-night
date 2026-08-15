import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ContraptionUiLab } from "./index";

// AC#9's actual proof. Reaching this file at all means importing the prototype module under
// `tsx --test` — no DOM, no Vite — so a bare `window` or `import.meta.env` read at module OR render
// scope throws here. A green `pnpm test` alone would NOT catch it: nothing in apps/client/src
// imports App, whose own render scope already reads bare `window.location.pathname`, so an
// unimported module's bare `window` sails through. gate1 called that "false comfort" on WN-16.
test("imports the prototype module without a DOM present", () => {
  assert.equal(typeof ContraptionUiLab, "function");
  assert.equal(typeof globalThis.window, "undefined");
});

test("renders at render scope without touching window", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /CONTRAPTION UI Direction Lab/);
});

// The ?variant= read happens in an effect, so the server-rendered frame must still be the default
// variant rather than a blank stage waiting for the client.
test("renders the default variant when no effect has run", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /Left edge, in profile, outside the field/);
});

test("offers a switcher entry for every variant", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /A · Sidestage/);
  assert.match(html, /B · Arena/);
  assert.match(html, /C · Character-first/);
});

test("names all three structural axes so the comparison is legible at the pick", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /Thrower/);
  assert.match(html, /Throw/);
  assert.match(html, /Target/);
});

// AC#5: both candidates present, and the physics implication stated rather than left to be
// inferred from the animation.
test("offers both projectile candidates on the page", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /Drumette/);
  assert.match(html, /Wing bone \(flat\)/);
});

test("states the rotation implication for the selected projectile", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  // Default is the drumette, which needs no new physics.
  assert.match(html, /needs no new physics/);
});

// The pick is the human's; a lab that quietly asserted a winner would be the failure mode gate1
// flagged. Pin the disclaimer so it cannot be dropped silently.
test("reserves the projectile pick for the human reviewer", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /stays with the human/);
});

// AC#7: the throw is a transition out of a phase that already exists, not a cold open.
test("opens the sequence on the EATING hand-off", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /EATING — timer dominant/);
});

// AC#6: the miss beat is the default reading, because that is the one WN-15 says the game dies
// without.
test("shows the cleanup beat because the default outcome is a miss", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /she picks it up/);
});
