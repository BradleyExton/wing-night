import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Team } from "@wingnight/shared";

import { resolveTeamTheme } from "../../utils/resolveTeamTheme";
import { TeamWordmark } from "./index";

const buildTeam = (genre?: string): Team => ({
  id: "team-1",
  name: "Molten Metal",
  playerIds: [],
  totalScore: 0,
  ...(genre === undefined ? {} : { genre })
});

test("does set the genre face, the tint and the treatment when the team has a genre", () => {
  const theme = resolveTeamTheme(buildTeam("metal"));
  const html = renderToStaticMarkup(
    <TeamWordmark name="Molten Metal" theme={theme} sizeClassName="text-9xl" />
  );

  assert.match(html, /data-team-wordmark="chrome"/);
  assert.match(html, /font-genre-metal/);
  assert.match(html, /\[--tint:theme\(colors\.teamD\)\]/);
  assert.match(html, /team-wordmark-chrome/);
  assert.match(html, /text-9xl/);
  assert.match(html, />Molten Metal</);
  assert.doesNotMatch(html, /team-enter/);
});

test("does play the genre's entrance beat only when asked", () => {
  const theme = resolveTeamTheme(buildTeam("disco"));
  const html = renderToStaticMarkup(
    <TeamWordmark name="Disco Inferno" theme={theme} sizeClassName="text-9xl" entrance />
  );

  assert.match(html, /team-enter team-enter-spin/);
});

test("does render plain house type for a team with no genre", () => {
  const theme = resolveTeamTheme(buildTeam());
  const html = renderToStaticMarkup(
    <TeamWordmark name="Team Heat" theme={theme} sizeClassName="text-9xl text-primary" />
  );

  assert.match(html, /data-team-wordmark="plain"/);
  assert.match(html, /font-sans/);
  assert.doesNotMatch(html, /team-wordmark-/);
  assert.match(html, /text-primary/);
});
