import type { TriviaHostView } from "@wingnight/minigames-trivia";
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
  hostView: TriviaHostView
): void => {
  state.activeTurnTeamId = hostView.activeTurnTeamId;
  state.triviaPromptCursor = hostView.promptCursor;
  state.currentTriviaPrompt =
    hostView.currentPrompt === null ? null : clonePrompt(hostView.currentPrompt);
  state.pendingMinigamePointsByTeamId = {
    ...hostView.pendingPointsByTeamId
  };
};

export const clearTriviaProjectionFromRoomState = (state: RoomState): void => {
  state.activeTurnTeamId = null;
  state.currentTriviaPrompt = null;
  state.triviaPromptCursor = 0;
};
