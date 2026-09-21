import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type {
  JoustMinigameHostView,
  JoustMinigameShot,
  JoustPlayerFigure
} from "@wingnight/shared";
import { resolveJoustRackSlots, resolveJoustRestFrame } from "@wingnight/shared";

import { HostJoustSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

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
  { playerId: "p4", name: "Rosie", avatarSrc: null, teamId: "team-2", genre: "disco" },
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

const oneDown: JoustMinigameShot = {
  shotNumber: 1,
  toppledPlayerIds: ["p4"],
  collapsedPerchIndices: [],
  isRackCleared: false,
  points: 1,
  aim: { x: -0.8, y: 0.5 },
  pinPlayerIds: ["p4", "p5", "p6"],
  rubblePerchIndices: [],
  run: {
    keyframeHz: 24,
    keyframes: [[...restFrame], [...restFrame]],
    topples: [{ pinIndex: 0, frameIndex: 1 }],
    collapses: []
  }
};

const hostView = (overrides: Partial<JoustMinigameHostView> = {}): JoustMinigameHostView => ({
  minigame: "JOUST",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3, "team-2": 1 },
  phase: "aiming",
  arena: ARENA,
  lineup: LINEUP,
  teammates: TEAMMATES,
  downPlayerIds: [],
  collapsedPerchIndices: [],
  previousShotGhost: null,
  activeShooterPlayerId: "p1",
  shotsPerTurn: 3,
  shotIndex: 0,
  aim: { x: 0, y: 0 },
  shots: [],
  lastShot: null,
  ...overrides
});

const renderSurface = (
  view: JoustMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true
): string => {
  return renderToStaticMarkup(
    <HostJoustSurface
      phase={phase}
      minigameType="JOUST"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      rail={null}
      clock={null}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );
};

const buttonFor = (html: string, label: string): string | null => {
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? [];

  return buttons.find((button) => button.includes(label)) ?? null;
};

// Matches the ATTRIBUTE, not the word: every control carries
// `disabled:opacity-40` in its class list, so a substring check on "disabled"
// reports every button as disabled and quietly passes the whole suite.
const isDisabled = (html: string, label: string): boolean => {
  const button = buttonFor(html, label);

  assert.notEqual(button, null, `expected a "${label}" button`);
  return /<button[^>]*\sdisabled=""/.test(button ?? "");
};

test("renders the lane scene, the shot counter and the rack while aiming", () => {
  const html = renderSurface(hostView());

  assert.match(html, /data-joust-scene/);
  assert.match(html, /data-joust-aim-arena/);
  assert.match(html, /Shot 1 of 3/);
  assert.match(html, /The Lookout/);
  assert.match(html, /Drag back on the lane/);
  assert.match(html, /3 of 3 still standing/);
  assert.match(html, /Alex is up/, "the deck names whose go it is");
});

test("counts a felled player out of the standing line", () => {
  assert.match(renderSurface(hostView({ downPlayerIds: ["p4"] })), /2 of 3 still standing/);
});

test("draws every cactus in the lane", () => {
  const html = renderSurface(
    hostView({
      arena: {
        ...ARENA,
        obstacles: [ARENA.obstacles[0] ?? { x: 0, y: 0, width: 1, height: 1 }, { x: 30, y: 60, width: 5, height: 18 }]
      }
    })
  );
  const cactusCount = (html.match(/stroke-dasharray="1.2 1.6"/g) ?? []).length;

  assert.equal(cactusCount, 2);
});

test("holds next shot until a shot has resolved", () => {
  assert.equal(isDisabled(renderSurface(hostView()), "Next shot"), true);
  assert.equal(
    isDisabled(renderSurface(hostView({ phase: "resolved", lastShot: oneDown })), "Next shot"),
    false
  );
});

test("names who went over and the points once a shot resolves", () => {
  const html = renderSurface(hostView({ phase: "resolved", lastShot: oneDown, shots: [oneDown] }));

  assert.match(html, /data-joust-result/);
  assert.match(html, /One down/);
  assert.match(html, /Rosie/);
  assert.match(html, /\+1/);
  assert.match(html, /Watch the TV/);
});

