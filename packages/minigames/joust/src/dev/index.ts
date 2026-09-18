import { createDevManifest } from "@wingnight/minigames-core";

// Mirrors content/sample/minigames/joust.json so sandbox play matches a real
// night: team-alpha shoots down the first lane, team-beta the second.
const DEV_CONTENT = {
  prompts: [
    {
      id: "arena-open-range",
      name: "Open Range",
      perches: [
        { x: 54, y: 78, width: 102 }
      ],
      obstacles: []
    },
    {
      id: "arena-lookout",
      name: "The Lookout",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 116, y: 50, width: 34 }
      ],
      obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
    },
    {
      id: "arena-two-towers",
      name: "Two Towers",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 62, y: 56, width: 32 },
        { x: 116, y: 56, width: 32 }
      ],
      obstacles: []
    },
    {
      id: "arena-front-porch",
      name: "Front Porch",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 58, y: 52, width: 34 }
      ],
      obstacles: []
    }
  ]
};

export const joustDevManifest = createDevManifest({
  rules: { shotsPerPlayer: 1 },
  content: DEV_CONTENT
});
