import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { TakeoverStage } from "./index.js";

// Markers rather than real chrome: the layout is placement, so every assertion
// here is about where a slot's content lands and what the layout wraps it in.
const rail = <span data-slot="rail" />;
const counter = <span data-slot="counter" />;
const clock = <span data-slot="clock" />;
const body = <span data-slot="body" />;
const deck = <span data-slot="deck" />;
const actions = <span data-slot="actions" />;

const LANDMARK_PATTERN = /<(?:header|nav|main|section|aside|footer)\b/;

test("does place rail, counter and clock across the rail row in reading order", () => {
  const html = renderToStaticMarkup(
    <TakeoverStage rail={rail} clock={clock} counter={counter}>
      {body}
    </TakeoverStage>
  );

  assert.ok(html.indexOf('data-slot="rail"') < html.indexOf('data-slot="counter"'));
  assert.ok(html.indexOf('data-slot="counter"') < html.indexOf('data-slot="clock"'));
  // All three sit in the rail row, which is the row above the body.
  assert.ok(html.indexOf('data-slot="clock"') < html.indexOf('data-slot="body"'));
});

// The abolished top-right reserve (§6) rests entirely on this: six of the nine
// minigames have no play clock, and the old fix was nine hand-typed
// `pr-[clamp(9rem,15vw,12rem)]` reserves for a chip that never drew. A row
// only works if an unfilled slot leaves nothing behind — not even a gap.
test("does leave nothing behind in the rail row when the counter and the clock render nothing", () => {
  const html = renderToStaticMarkup(<TakeoverStage rail={rail} clock={null}>{body}</TakeoverStage>);

  assert.match(html, /<div class="mr-auto min-w-0"><span data-slot="rail"><\/span><\/div><\/div>/);
  assert.doesNotMatch(html, /<div[^>]*><\/div>/);
});

// Band 0 (§7). This is the load-bearing idea: the body is its own stacking
// context, so a game may use any z-index inside it — Leaflet's 400-1000
// included — and none of it can escape onto the shell's chrome or the dock.
test("does isolate the body so a game's stacking cannot escape", () => {
  const html = renderToStaticMarkup(<TakeoverStage rail={rail} clock={clock}>{body}</TakeoverStage>);

  assert.match(html, /<div class="relative isolate min-h-0 min-w-0 flex-1"><span data-slot="body"/);
});

// Band 2 above band 1 (§7), so a game with a lot to say can never bury the
// round number or the clock. Band 3 stays the dock's, outside the layout.
test("does keep the shell's chrome above the game's and out of the dock's band", () => {
  const html = renderToStaticMarkup(
    <TakeoverStage rail={rail} clock={clock} counter={counter} deck={deck} actions={actions}>
      {body}
    </TakeoverStage>
  );

  assert.match(html, /<div class="z-20 flex shrink-0 items-center gap-3">/);
  assert.doesNotMatch(html, /z-\[1100\]/);
});

// §6: one number, applied by the layout and only by the layout. TRIVIA's
// INCORRECT and RECREATE's "Next target" land under the dock today because
// each is the last flow child of a body with no reserve.
test("does reserve the dock corner as right padding on the actions row", () => {
  const html = renderToStaticMarkup(
    <TakeoverStage rail={rail} clock={clock} actions={actions}>
      {body}
    </TakeoverStage>
  );

  assert.match(html, /<div class="shrink-0 pr-\[4\.5rem\]"><span data-slot="actions"/);
});

test("does reserve the dock corner at the foot of the scrolling deck column", () => {
  const html = renderToStaticMarkup(
    <TakeoverStage rail={rail} clock={clock} deck={deck}>
      {body}
    </TakeoverStage>
  );

  assert.match(
    html,
    /<div class="[^"]*w-\[clamp\(230px,28vw,330px\)\][^"]*overflow-y-auto pb-\[4\.5rem\]"><span data-slot="deck"/
  );
  // The deck is the right column of the main row, so the body comes first.
  assert.ok(html.indexOf('data-slot="body"') < html.indexOf('data-slot="deck"'));
});

test("does render no deck column and no actions row when a game passes neither", () => {
  const html = renderToStaticMarkup(<TakeoverStage rail={rail} clock={clock}>{body}</TakeoverStage>);

  assert.doesNotMatch(html, /clamp\(230px/);
  assert.doesNotMatch(html, /4\.5rem/);
  assert.doesNotMatch(html, /<div[^>]*><\/div>/);
});

// `HostMiniRail` renders the `<header>` the e2e suite locates (§9). The layout
// must not add a second landmark around it, or `page.locator("header")` starts
// matching a wrapper instead of the rail.
test("does add no landmark element around the rail slot", () => {
  const html = renderToStaticMarkup(
    <TakeoverStage rail={rail} clock={clock} counter={counter} deck={deck} actions={actions}>
      {body}
    </TakeoverStage>
  );

  assert.doesNotMatch(html, LANDMARK_PATTERN);
});
