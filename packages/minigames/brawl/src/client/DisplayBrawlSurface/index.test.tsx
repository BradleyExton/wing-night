import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { DisplayBrawlSurface } from "./index.js";

const render = (phase: "intro" | "play"): string =>
  renderToStaticMarkup(
    <DisplayBrawlSurface
      phase={phase}
      minigameType="BRAWL"
      minigameDisplayView={null}
      activeTeamName="Team Alpha"
      clock={<span data-test-clock />}
      clockLine={null}
      serverOrigin={null}
    />
  );

test("does set the room up by name rather than draw an empty street when the round has not opened", () => {
  const markup = render("intro");

  assert.ok(markup.includes("Streets of Barrie"));
  assert.ok(!markup.includes("data-brawl-placeholder"));
});

test("does hang the game and the team on the marquee with the shell's clock when the block is in play", () => {
  const markup = render("play");

  assert.ok(markup.includes("Streets of Barrie"));
  assert.ok(markup.includes("Team Alpha"));
  assert.ok(markup.includes("data-test-clock"));
  assert.ok(markup.includes('data-brawl-placeholder="display"'));
});
