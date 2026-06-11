import type { MinigameDevManifest } from "@wingnight/minigames-core";

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

export const triviaDevManifest: MinigameDevManifest = {
  teamIds: ["team-alpha", "team-beta"],
  teamNameByTeamId: {
    "team-alpha": "Team Alpha",
    "team-beta": "Team Beta"
  },
  activeRoundTeamId: "team-alpha",
  pointsMax: 15,
  pendingPointsByTeamId: {
    "team-alpha": 0,
    "team-beta": 0
  },
  rules: { questionsPerTurn: 3 },
  content: DEV_CONTENT
};
