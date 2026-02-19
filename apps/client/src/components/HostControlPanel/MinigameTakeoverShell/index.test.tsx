import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { type MinigameHostView } from "@wingnight/shared";

import { MinigameTakeoverShell } from "./index";

const teamNameByTeamId = new Map<string, string>([["team-alpha", "Team Alpha"]]);

const triviaHostView: MinigameHostView = {
  minigame: "TRIVIA",
  minigameApiVersion: 1,
  capabilityFlags: ["recordAttempt"],
  compatibilityStatus: "COMPATIBLE",
  compatibilityMessage: null,
  activeTurnTeamId: "team-alpha",
  attemptsRemaining: 1,
  promptCursor: 0,
  pendingPointsByTeamId: { "team-alpha": 0 },
  currentPrompt: {
    id: "prompt-1",
    question: "Which scale measures pepper heat?",
    answer: "Scoville"
  }
};

test("renders intro takeover shell with active team context", () => {
  const html = renderToStaticMarkup(
    <MinigameTakeoverShell
      hostMode="minigame_intro"
      minigameHostView={triviaHostView}
      activeRoundTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled={false}
      onRecordTriviaAttempt={(): void => undefined}
    />
  );

  assert.match(html, /data-host-minigame-takeover="intro"/);
  assert.match(html, /TRIVIA is queued\. Advance when players are ready to begin\./);
  assert.match(html, /Active Team/);
  assert.match(html, /Team Alpha/);
});

test("renders play takeover shell with trivia controls", () => {
  const html = renderToStaticMarkup(
    <MinigameTakeoverShell
      hostMode="minigame_play"
      minigameHostView={triviaHostView}
      activeRoundTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled={false}
      onRecordTriviaAttempt={(): void => undefined}
    />
  );

  assert.match(html, /data-host-minigame-takeover="play"/);
  assert.match(html, /Which scale measures pepper heat\?/);
  assert.match(html, /Scoville/);
  assert.match(html, /Correct/);
  assert.match(html, /Incorrect/);
});

test("renders compatibility mismatch warning during minigame intro", () => {
  const html = renderToStaticMarkup(
    <MinigameTakeoverShell
      hostMode="minigame_intro"
      minigameHostView={{
        ...triviaHostView,
        compatibilityStatus: "MISMATCH",
        compatibilityMessage: "Host minigame contract mismatch."
      }}
      activeRoundTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      triviaAttemptDisabled={false}
      onRecordTriviaAttempt={(): void => undefined}
    />
  );

  assert.match(html, /Host minigame contract mismatch\./);
});
