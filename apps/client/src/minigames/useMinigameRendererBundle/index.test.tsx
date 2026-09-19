import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MinigameType } from "@wingnight/shared";

import { loadMinigameRendererBundle } from "../registry";
import { useMinigameRendererBundle } from "./index";

// renderToStaticMarkup runs one synchronous pass and no effects, which is
// exactly the render that matters: the TV's first draw of a minigame surface
// happens at MINIGAME_PLAY, and whatever this probe reports on that pass is
// what the room sees.
const RendererProbe = ({
  minigameType
}: {
  minigameType: MinigameType | null;
}): JSX.Element => {
  const { status, rendererBundle } = useMinigameRendererBundle(minigameType);

  return (
    <span>
      {rendererBundle === null ? "not-ready" : "ready"}:{status}
    </span>
  );
};

test("does report not-ready on the first render when the chunk has not landed", () => {
  const html = renderToStaticMarkup(<RendererProbe minigameType="TRIVIA" />);

  assert.match(html, /not-ready/);
});

test("does hand back the bundle on the very first render when the chunk is warm", async () => {
  await loadMinigameRendererBundle("TRIVIA");

  // No effect has run for this component and none needs to: a warm chunk is a
  // synchronous read, so there is no pass in which the surface is missing and
  // therefore no fallback for the TV to flash mid-game.
  const html = renderToStaticMarkup(<RendererProbe minigameType="TRIVIA" />);

  assert.match(html, /ready:ready/);
  assert.doesNotMatch(html, /not-ready/);
});

test("does stay not-ready for a game whose own chunk has not landed", async () => {
  await loadMinigameRendererBundle("TRIVIA");

  const html = renderToStaticMarkup(<RendererProbe minigameType="DRAWING" />);

  assert.match(html, /not-ready/);
});

test("does report an idle load when no minigame is named", () => {
  const html = renderToStaticMarkup(<RendererProbe minigameType={null} />);

  assert.match(html, /not-ready:idle/);
});
