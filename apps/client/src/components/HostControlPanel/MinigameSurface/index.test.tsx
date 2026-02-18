import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MinigameHostView } from "@wingnight/shared";

import { MinigameSurface } from "./index";

const teamNameByTeamId = new Map<string, string>([["team-alpha", "Team Alpha"]]);

const triviaHostViewFixture: MinigameHostView = {
  minigame: "TRIVIA",
  activeTurnTeamId: "team-alpha",
  promptCursor: 1,
  pendingPointsByTeamId: { "team-alpha": 3 },
  currentPrompt: {
    id: "prompt-1",
    question: "Which scale measures pepper heat?",
    answer: "Scoville"
  }
};

test("renders trivia controls from minigame host view during MINIGAME_PLAY", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      minigameHostView={triviaHostViewFixture}
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled={false}
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Active Team: Team Alpha/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
});

test("renders waiting fallback when host view is unavailable", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      minigameHostView={null}
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Waiting for room state/);
});

test("renders waiting fallback for non-trivia minigame payloads", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      minigameHostView={{
        ...triviaHostViewFixture,
        minigame: "GEO"
      }}
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Waiting for room state/);
  assert.doesNotMatch(html, /Which scale measures pepper heat/);
});
