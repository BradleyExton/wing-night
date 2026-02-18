import assert from "node:assert/strict";
import test from "node:test";
import type { Team } from "@wingnight/shared";
import { renderToStaticMarkup } from "react-dom/server";

import { CompactSummarySurface } from "./index";

const standingsFixture: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-1"],
    totalScore: 8
  },
  {
    id: "team-beta",
    name: "Team Beta",
    playerIds: ["player-2"],
    totalScore: 5
  }
];

test("renders standings snapshot during ROUND_INTRO", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      sortedStandings={standingsFixture}
    />
  );

  assert.match(html, /Standings Snapshot/);
  assert.doesNotMatch(html, /Phase Status/);
  assert.doesNotMatch(html, /Round Context/);
  assert.doesNotMatch(html, /Next Action/);
  assert.match(html, /Leader/);
  assert.match(html, /Team Alpha/);
});

test("renders fallback label when standings are unavailable", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      sortedStandings={[]}
    />
  );

  assert.match(html, /No teams available for standings yet\./);
});
