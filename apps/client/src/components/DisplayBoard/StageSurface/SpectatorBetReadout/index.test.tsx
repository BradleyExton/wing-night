import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SpectatorBetReadout } from "./index";

test("does read the line and the count and no pick when bets are in", () => {
  const html = renderToStaticMarkup(<SpectatorBetReadout readout={{ line: 7.5, betCount: 3 }} />);

  assert.match(html, /data-spectator-bet-readout="3"/);
  assert.match(html, /Over \/ under/);
  assert.match(html, />7\.5</);
  assert.match(html, /3 bets in/);
});

test("does call the phones in when nobody has bet yet", () => {
  assert.match(
    renderToStaticMarkup(<SpectatorBetReadout readout={{ line: 10.5, betCount: 0 }} />),
    /phones, place your bets/
  );
});
