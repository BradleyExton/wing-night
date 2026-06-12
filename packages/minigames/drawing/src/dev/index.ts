import type { MinigameDevManifest } from "@wingnight/minigames-core";

// Mirrors a slice of content/sample/minigames/drawing.json so sandbox play
// matches a real night without filesystem access from the browser.
const DEV_CONTENT = {
  prompts: [
    { id: "pizza-slice", prompt: "Pizza slice" },
    { id: "campfire", prompt: "Campfire" },
    { id: "skateboard", prompt: "Skateboard" },
    { id: "octopus", prompt: "Octopus" },
    { id: "rocket-ship", prompt: "Rocket ship" },
    { id: "walking-the-dog", prompt: "Walking the dog" }
  ]
};

export const drawingDevManifest: MinigameDevManifest = {
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
  rules: null,
  content: DEV_CONTENT
};
