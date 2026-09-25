import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type Player, type Team } from "@wingnight/shared";

import { resolveTeamThemeById } from "../../../utils/resolveTeamTheme";
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

const themesFixture = resolveTeamThemeById(teamsFixture);

const playersFixture: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Sam" },
  { id: "player-4", name: "Jules" },
  { id: "player-5", name: "Taylor" }
];

test("renders standings in descending order with ordinal labels", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.ROUND_RESULTS}
      standings={teamsFixture}
      players={playersFixture}
      teamThemeByTeamId={themesFixture}
    />
  );

  assert.ok(html.indexOf("Team Beta") < html.indexOf("Team Alpha"));
  assert.match(html, /Leading/);
  assert.match(html, /2nd/);
});

test("renders empty state when standings are missing", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.SETUP}
      standings={[]}
      players={[]}
      teamThemeByTeamId={new Map()}
    />
  );

  assert.match(html, /No teams have joined yet/);
});

test("uses gold accent and trophy for the leader during FINAL_RESULTS", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.FINAL_RESULTS}
      standings={teamsFixture}
      players={playersFixture}
      teamThemeByTeamId={themesFixture}
    />
  );

  assert.match(html, /Winner/);
  assert.match(html, /text-gold/);
});

// A tie at the end has no champion yet — sudden death decides it — so no bay is
// crowned. It used to read "Winner" on every tied bay, all of them at 0-0.
test("crowns nobody when the final ends tied at the top", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.FINAL_RESULTS}
      standings={teamsFixture.map((team) => ({ ...team, totalScore: 7 }))}
      players={playersFixture}
      teamThemeByTeamId={themesFixture}
    />
  );

  assert.doesNotMatch(html, /Winner/);
  assert.match(html, /Tied/);
});

test("uses flame icon glow class for the leader outside FINAL_RESULTS", () => {
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.MINIGAME_PLAY}
      standings={teamsFixture}
      players={playersFixture}
      teamThemeByTeamId={themesFixture}
    />
  );

  assert.match(html, /Leading/);
  assert.match(html, /drop-shadow/);
});

test("does set each column's name in its team's wordmark and watermark its emblem", () => {
  const themedTeams: Team[] = [
    { ...teamsFixture[0], genre: "metal" },
    { ...teamsFixture[1], genre: "country" }
  ];
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.ROUND_RESULTS}
      standings={themedTeams}
      players={playersFixture}
      teamThemeByTeamId={resolveTeamThemeById(themedTeams)}
    />
  );

  assert.match(html, /data-team-wordmark="chrome"[^>]*>Team Beta</);
  assert.match(html, /data-team-wordmark="rope"[^>]*>Team Alpha</);
  assert.match(html, /class="[^"]*opacity-\[0\.22\][^"]*"[^>]*data-team-emblem="skull-hen"/);
  assert.match(html, /class="[^"]*opacity-\[0\.14\][^"]*"[^>]*data-team-emblem="hat-horseshoe"/);
  assert.match(html, /from-teamD\/30/);
  assert.match(html, /from-teamE\/15/);
});

test("does colour a column off the theme map rather than the id hash", () => {
  const authored: Team[] = [{ ...teamsFixture[1], color: "teamG" }];
  const html = renderToStaticMarkup(
    <StandingsSurface
      phase={Phase.SETUP}
      standings={authored}
      players={[]}
      teamThemeByTeamId={resolveTeamThemeById(authored)}
    />
  );

  assert.match(html, /from-teamG\//);
  assert.match(html, /bg-teamG/);
  assert.doesNotMatch(html, /from-teamA\//);
});
