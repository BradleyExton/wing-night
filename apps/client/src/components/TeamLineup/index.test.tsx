import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Player, Team } from "@wingnight/shared";

import { resolveTeamTheme } from "../../utils/resolveTeamTheme";
import { TeamLineup } from "./index";

const players: Player[] = [
  { id: "player-1", name: "Rob" },
  { id: "player-2", name: "Dan", avatarSrc: "avatars/dan.png" }
];

const buildTeam = (genre?: string): Team => ({
  id: "team-1",
  name: "Molten Metal",
  playerIds: players.map((player) => player.id),
  totalScore: 0,
  ...(genre === undefined ? {} : { genre })
});

test("does stand one bird per player in the team colour wearing the genre's apparel", () => {
  const theme = resolveTeamTheme(buildTeam("metal"));
  const html = renderToStaticMarkup(
    <TeamLineup players={players} theme={theme} sizeClassName="h-40" />
  );

  assert.match(html, /data-team-lineup/);
  assert.match(html, /h-40/);
  assert.equal((html.match(/data-lineup-member="/g) ?? []).length, 2);
  assert.equal((html.match(/data-character-silhouette="spiky"/g) ?? []).length, 2);
  assert.equal((html.match(/text-teamD/g) ?? []).length, 2);
});

test("does leave a genreless team's birds bare", () => {
  const theme = resolveTeamTheme(buildTeam());
  const html = renderToStaticMarkup(
    <TeamLineup players={players} theme={theme} sizeClassName="h-40" />
  );

  assert.doesNotMatch(html, /data-character-apparel/);
});

test("does render nothing when the team has no players", () => {
  const theme = resolveTeamTheme(buildTeam("metal"));

  assert.equal(renderToStaticMarkup(<TeamLineup players={[]} theme={theme} sizeClassName="h-40" />), "");
});
