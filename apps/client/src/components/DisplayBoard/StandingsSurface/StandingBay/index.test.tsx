import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Team } from "@wingnight/shared";

import { resolveTeamThemeById } from "../../../../utils/resolveTeamTheme";
import { resolveTeamTheme } from "../../../../utils/resolveTeamTheme";
import { StandingBay } from "./index";

const team: Team = {
  id: "team-beta",
  name: "Team Beta",
  playerIds: ["player-1"],
  totalScore: 12,
  genre: "metal"
};

const theme = resolveTeamThemeById([team]).get(team.id) ?? resolveTeamTheme(team);

const renderBay = (overrides: { isLeader?: boolean; isWinner?: boolean } = {}): string =>
  renderToStaticMarkup(
    <StandingBay
      name={team.name}
      score={team.totalScore}
      theme={theme}
      isLeader={overrides.isLeader ?? false}
      isWinner={overrides.isWinner ?? false}
      metaLabel="2nd"
    />
  );

test("does cut the team's name and score into the panel in its own wordmark", () => {
  const html = renderBay();

  assert.match(html, /data-team-wordmark="chrome"[^>]*>Team Beta</);
  assert.match(html, /2nd/);
  assert.match(html, />12</);
});

test("does reserve two lines for the name, so every bay's rank label lands on one line", () => {
  const html = renderBay();

  // The reserve is expressed in the wordmark's own size, set on the bay, so a
  // one-line name and a two-line name leave the band exactly as tall.
  assert.match(html, /--wn-bay-name:/);
  assert.match(html, /min-h-\[calc\(var\(--wn-bay-name\)\*2\.1\)\]/);
});

test("does run the leader's stretch of the deck lip gold", () => {
  const trailing = renderBay();
  const leading = renderBay({ isLeader: true });

  assert.doesNotMatch(trailing, /bg-gold/);
  assert.doesNotMatch(trailing, /text-gold/);
  assert.match(leading, /bg-gold/);
  assert.match(leading, /text-gold/);
});

test("does watermark the emblem brighter for the leader than for the rest", () => {
  assert.match(renderBay(), /opacity-\[0\.14\][^>]*data-team-emblem="skull-hen"/);
  assert.match(renderBay({ isLeader: true }), /opacity-\[0\.22\][^>]*data-team-emblem="skull-hen"/);
});
