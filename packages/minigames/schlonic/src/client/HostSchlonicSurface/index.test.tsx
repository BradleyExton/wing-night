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
  parWingsPerRun: 20,
  runs: [createRun(), createRun({ runIndex: 1, player: MORGAN })],
  wingsBanked: 0,
  wingsPar: 40,
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
      rail={phase === "play" ? <span data-test-rail /> : null}
      clock={null}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );

test("explains the zone before the round opens rather than drawing it", () => {
  const markup = render(createView(), "intro");

  assert.ok(markup.includes("Kempenfelt Bay Zone"));
  assert.ok(!markup.includes("data-schlonic-arena"));
  // The intro is a panel in the host's own control deck, not a takeover: no
  // rail slot, and so no chrome row to put one in.
  assert.ok(!markup.includes("data-test-rail"));
});

test("draws the zone and names whose run it is", () => {
  const markup = render(createView());

  assert.ok(markup.includes("data-schlonic-arena"));
  assert.ok(markup.includes("Run 1 of 2"));
  assert.ok(markup.includes("data-schlonic-runner-name"));
  assert.ok(markup.includes(">Alex</span>"));
  assert.ok(markup.includes("Alex: tap to go"));
});

// While the bird is on the hill the chrome is two chips and two buttons. The
// run list and the round's totals sit bottom-right, which is where the ground
// band scrolls in; a card there hid the next hazard until it was under the hen.
test("keeps the bottom-right corner clear while a run is live", () => {
  const ready = render(createView());
  const running = render(createView({ phase: "running" }));

  for (const markup of [ready, running]) {
    assert.ok(!markup.includes("data-schlonic-history"));
    assert.ok(!markup.includes("Round so far"));
  }

  // And a running bird's holder is not reading, so the hint goes too.
  assert.ok(!running.includes("data-schlonic-hint"));
});

test("forwards the shell's rail and says the team nowhere itself", () => {
  const markup = render(createView());

  assert.ok(markup.includes("data-test-rail"));
  // The mini-rail names the turn's team; the chip this surface used to draw
  // said it a second time on the same canvas, which is the duplication the
  // takeover layout exists to remove. (The running totals still list every
  // team's name — that is a row of numbers, not a chip saying whose go it is.)
  assert.ok(!markup.includes("On the shore:"));
  assert.ok(!markup.includes("shadow-[0_0_8px_#f97316]"));
});

test("gives the zone the whole canvas with no deck column", () => {
  const markup = render(createView());

  // The 330px deck, its `pr-[clamp(9rem,15vw,12rem)]` reserve for a clock this
  // game has never had, and the hint row under the zone are all gone: the
  // frame takes the body slot's full height and the layout floats the rest.
  assert.ok(!markup.includes("w-[clamp(230px,28vw,330px)]"));
  assert.ok(!markup.includes("pr-[clamp(9rem,15vw,12rem)]"));
  assert.ok(markup.includes('class="relative h-full w-full touch-none'));
});

test("keeps the tally of wings in the chrome, because it is the score and the health at once", () => {
  const markup = render(createView({ wingsBanked: 17, wingsPar: 40 }));

  assert.ok(markup.includes("17 / 40"));
  assert.ok(markup.includes("data-schlonic-wings"));
  // The wings in hand, which the paint loop writes into: on the line, none.
  assert.ok(markup.includes("data-schlonic-in-hand"));
  assert.ok(markup.includes("In hand"));
});

test("tells the tablet holder to wait when the host has not opened the round", () => {
  const markup = render(createView(), "play", false);

  assert.ok(markup.includes("Waiting for the host to open the round."));
});

test("moves the chip on to the next runner once a run is behind it", () => {
  const markup = render(
    createView({
      runIndex: 1,
      runs: [
        createRun({
          status: "done",
          result: { outcome: "cleared", endTick: 900, wings: 24, distance: 480 }
        }),
        createRun({ runIndex: 1, player: MORGAN })
      ]
    })
  );

  assert.ok(markup.includes("Run 2 of 2"));
  assert.ok(markup.includes(">Morgan</span>"));
  assert.ok(!markup.includes(">Alex</span>"));
});

test("shows how each finished run went, and what it banked, once the team is through", () => {
  const markup = render(
    createView({
      phase: "finished",
      runIndex: 2,
      runs: [
        createRun({
          status: "done",
          result: { outcome: "cleared", endTick: 900, wings: 24, distance: 480 }
        }),
        createRun({
          runIndex: 1,
          player: MORGAN,
          status: "done",
          result: { outcome: "fell", endTick: 300, wings: 0, distance: 120 }
        })
      ],
      wingsBanked: 24,
      points: 6
    })
  );

  assert.ok(markup.includes("Post! +24"));
  // A run that went down a hole is named as one, so the room knows what it saw.
  assert.ok(markup.includes("Down a hole"));
  // The chip stops naming a runner: nobody is.
  assert.ok(!markup.includes("data-schlonic-runner-name"));
});

test("posts the turn's points once the team is through", () => {
  const markup = render(
    createView({
      phase: "finished",
      runIndex: 2,
      wingsBanked: 31,
      points: 11
    })
  );

  assert.ok(markup.includes('data-schlonic-finish="finished"'));
  assert.ok(markup.includes("Zone clear"));
  assert.ok(markup.includes("+11"));
  assert.ok(markup.includes("the team. Advance the phase"));
});

test("keeps both escape hatches on the canvas (AGENTS.md §11)", () => {
  const markup = render(createView());

  assert.ok(markup.includes("Skip run"));
  assert.ok(markup.includes("Reset turn"));
});

// The zone is one big jump button and draws no chrome of its own (§5). How to
// jump is said once, in the hint on the line — the JUMP / HOLD FOR HEIGHT
// legend that used to sit beside that hint said it a second time in the same
// corner.
test("says how to jump once, in the hint, with no legend chip beside it", () => {
  const markup = render(createView());

  assert.ok(markup.includes("Hold the tap to jump higher"));
  assert.ok(!markup.includes("data-schlonic-jump-legend"));
  assert.ok(!markup.includes("bottom-3 left-3"));
});

// The card is `@wingnight/surface`'s now, not a fourth copy of it. The local
// variant was the only one of the four written in house tokens rather than
// JOUST's dusk-desert hexes, and the only one carrying a gap between a team's
// name and its points — the shared card kept the gap and widened it, so what
// travelled is the local one's best feature rather than its skin.
test("reads the round's pending points off the shared running-totals card", () => {
  const markup = render(
    createView({ phase: "finished", runIndex: 2, pendingPointsByTeamId: { "team-alpha": 3 } })
  );

  assert.ok(markup.includes("Round so far"));
  assert.ok(markup.includes("Team Alpha"));
  assert.ok(markup.includes("3 pts"));
  assert.ok(markup.includes("Full points at 40 wings"));
  // The shared card's skin, which the local flat box did not have.
  assert.ok(markup.includes("border-ember/20 bg-gradient-to-b from-surface to-bg"));
});

test("draws nothing of its own for another game's view", () => {
  const markup = render(null);

  assert.ok(!markup.includes("data-schlonic-arena"));
});
