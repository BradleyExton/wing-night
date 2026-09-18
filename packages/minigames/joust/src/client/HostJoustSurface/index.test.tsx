import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { JoustMinigameHostView, JoustMinigameShot } from "@wingnight/shared";
import { resolveJoustRestFrame } from "@wingnight/shared";

import { HostJoustSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const ARENA = {
  id: "arena-1",
  name: "Lone Saguaro",
  targetX: 126,
  obstacles: [{ x: 80, y: 52, width: 7, height: 26 }]
};

const restFrame = resolveJoustRestFrame(ARENA, { x: -0.8, y: 0.5 });

const headshot: JoustMinigameShot = {
  shotNumber: 1,
  hitZone: "head",
  points: 3,
  aim: { x: -0.8, y: 0.5 },
  run: {
    keyframeHz: 30,
    keyframes: [[...restFrame], [...restFrame]],
    hitZone: "head",
    hitFrameIndex: 1
  }
};

const hostView = (overrides: Partial<JoustMinigameHostView> = {}): JoustMinigameHostView => ({
  minigame: "JOUST",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3, "team-2": 1 },
  phase: "aiming",
  arena: ARENA,
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

test("renders the arena scene and the shot counter while aiming", () => {
  const html = renderSurface(hostView());

  assert.match(html, /data-joust-scene/);
  assert.match(html, /data-joust-aim-arena/);
  assert.match(html, /Shot 1 of 3/);
  assert.match(html, /Lone Saguaro/);
  assert.match(html, /Drag back on the arena/);
});

test("draws every cactus in the arena", () => {
  const html = renderSurface(
    hostView({
      arena: {
        ...ARENA,
        obstacles: [ARENA.obstacles[0] ?? { x: 0, y: 0, width: 1, height: 1 }, { x: 100, y: 60, width: 5, height: 18 }]
      }
    })
  );
  const cactusCount = (html.match(/stroke-dasharray="1.2 1.6"/g) ?? []).length;

  assert.equal(cactusCount, 2);
});

test("holds next shot until a shot has resolved", () => {
  assert.equal(isDisabled(renderSurface(hostView()), "Next shot"), true);
  assert.equal(
    isDisabled(renderSurface(hostView({ phase: "resolved", lastShot: headshot })), "Next shot"),
    false
  );
});

test("names the hit and its points once a shot resolves", () => {
  const html = renderSurface(hostView({ phase: "resolved", lastShot: headshot, shots: [headshot] }));

  assert.match(html, /data-joust-result/);
  assert.match(html, /Headshot/);
  assert.match(html, /\+3/);
  assert.match(html, /Watch the TV/);
});

test("calls a miss a whiff", () => {
  const miss: JoustMinigameShot = { ...headshot, hitZone: null, points: 0, run: { ...headshot.run, hitZone: null, hitFrameIndex: null } };
  const html = renderSurface(hostView({ phase: "resolved", lastShot: miss, shots: [miss] }));

  assert.match(html, /Whiff/);
});

test("offers the skip escape hatch only while aiming", () => {
  assert.equal(isDisabled(renderSurface(hostView()), "Skip shot"), false);
  assert.equal(
    isDisabled(renderSurface(hostView({ phase: "resolved", lastShot: headshot })), "Skip shot"),
    true
  );
});

test("keeps the reset escape hatch available in every phase", () => {
  for (const phase of ["aiming", "resolved", "done"] as const) {
    assert.equal(isDisabled(renderSurface(hostView({ phase, lastShot: headshot })), "Reset turn"), false);
  }
});

test("tells the host the turn is over instead of offering another shot", () => {
  const html = renderSurface(hostView({ phase: "done", shotIndex: 2, lastShot: headshot }));

  assert.match(html, /Turn over/);
  assert.equal(buttonFor(html, "Next shot"), null);
});

test("shows a chip per shot with the banked points filled in", () => {
  const html = renderSurface(hostView({ shots: [headshot], shotIndex: 1 }));

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
  const html = renderSurface(hostView({ phase: "resolved", lastShot: headshot }), "play", false);

  assert.equal(isDisabled(html, "Next shot"), true);
  assert.equal(isDisabled(html, "Reset turn"), true);
  assert.match(html, /Waiting for the host to open the round|Watch the TV/);
});

test("explains the round instead of showing controls during the intro", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /slingshot/);
  assert.equal(buttonFor(html, "Next shot"), null);
});

test("points the host at the content pack when no arena is loaded", () => {
  assert.match(renderSurface(hostView({ arena: null })), /joust.json/);
});
