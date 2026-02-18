import assert from "node:assert/strict";
import test from "node:test";
import { Phase, type Team } from "@wingnight/shared";
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

test("renders only standings snapshot during ROUND_INTRO", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      phase={Phase.ROUND_INTRO}
      currentRound={2}
      totalRounds={4}
      currentRoundConfig={{
        round: 2,
        label: "Medium",
        sauce: "Buffalo",
        pointsPerPlayer: 3,
        minigame: "TRIVIA"
      }}
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

test("renders fallback labels when round context and standings are unavailable", () => {
  const html = renderToStaticMarkup(
    <CompactSummarySurface
      phase={Phase.INTRO}
      currentRound={0}
      totalRounds={4}
      currentRoundConfig={null}
      sortedStandings={[]}
    />
  );

  assert.match(html, /Round details are not available for this phase yet\./);
  assert.match(html, /No teams available for standings yet\./);
});
