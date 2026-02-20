import assert from "node:assert/strict";
import test from "node:test";

import { Phase } from "@wingnight/shared";

import { buildSandboxRoomState } from "./index";

test("buildSandboxRoomState maps intro/play phases and preserves minigame views", () => {
  const roomState = buildSandboxRoomState({
    minigameType: "TRIVIA",
    minigamePhase: "play",
    activeTeamName: "Team Alpha",
    minigameHostView: {
      minigame: "TRIVIA",
      activeTurnTeamId: "team-alpha",
      attemptsRemaining: 1,
      promptCursor: 0,
      pendingPointsByTeamId: { "team-alpha": 2 },
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
      pendingPointsByTeamId: { "team-alpha": 2 },
      currentPrompt: {
        id: "prompt-1",
        question: "Question?"
      }
    }
  });

  assert.equal(roomState.phase, Phase.MINIGAME_PLAY);
  assert.equal(roomState.currentRoundConfig?.minigame, "TRIVIA");
  assert.equal(roomState.minigameHostView?.minigame, "TRIVIA");
  assert.equal(roomState.minigameDisplayView?.minigame, "TRIVIA");
  assert.equal(roomState.activeRoundTeamId, "team-alpha");
});
