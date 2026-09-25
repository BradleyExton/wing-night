import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { RecreateMinigameHostView } from "@wingnight/shared";

import { HostRecreateSurface } from "./index.js";

const TEAM_NAMES = new Map([["team-1", "Molten Metal"]]);

const hostView = (
  overrides: Partial<RecreateMinigameHostView> = {}
): RecreateMinigameHostView => ({
  minigame: "RECREATE",
  activeTurnTeamId: "team-1",
  pendingPointsByTeamId: { "team-1": 0 },
  subState: "writing",
  targetsPerTurn: 2,
  targetsCompletedThisTurn: 0,
  pointsPerIngredient: 1,
  liveGeneration: false,
  currentTarget: {
    id: "cottage-space",
    title: "Cottage Weekend",
    targetImageSrc: "recreate/targets/cottage-space.png",
    sourceImageSrc: null
  },
  attempt: null,
  lastPointsAwarded: null,
  checklist: null,
  ...overrides
});

const judgingView = (): RecreateMinigameHostView =>
  hostView({
    subState: "judging",
    attempt: {
      attemptId: "attempt-1",
      prompt: "Everyone in silver spacesuits",
      status: "skipped",
      imageSrc: null,
      failureReason: null
    },
    checklist: {
      ingredients: ["Outer space", "Spacesuits"],
      checkedIngredientIndexes: [0],
      authoredPrompt: "The whole group floating in outer space"
    }
  });

const renderSurface = (
  view: RecreateMinigameHostView | null,
  phase: "intro" | "play" = "play"
): string =>
  renderToStaticMarkup(
    <HostRecreateSurface
      phase={phase}
      minigameType="RECREATE"
      minigameHostView={view}
      activeTeamName="Molten Metal"
      teamNameByTeamId={TEAM_NAMES}
      rail={null}
      clock={null}
      canDispatchAction
      onDispatchAction={(): void => {}}
      serverOrigin={null}
    />
  );

const buttonLabels = (html: string): string[] =>
  (html.match(/<button[^>]*>[\s\S]*?<\/button>/g) ?? []).map((button) =>
    button.replace(/<[^>]*>/g, "").trim()
  );

test("does leave the rail to the shell rather than drawing one of its own", () => {
  // `page.locator("header")` is a STRICT e2e locator and RECREATE used to be
  // the only host surface rendering a second `<header>` at MINIGAME_PLAY.
  const html = renderSurface(hostView());

  assert.doesNotMatch(html, /<header/);
  assert.doesNotMatch(html, /Molten Metal/);
  assert.doesNotMatch(html, /Forgers on the job/);
});

test("does put the turn count in the rail row and nothing else", () => {
  assert.match(renderSurface(hostView()), /Target 1 of 2/);
  assert.match(renderSurface(judgingView()), /Target 1 of 2/);
});

test("does show exactly one beat-ender while the team writes", () => {
  assert.deepEqual(buttonLabels(renderSurface(hostView())), ["Send to the forger"]);
});

test("does keep the redo hatch beside the lock while the host grades", () => {
  // AGENTS.md §11: skip, redo and override are never removed.
  assert.deepEqual(buttonLabels(renderSurface(judgingView())), [
    // The tick is its own `<span>`, so a ticked ingredient carries the mark.
    "✓Outer space",
    "Spacesuits",
    "Lock in the score",
    "Let them rewrite"
  ]);
});

test("does offer the next target once a score is locked", () => {
  const html = renderSurface(
    hostView({ subState: "scored", targetsCompletedThisTurn: 1, lastPointsAwarded: 2 })
  );

  assert.deepEqual(buttonLabels(html), ["Next target"]);
  assert.match(html, /\+2/);
});

test("does retire the beat-ender rather than disable it when the turn is spent", () => {
  const html = renderSurface(
    hostView({ subState: "scored", targetsCompletedThisTurn: 2, lastPointsAwarded: 0 })
  );

  assert.deepEqual(buttonLabels(html), []);
  assert.match(html, /targets are spent/);
});

test("does point the host at the content pack when no target is loaded", () => {
  const html = renderSurface(hostView({ currentTarget: null }));

  assert.match(html, /recreate\.json/);
  assert.deepEqual(buttonLabels(html), []);
});

test("does brief the host without any takeover chrome during the intro", () => {
  const html = renderSurface(hostView(), "intro");

  assert.match(html, /doctored party photo/);
  assert.doesNotMatch(html, /Target 1 of 2/);
  assert.deepEqual(buttonLabels(html), []);
});
