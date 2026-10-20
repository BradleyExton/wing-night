// The one-tap outfits each team's wardrobe opens on (docs/research/bird-wardrobe.md
// §2.2), as drawn and judged in the harness's full-kit row
// (`apps/client/public/mockups/cast/outfit-items/looks.js`). The harness's "Full
// kit" rows are density tests, not Looks, and stay out. A Look names styles
// only where rule 8 needs one: a Prop contrasts with the Sleeve behind it.
//
// Every Look must pass `parseOutfit` for its genre, which a test holds.
import type { OutfitGenre, OutfitLook } from "../types.ts";

export const OUTFIT_LOOKS: Record<OutfitGenre, readonly OutfitLook[]> = {
  metal: [
    {
      id: "thrash",
      name: "Thrash",
      outfit: {
        top: { item: "battle-vest-a" },
        sleeve: { item: "leather-sleeve-a", style: "ink" },
        boots: { item: "combat-boots-a", style: "ink" },
        prop: { item: "flying-v-b", style: "white" }
      }
    },
    {
      id: "pyro",
      name: "Pyro",
      outfit: {
        sleeve: { item: "flame-sleeve-b", style: "ink" },
        tail: { item: "lava-tips-b" },
        stage: { item: "lava-disc-c" }
      }
    },
    {
      id: "drummer",
      name: "Drummer",
      outfit: {
        top: { item: "biker-jacket-a" },
        prop: { item: "drumsticks-a", style: "white" },
        stage: { item: "bolt-disc-a" }
      }
    }
  ],
  pop: [
    {
      id: "sporty",
      name: "Sporty",
      outfit: {
        top: { item: "tracksuit-top-b", style: "ink" },
        sleeve: { item: "stripe-sleeve-b", style: "team" },
        boots: { item: "platform-trainers-a", style: "white" },
        prop: { item: "pom-pom-a", style: "white" }
      }
    },
    {
      id: "ginger",
      name: "Ginger",
      outfit: {
        top: { item: "union-jack-dress-b", style: "ink" },
        prop: { item: "union-jack-flag-c", style: "ink" },
        stage: { item: "led-star-riser-a" }
      }
    },
    {
      id: "posh",
      name: "Posh",
      outfit: {
        top: { item: "little-black-dress-b" },
        boots: { item: "go-go-boots-b", style: "ink" },
        prop: { item: "star-mic-a", style: "white" }
      }
    },
    {
      id: "baby",
      name: "Baby",
      outfit: {
        top: { item: "crop-jacket-b" },
        tail: { item: "big-bow-b", style: "white" },
        stage: { item: "spotlight-b", style: "white" }
      }
    }
  ],
  country: [
    {
      id: "rodeo",
      name: "Rodeo",
      outfit: {
        top: { item: "trophy-buckle-a" },
        sleeve: { item: "fringe-sleeve-b", style: "ink" },
        prop: { item: "lasso-b", style: "white" },
        stage: { item: "sawdust-ring-a" }
      }
    },
    {
      id: "honky-tonk",
      name: "Honky-tonk",
      outfit: {
        top: { item: "western-yoke-b" },
        sleeve: { item: "suede-sleeve-a", style: "ink" },
        prop: { item: "acoustic-guitar-a", style: "white" },
        stage: { item: "sawdust-ring-b" }
      }
    },
    {
      id: "farmhand",
      name: "Farmhand",
      outfit: {
        top: { item: "bandana-b", style: "white" },
        prop: { item: "lasso-c", style: "ink" },
        stage: { item: "egg-nest-a" }
      }
    }
  ],
  disco: [
    {
      id: "fever",
      name: "Fever",
      outfit: {
        top: { item: "open-shirt-b" },
        sleeve: { item: "flare-sleeve-c", style: "white" },
        stage: { item: "lit-floor-a" }
      }
    },
    {
      id: "studio-54",
      name: "Studio 54",
      outfit: {
        top: { item: "dagger-collar-b", style: "white" },
        prop: { item: "mirror-ball-egg-c", style: "white" },
        stage: { item: "neon-flames-b" }
      }
    },
    {
      id: "roller",
      name: "Roller",
      outfit: {
        top: { item: "open-shirt-c" },
        boots: { item: "roller-skates-a", style: "white" },
        prop: { item: "vinyl-b" }
      }
    }
  ]
};
