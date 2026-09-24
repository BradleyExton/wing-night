import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FappyMinigameDisplayView, FappyMinigameLeg, FappyPlayerFigure } from "@wingnight/shared";


import { DisplayFappySurface } from "./index.js";

const ALEX: FappyPlayerFigure = { playerId: "p-1", name: "Alex", avatarSrc: "avatars/alex.png", teamId: "team-alpha", genre: "disco" };
const MORGAN: FappyPlayerFigure = { playerId: "p-2", name: "Morgan", avatarSrc: null, teamId: "team-alpha", genre: "disco" };
const DAN: FappyPlayerFigure = { playerId: "p-3", name: "Dan B", avatarSrc: null, teamId: "team-alpha", genre: "disco" };
const T0 = 1_700_000_000_000;

const createLeg = (overrides: Partial<FappyMinigameLeg> = {}): FappyMinigameLeg => {
  return {
    legIndex: 0,
    player: ALEX,
    seed: 11,
    status: "ready",
    attempt: 0,
    checkpointGate: 0,
    flapTicks: [],
    crashes: 0,
    skipped: false,
    knockedEagles: [],
    lastRun: null,
    ...overrides
  };
};

const createView = (overrides: Partial<FappyMinigameDisplayView> = {}): FappyMinigameDisplayView => {
  return {
    minigame: "FAPPY",
    activeTurnTeamId: "team-alpha",
    pendingPointsByTeamId: { "team-alpha": 5 },
    phase: "ready",
    legIndex: 0,
    legsPerTurn: 2,
    gatesPerLeg: 3,
    parSeconds: 20,
    limitSeconds: 60,
    legs: [createLeg(), createLeg({ legIndex: 1, player: MORGAN, seed: 12 })],
    totalGatesCleared: 0,
    startedAtMs: null,
    finishedAtMs: null,
    timedOutAtMs: null,
    elapsedMs: null,
    points: null,
    ...overrides
  };
};

const render = (
  view: FappyMinigameDisplayView | null,
  phase: "intro" | "play" = "play",
  serverOrigin: string | null = "http://127.0.0.1:3000"
): string => {
  return renderToStaticMarkup(
    <DisplayFappySurface
      phase={phase}
      minigameType="FAPPY"
      minigameDisplayView={view}
      activeTeamName="Team Alpha"
      clock={null}
      clockLine={null}
      serverOrigin={serverOrigin}
    />
  );
};

test("does show the intro card before play", () => {
  const html = render(createView(), "intro");

  assert.match(html, /Fappy Bird/);
  assert.doesNotMatch(html, /data-fappy-scene/);
});

test("does wait when there is no view yet", () => {
  assert.match(render(null), /Waiting for the relay/);
});

