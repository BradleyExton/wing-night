import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SpectatorBetSettlement } from "./index";

test("does show the line, the turn's score, the side and who called it when a turn settles", () => {
  const html = renderToStaticMarkup(
    <SpectatorBetSettlement
      settlement={{ line: 7.5, turnPoints: 5, outcome: "under", callerNames: ["Rob", "Dylan"] }}
      beatClassName=""
    />
  );

  assert.match(html, /data-spectator-bet-settlement="under"/);
  assert.match(html, />7\.5</);
  assert.match(html, />5</);
  assert.match(html, /Called it:/);
  assert.match(html, /Rob, Dylan/);
});

test("does say nobody called it when every bettor went the other way", () => {
  const html = renderToStaticMarkup(
    <SpectatorBetSettlement settlement={{ line: 7.5, turnPoints: 9, outcome: "over", callerNames: [] }} beatClassName="" />
  );

  assert.match(html, /Nobody called it/);
});
