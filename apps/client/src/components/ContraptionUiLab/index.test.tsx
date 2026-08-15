import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { VariantArena } from "./VariantArena";
import { VariantCharacterFirst } from "./VariantCharacterFirst";
import { VariantSidestage } from "./VariantSidestage";
import { ContraptionUiLab } from "./index";
import { resolveSequencePosition } from "./sequence";

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

// Asserted on the axis VALUES rather than the labels: "Throw" is a substring of "Thrower", so
// matching the labels would pass even if the throw-scale row were deleted outright.
test("names all three structural axes so the comparison is legible at the pick", () => {
  const html = renderToStaticMarkup(<ContraptionUiLab />);

  assert.match(html, /Left edge, in profile, outside the field/);
  assert.match(html, /Full-width traverse/);
  assert.match(html, /the can sits in front of the ramps/);
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

// Only the default variant is reachable through the entry, so the other two are rendered directly
// — otherwise a crash in either would be caught by nothing but a human opening the URL.
const MID_FLIGHT = resolveSequencePosition(3400);

test("renders the arena variant without a DOM", () => {
  const html = renderToStaticMarkup(
    <VariantArena position={MID_FLIGHT} outcome="missed" projectile="drumette" />
  );

  assert.match(html, /<svg/);
});

test("renders the character-first variant without a DOM", () => {
  const html = renderToStaticMarkup(
    <VariantCharacterFirst position={MID_FLIGHT} outcome="missed" projectile="drumette" />
  );

  assert.match(html, /<svg/);
});

// AC#6's completion, pinned where it can actually fail: once the cleaner has picked the bone up it
// is no longer drawn on the floor, so the gag ends on an empty floor rather than on a bone the
// cleaner is standing next to.
test("stops drawing the projectile on the floor once the cleaner has picked it up", () => {
  const beforePickUp = resolveSequencePosition(6300 + 2600 * 0.2);
  const afterPickUp = resolveSequencePosition(6300 + 2600 * 0.8);

  const before = renderToStaticMarkup(
    <VariantSidestage position={beforePickUp} outcome="missed" projectile="wing-bone" />
  );
  const after = renderToStaticMarkup(
    <VariantSidestage position={afterPickUp} outcome="missed" projectile="wing-bone" />
  );

  // The flat bone's 44-wide barrel is unique to the projectile sprite.
  assert.match(before, /width="44"/);
  assert.ok(!/width="44"/.test(after));
});
