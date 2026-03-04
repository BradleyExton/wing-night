import assert from "node:assert/strict";
import test from "node:test";
import type { Player, Team } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { CompactSummarySurface } from "./index";

const standingsFixture: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-1", "player-2", "player-3"],
    totalScore: 8
  },
  {
    id: "team-beta",
    name: "Team Beta",
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

test("renders standings snapshot during ROUND_INTRO", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      sortedStandings={standingsFixture}
      players={playersFixture}
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
    />
  );

  assert.match(html, /No teams available for standings yet\./);
});
