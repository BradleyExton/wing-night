import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { TakeoverCanvas } from "./index.js";

const rail = <span data-slot="rail" />;
const counter = <span data-slot="counter" />;
const clock = <span data-slot="clock" />;
const body = <span data-slot="body" />;
const actions = <span data-slot="actions" />;
const readout = <span data-slot="readout" />;

const LANDMARK_PATTERN = /<(?:header|nav|main|section|aside|footer)\b/;

test("does draw the body first so every other slot floats over it", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} counter={counter} actions={actions} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  assert.ok(html.indexOf('data-slot="body"') < html.indexOf('data-slot="rail"'));
  assert.ok(html.indexOf('data-slot="rail"') < html.indexOf('data-slot="actions"'));
  assert.ok(html.indexOf('data-slot="actions"') < html.indexOf('data-slot="readout"'));
});

// Band 0 (§7), and on a Canvas it is the one keeping the chrome visible at
// all: GEO's Leaflet controls reach z-1000, which would paint straight over a
// chrome row at z-20 if the body were not its own stacking context.
test("does isolate the body as well as the root", () => {
  const html = renderToStaticMarkup(<TakeoverCanvas rail={rail} clock={clock}>{body}</TakeoverCanvas>);

  assert.match(html, /<div class="relative isolate h-full min-h-0 w-full">/);
  assert.match(html, /<div class="relative isolate h-full w-full"><span data-slot="body"/);
});

test("does place rail, counter and clock across the chrome row in reading order", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} counter={counter}>
      {body}
    </TakeoverCanvas>
  );

  assert.ok(html.indexOf('data-slot="rail"') < html.indexOf('data-slot="counter"'));
  assert.ok(html.indexOf('data-slot="counter"') < html.indexOf('data-slot="clock"'));
});

// Same abolished top-right reserve as the Stage (§6): the clock is the last
// item in a row, so nothing is held for it when it draws nothing.
test("does leave nothing behind in the chrome row when the counter and the clock render nothing", () => {
  const html = renderToStaticMarkup(<TakeoverCanvas rail={rail} clock={null}>{body}</TakeoverCanvas>);

  assert.match(html, /<div class="mr-auto min-w-0"><span data-slot="rail"><\/span><\/div><\/div>/);
  assert.doesNotMatch(html, /<div[^>]*><\/div>/);
});

// The chrome floats over the map a team's thumb is working in, so the rows are
// transparent to a touch and only their chips take one. React escapes the `&`
// and `>` of the arbitrary child variant, hence the entities.
test("does let a thumb through the floating rows to the body underneath", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} actions={actions} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  const floatingRows = html.match(/pointer-events-none/g);
  assert.equal(floatingRows?.length, 3);
  assert.equal(html.match(/\[&amp;&gt;\*\]:pointer-events-auto/g)?.length, 3);
});

// §5/§6: the dock owns the bottom-right corner. The readout sits above it and
// the actions row cannot grow under it, so no game hand-types GEO's
// `bottom-[clamp(4.9rem,9vh,5.6rem)]` four more times.
test("does lift the readout clear of the corner dock", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  assert.match(html, /<div class="[^"]*bottom-\[4\.5rem\][^"]*"><span data-slot="readout"/);
});

// The other half of the same bound. `actions` was constrained in the axis it
// grows from the start; the readout was not, and an unbounded right-anchored
// row grows leftward across the canvas the moment a game puts something of
// variable width in it (JOUST's result plaque names everyone a shot felled).
// Both floating slots are bounded now, by the same one number.
test("does stop the readout growing back across the canvas", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  assert.match(html, /<div class="[^"]*max-w-\[calc\(100%-4\.5rem\)\][^"]*"><span data-slot="readout"/);
});

test("does stop the actions row running under the corner dock", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} actions={actions}>
      {body}
    </TakeoverCanvas>
  );

  assert.match(html, /<div class="[^"]*max-w-\[calc\(100%-4\.5rem\)\][^"]*"><span data-slot="actions"/);
});

test("does render no floating rows when a game passes neither actions nor readout", () => {
  const html = renderToStaticMarkup(<TakeoverCanvas rail={rail} clock={clock}>{body}</TakeoverCanvas>);

  assert.doesNotMatch(html, /4\.5rem/);
  assert.doesNotMatch(html, /<div[^>]*><\/div>/);
});

test("does keep every slot out of the corner dock's band", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} counter={counter} actions={actions} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  assert.doesNotMatch(html, /z-\[1100\]/);
});

test("does add no landmark element around the rail slot", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} counter={counter} actions={actions} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  assert.doesNotMatch(html, LANDMARK_PATTERN);
});
