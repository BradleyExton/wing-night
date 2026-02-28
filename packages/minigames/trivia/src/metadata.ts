import { type MinigamePluginMetadata } from "@wingnight/minigames-core";
import { MINIGAME_API_VERSION, type MinigameType } from "@wingnight/shared";

export const triviaMinigameId: MinigameType = "TRIVIA";

export const triviaMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  },
  intro: {
    displayName: "Trivia Sprint",
    shortTagline: "Answer fast while the heat builds.",
    objective: "Bank points by answering prompts correctly before the round ends.",
    howToPlay: [
      "Host reveals a prompt to the active team.",
      "Team answers immediately while spice is still active.",
      "Host marks each attempt as correct or incorrect."
    ],
    winCondition: "Finish the round with the highest trivia points total.",
    quickTip: "Keep answers short and commit quickly.",
    iconKey: "trivia"
  }
};
