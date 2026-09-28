import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  SchlonicMinigameDisplayView,
  SchlonicMinigameRun,
  SchlonicPlayerFigure
} from "@wingnight/shared";


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
  bestRun: null,
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
      clockLine={null}
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
  assert.ok(markup.includes(">12</span> / 40"));
  // The wings in hand, which the mirror's paint loop writes into as the runner collects them.
  assert.ok(markup.includes("data-schlonic-in-hand"));
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

// The wall is the room's seat, not the tablet's mirror (docs/minigame-design-principles.md §3):
// its camera fills the arena and shows more shore ahead of the runner than the tablet's box.
test("draws the zone through the room's wider camera rather than the tablet's box", () => {
  const markup = render(createView());

  assert.ok(markup.includes('data-schlonic-camera="fill"'));
  assert.ok(!markup.includes('viewBox="0 0 160 90"'));
});

// The round's best run is the ghost the runner races: its bird in the zone, its pin on the
// strip, and its wings on the marquee as the number to beat. Nothing of it before anyone has
// cleared the zone.
test("races the round's best run as a ghost once there is one", () => {
  const bestRun = {
    teamId: "team-beta",
    player: { ...ALEX, playerId: "p-9", name: "Dan", teamId: "team-beta" },
    inputs: [{ tick: 12, down: true }],
    wings: 33,
    endTick: 900
  };
  const markup = render(createView({ bestRun }));

  assert.ok(markup.includes("data-schlonic-ghost"));
  assert.ok(markup.includes("data-schlonic-track-ghost"));
  assert.ok(markup.includes("To beat · Dan"));
  assert.ok(markup.includes(">33<"));

  const without = render(createView());

  assert.ok(!without.includes("data-schlonic-ghost"));
  assert.ok(!without.includes("data-schlonic-track-ghost"));
  assert.ok(!without.includes("To beat"));
});

// The post's juice: the banked figure stands alone so the count-up can write it, and the pool
// of wings that fly into it is over the stage from the start.
test("stands the banked figure alone and mounts the wing flight over the stage", () => {
  const markup = render(createView({ wingsBanked: 12 }));

  assert.ok(markup.includes('data-schlonic-banked'));
  assert.ok(markup.includes(">12</span> / 40"));
  assert.ok(markup.includes("data-schlonic-wing-flight"));
});

test("hangs the zone strip over the arena so the room can read what is coming", () => {
  const markup = render(createView());

  assert.ok(markup.includes("data-schlonic-track"));
  assert.ok(markup.includes("data-schlonic-track-post"));
  assert.ok(markup.includes("data-schlonic-track-runner"));
});

// ADR-0006: the marquee is one shared component, not a container each game
// copies and a ring each copy could forget. This pins that the surface hangs
// THAT sign and not a private one — the drift the bulb-ring test used to catch.
test("does hang the shared neon marquee", () => {
  assert.ok(render(createView()).includes("data-neon-marquee"));
});