test("does draw the marquee, the course and the player's own bird", () => {
  const html = render(createView());

  assert.match(html, /Team Alpha/);
  assert.match(html, /Leg 1 of 2/);
  assert.match(html, /0 \/ 6 gates/);
  assert.match(html, /0:00\.0/);
  assert.match(html, /data-fappy-scene="display-fappy"/);
  assert.equal((html.match(/data-fappy-gate="/g) ?? []).length, 3);
  assert.match(html, /content-assets\/avatars\/alex\.png/);
  // Disco is shaped, not dressed: the bird carries its genre in its own tall,
  // high-tailed outline rather than in a prop.
  assert.match(html, /data-character-silhouette="preener"/);
  assert.match(html, /Alex is up — tap to take off/);
  assert.match(html, /data-fappy-waiting-bird/);
  assert.match(html, /data-fappy-cliffs/);
});

test("does put the finish flag, not a waiter, on the last leg's cliff", () => {
  const html = render(
    createView({
      legIndex: 1,
      startedAtMs: T0,
      legs: [createLeg({ status: "cleared" }), createLeg({ legIndex: 1, player: MORGAN, seed: 12 })],
      totalGatesCleared: 3
    })
  );

  assert.doesNotMatch(html, /data-fappy-waiting-bird/);
  assert.match(html, /data-fappy-finish-flag/);
  assert.match(html, /3 \/ 6 gates/);
});

test("does tell the room who the flyer has to land next to", () => {
  const html = render(createView({ phase: "flying", startedAtMs: T0, legs: [createLeg({ status: "flying", flapTicks: [0] }), createLeg({ legIndex: 1, player: MORGAN, seed: 12 })] }));

  assert.match(html, /Alex is flying — land next to Morgan/);
});

test("does send a crashed bird back to its perch on the wall", () => {
  const html = render(
    createView({
      startedAtMs: T0,
      legs: [createLeg({ attempt: 1, checkpointGate: 2, crashes: 1 }), createLeg({ legIndex: 1, player: MORGAN, seed: 12 })],
      totalGatesCleared: 2
    })
  );

  assert.match(html, /Alex is back on the perch — go again/);
});

test("does drop the plaque with the time and the points once the relay is through", () => {
  const html = render(
    createView({
      phase: "finished",
      legIndex: 2,
      startedAtMs: T0,
      finishedAtMs: T0 + 41_200,
      elapsedMs: 41_200,
      points: 9,
      legs: [createLeg({ status: "cleared" }), createLeg({ legIndex: 1, player: MORGAN, seed: 12, status: "cleared" })],
      totalGatesCleared: 6
    })
  );

  assert.match(html, /data-fappy-result="finished"/);
  assert.match(html, /Through!/);
  assert.match(html, /0:41\.2/);
  assert.match(html, /\+9/);
  assert.match(html, /Leg 2 of 2/);
  assert.match(html, /Relay over/);
});

test("does call time on the wall when the limit caught the team", () => {
  const html = render(
    createView({
      phase: "timedOut",
      startedAtMs: T0,
      timedOutAtMs: T0 + 60_000,
      elapsedMs: 60_000,
      points: 1,
      totalGatesCleared: 2
    })
  );

  assert.match(html, /data-fappy-result="timedOut"/);
  assert.match(html, /Time!/);
  assert.match(html, /2 of 6 gates before the clock ran out/);
  assert.match(html, /Out of time/);
});

// ADR-0006: the marquee is one shared component, not a container each game
// copies and a ring each copy could forget. This pins that the surface hangs
// THAT sign and not a private one — the drift the bulb-ring test used to catch.
test("does hang the shared neon marquee", () => {
  assert.ok(render(createView()).includes("data-neon-marquee"));
});

// Step 2: the same lineup the tablet carries, at sofa size, under the sign.
test("does hang the relay's running order under the marquee at wall size", () => {
  const html = render(createView());

  assert.match(html, /data-fappy-lineup="wall"/);
  assert.equal((html.match(/data-fappy-lineup-chip="/g) ?? []).length, 2);
  assert.match(html, /data-fappy-lineup-chip="0" data-fappy-lineup-state="flying"/);
  assert.match(html, /data-fappy-lineup-chip="1" data-fappy-lineup-state="next"/);
  // Alex's head comes from the pack; Morgan has none, so initials do.
  assert.match(html, /data-fappy-head="photo"/);
  assert.match(html, /data-fappy-head="initials"/);
  // Nothing is lit once the relay is over.
  assert.doesNotMatch(
    render(createView({ phase: "finished", legIndex: 2, startedAtMs: T0, finishedAtMs: T0 + 1000, points: 4 })),
    /data-fappy-lineup-state="next"/
  );
});

// Step 3: the status line names who is up after the handoff, with the waiter
// named first so "then" has something to hang off.
test("does name the player after the next one on the wall's status line", () => {
  const threeLegs = [
    createLeg(),
    createLeg({ legIndex: 1, player: MORGAN, seed: 12 }),
    createLeg({ legIndex: 2, player: DAN, seed: 13 })
  ];

  assert.match(
    render(createView({ legsPerTurn: 3, legs: threeLegs })),
    /Alex is up — tap to take off\. Morgan, then Dan B\./
  );
  assert.match(
    render(
      createView({
        phase: "flying",
        legsPerTurn: 3,
        startedAtMs: T0,
        legs: [createLeg({ status: "flying", flapTicks: [0] }), threeLegs[1]!, threeLegs[2]!]
      })
    ),
    /Alex is flying — land next to Morgan\. Then Dan B\./
  );
});

test("does leave the on-deck line off when there is nobody after the next player", () => {
  const html = render(createView());

  assert.match(html, /Alex is up — tap to take off/);
  assert.doesNotMatch(html, /then Dan B/);
  assert.doesNotMatch(html, /Then /);
});

// Step 5: the waiting bird stands most of a leg past the right edge, so a
// bubble on the bezel stands in for it until it scrolls into view.
test("does peek the waiting player over the bezel while their bird is off screen", () => {
  assert.match(render(createView()), /data-fappy-waiter-peek/);
  assert.match(render(createView()), /waiting at the cliff/);
  assert.doesNotMatch(
    render(
      createView({
        legIndex: 1,
        startedAtMs: T0,
        legs: [createLeg({ status: "cleared" }), createLeg({ legIndex: 1, player: MORGAN, seed: 12 })]
      })
    ),
    /data-fappy-waiter-peek/
  );
});
