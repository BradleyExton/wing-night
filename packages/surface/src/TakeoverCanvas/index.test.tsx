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

// The chrome floats over the map a team's thumb is working in, so all three
// rows are transparent to a touch.
test("does let a thumb through the floating rows to the body underneath", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} actions={actions} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  const floatingRows = html.match(/pointer-events-none/g);
  assert.equal(floatingRows?.length, 3);
});

// The regression FAPPY shipped with, and the reason the rule below is not
// `[&>*]`. A row that hands the pointer back to every direct child assumes
// every child is a control. FAPPY's hint sentence is a `<span>` in the actions
// row of a game whose body IS the button, and as a child it killed 764x48px of
// the corridor — 4.0% of it — where a tap means flap. A passive child cannot
// opt out on its own: a plain `pointer-events-none` on the hint has the same
// specificity as the row's generated `… > *` rule and loses on source order.
//
// So the row grants the pointer to controls rather than to children. There is
// no prop and no configuration object (ADR-0002 guardrail 2) — a control
// claims the pointer by being one, which fails safe: a forgotten class on a
// hint costs a dead tap target, a button is live for being a button.
test("does hand the pointer back to controls rather than to every child", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} actions={actions} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  // React escapes the `&` and `>` of an arbitrary variant, so the old
  // direct-child rule would read as `[&amp;&gt;*]` if it came back.
  assert.doesNotMatch(html, /&gt;\*\]:pointer-events-auto/);
  assert.equal(
    html.match(/\[&amp;_:is\(button,a,input,select,textarea\)\]:pointer-events-auto/g)?.length,
    3
  );
});

// §4 makes the chrome row read-only — no button, no link, no input — so
// nothing in it has anything to do with a tap, and the row holds no strip of
// the body's top edge against a thumb. §5 says the same of `readout`: there is
// no bottom-right slot for a control. Both are therefore fully transparent,
// and the one rule that says so is the one `actions` uses.
test("does grant no row a blanket pointer, including the read-only ones", () => {
  const html = renderToStaticMarkup(
    <TakeoverCanvas rail={rail} clock={clock} counter={counter} actions={actions} readout={readout}>
      {body}
    </TakeoverCanvas>
  );

  const rows = html.match(/class="pointer-events-none[^"]*"/g) ?? [];

  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.match(row, /\[&amp;_:is\(button,a,input,select,textarea\)\]:pointer-events-auto/);
    // Exactly one grant per row: a second one is a blanket rule creeping back.
    assert.equal(row.match(/pointer-events-auto/g)?.length, 1);
  }
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
