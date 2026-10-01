import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { BrawlMinigameBlock, BrawlMinigameDisplayView, BrawlPlayerFigure } from "@wingnight/shared";
import { resolveBrawlBlock } from "@wingnight/shared";

import type { BlockHold } from "../useHeldBlock/index.js";
import { BeatCallout } from "./BeatCallout/index.js";
import { DisplayBrawlSurface } from "./index.js";

const ALEX: BrawlPlayerFigure = {
  playerId: "p-1",
  name: "Alex",
  avatarSrc: null,
  teamId: "team-alpha",
  genre: "country"
};
const MORGAN: BrawlPlayerFigure = { ...ALEX, playerId: "p-2", name: "Morgan" };
const COURSE_SEED = 20261001;

const createBlock = (overrides: Partial<BrawlMinigameBlock> = {}): BrawlMinigameBlock => ({
  blockIndex: 0,
  player: ALEX,
  status: "ready",
  inputs: [],
  skipped: false,
  result: null,
  ...overrides
});

const createView = (overrides: Partial<BrawlMinigameDisplayView> = {}): BrawlMinigameDisplayView => ({
  minigame: "BRAWL",
  activeTurnTeamId: "team-alpha",
  pendingPointsByTeamId: { "team-alpha": 3 },
  phase: "ready",
  blockIndex: 0,
  blocksPerTurn: 2,
  courseSeed: COURSE_SEED,
  blocks: [createBlock(), createBlock({ blockIndex: 1, player: MORGAN })],
  goonsDown: 0,
  goonsTotal: 17,
  points: null,
  bestTurn: null,
  ...overrides
});

const render = (view: BrawlMinigameDisplayView | null, phase: "intro" | "play" = "play"): string =>
  renderToStaticMarkup(
    <DisplayBrawlSurface
      phase={phase}
      minigameType="BRAWL"
      minigameDisplayView={view}
      activeTeamName="Team Alpha"
      clock={<span data-test-clock />}
      clockLine={<span data-test-clock-line />}
      serverOrigin={null}
    />
  );

const createHold = (overrides: Partial<BlockHold> = {}): BlockHold => ({
  blockIndex: 0,
  outcome: "cleared",
  goons: 5,
  kind: "handoff",
  startedAtMs: 0,
  ...overrides
});

test("does set the room up by name rather than draw an empty street when the round has not opened", () => {
  const markup = render(createView(), "intro");

  assert.ok(markup.includes("Streets of Barrie"));
  assert.ok(!markup.includes("data-brawl-scene"));
});

test("does wait under the marquee rather than crash when the view has not arrived", () => {
  const markup = render(null);

  assert.ok(markup.includes("The street is being built"));
  assert.ok(markup.includes("data-neon-marquee"));
});

test("does hang the game, the team, the shell's clock and the block's live counts on the shared marquee when a block is in play", () => {
  const markup = render(createView({ phase: "running", blocks: [createBlock({ status: "running" }), createBlock({ blockIndex: 1, player: MORGAN })] }));

  assert.ok(markup.includes("data-neon-marquee"));
  assert.ok(markup.includes("Streets of Barrie"));
  assert.ok(markup.includes("Team Alpha"));
  assert.ok(markup.includes("data-test-clock"));
  assert.ok(markup.includes("data-test-clock-line"));
  // Whose block, on the sign.
  assert.ok(markup.includes("Block 1 of 2"));
  assert.match(markup, /data-brawl-block-name="[^"]*">Alex</);
  // Three hearts, written by the mirror's loop from here on.
  assert.ok(markup.includes('data-brawl-hearts="3"'));
  assert.equal(markup.split("♥").length - 1, 3);
  // The worth down over the course's worth.
  assert.match(markup, /data-brawl-goons="[^"]*">0 \/ 17</);
  assert.ok(markup.includes("Alex is brawling"));
});

test("does count what earlier blocks banked under the live tally when the turn is part-way through", () => {
  const markup = render(
    createView({
      phase: "ready",
      blockIndex: 1,
      goonsDown: 6,
      blocks: [
        createBlock({ status: "done", result: { outcome: "cleared", endTick: 1800, goons: 6, hearts: 2 } }),
        createBlock({ blockIndex: 1, player: MORGAN })
      ]
    })
  );

  assert.ok(markup.includes("Block 2 of 2"));
  assert.match(markup, /data-brawl-block-name="[^"]*">Morgan</);
  assert.match(markup, /data-brawl-goons="[^"]*">6 \/ 17</);
});

