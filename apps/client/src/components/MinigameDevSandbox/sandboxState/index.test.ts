import assert from "node:assert/strict";
import test from "node:test";
import type { MinigameDevScenario } from "@wingnight/minigames-core";

import { resolveInitialKnobsState } from "./index";

const triviaScenarioFixture: MinigameDevScenario = {
  id: "play-default",
  label: "Play",
  phase: "play",
  activeTeamName: "Team Alpha",
  teamNameByTeamId: {
    "team-alpha": "Team Alpha"
  },
  minigameHostView: {
    minigame: "TRIVIA",
    activeTurnTeamId: "team-alpha",
    attemptsRemaining: 1,
    promptCursor: 0,
    pendingPointsByTeamId: {
      "team-alpha": 2
    },
    currentPrompt: {
      id: "prompt-1",
      question: "Question?",
      answer: "Answer"
    }
  },
  minigameDisplayView: {
    minigame: "TRIVIA",
    activeTurnTeamId: "team-alpha",
    promptCursor: 0,
    pendingPointsByTeamId: {
      "team-alpha": 2
    },
    currentPrompt: {
      id: "prompt-1",
      question: "Question?"
    }
  }
};

const withWindowSearch = (search: string, callback: () => void): void => {
  const globalScope = globalThis as unknown as { window?: unknown };
  const originalWindow = globalScope.window;

  globalScope.window = {
    location: {
      search,
      pathname: "/dev/minigame/trivia"
    },
    history: {
      replaceState: (): void => {
        return;
      }
    }
  } as unknown as Window;

  try {
    callback();
  } finally {
    if (originalWindow === undefined) {
      delete globalScope.window;
      return;
    }

    globalScope.window = originalWindow;
  }
};

test("resolveInitialKnobsState falls back to scenario phase for invalid phase query params", () => {
  const introScenario = {
    ...triviaScenarioFixture,
    phase: "intro" as const
  };

  withWindowSearch("?phase=unsupported", () => {
    const knobsState = resolveInitialKnobsState(introScenario);
    assert.equal(knobsState.phase, "intro");
  });
});

test("resolveInitialKnobsState clamps negative numeric search params to zero", () => {
  withWindowSearch("?attempts=-5&pending=-10", () => {
    const knobsState = resolveInitialKnobsState(triviaScenarioFixture);
    assert.equal(knobsState.attemptsRemaining, 0);
    assert.equal(knobsState.pendingPointsForActiveTeam, 0);
  });
});