test("calls a tower coming down timber", () => {
  const timber: JoustMinigameShot = {
    ...oneDown,
    toppledPlayerIds: ["p6"],
    collapsedPerchIndices: [1],
    points: 2,
    run: { ...oneDown.run, collapses: [{ perchIndex: 1, frameIndex: 1 }] }
  };
  const html = renderSurface(hostView({ phase: "resolved", lastShot: timber, shots: [timber] }));

  assert.match(html, /Timber!/);
  assert.match(html, /\+2/);
});

test("draws the last shot's ghost on the tablet while the next teammate aims", () => {
  const html = renderSurface(
    hostView({
      shotIndex: 1,
      previousShotGhost: {
        shotNumber: 1,
        aim: { x: -0.8, y: 0.5 },
        path: [
          { x: 40, y: 46 },
          { x: 80, y: 30 }
        ]
      }
    })
  );

  assert.match(html, /data-joust-ghost/);
});

test("lays a fallen tower out as rubble on the tablet too", () => {
  assert.match(renderSurface(hostView({ collapsedPerchIndices: [1] })), /data-joust-rubble/);
});

test("calls a miss a whiff", () => {
  const miss: JoustMinigameShot = {
    ...oneDown,
    toppledPlayerIds: [],
    points: 0,
    run: { ...oneDown.run, topples: [] }
  };
  const html = renderSurface(hostView({ phase: "resolved", lastShot: miss, shots: [miss] }));

  assert.match(html, /Whiff/);
});

test("says the rack is clear once nobody is left standing", () => {
  const html = renderSurface(
    hostView({ phase: "done", downPlayerIds: ["p4", "p5", "p6"], lastShot: oneDown })
  );

  assert.match(html, /Rack cleared — nobody left standing/);
});

test("offers the skip escape hatch only while aiming", () => {
  assert.equal(isDisabled(renderSurface(hostView()), "Skip shot"), false);
  assert.equal(
    isDisabled(renderSurface(hostView({ phase: "resolved", lastShot: oneDown })), "Skip shot"),
    true
  );
});

test("keeps the reset escape hatch available in every phase", () => {
  for (const phase of ["aiming", "resolved", "done"] as const) {
    assert.equal(isDisabled(renderSurface(hostView({ phase, lastShot: oneDown })), "Reset turn"), false);
  }
});

test("tells the host the turn is over instead of offering another shot", () => {
  const html = renderSurface(hostView({ phase: "done", shotIndex: 2, lastShot: oneDown }));

  assert.match(html, /Turn over/);
  assert.equal(buttonFor(html, "Next shot"), null);
});

test("shows a chip per shot with the banked points filled in", () => {
  const html = renderSurface(hostView({ shots: [oneDown], shotIndex: 1 }));

  assert.match(html, /This turn/);
  assert.equal((html.match(/>—</g) ?? []).length, 2);
});

test("lists every team's running total, not just the active one", () => {
  const html = renderSurface(hostView());

  assert.match(html, /Team Heat/);
  assert.match(html, /Team Chill/);
  assert.match(html, /3 pts/);
  assert.match(html, /1 pt</);
});

test("disables every control when the host cannot act", () => {
  const html = renderSurface(hostView({ phase: "resolved", lastShot: oneDown }), "play", false);

  assert.equal(isDisabled(html, "Next shot"), true);
  assert.equal(isDisabled(html, "Reset turn"), true);
  assert.match(html, /Waiting for the host to open the round|Watch the TV/);
});

test("explains the round instead of showing controls during the intro", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /every player on the team gets one pull/i);
  assert.equal(buttonFor(html, "Next shot"), null);
});

test("points the host at the content pack when no lane is loaded", () => {
  assert.match(renderSurface(hostView({ arena: null })), /joust.json/);
});
