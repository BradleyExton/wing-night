import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { FappyMinigameLeg, FappyPlayerFigure } from "@wingnight/shared";

import { RelayLineup, resolveLineupState } from "./index.js";

const figure = (name: string, avatarSrc: string | null): FappyPlayerFigure => ({
  playerId: `p-${name}`,
  name,
  avatarSrc,
  teamId: "team-alpha",
  genre: "country"
});

const leg = (overrides: Partial<FappyMinigameLeg>): FappyMinigameLeg => ({
  legIndex: 0,
  player: figure("Alex", "avatars/alex.png"),
  seed: 1,
  status: "ready",
  attempt: 0,
  checkpointGate: 0,
  flapTicks: [],
  crashes: 0,
  skipped: false,
  knockedEagles: [],
  lastRun: null,
  ...overrides
});

const LEGS = [
  leg({ legIndex: 0, status: "cleared", crashes: 2 }),
  leg({ legIndex: 1, player: figure("Caitlin", null) }),
  leg({ legIndex: 2, player: figure("Steve B", null) }),
  leg({ legIndex: 3, player: null })
];

const render = (activeLegIndex: number | null, surface: "tablet" | "wall" = "tablet"): string =>
  renderToStaticMarkup(
    <RelayLineup
      legs={LEGS}
      activeLegIndex={activeLegIndex}
      activeTurnTeamId="team-alpha"
      serverOrigin="http://127.0.0.1:3000"
      surface={surface}
    />
  );

test("does mark a cleared leg and count what it cost", () => {
  const html = render(1);

  assert.match(html, /✓/);
  assert.match(html, /2×/);
  assert.match(html, /data-fappy-crashes="2"/);
  assert.match(html, /data-fappy-lineup-state="cleared"/);
});

test("does carry one face per leg in relay order", () => {
  const html = render(1);

  assert.equal((html.match(/data-fappy-lineup-chip="/g) ?? []).length, 4);
  // A head from the pack is an image, addressed against the server origin the
  // same way the corridor's bird addresses it.
  assert.match(html, /content-assets\/avatars\/alex\.png/);
  // No head in the pack, but a name: the initials, two letters at most.
  assert.match(html, /data-fappy-head="initials"/);
  assert.match(html, />SB</);
  // Nobody on the roster for the last leg: the cast's hen, never a second drawing.
  assert.match(html, /data-fappy-head="hen"/);
  assert.match(html, /data-character-body=/);
});

test("does light the leg in hand and tag the one after it as next", () => {
  const html = render(1);

  assert.match(html, /data-fappy-lineup-chip="1" data-fappy-lineup-state="flying"/);
  assert.match(html, /data-fappy-lineup-chip="2" data-fappy-lineup-state="next"/);
  assert.match(html, /data-fappy-lineup-chip="3" data-fappy-lineup-state="later"/);
  assert.match(html, /Next</);
});

test("does name the chips' players for a screen reader and on hover", () => {
  const html = render(1);

  assert.match(html, /data-fappy-lineup-player="Caitlin"/);
  assert.match(html, /Leg 2: Caitlin/);
  assert.match(html, /The house hen/);
});

test("does light nothing once the relay is over", () => {
  const html = render(null);

  assert.doesNotMatch(html, /data-fappy-lineup-state="flying"/);
  assert.doesNotMatch(html, /data-fappy-lineup-state="next"/);
});

test("does grow the same chips for the wall without a second chip style", () => {
  assert.match(render(1, "wall"), /data-fappy-lineup="wall"/);
  assert.match(render(1, "tablet"), /data-fappy-lineup="tablet"/);
  // The two strips differ by the row's font-size and nothing else: every chip
  // size below it is in `em`.
  assert.match(render(1, "wall"), /text-\[0\.75rem\]/);
  assert.match(render(1, "tablet"), /text-\[0\.5rem\]/);
});

test("does read a cleared leg as cleared even when it is the leg in hand", () => {
  assert.equal(resolveLineupState(leg({ legIndex: 0, status: "cleared" }), 0), "cleared");
  assert.equal(resolveLineupState(leg({ legIndex: 0 }), 0), "flying");
  assert.equal(resolveLineupState(leg({ legIndex: 1 }), 0), "next");
  assert.equal(resolveLineupState(leg({ legIndex: 2 }), 0), "later");
  assert.equal(resolveLineupState(leg({ legIndex: 2 }), null), "later");
});
