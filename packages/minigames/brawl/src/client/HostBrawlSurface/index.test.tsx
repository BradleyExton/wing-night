import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { HostBrawlSurface } from "./index.js";

const render = (phase: "intro" | "play"): string =>
  renderToStaticMarkup(
    <HostBrawlSurface
      phase={phase}
      minigameType="BRAWL"
      minigameHostView={null}
      activeTeamName="Team Alpha"
      teamNameByTeamId={new Map([["team-alpha", "Team Alpha"]])}
      rail={phase === "play" ? <span data-test-rail /> : null}
      clock={phase === "play" ? <span data-test-clock /> : null}
      canDispatchAction
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );

test("does explain the street rather than draw it when the round has not opened", () => {
  const markup = render("intro");

  assert.ok(markup.includes("Spirit Catcher"));
  assert.ok(!markup.includes("data-brawl-placeholder"));
  // The intro is a panel in the host's own control deck, not a takeover: no rail slot.
  assert.ok(!markup.includes("data-test-rail"));
});

test("does forward the shell's rail and clock into the canvas when the block is in play", () => {
  const markup = render("play");

  assert.ok(markup.includes("data-test-rail"));
  assert.ok(markup.includes("data-test-clock"));
  assert.ok(markup.includes('data-brawl-placeholder="host"'));
});
