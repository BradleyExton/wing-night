import { createDevManifest } from "@wingnight/minigames-core";

// A hand-copy of content/sample/minigames/joust.json, shelf for shelf, so sandbox play matches a
// real night: team-alpha shoots down the first lane, team-beta the second. The built lanes come
// first and the widest open one last, so the first turn of the night is the one with scaffolding
// to aim at.
//
// It is copied rather than imported because this module is bundled for the browser and the sample
// pack is a file on the server's disk. `index.test.ts` reads that file and diffs it against this
// object, so the copy cannot drift again without a red test — a lane that seats too few collapses
// into the bare-ground fallback, and the sandbox would then be showing a rack no party will see.
const DEV_CONTENT = {
  prompts: [
    {
      id: "arena-two-towers",
      name: "Two Towers",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 66, y: 44, width: 40 },
        { x: 112, y: 52, width: 40 }
      ],
      obstacles: []
    },
    {
      id: "arena-lookout",
      name: "The Lookout",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 57, y: 52, width: 58 },
        { x: 129, y: 40, width: 22 }
      ],
      obstacles: [{ x: 46, y: 66, width: 5, height: 12 }]
    },
    {
      id: "arena-front-porch",
      name: "Front Porch",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 62, y: 48, width: 76 }
      ],
      obstacles: []
    },
    {
      id: "arena-open-range",
      name: "Open Range",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 71, y: 56, width: 85 }
      ],
      obstacles: []
    }
  ]
};

export const joustDevManifest = createDevManifest({
  rules: { shotsPerPlayer: 1 },
  content: DEV_CONTENT
});
