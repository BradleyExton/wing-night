import type { MinigamePluginMetadata } from "@wingnight/minigames-core";
import { MINIGAME_API_VERSION, type MinigameType } from "@wingnight/shared";

export const geoMinigameId: MinigameType = "GEO";

export const geoMinigameMetadata: MinigamePluginMetadata = {
  minigameApiVersion: MINIGAME_API_VERSION,
  capabilities: {
    supportsHostRenderer: true,
    supportsDisplayRenderer: true,
    supportsDevScenarios: true
  },
  intro: {
    displayName: "Geo Dash",
    shortTagline: "Map instincts under spice pressure.",
    objective: "Identify the target location faster than other teams.",
    howToPlay: [
      "Host reveals the location challenge for the active team.",
      "Team points or calls out their best guess immediately.",
      "Host confirms whether the attempt is correct."
    ],
    winCondition: "Earn the most correct location calls in the round.",
    quickTip: "Choose a clear spokesperson before the turn starts.",
    iconKey: "geo"
  }
};
