import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type Player, type Team } from "@wingnight/shared";

import { StandingsSurface } from "./index";

const teamsFixture: Team[] = [
  {
    id: "team-beta",
    name: "Team Beta",
    playerIds: ["player-1", "player-2", "player-3", "player-4"],
    totalScore: 12
  },
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-5"],
    totalScore: 8
  }
];

const playersFixture: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Sam" },
  { id: "player-4", name: "Jules" },
  { id: "player-5", name: "Taylor" }
];

test("renders standings in descending order", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.ROUND_RESULTS}
      standings={teamsFixture}
      players={playersFixture}
    />
  );

  assert.ok(html.indexOf("Team Beta") < html.indexOf("Team Alpha"));
  assert.match(html, /Alex, Morgan, Sam \+1/);
  assert.match(html, /Taylor/);
  assert.match(html, /#1/);
  assert.match(html, /Leading/);
});

test("renders empty state when standings are missing", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface phase={Phase.SETUP} standings={[]} players={[]} />
  );

  assert.match(html, /No teams have joined yet/);
});

test("uses gold winner accent during FINAL_RESULTS", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.FINAL_RESULTS}
      standings={teamsFixture}
      players={playersFixture}
    />
  );

  assert.match(html, /border-l-gold\/85/);
  assert.match(html, /bg-gold\/90/);
  assert.match(html, /Winner/);
});
