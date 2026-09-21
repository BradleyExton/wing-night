import assert from "node:assert/strict";
import test from "node:test";
import type { Player, Team } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { resolveTeamThemeById } from "../../../utils/resolveTeamTheme";
import { CompactSummarySurface } from "./index";

const standingsFixture: Team[] = [
  {
    // Hashes to `teamG`; its metal kit is `teamD`.
    id: "team-alpha",
    name: "Team Alpha",
    genre: "metal",
    playerIds: ["player-1", "player-2", "player-3"],
    totalScore: 8
  },
  {
    id: "team-beta",
    name: "Team Beta",
    genre: "disco",
    playerIds: ["player-4"],
    totalScore: 5
  }
];

const playersFixture: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Sam" },
  { id: "player-4", name: "Jules" }
];

test("renders standings snapshot in the compact view", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      sortedStandings={standingsFixture}
      players={playersFixture}
      teamThemeByTeamId={resolveTeamThemeById(standingsFixture)}
    />
  );

  assert.match(html, /Standings Snapshot/);
  assert.doesNotMatch(html, /Phase Status/);
  assert.doesNotMatch(html, /Round Context/);
  assert.doesNotMatch(html, /Next Action/);
  assert.match(html, /Leader/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /Alex, Morgan \+1/);
  assert.match(html, /Jules/);
});

test("renders fallback label when standings are unavailable", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      sortedStandings={[]}
      players={[]}
      teamThemeByTeamId={new Map()}
    />
  );

  assert.match(html, /No teams available for standings yet\./);
});

test("does paint the standings dot its genre colour, not the id hash", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      sortedStandings={standingsFixture}
      players={playersFixture}
      teamThemeByTeamId={resolveTeamThemeById(standingsFixture)}
    />
  );

  assert.match(html, /bg-teamD/);
  assert.match(html, /bg-teamB\b/);
  assert.doesNotMatch(html, /bg-teamG/);
  assert.doesNotMatch(html, /bg-teamA\b/);
});
