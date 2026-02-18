import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phase, type MinigameDisplayView } from "@wingnight/shared";

import { MinigameSurface } from "./index";

const displayViewFixture: MinigameDisplayView = {
  minigame: "TRIVIA",
  activeTurnTeamId: "team-alpha",
  promptCursor: 2,
  pendingPointsByTeamId: { "team-alpha": 1 },
  currentPrompt: {
    id: "prompt-2",
    question: "Which scale measures pepper heat?"
  }
};

test("renders intro shell during MINIGAME_INTRO", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      phase={Phase.MINIGAME_INTRO}
      minigameType="TRIVIA"
      minigameDisplayView={null}
      activeTurnTeamName={null}
    />
  );

  assert.match(html, /Mini-Game/);
  assert.match(html, /TRIVIA is up next/);
});

test("renders prompt without answer during MINIGAME_PLAY", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      phase={Phase.MINIGAME_PLAY}
      minigameType="TRIVIA"
      minigameDisplayView={displayViewFixture}
      activeTurnTeamName="Team Alpha"
    />
  );

  assert.match(html, /Active Team: Team Alpha/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.doesNotMatch(html, /Scoville/);
});
