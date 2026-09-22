import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { GeoMinigameHostView } from "@wingnight/shared";

import { HostGeoSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const hostView = (
  overrides: Partial<GeoMinigameHostView> = {}
): GeoMinigameHostView => ({
  minigame: "GEO",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 4 },
  promptsPerTurn: 3,
  promptsCompletedThisTurn: 0,
  currentSubState: "guessing",
  currentGuess: null,
  currentPrompt: {
    id: "eiffel",
    title: "Eiffel Tower",
    imageSrc: "geo/eiffel.jpg",
    hint: "Iron, and a lot of it",
    answerLat: 48.85837,
    answerLng: 2.294481
  },
  lastResult: null,
  ...overrides
});

// The shell's chrome, as markers: this surface never draws either one, it
// forwards both into the Canvas's slots.
const rail = <span data-slot="rail" />;
const clock = <span data-slot="clock" />;

const renderSurface = (
  view: GeoMinigameHostView | null,
  phase: "intro" | "play" = "play"
): string =>
  renderToStaticMarkup(
    <HostGeoSurface
      phase={phase}
      minigameType="GEO"
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

test("does forward the shell's rail and clock into the canvas chrome row when playing", () => {
  const html = renderSurface(hostView());

  assert.match(html, /<div class="mr-auto min-w-0"><span data-slot="rail"><\/span><\/div>/);
  assert.match(html, /data-slot="clock"/);
  // The rail is the shell's `<header>`; the game adds no landmark of its own.
  assert.doesNotMatch(html, /<(?:header|nav|main|section|aside|footer)\b/);
});

// §4: the rail already says whose turn it is, and saying it twice on one
// canvas is the duplication this migration removes. `resolveActiveTeamName` —
// copy-pasted verbatim into all nine host surfaces — went with the chip.
test("does not repeat the active team name that the rail already carries", () => {
  const html = renderSurface(hostView());

  assert.doesNotMatch(html, /Team Heat/);
});

// §7: GEO's floating chrome used to pick the corner dock's own number and was
// kept underneath it by a single `isolate` in GEO's own styles. The dock's
// band is reserved now, and the game may not reach into it.
test("does write no z-index of the corner dock's band and no isolate of its own", () => {
  const html = renderSurface(hostView({ currentSubState: "submitted" }));

  assert.doesNotMatch(html, /z-\[1100\]/);
  // The only `isolate` GEO writes is the map frame's, which contains Leaflet.
  assert.equal(html.match(/isolate/g)?.length, 3);
});

// §6: the counter is a slot in the chrome row, so no game hand-types a
// top-right reserve for a chip that may not draw.
test("does put the photo count in the counter slot and reserve no rail width", () => {
  const html = renderSurface(hostView());

  assert.match(html, /Photo 1 \/ 3/);
  assert.doesNotMatch(html, /pr-\[clamp\(9rem/);
});

// §5/§6: the dock owns the bottom-right corner. GEO's own
// `bottom-[clamp(4.9rem,9vh,5.6rem)]` and `max-w-[calc(100%-6rem)]` are the
// layout's 4.5rem now, applied in one place for all nine games.
test("does hand the dock gutter to the layout rather than typing its own", () => {
  const html = renderSurface(
    hostView({
      currentSubState: "submitted",
      promptsCompletedThisTurn: 1,
      currentGuess: { lat: 40, lng: -74 },
      lastResult: {
        promptId: "eiffel",
        guessLat: 40,
        guessLng: -74,
        distanceKm: 5837,
        pointsAwarded: 3
      }
    })
  );

  // "Off by" sits two levels inside the slot wrapper, not one: the layout
  // owns the row and its bottom offset, the game owns the tile that carries
  // the label. Anchoring on the wrapper's own class is what makes this bite —
  // the `[^"]*` runs to the end of that one class attribute, so if the offset
  // moves off 4.5rem, or the tiles stop being the slot's content, it reddens.
  assert.match(
    html,
    /bottom-\[4\.5rem\][^"]*"><div class="[^"]*"><div class="[^"]*">Off by/
  );
  assert.match(html, /max-w-\[calc\(100%-4\.5rem\)\]/);
  assert.doesNotMatch(html, /calc\(100%-6rem\)/);
  assert.doesNotMatch(html, /9vh,5\.6rem/);
});

// The turn's one control lives bottom-left, in `actions` — never in the body,
// which on a Canvas would put it over the dock.
test("does float the turn's control in the actions slot", () => {
  const html = renderSurface(hostView());

  assert.match(html, /Lock it in/);
  assert.match(html, /Tap the map to place your pin/);
});

test("does show the next-photo control once the guess is stamped", () => {
  const html = renderSurface(
    hostView({ currentSubState: "submitted", promptsCompletedThisTurn: 1 })
  );

  assert.match(html, /Next photo/);
  assert.doesNotMatch(html, /Lock it in/);
});

test("does say the turn is spent once every photo is scored", () => {
  const html = renderSurface(
    hostView({ currentSubState: "submitted", promptsCompletedThisTurn: 3 })
  );

  assert.match(html, /That&#x27;s every photo for this team/);
  assert.doesNotMatch(html, /Next photo/);
});

// The intro beat is a deck panel, not a takeover: no rail, no clock, no chart.
test("does render a plain briefing panel on the intro beat", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /Brief the team, then advance to open the map/);
  assert.doesNotMatch(html, /data-slot="rail"/);
  assert.doesNotMatch(html, /isolate/);
});

// An empty bank keeps the takeover — dropping it would take the rail and the
// clock off the tablet on the one beat that is already a fault.
test("does keep the takeover when there is no photo to guess at", () => {
  const html = renderSurface(hostView({ currentPrompt: null }));

  assert.match(html, /Waiting for the next photo/);
  assert.match(html, /data-slot="rail"/);
  assert.doesNotMatch(html, /Lock it in/);
});