test("does show the number to beat and whose it is only once the round has one", () => {
  const markup = render(createView({ bestTurn: { teamId: "team-beta", teamName: "Team Beta", goons: 12 } }));

  assert.match(markup, /data-brawl-best="[^"]*">12</);
  assert.ok(markup.includes("To beat · Team Beta"));
  assert.ok(!render(createView()).includes("data-brawl-best"));
});

// The wall is the room's seat, not the tablet's mirror (docs/minigames/brawl-spec.md §3).
test("does draw the street through the room's wider camera rather than the tablet's box", () => {
  const markup = render(createView());

  assert.ok(markup.includes('data-brawl-scene="display-brawl"'));
  assert.ok(markup.includes('data-brawl-camera="fill"'));
});

test("does hang one pip per goon of the opening wave on the wave meter when the block is on the line", () => {
  const markup = render(createView());
  const firstWave = resolveBrawlBlock({ seed: COURSE_SEED, blocks: 2, block: 0 }).waves[0]?.spawns ?? [];
  const group = /data-brawl-wave-group="0" data-current="true">(.*?)<\/span><\/span>/.exec(markup)?.[1] ?? "";

  assert.ok(markup.includes("data-brawl-wave-meter"));
  assert.ok(firstWave.length > 0);
  assert.equal(group.split("data-brawl-wave-pip=").length - 1, firstWave.length);
  assert.ok(group.includes("Wave 1 of"));
  assert.ok(!group.includes('data-lit="true"'));
});

test("does call the next player up by name in the show's voice when the hen makes the handoff", () => {
  const markup = renderToStaticMarkup(<BeatCallout hold={createHold()} nextName="Morgan" />);

  assert.ok(markup.includes('data-brawl-beat-callout="cleared"'));
  assert.match(markup, /data-brawl-handoff-callout="display"[^>]*>Morgan</);
  assert.ok(markup.includes("Hand it to"));
});

test("does put the bay or the bell first and the handoff under it when the block went wrong", () => {
  const bay = renderToStaticMarkup(<BeatCallout hold={createHold({ outcome: "ko" })} nextName="Morgan" />);
  const bell = renderToStaticMarkup(<BeatCallout hold={createHold({ outcome: "timeout" })} nextName="Morgan" />);

  assert.match(bay, /data-brawl-beat-line="bay"[^>]*>Into the bay!</);
  assert.ok(bay.includes('data-brawl-handoff-callout="display"'));
  assert.match(bell, /data-brawl-beat-line="bell"[^>]*>Time!</);

  // The last block hands nothing on.
  const lastBay = renderToStaticMarkup(<BeatCallout hold={createHold({ outcome: "ko", kind: "finish" })} nextName={null} />);

  assert.ok(lastBay.includes("Into the bay!"));
  assert.ok(!lastBay.includes("data-brawl-handoff-callout"));
});

test("does say nothing over a skipped block but who is next when the tablet changes hands", () => {
  const skipped = renderToStaticMarkup(<BeatCallout hold={createHold({ outcome: "skipped" })} nextName="Morgan" />);

  assert.ok(skipped.includes("Morgan"));
  assert.ok(!skipped.includes("Into the bay"));
  assert.equal(renderToStaticMarkup(<BeatCallout hold={createHold({ outcome: "skipped", kind: "finish" })} nextName={null} />), "");
});

test("does post the turn's points and no standings once the team is through", () => {
  const markup = render(
    createView({
      phase: "finished",
      blockIndex: 2,
      goonsDown: 12,
      points: 11,
      blocks: [
        createBlock({ status: "done", result: { outcome: "cleared", endTick: 1800, goons: 6, hearts: 2 } }),
        createBlock({ blockIndex: 1, player: MORGAN, status: "done", result: { outcome: "ko", endTick: 900, goons: 6, hearts: 0 } })
      ]
    })
  );

  assert.ok(markup.includes('data-brawl-result="finished"'));
  assert.ok(markup.includes("12 of 17 down"));
  assert.ok(markup.includes("+11"));
  assert.match(markup, /data-brawl-goons="[^"]*">12 \/ 17</);
  assert.ok(!markup.includes("data-brawl-hearts"));
  assert.ok(!markup.includes("Round so far"));
});
