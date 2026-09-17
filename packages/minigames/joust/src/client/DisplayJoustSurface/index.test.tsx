import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { JoustMinigameDisplayView, JoustMinigameShot } from "@wingnight/shared";
import { resolveJoustRestFrame } from "@wingnight/shared";

import { DisplayJoustSurface } from "./index.js";

const ARENA = {
  id: "arena-1",
  name: "Lone Saguaro",
  targetX: 126,
  obstacles: [{ x: 80, y: 52, width: 7, height: 26 }]
};

const restFrame = resolveJoustRestFrame(ARENA, { x: -0.8, y: 0.5 });

// A one-frame track: the replay is already on its last frame at first paint,
// which is what a static render sees.
const lowBlow: JoustMinigameShot = {
  shotNumber: 2,
  hitZone: "balls",
  points: 5,
  aim: { x: -0.8, y: 0.5 },
  run: { keyframeHz: 30, keyframes: [[...restFrame]], hitZone: "balls", hitFrameIndex: 0 }
};

const baseView = (overrides: Partial<JoustMinigameDisplayView> = {}): JoustMinigameDisplayView => ({
  minigame: "JOUST",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 4, "team-2": 2 },
  phase: "aiming",
  arena: ARENA,
  shotsPerTurn: 3,
  shotIndex: 1,
  aim: { x: 0, y: 0 },
  shots: [],
  lastShot: null,
  ...overrides
});

const renderSurface = (
  minigameDisplayView: JoustMinigameDisplayView | null,
  phase: "intro" | "play" = "play"
): string => {
  return renderToStaticMarkup(
    <DisplayJoustSurface
      phase={phase}
      minigameType="JOUST"
      minigameDisplayView={minigameDisplayView}
      activeTeamName="Team Heat"
      serverOrigin="http://localhost:3000"
    />
  );
};

test("frames the arena with the team, the shot count and the pending points", () => {
  const html = renderSurface(baseView());

  assert.match(html, /Team Heat/);
  assert.match(html, /Shot 2 of 3/);
  assert.match(html, /\+4/);
  assert.match(html, /data-joust-scene/);
  assert.match(html, /Pull back/);
});

test("switches the prompt once the band is drawn", () => {
  assert.match(renderSurface(baseView({ aim: { x: -0.6, y: 0.2 } })), /Steady/);
});

test("announces the hit on the plaque once the replay has landed", () => {
  const html = renderSurface(baseView({ phase: "resolved", lastShot: lowBlow }));

  assert.match(html, /data-joust-result/);
  assert.match(html, /Low blow/);
  assert.match(html, /\+5/);
});

test("keeps the plaque off the arena while a multi-frame shot is still in the air", () => {
  const inFlight: JoustMinigameShot = {
    ...lowBlow,
    run: { ...lowBlow.run, keyframes: [[...restFrame], [...restFrame], [...restFrame]] }
  };
  const html = renderSurface(baseView({ phase: "resolved", lastShot: inFlight }));

  assert.doesNotMatch(html, /data-joust-result/);
  assert.match(html, /It&#x27;s away/);
});

test("closes the turn without putting other teams' scores on the TV", () => {
  const html = renderSurface(baseView({ phase: "done", lastShot: lowBlow }));

  assert.match(html, /That&#x27;s the turn/);
  assert.doesNotMatch(html, /Team Chill/);
});

test("renders the rules summary during the minigame intro", () => {
  const html = renderSurface(null, "intro");

  assert.match(html, /Slingshlong/);
  assert.match(html, /floppy/);
});

test("falls back to a waiting note when the view has not arrived", () => {
  assert.match(renderSurface(null), /Waiting for the host/);
});

test("says so when the arena is missing rather than drawing nothing", () => {
  assert.match(renderSurface(baseView({ arena: null })), /arena is missing/);
});
