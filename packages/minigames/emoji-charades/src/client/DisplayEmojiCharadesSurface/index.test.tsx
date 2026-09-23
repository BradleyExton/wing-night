import assert from "node:assert/strict";
import test from "node:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { EmojiCharadesMinigameDisplayView } from "@wingnight/shared";

import { DisplayEmojiCharadesSurface } from "./index.js";

const playingView = (): EmojiCharadesMinigameDisplayView => ({
  minigame: "EMOJI_CHARADES",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 4 },
  pointsPerCorrect: 2,
  status: "playing",
  emojiSequence: ["🔥", "🐔"],
  reveal: null
});

const render = (
  minigameDisplayView: EmojiCharadesMinigameDisplayView | null,
  clock: ReactNode = null
): string =>
  renderToStaticMarkup(
    <DisplayEmojiCharadesSurface
      phase="play"
      minigameType="EMOJI_CHARADES"
      minigameDisplayView={minigameDisplayView}
      activeTeamName="Team Heat"
      clock={clock}
      serverOrigin={null}
    />
  );

// EMOJI_CHARADES is one of the three games that DO have a `timerKey`, and its
// marquee's right column used to be an `aria-hidden` spacer span whose only
// job was holding the grid three-wide under a chip the shell pinned over the
// corner — a seventh idiom for the same reserve eight other surfaces spelled
// as `pr-[clamp(8rem,14vw,18rem)]` (docs/takeover-layout-api.md §6, T5.3).
// The clock is an ordinary child of that column now.
test("hangs the shell's clock in the marquee's meta cell", () => {
  const html = render(playingView(), <span>01:30</span>);

  assert.match(html, /<span>01:30<\/span>/);
  // After the show title, which is the marquee's middle cell — so the clock is
  // in the right-hand one and not floating somewhere over the board.
  assert.match(html, /Emoji Charades[\s\S]*<span>01:30<\/span>[\s\S]*<\/div>/);
});

// The inversion's other half: the cell is a flex row, so a room with no clock
// running gets no spacer and no padding holding the corner open. Nothing here
// may reserve width for a chip that is not on screen.
test("holds the marquee's right cell open with nothing when there is no clock", () => {
  const html = render(playingView());

  assert.doesNotMatch(html, /pr-\[clamp\(/);
  assert.doesNotMatch(html, /min-h-\[1px\]/);
});
