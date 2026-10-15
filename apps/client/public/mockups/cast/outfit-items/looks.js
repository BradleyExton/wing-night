// The Looks of docs/research/bird-wardrobe.md §2.2, per genre, for the
// harness's full-kit section (the density test of §2.1). Each slot names an
// item id from that genre's -kit/-show modules or shared.js; an item nobody
// has drawn yet is skipped and listed under the Look.
//
// Styles are set where rule 8 needs them: a Prop's style must contrast with
// the Sleeve it is held against, so a Look with both names both. If the item
// that ships does not offer the style named here, the harness shows its
// default and says so.
//
// `test: true` marks a density test: every slot filled at once, to see if a
// full kit holds at 76px. Those are not shipping Looks.

export const LOOKS = {
  metal: [
    {
      name: "Thrash",
      outfit: {
        top: { item: "battle-vest", variant: "a" },
        sleeve: { item: "leather-sleeve", variant: "a", style: "ink" },
        boots: { item: "combat-boots", variant: "a" },
        prop: { item: "flying-v", variant: "a", style: "white" }
      }
    },
    {
      name: "Pyro",
      outfit: {
        top: { item: "bandolier", variant: "a" },
        sleeve: { item: "flame-sleeve", variant: "a", style: "ink" },
        stage: { item: "lava-disc", variant: "a" }
      }
    },
    {
      name: "Drummer",
      outfit: {
        top: { item: "biker-jacket", variant: "a" },
        prop: { item: "drumsticks", variant: "a", style: "white" },
        stage: { item: "speaker-cab", variant: "a" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "bandolier", variant: "a" },
        sleeve: { item: "flame-sleeve", variant: "a", style: "ink" },
        tail: { item: "chain-loop", variant: "a" },
        boots: { item: "spiked-boots", variant: "a" },
        prop: { item: "flying-v", variant: "a", style: "white" },
        stage: { item: "lava-disc", variant: "a" }
      }
    }
  ],
  pop: [
    {
      name: "Sporty",
      outfit: {
        top: { item: "tracksuit-top", variant: "a" },
        sleeve: { item: "stripe-sleeve", variant: "a", style: "team" },
        boots: { item: "platform-trainers", variant: "a" },
        prop: { item: "pom-pom", variant: "a", style: "white" }
      }
    },
    {
      name: "Ginger",
      outfit: {
        top: { item: "union-jack-dress", variant: "a" },
        prop: { item: "union-jack-flag", variant: "a" },
        stage: { item: "led-star-riser", variant: "a" }
      }
    },
    {
      name: "Posh",
      outfit: {
        top: { item: "little-black-dress", variant: "a" },
        boots: { item: "go-go-boots", variant: "a" },
        prop: { item: "star-mic", variant: "a" }
      }
    },
    {
      name: "Baby",
      outfit: {
        top: { item: "crop-jacket", variant: "a" },
        sleeve: { item: "puff-sleeve", variant: "a" },
        tail: { item: "big-bow", variant: "a" },
        stage: { item: "spotlight", variant: "a" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "tracksuit-top", variant: "a" },
        sleeve: { item: "stripe-sleeve", variant: "a", style: "team" },
        tail: { item: "ribbon-streamers", variant: "a" },
        boots: { item: "platform-trainers", variant: "a" },
        prop: { item: "chili-mic", variant: "a", style: "ink" },
        stage: { item: "led-star-riser", variant: "a" }
      }
    }
  ],
  country: [
    {
      name: "Rodeo",
      outfit: {
        top: { item: "trophy-buckle", variant: "a" },
        sleeve: { item: "fringe-sleeve", variant: "a", style: "team" },
        prop: { item: "lasso", variant: "a", style: "ink" },
        stage: { item: "hay-bale", variant: "a" }
      }
    },
    {
      name: "Honky-tonk",
      outfit: {
        top: { item: "western-yoke", variant: "a" },
        sleeve: { item: "suede-sleeve", variant: "a", style: "ink" },
        // The doc's guitar body is ink; against an ink suede sleeve that is
        // one mass (rule 8), so this Look asks for the team-coloured guitar.
        prop: { item: "acoustic-guitar", variant: "a", style: "team" },
        stage: { item: "sawdust-ring", variant: "a" }
      }
    },
    {
      name: "Farmhand",
      outfit: {
        top: { item: "bandana", variant: "a" },
        tail: { item: "rope-coil", variant: "a" },
        prop: { item: "corn-cob", variant: "a" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "fringed-vest", variant: "a" },
        sleeve: { item: "fringe-sleeve", variant: "a", style: "team" },
        tail: { item: "tail-bandana", variant: "a" },
        prop: { item: "lasso", variant: "a", style: "ink" },
        stage: { item: "sawdust-ring", variant: "a" }
      }
    }
  ],
  disco: [
    {
      name: "Fever",
      outfit: {
        top: { item: "open-shirt", variant: "a" },
        sleeve: { item: "flare-sleeve", variant: "a", style: "ink" },
        boots: { item: "platforms", variant: "a" },
        stage: { item: "lit-floor", variant: "a" }
      }
    },
    {
      name: "Studio 54",
      outfit: {
        top: { item: "dagger-collar", variant: "a" },
        tail: { item: "tinsel", variant: "a" },
        prop: { item: "hand-fan", variant: "a" }
      }
    },
    {
      name: "Roller",
      outfit: {
        top: { item: "satin-jacket", variant: "a" },
        boots: { item: "roller-skates", variant: "a" },
        prop: { item: "vinyl", variant: "a" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "dagger-collar", variant: "a" },
        sleeve: { item: "satin-sleeve", variant: "a", style: "white" },
        tail: { item: "feather-boa", variant: "a" },
        boots: { item: "platforms", variant: "a" },
        prop: { item: "mirror-ball-egg", variant: "a", style: "ink" },
        stage: { item: "neon-flames", variant: "a" }
      }
    }
  ],
  // Shown on every genre page, in that genre's colour.
  shared: [
    {
      name: "Wing night",
      test: true,
      outfit: {
        top: { item: "wing-night-bib", variant: "a" },
        prop: { item: "drumstick", variant: "a" },
        stage: { item: "egg-nest", variant: "a" }
      }
    },
    {
      name: "Team colours",
      test: true,
      outfit: {
        top: { item: "team-sash", variant: "a" },
        prop: { item: "golden-egg", variant: "a" }
      }
    }
  ]
};

export default LOOKS;
