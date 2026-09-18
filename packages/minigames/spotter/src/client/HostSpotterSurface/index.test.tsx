import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { SpotterMinigameHostView } from "@wingnight/shared";

import { HostSpotterSurface } from "./index.js";

const TEAM_NAMES = new Map([
  ["team-1", "Team Heat"],
  ["team-2", "Team Chill"]
]);

const hostView = (
  overrides: Partial<SpotterMinigameHostView> = {}
): SpotterMinigameHostView => ({
  minigame: "SPOTTER",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 4, "team-2": 0 },
  status: "aiming",
  targetsPerTurn: 5,
  targetIndex: 1,
  nudgesThisTarget: 3,
  lastShot: { band: "HIT", points: 3 },
  results: [{ band: "HIT", points: 3 }],
  ...overrides
});

const renderSurface = (
  view: SpotterMinigameHostView | null,
  phase: "intro" | "play" = "play",
  canDispatchAction = true
): string => {
  return renderToStaticMarkup(
    <HostSpotterSurface
      phase={phase}
      minigameType="SPOTTER"
      minigameHostView={view}
      activeTeamName="Team Heat"
      teamNameByTeamId={TEAM_NAMES}
      canDispatchAction={canDispatchAction}
      onDispatchAction={(): void => {}}
    />
  );
};

const buttonFor = (html: string, label: string): string | null => {
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? [];

  return buttons.find((button) => button.includes(`aria-label="${label}"`)) ?? null;
};

// Matches the ATTRIBUTE, not the word: every zone carries `disabled:opacity-30`
// in its class list, so a substring check on "disabled" would pass vacuously.
const isDisabled = (html: string, label: string): boolean => {
  const button = buttonFor(html, label);

  assert.notEqual(button, null, `expected a "${label}" button`);
  return /<button[^>]*\sdisabled=""/.test(button ?? "");
};

test("intro phase briefs the handoff and renders no pad", () => {
  const html = renderSurface(hostView(), "intro");

  assert.ok(html.includes("back to the TV"));
  assert.equal(buttonFor(html, "Fire"), null);
  assert.ok(html.includes("Team Heat"));
});

test("play phase renders five zones, the progress line and the last shot", () => {
  const html = renderSurface(hostView());

  for (const label of ["Up", "Down", "Left", "Right", "Fire"]) {
    assert.equal(isDisabled(html, label), false, `${label} should be enabled`);
  }

  assert.ok(html.includes("Target 2 of 5"));
  assert.ok(html.includes("3 nudges"));
  assert.ok(html.includes("Hit! +3"));
  assert.ok(html.includes("+4 pending"));
});

test("zones are disabled when the host cannot dispatch", () => {
  const html = renderSurface(hostView(), "play", false);

  for (const label of ["Up", "Down", "Left", "Right", "Fire"]) {
    assert.equal(isDisabled(html, label), true, `${label} should be disabled`);
  }
});

test("a finished turn disables the pad and says so", () => {
  const html = renderSurface(hostView({ status: "done", targetIndex: 5 }));

  assert.ok(html.includes("All targets resolved"));
  assert.ok(html.includes("Target 5 of 5"));
  assert.equal(isDisabled(html, "Fire"), true);
});

test("a null view during play shows the waiting note, not a pad", () => {
  const html = renderSurface(null);

  assert.ok(html.includes("Waiting for the field"));
  assert.equal(buttonFor(html, "Up"), null);
});
