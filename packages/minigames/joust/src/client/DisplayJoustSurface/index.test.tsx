import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type {
  JoustMinigameDisplayView,
  JoustMinigameShot,
  JoustPlayerFigure,
  JoustShotGhost
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
  collapsedPerchIndices: [],
  isRackCleared: false,
  points: 2,
  aim: { x: -0.8, y: 0.5 },
  pinPlayerIds: ["p4", "p5", "p6"],
  rubblePerchIndices: [],
  run: {
    keyframeHz: 24,
    keyframes: [[...restFrame]],
    topples: [
      { pinIndex: 0, frameIndex: 0 },
      { pinIndex: 1, frameIndex: 0 }
    ],
    collapses: []
  }
};

const ghost: JoustShotGhost = {
  shotNumber: 1,
  aim: { x: -0.8, y: 0.5 },
  path: [
    { x: 40, y: 46 },
    { x: 70, y: 30 },
    { x: 110, y: 40 }
  ]
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
  collapsedPerchIndices: [],
  previousShotGhost: null,
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
      clock={null}
      clockLine={null}
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

test("dresses the lane with a backdrop and stands every bird in its own shade", () => {
  const html = renderSurface(baseView());
  const shadows = html.match(/data-joust-shadow/g) ?? [];

  assert.match(html, /data-joust-backdrop/);
  assert.equal(shadows.length, LINEUP.length + TEAMMATES.length);
});

test("rings the band's reach while it is being drawn, and not while it hangs slack", () => {
  assert.match(renderSurface(baseView({ aim: { x: -0.8, y: 0.5 } })), /data-joust-pull-guide/);
  assert.doesNotMatch(renderSurface(baseView()), /data-joust-pull-guide/);
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

test("stands the tower on two legs drawn from its bodies, and tags what the shelf pays", () => {
  const html = renderSurface(baseView());

  assert.equal((html.match(/data-joust-leg/g) ?? []).length, 2);
  assert.match(html, /data-joust-perch-points="2"/, "the shelf is 28 up: two a head");
  assert.doesNotMatch(html, /data-joust-rubble/);
});

test("lays a fallen tower out as rubble with nobody stood on it", () => {
  const html = renderSurface(baseView({ collapsedPerchIndices: [1] }));

  assert.match(html, /data-joust-rubble/);
  assert.equal((html.match(/data-joust-leg/g) ?? []).length, 0);
});

test("draws the last shot's arc while the next teammate aims, and not while a shot replays", () => {
  assert.match(renderSurface(baseView({ previousShotGhost: ghost })), /data-joust-ghost/);
  assert.doesNotMatch(
    renderSurface(baseView({ previousShotGhost: ghost, phase: "resolved", lastShot: pileUp })),
    /data-joust-ghost/
  );
});

test("shouts timber when a shot brings a tower down", () => {
  const timber: JoustMinigameShot = {
    ...pileUp,
    toppledPlayerIds: ["p6"],
    collapsedPerchIndices: [1],
    points: 2,
    run: { ...pileUp.run, topples: [{ pinIndex: 2, frameIndex: 0 }], collapses: [{ perchIndex: 1, frameIndex: 0 }] }
  };
  const html = renderSurface(baseView({ phase: "resolved", lastShot: timber }));

  assert.match(html, /Timber!/);
  assert.match(html, /data-joust-collapse/, "dust on the frame it fell");
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

test("holds the marquee at the launch numbers while a shot is still in the air", () => {
  const inFlight: JoustMinigameShot = {
    ...pileUp,
    run: { ...pileUp.run, keyframes: [[...restFrame], [...restFrame], [...restFrame]] }
  };
  // The state has already banked the two topples and the two points.
  const html = renderSurface(
    baseView({
      phase: "resolved",
      lastShot: inFlight,
      downPlayerIds: ["p4", "p5"],
      pendingPointsByTeamId: { "team-1": 6, "team-2": 2 }
    })
  );

  assert.match(html, /3\/3 standing/);
  assert.match(html, /\+4/);
  assert.doesNotMatch(html, /1\/3 standing/);
});

// A rack-clearing shot off tall shelves can pay more than the whole round is worth, and the
// reducer banks only what the cap allows. Taking the shot's full score back off the banked total
// would then read the marquee negative — "+-3" over the lane while the birds are still in the air.
test("does not read the marquee negative when a shot in the air scored past the round's cap", () => {
  const capped: JoustMinigameShot = {
    ...pileUp,
    toppledPlayerIds: ["p4", "p5", "p6"],
    isRackCleared: true,
    points: 18,
    run: { ...pileUp.run, keyframes: [[...restFrame], [...restFrame], [...restFrame]] }
  };
  const html = renderSurface(
    baseView({
      phase: "resolved",
      lastShot: capped,
      downPlayerIds: ["p4", "p5", "p6"],
      pendingPointsByTeamId: { "team-1": 15, "team-2": 2 }
    })
  );

  assert.doesNotMatch(html, /\+-\d/);
  assert.match(html, /\+0/, "nothing was pending before a turn's first shot");
});

test("lets the marquee catch up once the replay has landed", () => {
  const html = renderSurface(
    baseView({
      phase: "resolved",
      lastShot: pileUp,
      downPlayerIds: ["p4", "p5"],
      pendingPointsByTeamId: { "team-1": 6, "team-2": 2 }
    })
  );

  assert.match(html, /1\/3 standing/);
  assert.match(html, /\+6/);
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

// ADR-0006: the marquee is one shared component, not a container each game
// copies and a ring each copy could forget. This pins that the surface hangs
// THAT sign and not a private one — the drift the bulb-ring test used to catch.
test("does hang the shared neon marquee", () => {
  assert.ok(renderSurface(baseView()).includes("data-neon-marquee"));
});
