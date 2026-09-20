import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  SchlonicMinigameHostView,
  SchlonicMinigameRun,
  SchlonicPlayerFigure
} from "@wingnight/shared";

import { HostSchlonicSurface } from "./index.js";

const ALEX: SchlonicPlayerFigure = {
  playerId: "p-1",
  name: "Alex",
  avatarSrc: "avatars/alex.png",
  teamId: "team-alpha",
  genre: "country"
};
const MORGAN: SchlonicPlayerFigure = {
  playerId: "p-2",
  name: "Morgan",
  avatarSrc: null,
  teamId: "team-alpha",
  genre: "country"
};
const teamNameByTeamId = new Map([["team-alpha", "Team Alpha"]]);

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
  overrides: Partial<SchlonicMinigameHostView> = {}
): SchlonicMinigameHostView => ({
  minigame: "SCHLONIC",
  activeTurnTeamId: "team-alpha",
  pendingPointsByTeamId: { "team-alpha": 3 },
  phase: "ready",
  runIndex: 0,
  runsPerTurn: 2,
  zoneSeed: 4,
  zoneChunks: 8,
  parRingsPerRun: 20,
  runs: [createRun(), createRun({ runIndex: 1, player: MORGAN })],
  ringsBanked: 0,
  ringsPar: 40,
  points: null,
  ...overrides
});

const render = (
  view: SchlonicMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true
): string =>
  renderToStaticMarkup(
    <HostSchlonicSurface
      phase={phase}
      minigameType="SCHLONIC"
      minigameHostView={view}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );

test("explains the zone before the round opens rather than drawing it", () => {
  const markup = render(createView(), "intro");

  assert.ok(markup.includes("Chubby Hill Zone"));
  assert.ok(!markup.includes("data-schlonic-arena"));
});

test("draws the zone and names whose run it is", () => {
  const markup = render(createView());

  assert.ok(markup.includes("data-schlonic-arena"));
  assert.ok(markup.includes("Run 1 of 2"));
  assert.ok(markup.includes("Running: Alex"));
  assert.ok(markup.includes("Alex: tap to go"));
});

test("keeps the tally of rings on the rail, because it is the score and the health at once", () => {
  const markup = render(createView({ ringsBanked: 17, ringsPar: 40 }));

  assert.ok(markup.includes("17 / 40"));
});

test("tells the tablet holder to wait when the host has not opened the round", () => {
  const markup = render(createView(), "play", false);

  assert.ok(markup.includes("Waiting for the host to open the round."));
});

test("shows how each finished run went, and what it banked", () => {
  const markup = render(
    createView({
      runIndex: 1,
      runs: [
        createRun({
          status: "done",
          result: { outcome: "cleared", endTick: 900, rings: 24, distance: 480 }
        }),
        createRun({ runIndex: 1, player: MORGAN })
      ]
    })
  );

  assert.ok(markup.includes("Post! +24"));
  assert.ok(markup.includes("Run 2 of 2"));
  assert.ok(markup.includes("Running: Morgan"));
});

test("names a run that went down a hole as one, so the room knows what it saw", () => {
  const markup = render(
    createView({
      runIndex: 1,
      runs: [
        createRun({
          status: "done",
          result: { outcome: "fell", endTick: 300, rings: 0, distance: 120 }
        }),
        createRun({ runIndex: 1, player: MORGAN })
      ]
    })
  );

  assert.ok(markup.includes("Down a hole"));
});

test("posts the turn's points once the team is through", () => {
  const markup = render(
    createView({
      phase: "finished",
      runIndex: 2,
      ringsBanked: 31,
      points: 11
    })
  );

  assert.ok(markup.includes('data-schlonic-finish="finished"'));
  assert.ok(markup.includes("Zone clear"));
  assert.ok(markup.includes("+11"));
  assert.ok(markup.includes("the team. Advance the phase"));
});

test("keeps both escape hatches on the deck (AGENTS.md §11)", () => {
  const markup = render(createView());

  assert.ok(markup.includes("Skip run"));
  assert.ok(markup.includes("Reset turn"));
});

test("leaves the corner dock's gutter alone: the jump legend sits bottom-left", () => {
  const markup = render(createView());

  assert.ok(markup.includes("data-schlonic-jump-legend"));
  assert.ok(markup.includes("bottom-3 left-3"));
});

test("draws nothing of its own for another game's view", () => {
  const markup = render(null);

  assert.ok(!markup.includes("data-schlonic-arena"));
});
