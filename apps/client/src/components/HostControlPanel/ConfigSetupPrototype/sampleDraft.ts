// PROTOTYPE (throwaway) — fixture draft mirroring content/sample/*. The lab
// adopts live room state when a server is connected; this keeps it usable
// standalone. Deleted with the lab; never shipped.
import type { GameConfigFile } from "@wingnight/shared";

export type DraftTriviaPrompt = { id: string; question: string; answer: string };

export type ConfigDraft = {
  gameConfig: GameConfigFile;
  playerNames: string[];
  teamNames: string[];
  triviaPrompts: DraftTriviaPrompt[];
  geoPromptCount: number;
  drawingPromptCount: number;
};

export const buildSampleDraft = (): ConfigDraft => ({
  gameConfig: {
    name: "House Party Pack",
    setupPreviewRoundSlots: 8,
    rounds: [
      { round: 1, label: "Warm Up", sauce: "Frank's", pointsPerPlayer: 2, minigame: "TRIVIA" },
      { round: 2, label: "Second Heat", sauce: "Classic Buffalo", pointsPerPlayer: 3, minigame: "GEO" },
      { round: 3, label: "Final Fire", sauce: "Ghost Pepper", pointsPerPlayer: 4, minigame: "DRAWING" }
    ],
    minigameScoring: { defaultMax: 15, finalRoundMax: 20 },
    minigameRules: {
      trivia: { questionsPerTurn: 5 },
      geo: { promptsPerTurn: 3 }
    },
    timers: {
      eatingSeconds: 120,
      triviaSeconds: 30,
      geoSeconds: 45,
      drawingSeconds: 60
    }
  },
  playerNames: [
    "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Avery", "Riley", "Drew",
    "Quinn", "Cameron", "Reese", "Parker", "Rowan", "Skyler", "Jamie", "Dakota"
  ],
  teamNames: ["Scorch Squad", "Blaze Brigade", "Inferno Crew", "Pepper Riot"],
  triviaPrompts: [
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
  ],
  geoPromptCount: 6,
  drawingPromptCount: 24
});
