import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Player, Team } from "@wingnight/shared";

import { resolveTeamTheme } from "../../../../utils/resolveTeamTheme";
import { MinigameIntroStageBody } from "./index";

const players: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Chris" }
];

const buildTeam = (genre?: string): Team => ({
  id: "team-1",
  name: "Team Heat",
  playerIds: players.map((player) => player.id),
  totalScore: 0,
  ...(genre === undefined ? {} : { genre })
});

test("renders the team-first reveal with the genre kit, the lineup and the minigame", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      activeTeamName="Team Heat"
      activeTeamGenre="metal"
      activeTeamTheme={resolveTeamTheme(buildTeam("metal"))}
      activeTeamPlayers={players}
      minigameType="TRIVIA"
    />
  );

  assert.match(html, /on the wings/);
  assert.match(html, /metal/);
  assert.match(html, /data-team-ambient="lightning"/);
  assert.match(html, /data-team-emblem="skull-hen"/);
  assert.match(html, /data-team-wordmark="chrome"[^>]*>Team Heat</);
  assert.match(html, /team-enter team-enter-slam/);
  assert.match(html, /data-team-lineup/);
  assert.equal((html.match(/data-lineup-member="/g) ?? []).length, 3);
  assert.match(html, /data-character-silhouette="spiky"/);
  assert.match(html, /playing/);
  assert.match(html, /TRIVIA/);
});

test("falls back to placeholder labels when team and minigame data are missing", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      activeTeamName={null}
      activeTeamGenre={null}
      activeTeamTheme={null}
      activeTeamPlayers={[]}
      minigameType={null}
    />
  );

  assert.match(html, /Next Team/);
  assert.match(html, /Pending/);
  assert.doesNotMatch(html, /data-team-lineup|data-team-ambient|data-team-emblem/);
});

// The "identical to today when absent" half of the genre line: a team with no
// genre must not render a stray separator next to the eyebrow, and its name
// keeps the primary headline rather than a treatment.
test("renders the eyebrow alone and a plain primary headline for a team with no genre", () => {
  const html = renderToStaticMarkup(
    <MinigameIntroStageBody
      activeTeamName="Team Heat"
      activeTeamGenre={null}
      activeTeamTheme={resolveTeamTheme(buildTeam())}
      activeTeamPlayers={players}
      minigameType="TRIVIA"
    />
  );

  assert.match(html, /on the wings<\/span>/);
  assert.match(html, /class="[^"]*text-primary[^"]*"[^>]*data-team-wordmark="plain"/);
  assert.doesNotMatch(html, /data-team-ambient|data-team-emblem/);
  assert.match(html, /data-team-lineup/);
});
