import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { JoustPlayerFigure } from "@wingnight/shared";
import { JOUST_PIN_HEAD_RADIUS, JOUST_PIN_HEIGHT } from "@wingnight/shared";
import { CHARACTER_HEAD_RADIUS, CHARACTER_STAND_HEIGHT } from "@wingnight/cast";

import { ArenaHen } from "./index.js";

const FIGURE: JoustPlayerFigure = {
  playerId: "p1",
  name: "Rosie",
  avatarSrc: "avatars/rosie.png",
  teamId: "team-molten",
  genre: "Metal"
};

const render = (props: Partial<Parameters<typeof ArenaHen>[0]> = {}): string =>
  renderToStaticMarkup(
    <svg>
      <ArenaHen
        figure={FIGURE}
        foot={{ x: 100, y: 76.4 }}
        head={{ x: 100, y: 76.4 - JOUST_PIN_HEIGHT }}
        serverOrigin="http://127.0.0.1:3000"
        facing={-1}
        {...props}
      />
    </svg>
  );

// The comment in `world/` promises these two are the same creature. This is what holds it: the
// bird is scaled by its stand height, so the head the room sees has to come out the size of the
// head the integrator collides against.
test("does draw a head the size of the one the physics collides against", () => {
  const drawnHeadRadius = (JOUST_PIN_HEIGHT / CHARACTER_STAND_HEIGHT) * CHARACTER_HEAD_RADIUS;

  assert.ok(
    Math.abs(drawnHeadRadius - JOUST_PIN_HEAD_RADIUS) < 0.25,
    `drawn head is ${drawnHeadRadius.toFixed(2)}, pin head is ${JOUST_PIN_HEAD_RADIUS}`
  );
});

test("does wear the player's generated head, addressed against the server origin", () => {
  assert.match(render(), /href="http:\/\/127\.0\.0\.1:3000\/content-assets\/avatars\/rosie\.png"/);
});

test("does paint the bird in its own team's colour", () => {
  assert.match(render(), /class="text-team[A-H]"/);
});

// The arena bird wears a generated head, so nothing may perch on its face
// (cast `CharacterFigure`) — which is most of why a genre is carried by the
// bird's own outline now rather than by a prop.
test("does wear the team's genre shape", () => {
  assert.match(render(), /data-character-silhouette="spiky"/);
});

// The two halves of standing a bird on a pin: WHERE (the outer matrix, built from the two body
// centres) and WHICH WAY IT LOOKS (the inner mirror). Matched loosely on purpose — the digits are
// floating-point noise, and pinning them would only break on the next tweak to the lane.
const outerMatrix = (html: string): number[] => {
  const matched = /transform="matrix\(([^)]+)\)"/.exec(html);

  assert.ok(matched !== null, "the bird should be placed by a matrix");
  return (matched[1] ?? "").split(" ").map(Number);
};

test("does stand an upright pin's bird straight up on the pin's own foot", () => {
  const [a, b, , , e, f] = outerMatrix(render());

  assert.ok(Math.abs((a ?? 0) - 1) < 1e-6 && Math.abs(b ?? 0) < 1e-6, "no lean");
  assert.equal(e, 100);
  assert.equal(f, 76.4);
});

test("does mirror a lane bird to face the incoming shot, and leave a bench bird facing away", () => {
  assert.match(render({ facing: -1 }), /scale\(-0\.\d+ 0\.\d+\) translate\(-38 -71\)/);
  assert.match(render({ facing: 1 }), /scale\(0\.\d+ 0\.\d+\) translate\(-38 -71\)/);
});

test("does lean the bird over when its pin is on its way down", () => {
  const [a, b] = outerMatrix(render({ head: { x: 110, y: 76.4 - 4 } }));

  assert.ok(Math.abs(b ?? 0) > 0.5, `a pin most of the way over should lean hard, got ${b}`);
  assert.ok(Math.abs(a ?? 0) < 0.9, "and should not still be drawn upright");
});

test("does stand still with its own wing on unless told otherwise", () => {
  const html = render();

  assert.match(html, /data-character-pose="still"/);
  assert.match(html, /data-character-wing/);
  assert.doesNotMatch(html, /data-joust-wing/);
});

test("does walk when the bench says so", () => {
  assert.match(render({ pose: "walk" }), /data-character-pose="walk"/);
});

// The shooter's hand on the band: the figure loses its wing and one is drawn on a layer of its
// own, turned about the shoulder toward the point it is reaching for.
test("does reach for the band with a wing on its own layer, and none on the figure", () => {
  const html = render({ facing: 1, wingAimAt: { x: 60, y: 76.4 - 6 } });

  assert.doesNotMatch(html, /data-character-wing/);
  assert.match(html, /data-joust-wing/);
});

// Straight behind an upright bird facing the lane, level with its shoulder: the wing hangs back
// and down at rest, so reaching straight back is a modest lift of it — not a flip.
const wingTurn = (html: string): number => {
  const turn = /transform="rotate\(([-\d.]+) 47 35\)" data-joust-wing/.exec(html);

  assert.ok(turn !== null, "the wing should turn about the shoulder");
  return Number(turn[1]);
};

test("does turn the wing toward a point straight behind the shoulder by lifting it a little", () => {
  const turn = wingTurn(render({ facing: 1, wingAimAt: { x: 0, y: 76.4 - JOUST_PIN_HEIGHT * 0.6 } }));

  assert.ok(turn > 15 && turn < 45, `expected a modest lift back, got ${turn}`);
});

test("does turn the wing the mirrored way on a bird facing the other direction", () => {
  const facingLane = wingTurn(render({ facing: 1, wingAimAt: { x: 0, y: 76.4 - JOUST_PIN_HEIGHT * 0.6 } }));
  const facingAway = wingTurn(render({ facing: -1, wingAimAt: { x: 200, y: 76.4 - JOUST_PIN_HEIGHT * 0.6 } }));

  assert.ok(Math.abs(facingLane - facingAway) < 0.2, `mirror should agree: ${facingLane} vs ${facingAway}`);
});

test("does mark a bird felled on an earlier shot as spent without losing who it is", () => {
  const html = render({ isDown: true });

  assert.match(html, /class="text-team[A-H] opacity-50"/);
  assert.match(html, /Rosie/);
});
