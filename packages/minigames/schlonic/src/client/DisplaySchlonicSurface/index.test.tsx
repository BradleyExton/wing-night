import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  SchlonicMinigameDisplayView,
  SchlonicMinigameRun,
  SchlonicPlayerFigure
} from "@wingnight/shared";

import { marqueeBulbs } from "@wingnight/surface";

import { DisplaySchlonicSurface } from "./index.js";

const ALEX: SchlonicPlayerFigure = {
  playerId: "p-1",
  name: "Alex",
  avatarSrc: null,
  teamId: "team-alpha",
  genre: "country"
};

const createRun = (overrides: Partial<SchlonicMinigameRun> = {}): SchlonicMinigameRun => ({
  runIndex: 0,
  player: ALEX,
  status: "ready",
  inputs: [],
  skipped: false,
  result: null,
  ...overrides
});

const createView = (
  overrides: Partial<SchlonicMinigameDisplayView> = {}
): SchlonicMinigameDisplayView => ({
  minigame: "SCHLONIC",
  activeTurnTeamId: "team-alpha",
  pendingPointsByTeamId: { "team-alpha": 3 },
  phase: "ready",
  runIndex: 0,
  runsPerTurn: 2,
  zoneSeed: 4,
  zoneChunks: 8,
  parWingsPerRun: 20,
  runs: [createRun(), createRun({ runIndex: 1 })],
  wingsBanked: 0,
  wingsPar: 40,
  points: null,
  ...overrides
});

const render = (
  view: SchlonicMinigameDisplayView | null,
  phase: "intro" | "play" = "play"
): string =>
  renderToStaticMarkup(
    <DisplaySchlonicSurface
      phase={phase}
      minigameType="SCHLONIC"
      minigameDisplayView={view}
      activeTeamName="Team Alpha"
      clock={null}
      serverOrigin={null}
    />
  );

test("sets the room up before the round rather than drawing an empty zone", () => {
  const markup = render(createView(), "intro");

  assert.ok(markup.includes("Schlonic"));
  assert.ok(!markup.includes("data-schlonic-scene"));
});

test("puts the team, the zone and the wing tally on the marquee", () => {
  const markup = render(createView({ wingsBanked: 12 }));

  assert.ok(markup.includes("Team Alpha"));
  assert.ok(markup.includes("Kempenfelt Bay Zone"));
  assert.ok(markup.includes("Run 1 / 2"));
  assert.ok(markup.includes("12 / 40"));
});

test("tells the room who is on the line and who is running", () => {
  assert.ok(render(createView()).includes("Alex is on the line"));
  assert.ok(render(createView({ phase: "running" })).includes("Alex is running!"));
});

test("posts the turn's points once the team is through", () => {
  const markup = render(createView({ phase: "finished", runIndex: 2, wingsBanked: 31, points: 11 }));

  assert.ok(markup.includes('data-schlonic-result="finished"'));
  assert.ok(markup.includes("31 of 40 wings"));
  assert.ok(markup.includes("+11"));
});

test("waits rather than crashing when the view has not arrived", () => {
  assert.ok(render(null).includes("Waiting for the zone"));
});

test("carries nothing the host view does not, because a zone has no secrets", () => {
  const markup = render(createView());

  assert.ok(!markup.toLowerCase().includes("answer"));
  assert.ok(markup.includes("data-schlonic-scene"));
});

// T5.2: this surface descends from DRAWING's marquee but was missing its bulb
// ring, because the copy that made it took the two text styles and left the
// overlay behind — while keeping the `relative` that exists only to position
// it. The ring is the shared token now, so this pins that it is actually hung.
test("does hang the shared bulb ring on the marquee", () => {
  assert.ok(render(createView()).includes(marqueeBulbs));
});
