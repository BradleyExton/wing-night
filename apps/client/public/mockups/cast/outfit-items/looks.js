// The Looks of docs/research/bird-wardrobe.md §2.2, per genre, for the
// harness's full-kit section (the density test of §2.1). Each slot names an
// item id from that genre's -kit/-show modules or shared.js; an item nobody
// has drawn yet is skipped and listed under the Look.
//
// Run 1b: every Look points at art the critics KEPT, so Brad cuts from strong
// candidates. Where the doc's item has no kept variant, the Look swaps in a
// kept item from the same slot (or leaves the slot empty) and says so in a
// comment beside it.
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
        // Vest and sleeve merge into one leather mass on purpose (rule 8's
        // exception); the white Flying V is the brightest shape on the bird.
        top: { item: "battle-vest", variant: "a" },
        sleeve: { item: "leather-sleeve", variant: "a", style: "ink" },
        boots: { item: "combat-boots", variant: "a", style: "ink" },
        prop: { item: "flying-v", variant: "b", style: "white" }
      }
    },
    {
      name: "Pyro",
      outfit: {
        // Fire three ways: on the wing, the tail and the floor. The doc's
        // bandolier is left off: its ember shells beside the flame sleeve and
        // the flame tail turned the back half into one orange tangle at 76px.
        // It wears in the Full kit instead.
        sleeve: { item: "flame-sleeve", variant: "b", style: "ink" },
        tail: { item: "lava-tips", variant: "b" },
        stage: { item: "lava-disc", variant: "c" }
      }
    },
    {
      name: "Drummer",
      outfit: {
        top: { item: "biker-jacket", variant: "b" },
        // Sticks raised in a V behind the back, so they never cover the jacket.
        prop: { item: "drumsticks", variant: "c", style: "white" },
        // The doc's speaker cab was never drawn; the bolt disc is the kept stage.
        stage: { item: "bolt-disc", variant: "a" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "bandolier", variant: "b", style: "ink" },
        sleeve: { item: "flame-sleeve", variant: "a", style: "ink" },
        tail: { item: "chain-loop", variant: "a" },
        // spiked-boots has no kept variant.
        boots: { item: "combat-boots", variant: "b", style: "ink" },
        prop: { item: "battle-axe", variant: "a", style: "white" },
        stage: { item: "lava-disc", variant: "a" }
      }
    }
  ],
  pop: [
    {
      name: "Sporty",
      outfit: {
        top: { item: "tracksuit-top", variant: "b", style: "ink" },
        sleeve: { item: "stripe-sleeve", variant: "b", style: "team" },
        boots: { item: "platform-trainers", variant: "a", style: "white" },
        prop: { item: "pom-pom", variant: "a", style: "white" }
      }
    },
    {
      name: "Ginger",
      outfit: {
        top: { item: "union-jack-dress", variant: "b", style: "ink" },
        // Waved high behind the back, clear of the dress, so the two jacks
        // never touch.
        prop: { item: "union-jack-flag", variant: "c", style: "ink" },
        stage: { item: "led-star-riser", variant: "a" }
      }
    },
    {
      name: "Posh",
      outfit: {
        top: { item: "little-black-dress", variant: "b" },
        boots: { item: "go-go-boots", variant: "b", style: "ink" },
        prop: { item: "star-mic", variant: "a", style: "white" }
      }
    },
    {
      name: "Baby",
      outfit: {
        // crop-jacket's only keep is b, the ink star bomber, and puff-sleeve's
        // only keep is the same star on an ink wing (its note: never with
        // crop-jacket b), so Baby wears the jacket and no sleeve: the pink
        // bird, a dark bomber and a big white bow in her bunches.
        top: { item: "crop-jacket", variant: "b" },
        tail: { item: "big-bow", variant: "b", style: "white" },
        stage: { item: "spotlight", variant: "b", style: "white" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "tracksuit-top", variant: "b", style: "ink" },
        sleeve: { item: "stripe-sleeve", variant: "a", style: "team" },
        // ribbon-streamers has no kept variant.
        tail: { item: "big-bow", variant: "a", style: "white" },
        boots: { item: "platform-trainers", variant: "b", style: "white" },
        prop: { item: "corded-mic", variant: "b", style: "white" },
        stage: { item: "led-star-riser", variant: "b" }
      }
    }
  ],
  country: [
    {
      name: "Rodeo",
      outfit: {
        top: { item: "trophy-buckle", variant: "a" },
        sleeve: { item: "fringe-sleeve", variant: "b", style: "ink" },
        // White on the ink fringe sleeve (rule 8); the twirl swings it up
        // behind the tail, clear of the white star buckle.
        prop: { item: "lasso", variant: "b", style: "white" },
        // hay-bale has no kept variant; the barrel is barrel racing.
        stage: { item: "sawdust-ring", variant: "a" }
      }
    },
    {
      name: "Honky-tonk",
      outfit: {
        top: { item: "western-yoke", variant: "b" },
        sleeve: { item: "suede-sleeve", variant: "a", style: "ink" },
        prop: { item: "acoustic-guitar", variant: "a", style: "white" },
        stage: { item: "sawdust-ring", variant: "b" }
      }
    },
    {
      name: "Farmhand",
      outfit: {
        top: { item: "bandana", variant: "b", style: "white" },
        // corn-cob has no kept variant and rope-coil (the Tail) none either;
        // the ranch hand's rope comes in as the Prop instead.
        prop: { item: "lasso", variant: "c", style: "ink" },
        stage: { item: "egg-nest", variant: "a" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "fringed-vest", variant: "a" },
        sleeve: { item: "fringe-sleeve", variant: "b", style: "ink" },
        // No country Tail item has a keep yet.
        prop: { item: "lasso", variant: "b", style: "white" },
        stage: { item: "sawdust-ring", variant: "a" }
      }
    }
  ],
  disco: [
    {
      name: "Fever",
      outfit: {
        top: { item: "open-shirt", variant: "b" },
        // White bell sleeve against the ink shirt: two values, not one mass.
        sleeve: { item: "flare-sleeve", variant: "c", style: "white" },
        // platforms has no kept variant, so Fever goes without boots.
        stage: { item: "lit-floor", variant: "a" }
      }
    },
    {
      name: "Studio 54",
      outfit: {
        top: { item: "dagger-collar", variant: "b", style: "white" },
        // tinsel and feather-boa have no kept variant, nor does hand-fan; the
        // mirror ball, raised overhead, is the club's own prop.
        prop: { item: "mirror-ball-egg", variant: "c", style: "white" },
        stage: { item: "neon-flames", variant: "b" }
      }
    },
    {
      name: "Roller",
      outfit: {
        // satin-jacket has no kept variant. Every kept disco Sleeve is white,
        // and the white satin sleeve swallowed the record's white sleeve
        // (rule 8, 2.43:1), so Roller wears the ink sparkle shirt instead.
        top: { item: "open-shirt", variant: "c" },
        boots: { item: "roller-skates", variant: "a", style: "white" },
        prop: { item: "vinyl", variant: "b" }
      }
    },
    {
      name: "Full kit",
      test: true,
      outfit: {
        top: { item: "open-shirt", variant: "c" },
        sleeve: { item: "satin-sleeve", variant: "b", style: "white" },
        // No disco Tail item has a keep yet. Every kept disco Sleeve is white
        // and every kept Prop is white or team, so this pair fails rule 8 on
        // purpose: it is the gap (a dark kept Sleeve, or an ink Prop).
        boots: { item: "roller-skates", variant: "b", style: "white" },
        prop: { item: "vinyl", variant: "b" },
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
        prop: { item: "drumstick", variant: "b", style: "white" },
        stage: { item: "egg-nest", variant: "c" }
      }
    },
    {
      name: "Team colours",
      test: true,
      outfit: {
        // Ink sash under a white egg: the white sash ran into the egg as one club.
        top: { item: "team-sash", variant: "a", style: "ink" },
        prop: { item: "golden-egg", variant: "b", style: "white" }
      }
    }
  ]
};

export default LOOKS;
