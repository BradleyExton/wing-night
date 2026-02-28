import type { MinigamePluginMetadata } from "@wingnight/minigames-core";
import { MINIGAME_API_VERSION, type MinigameType } from "@wingnight/shared";

export const drawingMinigameId: MinigameType = "DRAWING";

export const drawingMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  },
  intro: {
    displayName: "Sketch Relay",
    shortTagline: "Draw clues before the burn fades.",
    objective: "Communicate the prompt through drawing only.",
    howToPlay: [
      "Host gives the active team a drawing prompt.",
      "One teammate draws while others guess in real time.",
      "Host scores the attempt when the correct guess lands."
    ],
    winCondition: "Score the most successful prompt guesses this round.",
    quickTip: "Start with broad shapes before details.",
    iconKey: "drawing"
  }
};
