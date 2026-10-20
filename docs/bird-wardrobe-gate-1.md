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

## Applied: the art pass (2026-10-20)

Everything above is now in the mockup art, on branch `claude/wardrobe-gate1-art-pass`. The cut sheet
(`mockups/cast/outfit-gallery.html`) shows only what ships: **132 tiles, 0 cuts, 0 open fixes**,
and every style of every tile passes the measured slot rules on all four genre pages. Before/after
sheets of each changed tile, drawn head only (130px blurred, then 76px in every style), are in
[screenshots/wardrobe-gate-1/](screenshots/wardrobe-gate-1/). The Moves sheet shows the key frames as
silhouettes.

- **Cuts:** the 15 variants are deleted from their modules, along with the helpers only they used,
  and their verdicts are gone from the sheet. `verdicts.js` keeps run 1b's verdicts as `RUN_1B`
  and lays Gate 1 over them (`GATE_1_CUT`, `GATE_1_FIXED`, `GATE_1_KEPT_BY_EYE`).
- **Gold:** removed from the bandolier, the pom-pom (all three), the mirror-ball egg and every country
  item (corn-cob c, hay-bale b), with their dead gold code paths. Everywhere else it stays optional,
  never first.
- **Kept by eye:** the eight country-kit drawings are keeps on the sheet, marked "kept by eye".
- **Looks:** Drummer wears drumsticks a (c was cut) and biker-jacket a: with b, the raised meats lined
  up with its ember hem into one orange bar. The metal Full kit wears chain-loop b (a was cut). The
  country Full kit gains tail-bandana b, but the white bandana is mostly lost under the white lasso.
  The disco Full kit gains tinsel a and wears hand-fan b in ink, which clears its rule-8 failure: the
  fixed fan is disco's first ink Prop. Every Look passes rule 8; the amber warnings are unchanged.

### Which fixes landed

All 39 are made, and every style passes every measured rule. A fresh critic has not judged them;
the art pass judged them at 76px and 130px blurred. The tile's "why" in the sheet says exactly what was
drawn. Where the critic's numbers broke a measured rule once drawn, the art moved the least it could,
so the column says how each one landed.

| Unit | Variant | Landed |
|---|---|---|
| metal-kit | battle-vest b | As asked |
| metal-kit | chain-loop b | As asked |
| metal-kit | combat-boots c | As asked |
| metal-kit | spiked-boots a | As asked |
| metal-show | flying-v a | As asked (ink dropped) |
| metal-show | flying-v c | As asked (ink dropped) |
| metal-show | drumsticks a | As asked |
| pop-kit | crop-jacket a | Moved onto the chest: the critic's x values sat about 10 units right of the real front edge; still a blocky white panel |
| pop-kit | tracksuit-top a | Moved onto the chest, same slant and spacing |
| pop-kit | little-black-dress a | **Partly:** the skirt cannot flare 3 units past the outline (the Top region rule allows 1, and §1.3 keeps kit inside the body for the game colliders), so the flare is inside it |
| pop-kit | union-jack-dress a | **Partly:** same skirt limit; the front of the skirt is only about 4 units tall |
| pop-kit | puff-sleeve a | Lobes 0.6 units higher to keep the sleeve fringe under 7 |
| pop-kit | ribbon-streamers a | As asked |
| pop-kit | ribbon-streamers b | White baton with an ink edge: a plain ink stick vanished on the dark room |
| pop-kit | go-go-boots a | Toe to x+10, not x+11 (the 9-unit boots band); arch notch filled |
| pop-show | star-mic b | 2.4 units lower (face line, walk tuck) |
| pop-show | corded-mic a | 2.3 units lower; the cable loops onto the pink under the wing and reads weakly, like a wing scallop |
| pop-show | pom-pom c | Centre (15.5,20): both of the critic's centres break prop reach |
| pop-show | union-jack-flag a | Pole 8 units back: at the critic's spot the fly end was 17 units out (limit 10) |
| country-kit | tail-bandana a | Redrawn as a kerchief knotted round the lower plume, inside the Tail region |
| country-show | corn-cob a | Narrower V (chin rule); busy at 76, where the white leaves fan like feathers |
| country-show | corn-cob c | Leans further back (chin rule) |
| country-show | acoustic-guitar b | As asked (white only) |
| country-show | hay-bale b | Right end x 85, wisps up to 3.8 (stage limits) |
| disco-kit | satin-jacket a | As asked, plus a body clip and the rib cut at y 37 (region, hair) |
| disco-kit | flare-sleeve b | As asked (cuff band on team) |
| disco-kit | tinsel a | Long strand ends 3 units further in (tail reach) |
| disco-kit | feather-boa a | As asked |
| disco-kit | feather-boa b | As asked |
| disco-kit | platforms a | Ink style dropped (the fix made it the white shoe); near heel to x−8 |
| disco-show | hand-fan b | Rivet 1.5 units lower (head box at rest); ink default |
| shared | team-sash b | Per body: two tails on the broody, the fix's one-tail fallback on stock and spiky, the knot alone on the preener (too shallow for a tail) |
| shared | golden-egg a | Moved further than asked, to clear 3 units of team colour on all four birds |
| shared | drumstick a | **Partly:** bigger meat behind the legs, legs fully orange, but it cannot hang as low as asked: the chicken-dance flap and the horns-pump stamp sweep it 3–8 units under the floor |
| shared | egg-nest b | As asked (back end x −7.5 for the stage limit) |
| moves | horns-pump | Fist above the head; the raised wing floats a little off the back |
| moves | heart-point | A mirrored wing (new `wingFlip` rig field) turns the notch down |
| moves | boot-scoot | As asked, with a steeper knee lift |
| moves | chicken-dance | Shared tail −65 on the flap (no per-bird keyframes); mirrored-wing clap |

For run 2/3: `wingFlip` mirrors the wing about its shoulder, and the cast's `CharacterFigure` needs it on
its wing part before heart-point and the chicken dance can port.
