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
      canDispatchAction
      onDispatchAction={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Team Up/);
  assert.match(html, /Team Alpha/);
  assert.match(html, /1 question left/);
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
      canDispatchAction={false}
      onDispatchAction={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Waiting for minigame host state from the server snapshot\./);
});

test("renders GEO guessing surface for configured geo minigame", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      phase="play"
      minigameType="GEO"
      minigameHostView={{
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: {
          "team-alpha": 0
        },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 0,
        currentSubState: "guessing",
        currentGuess: null,
        currentPrompt: {
          id: "geo-prompt-1",
          title: "Eiffel Tower",
          imageSrc: "/sample-assets/geo/eiffel-tower.svg",
          hint: "Iron lady of a European capital",
          answerLat: 48.85837,
          answerLng: 2.294481
        },
        lastResult: null
      }}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      canDispatchAction={false}
      onDispatchAction={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Eiffel Tower/);
  assert.match(html, /Exhibit 1 of 3/);
  assert.match(html, /“Iron lady of a European capital”/);
  assert.match(html, /Stamp the Guess/);
});

test("renders GEO result card after a submitted guess", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      phase="play"
      minigameType="GEO"
      minigameHostView={{
        minigame: "GEO",
        activeTurnTeamId: "team-alpha",
        pendingPointsByTeamId: {
          "team-alpha": 2
        },
        promptsPerTurn: 3,
        promptsCompletedThisTurn: 1,
        currentSubState: "submitted",
        currentGuess: { lat: 48.8, lng: 2.35 },
        currentPrompt: {
          id: "geo-prompt-1",
          title: "Eiffel Tower",
          imageSrc: "/sample-assets/geo/eiffel-tower.svg",
          answerLat: 48.85837,
          answerLng: 2.294481
        },
        lastResult: {
          promptId: "geo-prompt-1",
          guessLat: 48.8,
          guessLng: 2.35,
          distanceKm: 7.7,
          pointsAwarded: 2
        }
      }}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      canDispatchAction={false}
      onDispatchAction={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /7\.7 km off course/);
  assert.match(html, /\+2/);
  assert.match(html, /Turn the Page/);
});

test("renders intro surface for configured trivia minigame", () => {
  const html = renderToStaticMarkup(
    <MinigameSurface
      phase="intro"
      minigameType="TRIVIA"
      minigameHostView={null}
      activeTeamName="Team Alpha"
      teamNameByTeamId={teamNameByTeamId}
      canDispatchAction={false}
      onDispatchAction={(): void => {
        return;
      }}
    />
  );

  assert.match(html, /Call the team up, explain it, then start eating once they are set\./);
  assert.match(html, /Team Up/);
  assert.match(html, /Team Alpha/);
});
