import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { DrawingMinigameHostView } from "@wingnight/shared";

import { HostDrawingSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const hostView = (
  overrides: Partial<DrawingMinigameHostView> = {}
): DrawingMinigameHostView => ({
  minigame: "DRAWING",
  activeTurnTeamId: "team-1",
  promptCursor: 0,
  pendingPointsByTeamId: { "team-1": 3 },
  currentPrompt: { id: "pizza", prompt: "Pizza slice" },
  strokes: [],
  activeStrokeId: null,
  reveal: null,
  ...overrides
});

// The shell's chrome, as markers: this surface never draws either one, it
// forwards both into the layout's slots.
const rail = <span data-slot="rail" />;
const clock = <span data-slot="clock" />;

const renderSurface = (
  view: DrawingMinigameHostView | null,
  phase: "intro" | "play" = "play"
): string => {
  return renderToStaticMarkup(
    <HostDrawingSurface
      phase={phase}
      minigameType="DRAWING"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      rail={phase === "play" ? rail : null}
      clock={phase === "play" ? clock : null}
      canDispatchAction
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );
};

test("does forward the shell's rail into the takeover's rail row when playing", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<div class="mr-auto min-w-0"><span data-slot="rail"><\/span><\/div>/);
  // The rail is the shell's `<header>`; the game adds no landmark of its own.
  assert.doesNotMatch(html, /<(?:header|nav|main|section|aside|footer)\b/);
});

// §6, and the regression this task closes: DRAWING is one of only three games
// with a play clock (`timerKey: drawingSeconds`), and while no game forwarded
// the slot it drew none at all. The chip is the last item of the rail row now,
// after the counter — which is also what ends the collision that made the old
// absolutely-positioned chip land on top of the pending-points number.
test("does forward the shell's clock into the rail row after the counter", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<span data-slot="clock"><\/span>/);
  assert.ok(html.indexOf('data-slot="rail"') < html.indexOf("+3 pending"));
  assert.ok(html.indexOf("+3 pending") < html.indexOf('data-slot="clock"'));
});

// §4: the rail already says whose turn it is, and saying it twice on one canvas
// is the duplication this migration removes. The `resolveActiveTeamName` helper
// — copy-pasted verbatim into all nine host surfaces — went with it, and so did
// the "On the easel:" chip it fed.
test("does not repeat the active team name that the rail already carries", () => {
  const html = renderSurface(hostView());

  assert.doesNotMatch(html, /Team Heat/);
  assert.doesNotMatch(html, /On the easel/);
});

// The prompt is the turn's one read, and on a height-bound surface a card of
// its own costs a row — which is 1.6 rows of board. It rides the rail row
// instead, where the 48px clock chip has already paid for the height.
test("does put the prompt and the pending points in the rail row's counter slot", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<p class="[^"]*font-voice[^"]*">Pizza slice<\/p>/);
  assert.ok(html.indexOf("Pizza slice") < html.indexOf("Undo"));
});

test("does render the positive verdict before the negative one", () => {
  const html = renderSurface(hostView());

  assert.ok(html.indexOf("Correct") < html.indexOf("Nope"));
});

// §6: the `pr-[4.5rem]` this surface used to hand-type was one of the nine
// reserves the layouts abolish. The gutter is the layout's `actions` row now.
test("does take the dock gutter from the layout rather than from its own styles", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<div class="shrink-0 pr-\[4\.5rem\]">/);
  assert.ok(html.indexOf('class="shrink-0 pr-[4.5rem]"') < html.indexOf("Nope"));
});

// Neither the empty-bank note nor the reveal line may hold a row: a row here is
// board area, so both float over the board and neither takes the pointer.
test("does float the empty-bank note over the board instead of giving it a row", () => {
  const html = renderSurface(hostView({ currentPrompt: null }));

  assert.match(html, /<p class="pointer-events-none absolute[^"]*">No drawing prompts are loaded/);
  assert.doesNotMatch(html, /Tonight/);
});

test("does keep the booth's own name off the rail row the shell owns", () => {
  const html = renderSurface(hostView());

  assert.match(html, /Sketch Booth/);
  // On the palette post, inside the body — after the rail row, not in it.
  assert.ok(html.indexOf('data-slot="clock"') < html.indexOf("Sketch Booth"));
});

// The intro beat is a panel in the host's control deck, not a takeover: no
// chrome, no board, no controls.
test("does render the briefing without takeover chrome or controls at intro", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /Pick an artist to hold the tablet/);
  assert.doesNotMatch(html, /<button/);
  assert.doesNotMatch(html, /<canvas/);
});

test("does stand in for the easel when there is no drawing host view", () => {
  const html = renderSurface(null);

  assert.match(html, /The easel has not loaded/);
  assert.doesNotMatch(html, /<button/);
});
