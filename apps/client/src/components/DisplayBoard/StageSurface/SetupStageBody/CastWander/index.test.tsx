import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Player, Team } from "@wingnight/shared";

import { resolveTeamColorVariant } from "@wingnight/cast";
import { CastWander } from "./index";
import * as styles from "./styles";

const players: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Sam" }
];

const teams: Team[] = [
  { id: "team-alpha", name: "Team Alpha", playerIds: ["player-1"], totalScore: 0, genre: "metal" },
  { id: "team-beta", name: "Team Beta", playerIds: ["player-2"], totalScore: 0 }
];

const countMembers = (html: string): number => {
  return (html.match(/data-cast-member="/g) ?? []).length;
};

test("does render one character per player when the roster has players", () => {
  const html = renderToStaticMarkup(<CastWander players={players} teams={teams} />);

  assert.equal(countMembers(html), players.length);
  assert.match(html, /data-cast-wander/);
  assert.match(html, /aria-hidden/);
});

test("does colour a seated player by its team accent and leave an unassigned player muted", () => {
  const html = renderToStaticMarkup(<CastWander players={players} teams={teams} />);
  const alphaFill = resolveTeamColorVariant("team-alpha").characterFillClassName;
  const betaFill = resolveTeamColorVariant("team-beta").characterFillClassName;

  assert.match(html, new RegExp(`data-cast-member="player-1"[^]*?${alphaFill}`));
  assert.match(html, new RegExp(`data-cast-member="player-2"[^]*?${betaFill}`));
  assert.match(html, new RegExp(`data-cast-member="player-3"[^]*?${styles.unassignedFill}`));
});

test("does dress a player in the team genre's apparel and leave a genreless team bare", () => {
  const html = renderToStaticMarkup(<CastWander players={players} teams={teams} />);

  assert.match(html, /data-cast-member="player-1"[^]*?data-character-apparel="collar"/);
  assert.doesNotMatch(html, /data-cast-member="player-2"[^]*?data-character-apparel[^]*?data-cast-member="player-3"/);
});

test("does render nothing when the roster is empty", () => {
  const html = renderToStaticMarkup(<CastWander players={[]} teams={teams} />);

  assert.equal(html, "");
});

test("does wrap onto the lane list when the roster is longer than it", () => {
  const bigRoster: Player[] = Array.from({ length: styles.lanes.length + 2 }, (_, index) => ({
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`
  }));
  const html = renderToStaticMarkup(<CastWander players={bigRoster} teams={[]} />);

  assert.equal(countMembers(html), styles.lanes.length + 2);
});
