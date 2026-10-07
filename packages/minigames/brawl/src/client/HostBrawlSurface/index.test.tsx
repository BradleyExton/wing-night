import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MinigameSeat } from "@wingnight/minigames-core";
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
  heartBought: false,
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
  heartPrice: 3,
  points: null,
  bestTurn: null,
  ...overrides
});

const render = (
  view: BrawlMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true,
  seat: MinigameSeat = "host"
): string =>
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
      seat={seat}
      handset="tablet"
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
  assert.ok(markup.includes("Worth"));
  assert.ok(!markup.includes("Down<"));
  assert.ok(markup.includes("data-brawl-arena"));
  assert.ok(markup.includes('data-brawl-scene="host-brawl"'));
  assert.ok(markup.includes("data-brawl-hen"));
  assert.ok(markup.includes("data-brawl-walk-pad"));
  assert.ok(markup.includes("data-brawl-peck-zone"));
  assert.ok(markup.includes("data-brawl-go"));
  assert.ok(markup.includes("data-brawl-handoff"));
  // The next teammate waits at the handoff of every block but the last.
  assert.ok(markup.includes('data-brawl-relay-mate="next"'));
  assert.match(markup, /data-brawl-hint="[^"]*">Alex is on the line — hold left to walk, pull back to turn, tap right to peck</);
  // The thumb-rest glyphs teach both halves: the walk thumb's ring and its one line, and the peck ring.
  assert.match(markup, /data-brawl-walk-glyph[^>]*>.*◀.*▶.*hold to walk · pull back to turn</);
  assert.match(markup, /data-brawl-peck-glyph[^>]*>.*PECK.*tap or hold</);
  // The live stick under a held thumb is mounted, and hidden until a thumb is down.
  assert.ok(markup.includes('data-brawl-thumb-held="false"'));
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

// The side a goon steps in from is the room's to know, never the holder's (spec §3); the tablet
// draws no wave strip at all.
test("does never tell the holder which side a goon is coming from", () => {
  for (const markup of [render(createView()), render(createView({ phase: "running", blocks: [createBlock({ status: "running" }), createBlock({ blockIndex: 1, player: MORGAN })] }))]) {
    assert.ok(!markup.includes("data-brawl-wave-side"));
    assert.ok(!markup.includes("data-brawl-wave-meter"));
    assert.ok(!markup.includes("data-brawl-wave-star"));
  }
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
  // The handoff banks the two hearts she walked off with on top of the block's 7; the bay banks none.
  assert.ok(markup.includes("Handed off · 9 worth"));
  assert.ok(markup.includes("Into the bay · 5 worth"));
  assert.ok(markup.includes("Full points at 27 worth"));
  assert.ok(markup.includes("That&#x27;s the team"));
  assert.ok(!markup.includes("data-brawl-hearts"));
});

const finishedView = (): BrawlMinigameHostView =>
  createView({
    phase: "finished",
    blockIndex: 2,
    goonsDown: 12,
    points: 7,
    blocks: [
      createBlock({ status: "done", result: { outcome: "cleared", endTick: 1800, goons: 7, hearts: 2 } }),
      createBlock({ blockIndex: 1, player: MORGAN, status: "done", result: { outcome: "ko", endTick: 900, goons: 5, hearts: 0 } })
    ]
  });

// Solo (the online teaser) there is no host: nobody to skip a block for, a reset is starting over,
// and nobody to ask to advance the phase.
test("drops the host's skip, offers a restart and asks nobody to advance the phase when it plays solo", () => {
  const live = render(createView(), "play", true, "solo");

  assert.ok(!live.includes("Skip block"));
  assert.ok(!live.includes("Reset turn"));
  assert.ok(live.includes("Restart"));

  const through = render(finishedView(), "play", true, "solo");

  assert.ok(!through.includes("Advance the phase"));
  // Solo keeps the totals it always showed at the finish.
  assert.ok(through.includes("Round so far"));
});

// On a guest's phone at the party the host keeps every hatch on the tablet and moves the room on.
test("drops every hatch, the room's totals and the phase hint when it sits on the contestant's phone", () => {
  const live = render(createView(), "play", true, "contestant");

  assert.ok(live.includes("data-brawl-arena"));
  assert.ok(!live.includes("Skip block"));
  assert.ok(!live.includes("Reset turn"));
  assert.ok(!live.includes("Restart"));

  const through = render(finishedView(), "play", true, "contestant");

  assert.ok(through.includes('data-brawl-finish="finished"'));
  assert.ok(!through.includes("Advance the phase"));
  assert.ok(!through.includes("Round so far"));
  assert.ok(render(finishedView()).includes("Round so far"));
});

test("does lock the hint to the host when the tablet cannot act", () => {
  const markup = render(createView(), "play", false);

  assert.ok(markup.includes("Waiting for the host to open the round."));
});

// The handoff pick (spec §0.6): block 0 cleared and banked, block 1 on the line.
const onBlockOne = (overrides: Partial<BrawlMinigameBlock> = {}, goonsDown = 14): BrawlMinigameHostView =>
  createView({
    blockIndex: 1,
    goonsDown,
    blocks: [
      createBlock({ status: "done", result: { outcome: "cleared", endTick: 1800, goons: 11, hearts: 3 } }),
      createBlock({ blockIndex: 1, player: MORGAN, ...overrides })
    ]
  });

test("does put the buy-or-keep cards over the street when the block after a handoff is on the line and the team can pay", () => {
  const markup = render(onBlockOne());

  assert.ok(markup.includes("data-brawl-heart-pick"));
  assert.ok(markup.includes('data-brawl-heart-pick-choice="buy"'));
  assert.ok(markup.includes('data-brawl-heart-pick-choice="keep"'));
  assert.ok(markup.replace(/<[^>]+>/g, "").includes("a 4th heart · costs 3 worth · you have 14"));
  assert.ok(markup.includes("or just start walking"));
  // The hint line stays, and so do both thumb zones: a thumb on the street is "keep the three".
  assert.match(markup, /data-brawl-hint="[^"]*">Morgan is on the line/);
  assert.ok(markup.includes("data-brawl-walk-pad"));
  assert.ok(markup.includes("data-brawl-peck-zone"));
  assert.ok(markup.includes('data-brawl-hearts="3"'));
});

test("does show no cards when the offer does not stand", () => {
  // Block 0, too poor, already bought, already started, and a tablet that may not act.
  for (const markup of [
    render(createView()),
    render(onBlockOne({}, 2)),
    render(onBlockOne({ heartBought: true }, 11)),
    render(createView({ ...onBlockOne({ status: "running" }), phase: "running" })),
    render(onBlockOne(), "play", false)
  ]) {
    assert.ok(!markup.includes("data-brawl-heart-pick"));
  }
});

test("does draw four hearts in the counter when the team bought one for the block on the line", () => {
  const markup = render(onBlockOne({ heartBought: true }, 11));

  assert.ok(markup.includes('data-brawl-hearts="4"'));
  assert.equal((markup.match(/data-lit="true"/g) ?? []).length, 4);
  assert.match(markup, /data-brawl-goons="[^"]*">11 \/ 27</);
});
