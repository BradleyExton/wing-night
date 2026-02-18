import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type Team } from "@wingnight/shared";

import { StandingsSurface } from "./index";

const teamsFixture: Team[] = [
  {
    id: "team-beta",
    name: "Team Beta",
    playerIds: [],
    totalScore: 12
  },
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: [],
    totalScore: 8
  }
];

test("renders standings in descending order", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface phase={Phase.ROUND_RESULTS} standings={teamsFixture} />
  );

  assert.ok(html.indexOf("Team Beta") < html.indexOf("Team Alpha"));
});

test("renders empty state when standings are missing", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface phase={Phase.SETUP} standings={[]} />
  );

  assert.match(html, /No teams have joined yet/);
});
