import type { MinigameDevManifest } from "@wingnight/minigames-core";

export const triviaDevManifest: MinigameDevManifest = {
  defaultScenarioId: "play-default",
  scenarios: [
    {
      id: "intro-default",
      label: "Intro",
      phase: "intro",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: {
        "team-alpha": "Team Alpha",
        "team-beta": "Team Beta"
      },
      minigameHostView: {
        minigame: "TRIVIA",
        activeTurnTeamId: "team-alpha",
        attemptsRemaining: 1,
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 0,
          "team-beta": 0
        },
        currentPrompt: {
          id: "trivia-1",
          question: "Which scale measures pepper heat?",
          answer: "Scoville"
        }
      },
      minigameDisplayView: {
        minigame: "TRIVIA",
        activeTurnTeamId: "team-alpha",
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 0,
          "team-beta": 0
        },
        currentPrompt: {
          id: "trivia-1",
          question: "Which scale measures pepper heat?"
        }
      }
    },
    {
      id: "play-default",
      label: "Play",
      phase: "play",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: {
        "team-alpha": "Team Alpha",
        "team-beta": "Team Beta"
      },
      minigameHostView: {
        minigame: "TRIVIA",
        activeTurnTeamId: "team-alpha",
        attemptsRemaining: 1,
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 3,
          "team-beta": 1
        },
        currentPrompt: {
          id: "trivia-2",
          question: "What city is famous for buffalo wings?",
          answer: "Buffalo"
        }
      },
      minigameDisplayView: {
        minigame: "TRIVIA",
        activeTurnTeamId: "team-alpha",
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 3,
          "team-beta": 1
        },
        currentPrompt: {
          id: "trivia-2",
          question: "What city is famous for buffalo wings?"
        }
      }
    },
    {
      id: "play-no-prompt",
      label: "Play (No Prompt)",
      phase: "play",
      activeTeamName: "Team Alpha",
      teamNameByTeamId: {
        "team-alpha": "Team Alpha",
        "team-beta": "Team Beta"
      },
      minigameHostView: {
        minigame: "TRIVIA",
        activeTurnTeamId: "team-alpha",
        attemptsRemaining: 0,
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 3,
          "team-beta": 1
        },
        currentPrompt: null
      },
      minigameDisplayView: {
        minigame: "TRIVIA",
        activeTurnTeamId: "team-alpha",
        promptCursor: 0,
        pendingPointsByTeamId: {
          "team-alpha": 3,
          "team-beta": 1
        },
        currentPrompt: null
      }
    }
  ]
};
