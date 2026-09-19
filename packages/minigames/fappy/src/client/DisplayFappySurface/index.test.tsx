import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FappyMinigameDisplayView, FappyMinigameLeg, FappyPlayerFigure } from "@wingnight/shared";

import { DisplayFappySurface } from "./index.js";

const ALEX: FappyPlayerFigure = { playerId: "p-1", name: "Alex", avatarSrc: "avatars/alex.png", teamId: "team-alpha", genre: "disco" };
const MORGAN: FappyPlayerFigure = { playerId: "p-2", name: "Morgan", avatarSrc: null, teamId: "team-alpha", genre: "disco" };
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
  assert.match(html, /data-character-apparel="medallion"/);
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
