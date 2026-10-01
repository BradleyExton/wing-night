import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { BrawlMinigameBlock, BrawlMinigameHostView, BrawlPlayerFigure } from "@wingnight/shared";

import { HostBrawlSurface } from "./index.js";

const ALEX: BrawlPlayerFigure = {
  playerId: "p-1",
  name: "Alex",
  avatarSrc: "avatars/alex.png",
  teamId: "team-alpha",
  genre: "country"
};
const MORGAN: BrawlPlayerFigure = { ...ALEX, playerId: "p-2", name: "Morgan", avatarSrc: null };
const teamNameByTeamId = new Map([["team-alpha", "Team Alpha"]]);

const createBlock = (overrides: Partial<BrawlMinigameBlock> = {}): BrawlMinigameBlock => ({
  blockIndex: 0,
  player: ALEX,
  status: "ready",
  inputs: [],
  skipped: false,
  result: null,
  ...overrides
});

const createView = (overrides: Partial<BrawlMinigameHostView> = {}): BrawlMinigameHostView => ({
  minigame: "BRAWL",
  activeTurnTeamId: "team-alpha",
  pendingPointsByTeamId: { "team-alpha": 3 },
  phase: "ready",
  blockIndex: 0,
  blocksPerTurn: 2,
  courseSeed: 20261001,
  blocks: [createBlock(), createBlock({ blockIndex: 1, player: MORGAN })],
  goonsDown: 0,
  goonsTotal: 27,
  points: null,
  bestTurn: null,
  ...overrides
});

const render = (view: BrawlMinigameHostView | null, phase: "intro" | "play" = "play", canDispatchAction = true): string =>
  renderToStaticMarkup(
    <HostBrawlSurface
      phase={phase}
      minigameType="BRAWL"
      minigameHostView={view}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      rail={phase === "play" ? <span data-test-rail /> : null}
      clock={phase === "play" ? <span data-test-clock /> : null}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );

test("does explain the street rather than draw it when the round has not opened", () => {
  const markup = render(createView(), "intro");

  assert.ok(markup.includes("Spirit Catcher"));
  assert.ok(!markup.includes("data-brawl-arena"));
  // The intro is a panel in the host's own control deck, not a takeover: no rail slot.
  assert.ok(!markup.includes("data-test-rail"));
});

test("does forward the shell's rail and clock into the canvas when the block is in play", () => {
  const markup = render(createView());

  assert.ok(markup.includes("data-test-rail"));
  assert.ok(markup.includes("data-test-clock"));
});

test("does draw the counter, the street, both thumb zones, the hint and both actions when a block is ready", () => {
  const markup = render(createView());

  assert.ok(markup.includes("Block 1 of 2"));
  assert.match(markup, /data-brawl-block-name="[^"]*">Alex</);
  assert.ok(markup.includes('data-brawl-hearts="3"'));
  assert.equal((markup.match(/data-lit="true"/g) ?? []).length, 3);
  assert.match(markup, /data-brawl-goons="[^"]*">0 \/ 27</);
  assert.ok(markup.includes("data-brawl-arena"));
  assert.ok(markup.includes('data-brawl-scene="host-brawl"'));
  assert.ok(markup.includes("data-brawl-hen"));
  assert.ok(markup.includes("data-brawl-walk-pad"));
  assert.ok(markup.includes("data-brawl-peck-zone"));
  assert.ok(markup.includes("data-brawl-go"));
  assert.ok(markup.includes("data-brawl-handoff"));
  // The next teammate waits at the handoff of every block but the last.
  assert.ok(markup.includes('data-brawl-relay-mate="next"'));
  assert.match(markup, /data-brawl-hint="[^"]*">Alex is on the line — hold left to walk, tap right to peck</);
  assert.ok(markup.includes("Skip block"));
  assert.ok(markup.includes("Reset turn"));
});

test("does keep the readout off the street and the hint quiet while a block is live", () => {
  const ready = render(createView());
  const running = render(createView({ phase: "running", blocks: [createBlock({ status: "running" }), createBlock({ blockIndex: 1, player: MORGAN })] }));

  for (const markup of [ready, running]) {
    assert.ok(!markup.includes("data-brawl-history"));
    assert.ok(!markup.includes("data-brawl-finish"));
  }

  assert.ok(!running.includes("data-brawl-hint"));
});

test("does show the number to beat when a team before this one set one", () => {
  const markup = render(createView({ bestTurn: { teamId: "team-beta", teamName: "Team Beta", goons: 19 } }));

  assert.ok(markup.includes("data-brawl-best"));
  assert.ok(markup.includes("To beat · Team Beta"));
});

test("does put up the finish card, the block list and the totals when the team is through", () => {
  const markup = render(
    createView({
      phase: "finished",
      blockIndex: 2,
      goonsDown: 12,
      points: 7,
      blocks: [
        createBlock({ status: "done", result: { outcome: "cleared", endTick: 1800, goons: 7, hearts: 2 } }),
        createBlock({ blockIndex: 1, player: MORGAN, status: "done", result: { outcome: "ko", endTick: 900, goons: 5, hearts: 0 } })
      ]
    })
  );

  assert.ok(markup.includes('data-brawl-finish="finished"'));
  assert.ok(markup.includes("+7"));
  assert.ok(markup.includes("Handed off · 7 down"));
  assert.ok(markup.includes("Into the bay · 5 down"));
  assert.ok(markup.includes("That&#x27;s the team"));
  assert.ok(!markup.includes("data-brawl-hearts"));
});

test("does lock the hint to the host when the tablet cannot act", () => {
  const markup = render(createView(), "play", false);

  assert.ok(markup.includes("Waiting for the host to open the round."));
});
