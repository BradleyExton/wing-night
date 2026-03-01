import assert from "node:assert/strict";

import {
  Phase,
  type GameConfigFile,
  type TriviaPrompt
} from "@wingnight/shared";

import {
  advanceRoomStatePhase,
  assignPlayerToTeam,
  createTeam,
  getRoomStateSnapshot,
  setRoomStateGameConfig,
  setRoomStateMinigameContent,
  setRoomStatePlayers
} from "./index.js";

export const gameConfigFixture: GameConfigFile = {
  name: "Fixture Config",
  rounds: [
    {
      round: 1,
      label: "Warm Up",
      sauce: "Frank's",
      pointsPerPlayer: 2,
      minigame: "TRIVIA"
    },
    {
      round: 2,
      label: "Medium",
      sauce: "Buffalo",
      pointsPerPlayer: 3,
      minigame: "GEO"
    }
  ],
  minigameScoring: {
    defaultMax: 15,
    finalRoundMax: 20
  },
  timers: {
    eatingSeconds: 120,
    triviaSeconds: 30,
    geoSeconds: 45,
    drawingSeconds: 60
  }
};

export const triviaPromptFixture: TriviaPrompt[] = [
  {
    id: "prompt-1",
    question: "Question 1?",
    answer: "Answer 1"
  },
  {
    id: "prompt-2",
    question: "Question 2?",
    answer: "Answer 2"
  }
];

export const setupValidTeamsAndAssignments = (
  gameConfig: GameConfigFile = gameConfigFixture
): void => {
  setRoomStateGameConfig(gameConfig);
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
};

export const setupThreeTeamsAndAssignments = (): void => {
  setRoomStateGameConfig({
    ...gameConfigFixture,
    rounds: [{ ...gameConfigFixture.rounds[0] }]
  });
  setRoomStatePlayers([
    { id: "player-1", name: "Player One" },
    { id: "player-2", name: "Player Two" },
    { id: "player-3", name: "Player Three" }
  ]);
  createTeam("Team Alpha");
  createTeam("Team Beta");
  createTeam("Team Gamma");
  assignPlayerToTeam("player-1", "team-1");
  assignPlayerToTeam("player-2", "team-2");
  assignPlayerToTeam("player-3", "team-3");
};

export const setRoomStateTriviaPrompts = (prompts: TriviaPrompt[]): void => {
  setRoomStateMinigameContent("TRIVIA", { prompts });
};

export const resolveHostPromptId = (
  snapshot: ReturnType<typeof getRoomStateSnapshot>
): string | null => {
  return snapshot.minigameHostView?.currentPrompt?.id ?? null;
};

export const resolveHostPromptCursor = (
  snapshot: ReturnType<typeof getRoomStateSnapshot>
): number | null => {
  return snapshot.minigameHostView?.promptCursor ?? null;
};

export const advanceUntil = (
  targetPhase: Phase,
  targetRound: number,
  maxSteps = 64
): void => {
  for (let step = 0; step < maxSteps; step += 1) {
    const snapshot = getRoomStateSnapshot();

    if (
      snapshot.phase === targetPhase &&
      snapshot.currentRound === targetRound
    ) {
      return;
    }

    advanceRoomStatePhase();
  }

  assert.fail(
    `Unable to reach phase ${targetPhase} in round ${targetRound} within ${maxSteps} steps`
  );
};

export const advanceToEatingPhase = (round = 1): void => {
  advanceUntil(Phase.EATING, round);
};

export const advanceToMinigamePlayPhase = (round = 1): void => {
  advanceUntil(Phase.MINIGAME_PLAY, round);
};

export const advanceToFinalRoundMinigamePlayPhase = (): void => {
  advanceUntil(Phase.MINIGAME_PLAY, 2);
};

export const advanceToRoundResultsPhase = (round: number): void => {
  advanceUntil(Phase.ROUND_RESULTS, round);
};
