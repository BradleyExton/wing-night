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
      id: "arena-centennial-beach",
      name: "Centennial Beach",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 54, y: 64, width: 28 },
        { x: 89, y: 50, width: 65 }
      ],
      obstacles: [
        { x: 45, y: 64, width: 7, height: 14, kind: "umbrella" },
        { x: 60, y: 73, width: 16, height: 5, kind: "canoe" },
        { x: 156, y: 50, width: 2, height: 28, kind: "mast" }
      ]
    },
    {
      id: "arena-spirit-catcher",
      name: "The Spirit Catcher",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 56, y: 52, width: 38 },
        { x: 98, y: 40, width: 41 }
      ],
      obstacles: [
        { x: 41, y: 66, width: 13, height: 12, kind: "chip-truck" },
        { x: 156, y: 50, width: 2, height: 28, kind: "mast" }
      ]
    },
    {
      id: "arena-allandale-dock",
      name: "Allandale Dock",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 54, y: 48, width: 65 },
        { x: 128, y: 62, width: 28 }
      ],
      obstacles: [
        { x: 45, y: 62, width: 6, height: 16, kind: "lifeguard-chair" },
        { x: 134, y: 73, width: 16, height: 5, kind: "canoe" }
      ]
    },
    {
      id: "arena-meridian-place",
      name: "Meridian Place",
      perches: [
        { x: 54, y: 78, width: 102 },
        { x: 64, y: 44, width: 40 },
        { x: 112, y: 52, width: 40 }
      ],
      obstacles: [
        { x: 44, y: 70, width: 8, height: 8, kind: "muskoka-chair" },
        { x: 156, y: 52, width: 2, height: 26, kind: "mast" }
      ]
    }
  ]
};

export const joustDevManifest = createDevManifest({
  rules: { shotsPerPlayer: 1 },
  content: DEV_CONTENT
});
