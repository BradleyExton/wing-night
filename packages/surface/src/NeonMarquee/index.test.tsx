import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { NeonMarquee } from "./index.js";
import * as styles from "./styles.js";

const render = (props: Partial<Parameters<typeof NeonMarquee>[0]> = {}): string =>
  renderToStaticMarkup(
    createElement(NeonMarquee, {
      title: "Live Sketch",
      teamName: "Molten Metal",
      clock: null,
      clockLine: null,
      ...props
    })
  );

test("does name the show and the team, in that order, under one hook", () => {
  const html = render();

  assert.match(html, /data-neon-marquee/);
  assert.match(html, /Live Sketch[\s\S]*Molten Metal/);
});

test("does render an empty name rather than nothing when no team is up", () => {
  assert.ok(render({ teamName: null }).includes(`class="${styles.teamName}"></span>`));
});

test("does light the pending points beside the name only when a game passes them", () => {
  assert.equal(render().includes(styles.pending), false);
  assert.ok(render({ pending: 3 }).includes(`${styles.pending}">+3 <`));
});

// It read "+0 PENDING" on two games and a bare "+0" on two more, because each
// game wrote its own copy. The sign words it now; a game passes the number.
test("does word the pending points the same way for every game", () => {
  assert.match(render({ pending: 0 }), />\+0 <span[^>]*>pending<\/span>/);
});

// The clock is two slots because it is in two places: the digits at the end of
// the meta row, the lit length in the track under it. Both come from the shell.
test("does seat the readout and the digits in the meta row and the lit length in the track", () => {
  const html = render({
    readout: createElement("span", null, "Photo 1 of 2"),
    clock: createElement("span", null, "0:39"),
    clockLine: createElement("i", { "data-lit": true })
  });

  assert.match(html, /Photo 1 of 2<\/span><\/div><span>0:39<\/span><\/div>/);
  assert.ok(html.includes(`class="${styles.track}"><i data-lit="true"></i></div>`));
});

// docs/takeover-layout-api.md §6: an absent clock costs no width. The meta
// row and the track are rows, never reserves.
test("does reserve nothing for a clock that is not on screen", () => {
  for (const token of [styles.meta, styles.readout, styles.track, styles.marquee]) {
    assert.doesNotMatch(token, /\b(min-w|pr|pl|w)-\[/, token);
  }
});

// Trivia's rule, now the marquee's own: `page.locator("header")` is the e2e
// suite's strict handle on the host rail, and the sandbox draws both surfaces
// on one page.
test("does not render a header landmark", () => {
  assert.doesNotMatch(render(), /<header/);
});

// The readout's label type is the sign's, not the game's: it was `muted` on
// three games, `mutedWarmDim` on three and its own size on RECREATE.
test("does set the readout's type itself so a game passes plain text", () => {
  assert.ok(render({ readout: "Photo 1 of 2" }).includes(`class="${styles.readout}">Photo 1 of 2</div>`));
});
