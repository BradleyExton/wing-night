import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Team } from "@wingnight/shared";

import { resolveTeamTheme } from "../../utils/resolveTeamTheme";
import { TeamAmbient } from "./index";

const buildTeam = (genre?: string): Team => ({
  id: "team-1",
  name: "Team",
  playerIds: [],
  totalScore: 0,
  ...(genre === undefined ? {} : { genre })
});

test("does lay the genre's texture behind the body in the team tint", () => {
  const html = renderToStaticMarkup(<TeamAmbient theme={resolveTeamTheme(buildTeam("country"))} />);

  assert.match(html, /data-team-ambient="woodgrain"/);
  assert.match(html, /team-ambient team-ambient-woodgrain|team-ambient-woodgrain/);
  assert.match(html, /\[--tint:theme\(colors\.teamE\)\]/);
  assert.match(html, /aria-hidden/);
  assert.doesNotMatch(html, /opacity-50/);
});

test("does drop to half strength when the team is context rather than headline", () => {
  const html = renderToStaticMarkup(
    <TeamAmbient theme={resolveTeamTheme(buildTeam("pop"))} strength="half" />
  );

  assert.match(html, /opacity-50/);
});

test("does render nothing for a kit without a texture", () => {
  assert.equal(renderToStaticMarkup(<TeamAmbient theme={resolveTeamTheme(buildTeam("classical"))} />), "");
  assert.equal(renderToStaticMarkup(<TeamAmbient theme={resolveTeamTheme(buildTeam())} />), "");
});
