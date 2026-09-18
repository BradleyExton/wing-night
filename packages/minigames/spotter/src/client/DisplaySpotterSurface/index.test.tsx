import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { SpotterMinigameDisplayView } from "@wingnight/shared";

import { DisplaySpotterSurface } from "./index.js";

const displayView = (
  overrides: Partial<SpotterMinigameDisplayView> = {}
): SpotterMinigameDisplayView => ({
  minigame: "SPOTTER",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 3, "team-2": 0 },
  status: "aiming",
  gridCols: 13,
  gridRows: 7,
  targets: [
    { col: 2, row: 1 },
    { col: 10, row: 5 },
    { col: 6, row: 0 }
  ],
  targetIndex: 1,
  cursor: { col: 7, row: 2 },
  path: ["U", "R"],
  results: [{ targetIndex: 0, col: 2, row: 1, distanceCells: 0, band: "HIT", points: 3 }],
  ...overrides
});

const renderSurface = (
  view: SpotterMinigameDisplayView | null,
  phase: "intro" | "play" = "play"
): string => {
  return renderToStaticMarkup(
    <DisplaySpotterSurface
      phase={phase}
      minigameType="SPOTTER"
      minigameDisplayView={view}
      activeTeamName="Team Heat"
      serverOrigin={null}
    />
  );
};

const countMatches = (html: string, pattern: RegExp): number => {
  return (html.match(pattern) ?? []).length;
};

test("play phase renders every target, the trail, the crosshair and the shots", () => {
  const html = renderSurface(displayView());

  assert.equal(countMatches(html, /data-spotter-target="\d+"/g), 3);
  assert.equal(countMatches(html, /data-spotter-crosshair/g), 1);
  assert.equal(countMatches(html, /data-spotter-shot="HIT"/g), 1);
  // Two nudges → three trail cells including the cursor.
  assert.ok(html.includes('data-spotter-trail="3"'));
  assert.ok(html.includes("Target 2 of 3"));
  assert.ok(html.includes("+3 pending"));
  assert.ok(html.includes("Team Heat is calling the shots"));
});

test("intro phase keeps the field behind the handoff instruction", () => {
  const html = renderSurface(displayView(), "intro");

  assert.ok(html.includes("back to the TV"));
  assert.equal(countMatches(html, /data-spotter-field/g), 1);
  assert.equal(html.includes("calling the shots"), false);
});

test("a finished turn reads as resolved", () => {
  const html = renderSurface(displayView({ status: "done", targetIndex: 3, path: [] }));

  assert.ok(html.includes("All targets resolved"));
  assert.ok(html.includes("Target 3 of 3"));
  assert.equal(html.includes("data-spotter-trail"), false);
});

test("a foreign or missing view renders the marquee only", () => {
  const html = renderSurface(null);

  assert.equal(html.includes("data-spotter-field"), false);
  assert.ok(html.includes("Spotter"));
});
