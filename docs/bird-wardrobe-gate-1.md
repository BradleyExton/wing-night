# Bird wardrobe: Gate 1 cuts

Date: 2026-10-20. Brad's keep-or-cut pass over `mockups/cast/outfit-gallery.html`, the cut sheet
for run 1 of [bird-wardrobe-build-plan.md](bird-wardrobe-build-plan.md). The critics' verdicts it
was judged against are `mockups/cast/outfit-items/verdicts.js`.

147 tiles: **132 kept, 15 cut**. Every Move is kept.

## Cut

Everything not listed here is kept.

| Genre | Slot | Cut | Critic said |
|---|---|---|---|
| metal | Top | bandolier a (bullet belt) | fix |
| metal | Tail | chain-loop a | keep |
| metal | Tail | spiked-cuff a | cut |
| metal | Boots | spiked-boots b | cut |
| metal | Prop | drumsticks b | keep |
| metal | Prop | drumsticks c | keep |
| country | Stage | hay-bale a | cut |
| disco | Top | open-shirt a | cut |
| disco | Top | dagger-collar c | cut |
| disco | Top | satin-jacket b | cut |
| disco | Tail | tinsel b | cut |
| disco | Boots | platforms b | cut |
| disco | Prop | mirror-ball-egg b | cut |
| disco | Prop | hand-fan a | cut |
| disco | Prop | vinyl a | cut |

Brad overrode the critic four times, all toward cutting: the three critic keeps above and the
bullet belt's `a`, which leaves the bandolier as `b` only.

## Keep, and make the critic's fix

A kept tile the critic sent back as a fix ships with that fix made. The fix text is the `fix` field
of its entry in `verdicts.js`. These 39 are the art queue before run 3 ports them:

| Unit | Variants |
|---|---|
| metal-kit | battle-vest b, chain-loop b, combat-boots c, spiked-boots a |
| metal-show | flying-v a, flying-v c, drumsticks a |
| pop-kit | crop-jacket a, tracksuit-top a, little-black-dress a, union-jack-dress a, puff-sleeve a, ribbon-streamers a, ribbon-streamers b, go-go-boots a |
| pop-show | star-mic b, corded-mic a, pom-pom c, union-jack-flag a |
| country-kit | tail-bandana a |
| country-show | corn-cob a, corn-cob c, acoustic-guitar b, hay-bale b |
| disco-kit | satin-jacket a, flare-sleeve b, tinsel a, feather-boa a, feather-boa b, platforms a |
| disco-show | hand-fan b |
| shared | team-sash b, golden-egg a, drumstick a, egg-nest b |
| moves | horns-pump, heart-point, boot-scoot, chicken-dance |

## Kept as drawn, by Brad's eye

The run 1b country-kit critic failed, so these eight carry a "not re-judged" fix rather than a
real one. Brad judged them at 76px and kept them, so they need no redraw: western-yoke a,
trophy-buckle b, fringed-vest b, fringe-sleeve a, suede-sleeve b, tail-bandana b, rope-coil a,
rope-coil b.

## Gold

**Keep it where it reads, as an optional style, never the default** (Brad, 2026-10-20). The critics
found gold (#d4a72c) reads as well as white on the Flying V, the axe and the disco lamé, so it stays
offered wherever an item has it, except where they found it fails. There, the `gold` style comes
out of the item's `styles` in the same art pass as the fixes above:

- the **bandolier** (`metal-kit`): it adds nothing over ember;
- the **pom-pom** (`pop-show`): it turns into a sunflower;
- the **mirror-ball egg** (`disco-show`): it turns into a waffle;
- every **country** item (`country-kit`, `country-show`): it is 1.30:1 on country's orange.
