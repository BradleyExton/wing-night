import { createDevManifest } from "@wingnight/minigames-core";
import type { SerializableValue } from "@wingnight/minigames-core";

// A hand-copy of content/sample/minigames/joust.json, shelf for shelf, so sandbox play matches a
// real night: team-alpha shoots down the first lane, team-beta the second, and so on down the
// four. Every lane is three or four small towers stepping up away from the slingshot, each with a
// sand group stood between its own legs, on four different plans (docs/minigames/joust-spec.md §5).
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
      id: "arena-centennial-beach",
      name: "Centennial Beach",
      perches: [
        { x: 54, y: 52, width: 23.7, kind: "lifeguard-tower" },
        { x: 56.15, y: 78, width: 19.4 },
        { x: 78.5, y: 48, width: 28.4, kind: "lifeguard-tower" },
        { x: 83, y: 78, width: 19.4 },
        { x: 132.2, y: 34, width: 23.7, kind: "lifeguard-tower" },
        { x: 109.85, y: 78, width: 19.4 },
        { x: 107.7, y: 38, width: 23.7, kind: "lifeguard-tower" },
        { x: 134.35, y: 78, width: 19.4 }
      ],
      obstacles: [
        { x: 45, y: 68, width: 7, height: 10, kind: "umbrella" },
        { x: 156, y: 50, width: 2, height: 28, kind: "mast" }
      ]
    },
    {
      id: "arena-spirit-catcher",
      name: "The Spirit Catcher",
      perches: [
        { x: 54, y: 50, width: 23.7, kind: "dock" },
        { x: 123.3, y: 38, width: 32.6, kind: "lifeguard-tower" },
        { x: 81.8, y: 42, width: 37.4, kind: "lifeguard-tower" },
        { x: 56.15, y: 78, width: 19.4 },
        { x: 86.3, y: 78, width: 28.4 },
        { x: 125.4, y: 78, width: 28.4 }
      ],
      obstacles: [
        { x: 41, y: 62, width: 13, height: 16, kind: "chip-truck" },
        { x: 156, y: 50, width: 2, height: 28, kind: "mast" }
      ]
    },
    {
      id: "arena-allandale-dock",
      name: "Allandale Dock",
      perches: [
        { x: 95.5, y: 44, width: 23.7, kind: "condo-balcony" },
        { x: 123.3, y: 36, width: 32.6, kind: "condo-balcony" },
        { x: 54, y: 52, width: 37.4, kind: "dock" },
        { x: 58.5, y: 78, width: 28.4 },
        { x: 97.65, y: 78, width: 19.4 },
        { x: 125.4, y: 78, width: 28.4 }
      ],
      obstacles: [
        { x: 45, y: 64, width: 7, height: 14, kind: "lifeguard-chair" }
      ]
    },
    {
      id: "arena-meridian-place",
      name: "Meridian Place",
      perches: [
        { x: 54, y: 50, width: 32.6, kind: "souldiers-roof" },
        { x: 88.6, y: 40, width: 32.6, kind: "queens-balcony" },
        { x: 123.2, y: 36, width: 32.6, kind: "condo-balcony" },
        { x: 56.1, y: 78, width: 28.4 },
        { x: 90.7, y: 78, width: 28.4 },
        { x: 125.3, y: 78, width: 28.4 }
      ],
      obstacles: [
        { x: 44, y: 62, width: 8, height: 16, kind: "planter" },
        { x: 156, y: 52, width: 2, height: 26, kind: "lamp-post" }
      ]
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
