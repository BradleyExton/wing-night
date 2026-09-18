import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type {
  ContraptionMinigameDisplayView,
  ContraptionMinigameRun
} from "@wingnight/shared";

import { DisplayContraptionSurface } from "./index.js";

const run = (overrides: Partial<ContraptionMinigameRun> = {}): ContraptionMinigameRun => ({
  attemptNumber: 1,
  track: { keyframeHz: 30, positions: [8, 14, 20, 30, 74, 95] },
  outcome: "short",
  settleSeconds: 0.05,
  collectedPickupIds: [],
  points: 0,
  replayToken: 0,
  ...overrides
});

const displayView = (
  overrides: Partial<ContraptionMinigameDisplayView> = {}
): ContraptionMinigameDisplayView => ({
  minigame: "CONTRAPTION",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 0 },
  phase: "building",
  level: {
    id: "over-the-shoulder",
    title: "Over the Shoulder",
    wing: { x: 8, y: 14, radius: 2.6 },
    bucket: { x: 68, width: 16, height: 14 },
    obstacles: [{ id: "ledge", from: { x: 26, y: 48 }, to: { x: 56, y: 48 } }],
    pickups: [{ id: "mid-air", x: 50, y: 65, points: 2 }],
    pieceBudget: 2,
    pointsLanded: 5
  },
  pieces: [{ kind: "steep-left", column: 3, row: 6 }],
  attemptsPerTurn: 2,
  attemptsUsed: 0,
  bestPoints: 0,
  run: null,
  ...overrides
});

const renderSurface = (
  view: ContraptionMinigameDisplayView | null,
  phase: "intro" | "play" = "play"
): string => {
  return renderToStaticMarkup(
    <DisplayContraptionSurface
      phase={phase}
      minigameType="CONTRAPTION"
      minigameDisplayView={view}
      activeTeamName="Team Heat"
      serverOrigin={null}
    />
  );
};

test("shows the plan as the team lays it, with the level, attempt and piece count", () => {
  const html = renderSurface(displayView());

  assert.match(html, /Over the Shoulder/);
  assert.match(html, /Attempt 1 of 2/);
  assert.match(html, /1 \/ 2 pieces/);
  assert.match(html, /Building…/);
  assert.match(html, /data-contraption-piece="steep-left"/);
  assert.match(html, /data-contraption-stage="building"/);
});

test("draws the wing in the thrower's hand before anything has run", () => {
  const html = renderSurface(displayView());

  assert.match(html, /data-contraption-wing/);
  assert.doesNotMatch(html, /data-contraption-cleaner/);
});

test("starts a run in flight with no verdict on screen", () => {
  const html = renderSurface(displayView({ phase: "ran", attemptsUsed: 1, run: run() }));

  assert.match(html, /data-contraption-stage="flight"/);
  assert.doesNotMatch(html, /data-contraption-verdict/);
  assert.doesNotMatch(html, /Building…/);
});

test("renders the intro before play and a waiting note without a view", () => {
  assert.match(renderSurface(displayView(), "intro"), /Then everybody watches a wing/);
  assert.match(renderSurface(null), /Waiting for the host/);
});

test("never renders a solution", () => {
  for (const view of [displayView(), displayView({ phase: "done", attemptsUsed: 2, run: run() })]) {
    assert.doesNotMatch(renderSurface(view), /solution/i);
  }
});
