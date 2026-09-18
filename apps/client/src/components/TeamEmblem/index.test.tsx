import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { EMBLEM_IDS, type Team, type TeamTheme } from "@wingnight/shared";

import { resolveTeamTheme } from "../../utils/resolveTeamTheme";
import { TeamEmblem } from "./index";

const buildTeam = (genre?: string): Team => ({
  id: "team-1",
  name: "Team",
  playerIds: [],
  totalScore: 0,
  ...(genre === undefined ? {} : { genre })
});

test("does draw the genre's emblem in the team colour at the caller's size", () => {
  const theme = resolveTeamTheme(buildTeam("metal"));
  const html = renderToStaticMarkup(<TeamEmblem theme={theme} sizeClassName="h-12" />);

  assert.match(html, /<svg[^>]*data-team-emblem="skull-hen"/);
  assert.match(html, /text-teamD/);
  assert.match(html, /h-12/);
  assert.match(html, /aria-hidden/);
  assert.match(html, /fill-current/);
});

test("does render nothing for a team whose kit has no emblem", () => {
  const html = renderToStaticMarkup(
    <TeamEmblem theme={resolveTeamTheme(buildTeam())} sizeClassName="h-12" />
  );

  assert.equal(html, "");
});

test("does have a drawing for every emblem id the vocabulary names", () => {
  const baseTheme = resolveTeamTheme(buildTeam("metal"));

  for (const emblem of EMBLEM_IDS) {
    const theme: TeamTheme = { ...baseTheme, emblem };
    const html = renderToStaticMarkup(<TeamEmblem theme={theme} sizeClassName="h-12" />);

    assert.match(html, new RegExp(`data-team-emblem="${emblem}"`));
    assert.match(html, /<(path|rect|circle)/);
  }
});
