import { createDevManifest } from "@wingnight/minigames-core";
import type { SerializableValue } from "@wingnight/minigames-core";

// A hand-copy of content/sample/minigames/joust.json, shelf for shelf, so sandbox play matches a
// real night: team-alpha shoots down the first lane, team-beta the second. The built lanes come
// first and the widest open one last, so the first turn of the night is the one with scaffolding
// to aim at.
//
// It is copied rather than imported because this module is bundled for the browser and the sample
// pack is a file on the server's disk. `index.test.ts` reads that file and diffs it against this
// object, so the copy cannot drift again without a red test — a lane that seats too few collapses
// into the bare-ground fallback, and the sandbox would then be showing a rack no party will see.
// Typed as the wire shape rather than inferred: the loadout is a list of unlike objects, and
// the union TypeScript infers for it carries `usesPerTurn?: undefined` members that the
// manifest's `SerializableValue` refuses. Annotating checks each literal on its own.
const DEV_CONTENT: SerializableValue = {
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
  ],
  // The loadout, kind for kind: the profiles here are the ones the sweep in
  // docs/minigames/joust-spec.md §7 was run against, so the sandbox's picker
  // fires exactly what the pack fires.
  shooters: [
    {
      id: "standard",
      name: "The Standard",
      blurb:
        "The house shot. Ploughs a row, folds a tower if you hit the legs hard, lobs to a shelf.",
      color: { fill: "#f97316", dark: "#b8410a", light: "#fdba74" }
    },
    {
      id: "log",
      name: "The Log",
      blurb: "Big, slow, heavy. Ploughs the sand row and folds towers. Can't reach the top shelf.",
      color: { fill: "#8b5a2b", dark: "#4a2c12", light: "#c48b55" },
      usesPerTurn: 1,
      profile: {
        shaftRadius: 3.4,
        headRadius: 4.8,
        ballRadius: 3.2,
        linkSpacing: 3.8,
        massShare: 0.06,
        legShare: 0.06,
        restitution: 0.1,
        bendStiffness: 0.7,
        launchSpeedScale: 0.65
      }
    },
    {
      id: "pencil",
      name: "The Pencil",
      blurb:
        "Thin, quick, long. Reaches the far end and the top shelf, stops in the first birds it meets, bounces off timber.",
      color: { fill: "#a78bfa", dark: "#5b21b6", light: "#ddd6fe" },
      usesPerTurn: 1,
      profile: {
        shaftRadius: 1.4,
        headRadius: 2.2,
        ballRadius: 1.8,
        linkSpacing: 3.4,
        massShare: 0.15,
        legShare: 0.7,
        bendStiffness: 0.85,
        launchSpeedScale: 1.3
      }
    },
    {
      id: "bouncer",
      name: "The Bouncer",
      blurb:
        "Rubber. Lob it short and it comes off the sand and the slabs into rows a straight shot can't reach. Never folds a tower.",
      color: { fill: "#ef4444", dark: "#991b1b", light: "#fca5a5" },
      usesPerTurn: 1,
      profile: {
        shaftRadius: 2.8,
        headRadius: 3.6,
        ballRadius: 2.2,
        linkSpacing: 2.4,
        massShare: 0.12,
        legShare: 0.8,
        restitution: 0.9,
        slip: 0.02,
        bendStiffness: 0.9,
        damping: 0.9995,
        launchSpeedScale: 1.1
      }
    }
  ]
};

export const joustDevManifest = createDevManifest({
  rules: { shotsPerPlayer: 1 },
  content: DEV_CONTENT
});
