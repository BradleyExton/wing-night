import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type {
  JoustMinigameDisplayView,
  JoustMinigameShot,
  JoustPlayerFigure
} from "@wingnight/shared";
import { resolveJoustRackSlots, resolveJoustRestFrame } from "@wingnight/shared";

import { DisplayJoustSurface } from "./index.js";

const PERCHES = [
  { x: 54, y: 78, width: 102 },
  { x: 116, y: 50, width: 34 }
];

const ARENA = {
  id: "arena-1",
  name: "The Lookout",
  perches: PERCHES,
  obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
};

const LINEUP: JoustPlayerFigure[] = [
  { playerId: "p4", name: "Rosie", avatarSrc: "avatars/rosie.png", teamId: "team-2", genre: "disco" },
  { playerId: "p5", name: "Darren", avatarSrc: null, teamId: "team-2", genre: "disco" },
  { playerId: "p6", name: "Sarah", avatarSrc: null, teamId: "team-2", genre: "disco" }
];

const TEAMMATES: JoustPlayerFigure[] = [
  { playerId: "p1", name: "Alex", avatarSrc: null, teamId: "team-1", genre: "metal" },
  { playerId: "p2", name: "Caitlin", avatarSrc: null, teamId: "team-1", genre: "metal" }
];

const restFrame = resolveJoustRestFrame(
  {
    pinFeet: resolveJoustRackSlots(PERCHES, LINEUP.length),
    perches: PERCHES,
    obstacles: ARENA.obstacles
  },
  { x: -0.8, y: 0.5 }
);

// A one-frame track: the replay is already on its last frame at first paint,
// which is what a static render sees.
const pileUp: JoustMinigameShot = {
  shotNumber: 2,
  toppledPlayerIds: ["p4", "p5"],
  isRackCleared: false,
  points: 2,
  aim: { x: -0.8, y: 0.5 },
  pinPlayerIds: ["p4", "p5", "p6"],
  run: {
    keyframeHz: 24,
    keyframes: [[...restFrame]],
    topples: [
      { pinIndex: 0, frameIndex: 0 },
      { pinIndex: 1, frameIndex: 0 }
    ]
  }
};

const baseView = (overrides: Partial<JoustMinigameDisplayView> = {}): JoustMinigameDisplayView => ({
  minigame: "JOUST",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 4, "team-2": 2 },
  phase: "aiming",
  arena: ARENA,
  lineup: LINEUP,
  teammates: TEAMMATES,
  downPlayerIds: [],
  activeShooterPlayerId: "p1",
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

test("frames the lane with the team, the shot count, the rack and the pending points", () => {
  const html = renderSurface(baseView());

  assert.match(html, /Team Heat/);
  assert.match(html, /Shot 2 of 3/);
  assert.match(html, /3\/3 standing/);
  assert.match(html, /\+4/);
  assert.match(html, /data-joust-scene/);
  assert.match(html, /Alex — pull back/, "the TV names whose go it is");
});

test("draws a bird per player in the rack and a bird per teammate on the bench", () => {
  const html = renderSurface(baseView());

  for (const figure of [...LINEUP, ...TEAMMATES]) {
    assert.match(html, new RegExp(`data-joust-hen="${figure.name}"`));
  }
  assert.match(html, /data-joust-bench/);
});

test("addresses a pack-relative head against the server origin", () => {
  assert.match(
    renderSurface(baseView()),
    /http:\/\/localhost:3000\/content-assets\/avatars\/rosie\.png/
  );
});

test("counts a felled player out of the standing chip", () => {
  assert.match(renderSurface(baseView({ downPlayerIds: ["p4"] })), /2\/3 standing/);
});

test("names who went over on the plaque once the replay has landed", () => {
  const html = renderSurface(baseView({ phase: "resolved", lastShot: pileUp }));

  assert.match(html, /data-joust-result/);
  assert.match(html, /Pile-up/);
  assert.match(html, /Rosie/);
  assert.match(html, /Darren/);
  assert.match(html, /\+2/);
});

test("calls a shot that leaves nobody standing a cleared rack", () => {
  const swept: JoustMinigameShot = {
    ...pileUp,
    toppledPlayerIds: ["p4", "p5", "p6"],
    isRackCleared: true,
    points: 6
  };

  assert.match(renderSurface(baseView({ phase: "resolved", lastShot: swept })), /Rack cleared/);
});

test("keeps the plaque off the lane while a multi-frame shot is still in the air", () => {
  const inFlight: JoustMinigameShot = {
    ...pileUp,
    run: { ...pileUp.run, keyframes: [[...restFrame], [...restFrame], [...restFrame]] }
  };
  const html = renderSurface(baseView({ phase: "resolved", lastShot: inFlight }));

  assert.doesNotMatch(html, /data-joust-result/);
  assert.match(html, /It&#x27;s away/);
});

test("closes the turn without putting other teams' scores on the TV", () => {
  const html = renderSurface(baseView({ phase: "done", lastShot: pileUp }));

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

test("says so when the lane is missing rather than drawing nothing", () => {
  assert.match(renderSurface(baseView({ arena: null })), /lane is missing/);
});
