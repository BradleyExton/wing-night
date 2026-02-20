import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { MinigameHostView } from "@wingnight/shared";

import { MinigameSurface } from "./index";

const teamNameByTeamId = new Map<string, string>([["team-alpha", "Team Alpha"]]);

const triviaHostViewFixture: MinigameHostView = {
  minigame: "TRIVIA",
  activeTurnTeamId: "team-alpha",
  attemptsRemaining: 1,
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
      phase="play"
      minigameType="TRIVIA"
      minigameHostView={triviaHostViewFixture}
      activeTeamName="Team Alpha"
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
      phase="play"
      minigameType="TRIVIA"
      minigameHostView={null}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Waiting for minigame host state from the server snapshot\./);
});

test("renders unsupported fallback for minigames without a renderer", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      phase="play"
      minigameType="GEO"
      minigameHostView={{
        ...triviaHostViewFixture,
        minigame: "GEO"
      }}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /GEO host surface is not available yet\./);
  assert.doesNotMatch(html, /Which scale measures pepper heat/);
});

test("renders intro surface for configured trivia minigame", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      phase="intro"
      minigameType="TRIVIA"
      minigameHostView={null}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled
      onRecordTriviaAttempt={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Review the active team, then advance to begin trivia play\./);
  assert.match(html, /Active Team: Team Alpha/);
});
