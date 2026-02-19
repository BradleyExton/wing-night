import type {
  TriviaDisplayView,
  TriviaHostView
} from "@wingnight/minigames-trivia";
import type { RoomState, TriviaPrompt } from "@wingnight/shared";

const clonePrompt = (prompt: TriviaPrompt): TriviaPrompt => {
  return {
    id: prompt.id,
    question: prompt.question,
    answer: prompt.answer
  };
};

export const projectTriviaHostViewToRoomState = (
  state: RoomState,
  hostView: TriviaHostView,
  attemptsRemaining: number
): void => {
  state.activeTurnTeamId = hostView.activeTurnTeamId;
  state.triviaPromptCursor = hostView.promptCursor;
  state.currentTriviaPrompt =
    hostView.currentPrompt === null ? null : clonePrompt(hostView.currentPrompt);
  state.pendingMinigamePointsByTeamId = {
    ...hostView.pendingPointsByTeamId
  };
  state.minigameHostView = {
    minigame: "TRIVIA",
    activeTurnTeamId: hostView.activeTurnTeamId,
    attemptsRemaining,
    promptCursor: hostView.promptCursor,
    pendingPointsByTeamId: {
      ...hostView.pendingPointsByTeamId
    },
    currentPrompt:
      hostView.currentPrompt === null ? null : clonePrompt(hostView.currentPrompt)
  };
};

export const projectTriviaDisplayViewToRoomState = (
  state: RoomState,
  displayView: TriviaDisplayView
): void => {
  state.minigameDisplayView = {
    minigame: "TRIVIA",
    activeTurnTeamId: displayView.activeTurnTeamId,
    promptCursor: displayView.promptCursor,
    pendingPointsByTeamId: {
      ...displayView.pendingPointsByTeamId
    },
    currentPrompt:
      displayView.currentPrompt === null
        ? null
        : {
            id: displayView.currentPrompt.id,
            question: displayView.currentPrompt.question
          }
  };
};

export const clearTriviaProjectionFromRoomState = (state: RoomState): void => {
  state.activeTurnTeamId = null;
  state.currentTriviaPrompt = null;
  state.triviaPromptCursor = 0;
  state.minigameHostView = null;
  state.minigameDisplayView = null;
};
