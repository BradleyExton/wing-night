import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { ContraptionMinigameHostView, ContraptionMinigameRun } from "@wingnight/shared";

import { HostContraptionSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const run = (overrides: Partial<ContraptionMinigameRun> = {}): ContraptionMinigameRun => ({
  attemptNumber: 1,
  track: { keyframeHz: 30, positions: [8, 14, 20, 30, 74, 95] },
  outcome: "landed",
  settleSeconds: 0.05,
  collectedPickupIds: ["mid-air"],
  points: 7,
  replayToken: 0,
  ...overrides
});

const hostView = (
  overrides: Partial<ContraptionMinigameHostView> = {}
): ContraptionMinigameHostView => ({
  minigame: "CONTRAPTION",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3, "team-2": 1 },
  phase: "building",
  level: {
    id: "over-the-shoulder",
    title: "Over the Shoulder",
    wing: { x: 8, y: 14, radius: 2.6 },
    bucket: { x: 68, width: 16, height: 14 },
    obstacles: [],
    pickups: [{ id: "mid-air", x: 50, y: 65, points: 2 }],
    pieceBudget: 2,
    pointsLanded: 5
  },
  pieces: [{ kind: "slope-right", column: 3, row: 6 }],
  attemptsPerTurn: 2,
  attemptsUsed: 0,
  bestPoints: 0,
  run: null,
  ...overrides
});

const renderSurface = (
  view: ContraptionMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true
): string => {
  return renderToStaticMarkup(
    <HostContraptionSurface
      phase={phase}
      minigameType="CONTRAPTION"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
    />
  );
};

const buttonFor = (html: string, label: string): string | null => {
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? [];

  return buttons.find((button) => button.includes(label)) ?? null;
};

// Matches the ATTRIBUTE, not the word: every control carries
// `disabled:opacity-40` in its class list.
const isDisabled = (html: string, label: string): boolean => {
  const button = buttonFor(html, label);

  assert.notEqual(button, null, `expected a "${label}" button`);
  return /<button[^>]*\sdisabled=""/.test(button ?? "");
};

test("shows the level, the attempt and the piece budget while building", () => {
  const html = renderSurface(hostView());

  assert.match(html, /Over the Shoulder/);
  assert.match(html, /Attempt 1 of 2/);
  assert.match(html, /1 \/ 2 pieces/);
  assert.match(html, /Building: Team Heat/);
  assert.match(html, /\+3 pending/);
});

test("arms GO while building and offers the full piece palette", () => {
  const html = renderSurface(hostView());

  assert.equal(isDisabled(html, "GO"), false);
  assert.match(html, /aria-label="Select Slope right"[^>]*aria-pressed="true"/);
  assert.match(html, /aria-label="Select Steep left"[^>]*aria-pressed="false"/);
  assert.equal(isDisabled(html, "Clear field"), false);
});

test("renders a tappable cell for every grid position while building", () => {
  const html = renderSurface(hostView());

  assert.equal((html.match(/aria-label="Cell \d+, \d+"/g) ?? []).length, 100);
  assert.equal((renderSurface(hostView(), "play", false).match(/aria-label="Cell/g) ?? []).length, 0);
});

test("locks the palette and GO when the host cannot dispatch", () => {
  const html = renderSurface(hostView(), "play", false);

  assert.equal(isDisabled(html, "GO"), true);
  assert.equal(isDisabled(html, "Select Shelf"), true);
});

test("shows the verdict, the points and the advance control after a run", () => {
  const html = renderSurface(hostView({ phase: "ran", attemptsUsed: 1, bestPoints: 7, run: run() }));

  assert.match(html, /IN THE BUCKET/);
  assert.match(html, /\+7/);
  assert.match(html, /1 bonus clipped/);
  assert.match(html, /Best so far: 7/);
  assert.equal(isDisabled(html, "Replay for the room"), false);
  assert.equal(isDisabled(html, "Next attempt"), false);
  assert.equal(buttonFor(html, "GO"), null);
});

test("offers Finish turn instead of another attempt once the budget of goes is spent", () => {
  const html = renderSurface(hostView({ phase: "ran", attemptsUsed: 2, run: run({ attemptNumber: 2 }) }));

  assert.match(html, /Finish turn/);
  assert.doesNotMatch(html, /Next attempt/);
});

test("tells the host to advance the phase once the turn is done", () => {
  const html = renderSurface(hostView({ phase: "done", attemptsUsed: 2, run: run({ attemptNumber: 2 }) }));

  assert.match(html, /Turn complete/);
  assert.equal(isDisabled(html, "Replay for the room"), false);
});

test("renders the intro copy before play and a content note when no level loaded", () => {
  assert.match(renderSurface(hostView(), "intro"), /Lay ramps on the grid/);
  assert.match(renderSurface(hostView({ level: null })), /No levels are loaded/);
});

test("never renders a solution, whatever the phase", () => {
  for (const view of [hostView(), hostView({ phase: "ran", attemptsUsed: 1, run: run() })]) {
    assert.doesNotMatch(renderSurface(view), /solution/i);
  }
});
