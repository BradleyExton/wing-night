import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { Player, Team } from "@wingnight/shared";

import { CHARACTER_FOOTWORKS, resolveCharacterGrooveClassName } from "@wingnight/cast";

import { resolveTeamThemeById } from "../../../../../utils/resolveTeamTheme";
import { CastParade } from "./index";
import * as styles from "./styles";

const players: Player[] = [
  { id: "player-1", name: "Alex" },
  { id: "player-2", name: "Morgan" },
  { id: "player-3", name: "Sam" },
  { id: "player-4", name: "Jo" }
];

const teams: Team[] = [
  { id: "team-alpha", name: "Team Alpha", playerIds: ["player-1", "player-4"], totalScore: 0, genre: "metal" },
  { id: "team-beta", name: "Team Beta", playerIds: ["player-2"], totalScore: 0 }
];

const themes = resolveTeamThemeById(teams);

const renderParade = (paradePlayers: Player[], paradeTeams: Team[] = teams): string => {
  return renderToStaticMarkup(
    <CastParade
      players={paradePlayers}
      teams={paradeTeams}
      teamThemeByTeamId={resolveTeamThemeById(paradeTeams)}
    />
  );
};

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const countMembers = (html: string): number => {
  return (html.match(/data-cast-member="/g) ?? []).length;
};

test("does put the first two groups on the floor, one a side, and hold the rest for a later pair", () => {
  const html = renderParade(players);

  assert.match(html, /data-cast-parade/);
  assert.match(html, /aria-hidden/);
  assert.match(html, /data-cast-group="team-alpha" data-cast-side="left"/);
  assert.match(html, /data-cast-group="team-beta" data-cast-side="right"/);
  assert.equal(countMembers(html), 3);
  assert.doesNotMatch(html, /data-cast-member="player-3"/, "the unseated group waits its turn");
});

test("does stage both groups off their own edges, walking, before the first frame moves them", () => {
  const html = renderParade(players);

  assert.match(html, /data-cast-parade-phase="staged"/);
  assert.match(html, new RegExp(`class="[^"]*${styles.groupLeftOffstage}[^"]*" data-cast-group="team-alpha"`));
  assert.match(html, new RegExp(`class="[^"]*${styles.groupRightOffstage}[^"]*" data-cast-group="team-beta"`));
  assert.doesNotMatch(html, /translate-x-\[6vw\]/);
  assert.equal((html.match(/data-character-pose="walk"/g) ?? []).length, 3);
});

test("does face the right-hand group left so it walks in towards the floor", () => {
  const html = renderParade(players);

  // The ground and the bird each carry the mirror; the member they share is
  // never transformed, so it never stacks on its own.
  assert.match(
    html,
    new RegExp(
      `data-cast-member="player-2"><span class="${escapeForRegExp(styles.ground)} ${escapeForRegExp(styles.facingLeft)}">[^]*?<span class="${escapeForRegExp(styles.bird)} z-\\[\\d+\\] ${escapeForRegExp(styles.facingLeft)}">`
    )
  );
  assert.match(html, new RegExp(`data-cast-group="team-alpha"[^]*?class="${styles.member} [^"]*" data-cast-member="player-1"`));
  assert.doesNotMatch(
    html,
    new RegExp(`data-cast-member="player-1"><span class="[^"]*${escapeForRegExp(styles.facingLeft)}`)
  );
});

// Dressed for the wardrobe's showpieces (docs/research/bird-wardrobe.md §2.6).
const dressedPlayers: Player[] = [
  { id: "player-1", name: "Alex" },
  {
    id: "player-2",
    name: "Morgan",
    outfits: { metal: { prop: { item: "flying-v-b", style: "white" } } }
  },
  { id: "player-3", name: "Sam" },
  { id: "player-4", name: "Jo" },
  { id: "player-5", name: "Kit", outfits: { metal: { stage: { item: "lava-disc-c" } } } }
];

const dressedTeams: Team[] = [
  {
    id: "team-alpha",
    name: "Team Alpha",
    playerIds: ["player-1", "player-2", "player-3", "player-4", "player-5"],
    totalScore: 0,
    genre: "metal"
  }
];

const memberClassName = (html: string, playerId: string): string =>
  new RegExp(`class="([^"]*)" data-cast-member="${playerId}"`).exec(html)?.[1] ?? "";

test("does give a bird with a Prop or a Stage room either side of it in the huddle", () => {
  const html = renderParade(dressedPlayers, dressedTeams);

  assert.doesNotMatch(memberClassName(html, "player-1"), /-ml-/, "the first bird tucks in behind nobody");
  assert.match(memberClassName(html, "player-2"), new RegExp(escapeForRegExp(styles.memberOverlapShowpiece)));
  assert.match(memberClassName(html, "player-3"), new RegExp(escapeForRegExp(styles.memberOverlapShowpiece)));
  assert.match(memberClassName(html, "player-4"), new RegExp(escapeForRegExp(styles.memberOverlapTight)));
  assert.match(memberClassName(html, "player-5"), new RegExp(escapeForRegExp(styles.memberOverlapShowpiece)));
});

// A tail or a Prop is out at a bird's back; the face is at its front. In a
// huddle the bird behind's face must paint over the bird in front's back.
test("does paint each bird's face over the back of the bird in front of it", () => {
  const html = renderParade(dressedPlayers, dressedTeams);
  const depthOf = (playerId: string): number =>
    Number(new RegExp(`data-cast-member="${playerId}"[^]*?class="${escapeForRegExp(styles.bird)} z-\\[(\\d+)\\]`).exec(html)?.[1]);

  // The left group faces right, so its front bird is its last.
  assert.ok(depthOf("player-1") > depthOf("player-2"));
  assert.ok(depthOf("player-4") > depthOf("player-5"));
  // Every ground lies under every bird.
  assert.match(styles.ground, /\bz-0\b/);
  assert.ok(depthOf("player-5") >= 1);
});

test("does lay a worn Stage in the ground under the bird, in the shadow pool's place", () => {
  const html = renderParade(dressedPlayers, dressedTeams);

  assert.match(
    html,
    new RegExp(`data-cast-member="player-5"[^>]*><span class="${escapeForRegExp(styles.ground)} ?"><svg[^>]*data-character-stage`)
  );
  assert.doesNotMatch(
    html,
    new RegExp(`data-cast-member="player-5"[^>]*><span class="${escapeForRegExp(styles.ground)} ?"><span class="${escapeForRegExp(styles.shadow)}"`)
  );
});

test("does play no Move before the pair is dancing to the room's beat", () => {
  const html = renderParade(dressedPlayers, dressedTeams);

  assert.doesNotMatch(html, /data-cast-move=/);
  assert.doesNotMatch(html, /data-character-move=/);
});

test("does hand every bird its own groove, so the floor is not one animal on one clock", () => {
  const html = renderParade(players);
  const worn = CHARACTER_FOOTWORKS.filter((footwork) => html.includes(footwork));

  assert.ok(worn.length > 1, "the whole floor wore one footwork");
  assert.match(
    html,
    new RegExp(`class="[^"]*${escapeForRegExp(resolveCharacterGrooveClassName("Alex"))}[^"]*" data-cast-member="player-1"`)
  );
});

// What the birds DO once they are dancing — the jig layer and its quick
// feet — is the cast's, and is tested against the figure that draws it
// (`packages/cast/src/Character`). What the parade owns is which groove each
// bird wears and what wraps it, which is what a first frame shows.
test("does wrap every bird in a bounce layer inside its mirror, so it keeps facing the room", () => {
  const html = renderParade(players);

  assert.match(
    html,
    new RegExp(
      `data-cast-member="player-2">[^]*?<span class="${escapeForRegExp(styles.bird)} z-\\[\\d+\\] ${escapeForRegExp(styles.facingLeft)}"><span class="${escapeForRegExp(styles.jive)}"`
    )
  );
  // Walking on, the group's own transform carries the birds and nothing
  // wobbles under it — the bird's bounce timings are set on it, but the
  // bounce itself is not running.
  assert.doesNotMatch(html, /animation:cast-jive/);
});

// The pool of shade is what puts a bird ON the deck rather than in front of it
// (DESIGN.md §2.2C). It has to hang OUTSIDE the bounce layer: inside it, the
// shadow would hop with the bird and ground nothing.
test("does give every bird a pool of shade that sits outside its bounce layer", () => {
  const html = renderParade(players);

  assert.match(
    html,
    new RegExp(
      `data-cast-member="player-2"><span class="${escapeForRegExp(styles.ground)} ${escapeForRegExp(styles.facingLeft)}"><span class="${escapeForRegExp(styles.shadow)}"></span></span><span class="${escapeForRegExp(styles.bird)} [^"]*"><span class="${escapeForRegExp(styles.jive)}"`
    )
  );
  // Walking on, the pool is as still as the bird is.
  assert.doesNotMatch(html, /animation:cast-jive-shadow/);
});

test("does colour a group by its team accent and dress it in the genre's apparel", () => {
  const html = renderParade(players);
  const alphaFill = themes.get("team-alpha")?.colorVariant.characterFillClassName;
  const betaFill = themes.get("team-beta")?.colorVariant.characterFillClassName;

  assert.equal(alphaFill, "text-teamD");
  assert.match(html, new RegExp(`data-cast-member="player-1"[^]*?${alphaFill}`));
  assert.match(html, new RegExp(`data-cast-member="player-1"[^]*?data-character-silhouette="spiky"`));
  assert.match(html, new RegExp(`data-cast-member="player-2"[^]*?${betaFill}`));
  assert.doesNotMatch(html, /data-cast-member="player-2"[^]*?data-character-apparel/);
});

test("does parade the unseated as a muted group of their own when nobody has a team", () => {
  const html = renderParade(players, []);

  assert.match(html, /data-cast-group="unseated" data-cast-side="left"/);
  assert.equal(countMembers(html), players.length);
  assert.match(html, new RegExp(`data-cast-member="player-1"[^]*?${styles.unassignedFill}`));
});

test("does put one group in the middle of the floor at a time when the lineup is solo", () => {
  const html = renderToStaticMarkup(
    <CastParade players={players} teams={teams} teamThemeByTeamId={themes} lineup="solo" />
  );

  assert.match(html, /data-cast-group="team-alpha" data-cast-side="left"/);
  assert.doesNotMatch(html, /data-cast-group="team-beta"/, "the second team waits for its own cycle");
  assert.equal(countMembers(html), 2);
  // Staged off the left edge, from where it walks to the centre line.
  assert.match(
    html,
    new RegExp(`class="${escapeForRegExp(styles.groupSolo)} ${escapeForRegExp(styles.groupSoloLeftOffstage)}" data-cast-group="team-alpha"`)
  );
  assert.doesNotMatch(html, new RegExp(escapeForRegExp(styles.groupLeftOffstage)));
});

test("does render nothing when the roster is empty", () => {
  assert.equal(renderParade([]), "");
});
