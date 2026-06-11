import type {
  MinigameDevManifest,
  MinigameRuntimeActionEnvelope
} from "@wingnight/minigames-core";

const TEAM_NAME_BY_TEAM_ID = {
  "team-alpha": "Team Alpha",
  "team-beta": "Team Beta"
} as const;

// Mirrors content/sample/minigames/trivia.json so sandbox play matches a
// real night.
const DEV_CONTENT = {
  prompts: [
    {
      id: "spice-origin",
      question: "What country is widely credited as the origin of hot sauce?",
      answer: "Mexico"
    },
    {
      id: "capsaicin-source",
      question: "What compound gives chili peppers their heat?",
      answer: "Capsaicin"
    },
    {
      id: "scoville-name",
      question: "What scale is used to measure pepper heat?",
      answer: "Scoville scale"
    }
  ]
};

const CORRECT_ATTEMPT_ACTION: MinigameRuntimeActionEnvelope = {
  actionType: "recordAttempt",
  actionPayload: { isCorrect: true }
};

const INCORRECT_ATTEMPT_ACTION: MinigameRuntimeActionEnvelope = {
  actionType: "recordAttempt",
  actionPayload: { isCorrect: false }
};

export const triviaDevManifest: MinigameDevManifest = {
  defaultScenarioId: "play-default",
  live: {
    teamIds: ["team-alpha", "team-beta"],
    teamNameByTeamId: TEAM_NAME_BY_TEAM_ID,
    activeRoundTeamId: "team-alpha",
    pointsMax: 15,
    pendingPointsByTeamId: {
      "team-alpha": 0,
      "team-beta": 0
    },
    rules: { questionsPerTurn: 3 },
    content: DEV_CONTENT
  },
  scenarios: [
    {
      id: "intro-default",
      label: "Intro",
      phase: "intro"
    },
    {
      id: "play-default",
      label: "Play",
      phase: "play"
    },
    {
      id: "play-mid-turn",
      label: "Play (Mid Turn)",
      phase: "play",
      setupActions: [CORRECT_ATTEMPT_ACTION]
    },
    {
      id: "play-turn-complete",
      label: "Play (Turn Complete)",
      phase: "play",
      setupActions: [
        CORRECT_ATTEMPT_ACTION,
        INCORRECT_ATTEMPT_ACTION,
        CORRECT_ATTEMPT_ACTION
      ]
    }
  ]
};
