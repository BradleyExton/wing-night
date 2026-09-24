import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveHashedTeamColorToken,
  resolveTeamColorVariantByToken
} from "@wingnight/cast";
import type { Team } from "@wingnight/shared";

import { resolveGenreFontSrcs, resolveTeamTheme, resolveTeamThemeById } from "./index";

const buildTeam = (overrides: Partial<Team> & Pick<Team, "id">): Team => ({
  name: overrides.id,
  playerIds: [],
  totalScore: 0,
  ...overrides
});

test("does expand a genre to its whole kit when the team names one", () => {
  const theme = resolveTeamTheme(buildTeam({ id: "team-1", genre: "metal" }));

  assert.equal(theme.genre, "metal");
  assert.equal(theme.colorToken, "teamD");
  assert.deepEqual(theme.colorVariant, resolveTeamColorVariantByToken("teamD"));
  assert.equal(theme.fontClassName, "font-genre-metal");
  assert.equal(theme.wordmark, "chrome");
  assert.equal(theme.emblem, "skull-hen");
  assert.equal(theme.texture, "lightning");
  assert.equal(theme.entrance, "slam");
  assert.equal(theme.apparel, undefined);
  assert.equal(theme.silhouette, "spiky");
});

test("does fold the pack's four genres into the kits the board decided", () => {
  const themes = resolveTeamThemeById([
    buildTeam({ id: "team-1", genre: "metal" }),
    buildTeam({ id: "team-2", genre: "pop" }),
    buildTeam({ id: "team-3", genre: "country" }),
    buildTeam({ id: "team-4", genre: "disco" })
  ]);

  assert.deepEqual(
    [...themes.values()].map((theme) => [
      theme.colorToken,
      theme.wordmark,
      theme.emblem,
      theme.texture,
      theme.entrance,
      theme.apparel,
      theme.silhouette,
      theme.dance
    ]),
    [
      // One carrier each: three teams are shaped, and pop — the origin of the
      // shape axis — is the one that moves and wears something instead.
      ["teamD", "chrome", "skull-hen", "lightning", "slam", undefined, "spiky", undefined],
      ["teamH", "candy", "star-mic", "confetti", "bounce", "shades", undefined, "bounce"],
      ["teamE", "rope", "hat-horseshoe", "woodgrain", "swing", undefined, "broody", undefined],
      ["teamB", "neon", "mirrorball", "lightdots", "spin", undefined, "preener", undefined]
    ]
  );
});

test("does render the none kit for a team with no genre so nothing changes on screen", () => {
  const team = buildTeam({ id: "team-9" });
  const theme = resolveTeamTheme(team);

  assert.equal(theme.genre, "none");
  assert.equal(theme.colorToken, resolveHashedTeamColorToken("team-9"));
  assert.equal(theme.fontClassName, "font-sans");
  assert.equal(theme.wordmark, "plain");
  assert.equal(theme.emblem, null);
  assert.equal(theme.texture, null);
  assert.equal(theme.entrance, "beat");
  assert.equal(theme.apparel, undefined);
});

test("does let an authored colour beat the genre default when the team carries one", () => {
  const theme = resolveTeamTheme(buildTeam({ id: "team-1", genre: "metal", color: "teamG" }));

  assert.equal(theme.colorToken, "teamG");
  assert.equal(theme.colorVariant.dotAccentClassName, "bg-teamG");
});

test("does fall back to the id hash when neither colour nor genre decides", () => {
  const theme = resolveTeamTheme(buildTeam({ id: "team-alpha", genre: "polka" }));

  assert.equal(theme.colorToken, resolveHashedTeamColorToken("team-alpha"));
});

test("does move a later team onto the next free token when its colour is already taken", () => {
  // `folk` resolves to country, and `grunge` to rock, so both pairs want a
  // token an earlier team already holds.
  const themes = resolveTeamThemeById([
    buildTeam({ id: "team-1", genre: "country" }),
    buildTeam({ id: "team-2", genre: "folk" }),
    buildTeam({ id: "team-3", genre: "rock" }),
    buildTeam({ id: "team-4", genre: "grunge" })
  ]);

  assert.equal(themes.get("team-1")?.colorToken, "teamE");
  assert.equal(themes.get("team-2")?.colorToken, "teamF");
  assert.equal(themes.get("team-3")?.colorToken, "teamA");
  assert.equal(themes.get("team-4")?.colorToken, "teamB");
});

test("does wrap the collision walk past H back to A when the tail is full", () => {
  const themes = resolveTeamThemeById([
    buildTeam({ id: "team-1", color: "teamH" }),
    buildTeam({ id: "team-2", color: "teamH" })
  ]);

  assert.equal(themes.get("team-2")?.colorToken, "teamA");
});

test("does never share a colour among eight teams however they collide", () => {
  const teams = Array.from({ length: 8 }, (_, index) =>
    buildTeam({ id: `team-${index + 1}`, genre: "metal" })
  );
  const tokens = [...resolveTeamThemeById(teams).values()].map((theme) => theme.colorToken);

  assert.equal(new Set(tokens).size, 8);
});

test("does theme a team by its seat when it is resolved among the roster", () => {
  // Rock and classical are the one pair that share a default token (nine
  // genres, eight accents), so the second of them is what the collision pass
  // has to move — and moving it is exactly what seat-awareness buys.
  const teams = [
    buildTeam({ id: "team-1", genre: "rock" }),
    buildTeam({ id: "team-2", genre: "classical" })
  ];

  assert.equal(resolveTeamTheme(teams[1], teams).colorToken, "teamB");
  assert.equal(resolveTeamTheme(teams[1]).colorToken, "teamA");
});

// The marquee's own two faces (Monoton, Anton) lead the list on every roster;
// a disco team's Monoton is not listed a second time behind them.
test("does list the marquee's faces, then each roster face once, skipping genreless teams", () => {
  const fontSrcs = resolveGenreFontSrcs([
    { genre: "metal" },
    { genre: "heavy metal" },
    { genre: "disco" },
    {}
  ]);

  assert.deepEqual(fontSrcs, [
    "/fonts/monoton/monoton-latin.woff2",
    "/fonts/anton/anton-latin.woff2",
    "/fonts/metal-mania/metal-mania-latin.woff2"
  ]);
});
