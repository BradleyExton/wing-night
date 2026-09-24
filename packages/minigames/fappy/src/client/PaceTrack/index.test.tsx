import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { FappyMinigameDisplayView, FappyMinigameLeg } from "@wingnight/shared";

import { resolveLegBird } from "../resolveLegBird/index.js";
import { PaceTrack, resolvePaceMarks } from "./index.js";

const createLeg = (legIndex: number): FappyMinigameLeg => ({
  legIndex,
  player: null,
  seed: 11,
  status: "ready",
  attempt: 0,
  checkpointGate: 0,
  flapTicks: [],
  crashes: 0,
  skipped: false,
  knockedEagles: [],
  lastRun: null
});

const createView = (
  overrides: Partial<FappyMinigameDisplayView> = {}
): FappyMinigameDisplayView => ({
  minigame: "FAPPY",
  activeTurnTeamId: "team-alpha",
  pendingPointsByTeamId: { "team-alpha": 0 },
  phase: "flying",
  legIndex: 0,
  legsPerTurn: 2,
  gatesPerLeg: 5,
  parSeconds: 50,
  limitSeconds: 100,
  legs: [createLeg(0), createLeg(1)],
  totalGatesCleared: 0,
  startedAtMs: 1_700_000_000_000,
  finishedAtMs: null,
  timedOutAtMs: null,
  elapsedMs: null,
  points: null,
  pointsMax: 20,
  ...overrides
});

test("does put par halfway along a bar whose window is twice par", () => {
  const marks = resolvePaceMarks({
    elapsedMs: 0,
    parSeconds: 50,
    limitSeconds: 100,
    gatesCleared: 0,
    gatesTotal: 10
  });

  assert.equal(marks.parPercent, 50);
  assert.equal(marks.birdPercent, 0);
  assert.equal(marks.ghostPercent, 0);
});

// The two racers only mean anything against each other: half the course at
// half of par is dead level, and that is the reading the room takes.
test("does draw the bird level with the ghost when the course and the clock agree", () => {
  const marks = resolvePaceMarks({
    elapsedMs: 25_000,
    parSeconds: 50,
    limitSeconds: 100,
    gatesCleared: 5,
    gatesTotal: 10
  });

  assert.equal(marks.birdPercent, marks.ghostPercent);
  assert.equal(marks.isPastPar, false);
});

test("does park the ghost on the par tick once par is spent", () => {
  const marks = resolvePaceMarks({
    elapsedMs: 80_000,
    parSeconds: 50,
    limitSeconds: 100,
    gatesCleared: 8,
    gatesTotal: 10
  });

  assert.equal(marks.ghostPercent, marks.parPercent);
  assert.equal(marks.isPastPar, true);
  assert.equal(marks.elapsedPercent, 80);
});

test("does stop the fills at the limit when the clock runs past it", () => {
  const marks = resolvePaceMarks({
    elapsedMs: 400_000,
    parSeconds: 50,
    limitSeconds: 100,
    gatesCleared: 40,
    gatesTotal: 10
  });

  assert.equal(marks.elapsedPercent, 100);
  assert.equal(marks.birdPercent, marks.parPercent);
});

test("does draw both racers and the par tick on the strip", () => {
  const html = renderToStaticMarkup(
    <PaceTrack
      view={createView({ totalGatesCleared: 4 })}
      elapsedMs={20_000}
      bird={resolveLegBird({ figure: null, activeTurnTeamId: "team-alpha", serverOrigin: null })}
    />
  );

  assert.match(html, /data-fappy-pace-bird/);
  assert.match(html, /data-fappy-pace-ghost/);
  assert.match(html, /data-fappy-pace-par/);
  assert.match(html, /data-fappy-pace-past-par="false"/);
  assert.doesNotMatch(html, /data-fappy-pace-overrun/);
});

test("does turn the bar past par to heat when the relay overruns", () => {
  const html = renderToStaticMarkup(
    <PaceTrack
      view={createView({ totalGatesCleared: 9 })}
      elapsedMs={70_000}
      bird={resolveLegBird({ figure: null, activeTurnTeamId: "team-alpha", serverOrigin: null })}
    />
  );

  assert.match(html, /data-fappy-pace-past-par="true"/);
  assert.match(html, /data-fappy-pace-overrun/);
});
