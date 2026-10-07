import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { SpectatorBets } from "@wingnight/shared";

import { SpectatorBetCount } from "./index";

const bets = (overrides: Partial<SpectatorBets> = {}): SpectatorBets => ({
  turnKey: "1:0",
  teamId: "team-1",
  line: 7.5,
  baselinePoints: 0,
  status: "open",
  betsByPlayerId: {},
  bettorPlayerIds: ["p2", "p3"],
  betCount: 2,
  turnPoints: null,
  outcome: null,
  ...overrides
});

test("does show the host the line and how many are in when the window is open", () => {
  const html = renderToStaticMarkup(<SpectatorBetCount spectatorBets={bets()} />);

  assert.match(html, /data-host-spectator-bets="2"/);
  assert.match(html, /O\/U 7\.5/);
  assert.match(html, /2 in/);
});

test("does show nothing once the window has closed or when there are no bets", () => {
  assert.equal(renderToStaticMarkup(<SpectatorBetCount spectatorBets={bets({ status: "closed" })} />), "");
  assert.equal(renderToStaticMarkup(<SpectatorBetCount spectatorBets={null} />), "");
});
