# The bird wardrobe: a fuller outfit picker for wingnight.tv

Date: 2026-10-14. Research and recommendation, no app code. It builds on
[guest-portal-team-pick-plan.md](../guest-portal-team-pick-plan.md): milestone 1 (self-pick teams) is
shipped, and milestone 2 (the two-slot wardrobe mockups, `apps/client/public/mockups/cast/wardrobe-*.html`)
is drawn and waiting for cuts. This doc replaces that plan's "The wardrobe itself" section and
milestones 3–4 once Brad signs off. The full item idea bank is in
[bird-wardrobe-item-bank.md](bird-wardrobe-item-bank.md). The recommendation is drawn on a phone in
[`mockups/cast/wardrobe-picker.html`](../../apps/client/public/mockups/cast/wardrobe-picker.html).

## The short version

Brad wants guests to dress their chicken with several items, not a token two-slot rail. The
research agrees, with one big condition. **Richness has to come from where items sit, not from
how many we pile on the chest.** The chest is about 15×24 units, roughly 27×43 px in the lobby
parade. The first round put both of its slots on that panel and on a wing patch, and most of its
candidates turned to mush or read as eyes. Items that change the outline or a whole plane read at
TV size: the whole wing, the tail, a prop held out past the body, a stage under the feet, a move.

The recommendation:

- **Seven slots in two groups.** The **kit** rides the bird everywhere, minigames included: *Top*,
  *Sleeve*, *Tail* and *Boots*. The **showpieces** only appear where the bird is on show (the
  lobby parade, the intro lineup, the portal): *Prop*, *Stage* and *Move*.
- **A rail per team.** Each genre gets three or four items per kit slot and two or three per
  showpiece slot, plus a shared rail that every team can wear in its own colour. Version 1 is
  about 16 items per genre plus 7 shared, roughly 70 drawings, which gives between 8,000 and
  21,000 combinations per team.
- **Authored styles instead of a colour picker.** Each item carries one to three styles (ink,
  white, team colour, and maybe gold), and every style is judged at TV size before it ships.
- **Looks and Shuffle.** Each team gets three or four named one-tap outfits; pop's are the Spice
  personas. There is also a dice button that dresses the bird at random from the team's rail.
- **A focused wardrobe screen** at `/me/wardrobe`. Your bird stands large at the top in its
  stage, with slot tabs below and a grid of tiles. **Each tile is a zoomed crop of your own bird
  wearing that item.** At the foot, your teammates appear as they'll look in the parade.
- **Keep an outfit per genre.** A team switch swaps rails and restores the outfit you last built
  there. Unlike the plan, *all* genres' outfits go down to the pack, so a reseat on the night
  keeps the guest dressed.

That means overturning five past decisions, all listed under
[Decisions this overturns](#decisions-this-overturns). Necklaces stay rejected, nothing goes on
the face, and the team still owns the silhouette.

---

## 1. Findings

Four parallel research passes. The notes behind them, with full source lists, are summarised here
and the sources are linked inline.

### 1.1 Prior art: avatar and cosmetic systems

| System | Slots | What we take from it |
|---|---|---|
| **Fall Guys** | colour, pattern, upper and lower costume halves, face, nickname, emotes, celebration | Halves mix freely, so a few assets give many combinations. Team rounds *tint over* authored colours and came out muddy: one costume read green on blue team, and was still "yellow-ish" after a fix ([Epic help](https://www.epicgames.com/help/en-US/fall-guys-c-202300000001638/gameplay-c-202300000001728/how-to-customize-your-character-a202300000016495), [Gameluster](https://gameluster.com/mediatonic-adding-customization-features-to-fall-guys-in-season-2/)). **Don't tint authored colours; author the styles.** |
| **Among Us** | colour, hat, visor, skin, pet, nameplate | Colour is identity and unique per lobby. Pets are the priciest slot, because they're *outside the body* ([PC Gamer](https://pcgamer.com/how-to-customize-your-character-in-among-us)). |
| **Animal Crossing** | top, bottom, one-piece fills both, head, face, shoes, bag | A one-piece takes two slots; a helmet blocks face items. There's a fitting room before you buy, and 8 saved outfits ([Nookipedia](https://nookipedia.com/wiki/Clothing)). **Slot exclusion is a rule of the model, not left to each asset.** |
| **Splatoon** | head, clothes, shoes | Team ink colour lives in the **hair**, not the gear. Gear stays free and the team still reads ([Inkipedia](https://splatoonwiki.org/wiki/Ink)). Splashtag titles are adjective + noun with a shuffle ([Sportskeeda](https://sportskeeda.com/esports/how-edit-splashtag-splatoon-3)). |
| **Fortnite locker** | outfit, back bling, pickaxe, glider, contrail, emotes, wraps, lobby music | Styles and edit styles give authored variants of one item. There are presets and an official Randomize ([Epic help](https://www.epicgames.com/help/c-202300000001636/c-202300000001721/how-to-randomize-your-outfit-in-fortnite-a202300000010177)). Back bling is popular because it changes the outline seen from behind. |
| **Rocket League** | body, decal, paint, wheels, boost, topper, antenna, goal explosion, anthem | The primary paint palette is split warm/cool so every car reads as its team; the accent is free ([Rocket League wiki](https://rocketleague.fandom.com/wiki/Paint)). Player Anthems play for everyone on a goal ([EGM](https://egmnow.com/rocket-leagues-player-anthems-feature-detailed/)). Competitive players drop toppers because they block the view. |
| **Gang Beasts** | colour, costume top and bottom | Some costume regions follow your player colour; fixed costumes (panda, penguin) never do ([Ludo guide](https://www.ludo.guide/guide/gang-beasts/side-quests-activities/character-customization)). **Mark each region of an item as team or fixed.** |
| **Bitmoji, Memoji, Duolingo** | phone makers | A big preview on top with options below. Memoji tints up to 3 colours per garment and shows **your own avatar in every tile** ([9to5Mac](https://9to5mac.com/2021/09/26/ios-15-brings-new-memoji-customization-with-over-40-outfits-accessibility-options-more), [Duolingo blog](https://blog.duolingo.com/avatar-creator/)). |
| **Party and sports games** | Mario Strikers gear, Stumble Guys footsteps and victories, Jackbox Champ'd Up cards | Mixed gear muddies the team look ([Analog Stick](https://www.analogstickgaming.com/game-reviews/2022/6/25/mario-strikers-battle-league)). Kit-clash rules set contrast by **lightness, not hue** ([Colour Blind Awareness kit advice](https://www.colourblindawareness.org/wp-content/uploads/2020/07/Kit-Selection-Advice-FINAL.pdf)). Champ'd Up's drawn-character keepsake card is a precedent for a post-party card ([Jackbox](https://www.jackboxgames.com/champd-up)). |

Patterns worth stealing, ranked for a dancing chicken with a photo face:

1. **The team owns one organ; items are free.** Splatoon's hair and Rocket League's primary paint
   work the way our genre silhouette does.
2. **Every tile shows your own bird wearing the item** (Memoji, Fortnite hover, the Animal Crossing
   fitting room). Browsing becomes trying on.
3. **Outline changes beat surface pattern** (TF2, Fortnite back bling, Among Us pets).
4. **Authored styles, not free tints** (Fortnite styles; Fall Guys is the cautionary case).
5. **Halves that mix freely, with exclusions as model rules** (Fall Guys, Animal Crossing).
6. **Presets and one-tap randomize** (Fortnite, Rocket League, Fall Guys).
7. **Cheap motion slots** such as victory poses and celebrations (Fall Guys, Stumble Guys). Each
   one is a single new rig pose.
8. **Preset-word titles with a shuffle** (Splatoon, Fall Guys nicknames). There's nothing to
   moderate. Deferred, see §2.9.

Usage data on which slots players value is thin. The surveys found say people buy cosmetics for
looks and to be seen ([Tampere PlayLab](https://blogs.tuni.fi/playlab/game-research-highlights/colorful-pixels-for-150000-e-understanding-virtual-skin-buyers-in-csgo/)),
which fits a party where the whole point is the room seeing your bird.

### 1.2 Prior art: genre and team identity

- **Silhouette first.** Valve designed TF2's classes to be identifiable with no interior shading,
  and picked interior detail to *echo* the outline ([Mitchell et al., NPAR 2007](https://www.cs.princeton.edu/courses/archive/fall07/cos597B/papers/mitchell-team-fortress.pdf),
  [GDC 2008](https://cdn.fastly.steamstatic.com/apps/valve/2008/GDC2008_StylizationWithAPurpose_TF2.pdf)).
  Riot says a champion's primary silhouette feature "should never be removed or significantly
  altered in any skin", and that the silhouette should show the character's **source of power**
  ([Clarity in League](https://www.leagueoflegends.com/en-gb/news/dev/clarity-in-league/)). For
  us: the genre body is the primary feature and no item may fight it. **The strongest secondary
  read is the thing in the wing: the instrument or the mic.**
- **The musician is the prop.** Ulala's mic, Chai's guitar, Beat's spray can. Guitar Hero carried
  each genre with one exaggerated signature, not a whole outfit. Fortnite Festival's Icon bundles
  are outfit + back bling + instrument + emote, which maps almost one-to-one onto our slots
  ([Hi-Fi Rush](https://en.wikipedia.org/wiki/Hi-Fi_Rush), [Ulala](https://en.wikipedia.org/wiki/Ulala_(Space_Channel_5)),
  [Digital Trends](https://www.digitaltrends.com/gaming/fortnite-icon-series-skins/)).
- **Stage as a slot.** Fuser lets the player customise the stage (lights, pyro) and the DJ's
  "attitude" separately from the clothes ([Tom's Guide](https://www.tomsguide.com/news/fuser-harmonix-deep-dive)).
  That is our *Stage* and *Move*.
- **Team paint everywhere.** TF2 ships every cosmetic in RED and BLU, and the community resists
  cross-team paints ([TF2 wiki, Bill's Hat](https://wiki.teamfortress.com/wiki/Bill_Hat)). Splatoon's
  neon night mode washed out blue ink ([Automaton](https://automaton-media.com/en/news/20221112-16667/)),
  so disco cyan and metal chrome on a dark TV are the two to watch.
- **Motion is identity when everyone moves.** The Night Fever point, the headbang, the line-dance
  heel-toe and the Bump all read in silhouette ([Stanford Night Fever syllabus](https://socialdance.stanford.edu/Syllabi/Night_Fever.pdf),
  [Library of Dance, the Bump](https://www.libraryofdance.org/dances/bump/),
  [Mental Floss, the horns](https://www.mentalfloss.com/entertainment/music/devil-horns-origin)).
- **The genre vocabulary**, sourced in the item bank:
  - Metal: kutte and patches, the Priest leather of 1978, bullet belts, the Flying V, the horns,
    pyro ([Heavy metal fashion](https://en.wikipedia.org/wiki/Heavy_metal_fashion),
    [Guitar Player, Flying V](https://www.guitarplayer.com/gear/get-your-wings-the-history-of-gibsons-iconic-flying-v-guitar)).
  - Pop: the five Spice personas, the Union Jack dress, the tracksuit, platform trainers
    ([AnOther](https://anothermag.com/fashion-beauty/2366/decoding-the-spice-girls-style-legacy)).
  - Country: Nudie suits, yoke and snap shirts, fringe, the bandana, the trophy buckle, the lasso
    ([Country Music Hall of Fame](https://countrymusichalloffame.org/exhibit/suiting-the-sound/nudie-cohn-the-original-rhinestone-cowboy/),
    [Western wear](https://en.wikipedia.org/wiki/Western_wear)).
  - Disco: the SNF suit and dagger collar, the medallion, the mirror ball, the lit floor
    ([BAMF Style](https://bamfstyle.com/2017/12/15/saturday-night-fever-white-suit/),
    [DJ Mag](https://djmag.com/features/stayin-alive-history-of-disco-ball)).
- **Motifs two teams would share.** Give each one owner:
  - star: pop's, not a country sheriff star;
  - flame: metal's real fire; disco gets neon outlines only;
  - glitter vs confetti: disco silver points, pop multicolour;
  - feather boa: disco;
  - leopard: nobody, because it turns to mush.

### 1.3 Our codebase: where items can attach

Mapped from `packages/cast`, the portal, the Worker and the pull.

- **No outfit exists in code.** The only traces:
  - `TeamPick.outfitsByGenre` holds `OutfitDraft = Record<string, string>`
    (`packages/shared/src/guestPortal/teamPick/index.ts:10-19`).
  - The D1 column `team_picks.outfits_json` is always written as `'{}'`. The team-pick upsert never
    touches it, so an outfit already survives a team switch (`apps/teaser-worker/src/guestRoutes/index.ts:80-88`).
- **The rig.** `CHARACTER_PARTS = tail, legFar, body, legNear, wing, head` back to front, each turned
  about a fixed pivot. Motion is CSS on each part's `<g>`. Two facts shape every item:
  - The **head moves on its own transform**: it nods −4..5° walking, up to 38° headbanging, and
    pecks 22° idle. Today's hat, shades and medallion are drawn inside the head, so they swing.
    Outfit items must not live there.
  - **Paint-order trap.** The plan says items "paint in the `body` part", but that part paints
    *under* the near thigh and the wing. Every wardrobe page was judged with the item *over* the
    wing (the harness paints `bodyApparel` after the wing and before the neck). Kit items need their
    own layer between `wing` and `head`.
- **The wing is drawn in three places**: the posed figure, FAPPY's separate `CharacterWing` layer,
  and JOUST's aiming wing. The ragdoll has a second, far wing. A Sleeve item has to be drawn in all
  of them.
- **The ragdoll** (Mount Your Hens) follows a child of the `body` RagdollPart for free. The tail
  rides the body. MOUNT's `Climber` paints transforms per layer name (`PART_OF_LAYER`), so a new
  layer name has to be added there or it stays frozen.
- **No surface gets an outfit for free yet.** `resolvePlayerAppearance` rebuilds the appearance from
  `name` and `avatarSrc` only, and `buildPlayer` in the loader drops unknown keys. Once those two
  pass `outfit` through, room state (which ships whole `Player`s) carries it to the **lobby
  parade, the intro lineup and the player phone with no other change**.
- **Separate plumbing is needed** for the teaser roster, `PortalHeadBird`, the config write-back
  and **all five arcade games**. Each game rebuilds a `*PlayerFigure = { playerId, name, avatarSrc,
  teamId, genre }` field by field, in a server builder, a client resolver and a memo key. A shared
  base figure type would make this one change instead of five.
- **Colliders.** JOUST's chest pin and MOUNT's body ball are derived from `CHARACTER_BODY` (41.5, 44,
  r 23), and tests pin them. Kit art stays inside the body outline. Anything drawn outside it (Prop,
  Stage) is paint only, which is why it stays out of games where it would look like it should
  collide.
- **The drawn round** (milestone 2) has 16 candidates on two slots. The harness measures three
  rules from the outline: nothing above the chin, nothing on the upper back right of x≈45 under a
  photo, nothing below the belly. It counts two more by hand: at most one white point, and no white
  shape with a dark centre.

### 1.4 Feasibility at our sizes

The bird is drawn in an 80×72 box. Measured from the CSS and transform chains, not yet in a
browser:

| Where | Bird height | px per unit |
|---|---|---|
| Portal studio (`PortalHeadBird` large) | 176px | 2.44 |
| TV intro lineup (`TeamLineup`) | 173px | 2.40, the biggest the TV shows a bird |
| **TV lobby parade** (`CastParade`, 12vh) | **130px** | **1.80** |
| BRAWL / JOUST / FAPPY / Dunlop Dash | 157 / 113 / 102 / 92px | 2.18 / 1.57 / 1.42 / 1.28, moving 400–1200 px/s |
| Mount Your Hens | up to 245px | 1.9–3.4 as the camera zooms |
| Wardrobe chip at 76px, crowds, relay chips | 76px and less | ≤1.06 |

DESIGN.md's "76px on a 1080p TV" predates the 12vh parade and is now the worst case. It is still
the right cut line.

**What the eye resolves.** On a 55" 1080p set at 3 m, one pixel is ≈0.73 arcmin. With a 2× party
margin on Snellen, a recognisable shape needs ≈10 arcmin (≈14 px) and a stroke ≈2 arcmin (≈3 px).
So **the smallest feature is 8 units in the parade and 13 units at 76px, and the smallest stroke is
2 units**, the house outline ([Optimum HDTV viewing distance](https://en.wikipedia.org/wiki/Optimum_HDTV_viewing_distance),
[Microsoft, designing for TV](https://learn.microsoft.com/pl-pl/windows/apps/design/devices/designing-for-tv)).

**The first round, judged honestly at 76px:**

| Verdict | Candidates |
|---|---|
| Reads | bandana; disco open shirt (one big white wedge each) |
| Half-reads | battle vest (a dark block); crop jacket; star patch (a disc); pop mic; bracer band |
| Mush | sequin tee, sequin shirt, chain mail, tambourine, plaid grid |
| Reads as a face | banjo, wing medallion, pick patch (eyes); horseshoe (a grin) |

**A render of 15 item *kinds*** on pop pink and metal chrome with a photo head, at 76, 130,
130 blurred and 200 px:

| Tier | Kinds |
|---|---|
| Strongest | **recoloured wing**; **two-tone chest** (when it contrasts); **tail plume**; **stage disc** under the feet; **cape** |
| Second | held prop poking past the outline; flag on a pole; boots; sash |
| Fail | belt (hidden by wing and thigh); aura specks; spot pattern; an 8-unit patch |

White on chrome disappears.

**Contrast.** Ink (#121212) clears 3:1 against every team colour (5.3–13.9). White fails on chrome
(1.35), disco cyan (2.43) and country orange (2.91), and passes only on pink (3.53). The leg orange
is useless as an item colour (1.0–2.1). What matters for an item's *inner* detail is contrast
against the item's own base, not against the bird.

**Motion crosses the face, placement doesn't.**
- Body-painted items are safe in every pose.
- A *forward*-pointing wing prop swings into the middle of the photo on the `flap` dance beat:
  (74,39) → (63,13). Any non-pop team can roll `flap`.
- A prop at the wing's back tip rises beside the hair on `hurt` and `ride`, and dips below the feet
  on `flap` and `bounce`.
- In the ragdoll the wings spin freely, so **any** held prop can cross the face.

| Kind | Portal | Parade | Lineup | Minigames | Ragdoll | Face/hair |
|---|---|---|---|---|---|---|
| Chest panel ≥14u, contrasting value | ✓ | ✓ | ✓ | ~ colour block | ✓ | ✓ |
| Chest pattern / texture | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Chest emblem <13u | ✓ | ✗ | ~ | ✗ | ✗ | ~ eye risk |
| Wing recolour / broad band | ✓ | ✓ | ✓ | ✓ | ~ both wings | ✓ |
| Wing-held prop | ✓ | ~ | ✓ | ~ | ✗ | ✗ if forward |
| Tail ornament | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Boots | ✓ | ~ not broody | ~ | ~ | ~ | ✓ |
| Back-mounted (cape, flag) | ✓ | ✓ / ~ | ✓ | ~ | ~ | ~ |
| Stage under the feet | ✓ | ✓ | ✓ | ✗ games own the ground | ✗ | ✓ |
| Aura / particles | ✓ | ✗ specks | ~ | ✗ | ✗ | ~ |
| Move / flourish | ~ | ✓ | ✓ | ✗ the sim owns the pose | ✗ | ~ |

**Real estate differs by genre**, which decides where each team's flavour goes:

| Genre | Chest area | Wing | Tail outside body | Leg shown |
|---|---|---|---|---|
| Country (broody) | 555 u² | 251 u², a 21-unit tuck | 106 u² | **2.3u: boots vanish** |
| Disco (preener) | 248 u², the smallest | 365 u² | 376 u², two sickles to y=0 | 16.3u |
| Metal (spiky) | 293 u² | 507 u² | 202 u² | 8.8u |
| Pop (stock) | 370 u² | 486 u² | 240 u² | 5.3u |

So country's flavour goes on the chest, disco's on the tail and wing.

---

## 2. Recommendation

### 2.1 The slot model

Seven slots. Each slot holds one item or nothing, and each sits on its own region, so two items
never fight for the same pixels.

| Slot | Region | Paint layer (cast) | Shown | Changes |
|---|---|---|---|---|
| **Top** | chest panel, from `head.shoulders` (37) down, inside the body outline | new `outfit` layer after `wing`, before `head`; rides the body's bob, not the head's nod | everywhere | value |
| **Sleeve** | the whole near wing (fill, trailing edge, a broad band) | inside the wing drawing, everywhere the wing is drawn (posed figure, `CharacterWing`, JOUST aim wing, both ragdoll wings) | everywhere | value / outline |
| **Tail** | an ornament *on* the genre tail: tips, streamers, a cuff | inside the `tail` part | everywhere | outline |
| **Boots** | the shank and foot, around the existing leg | inside each leg part; sole never below y 72.75, `CHARACTER_FOOT` unchanged | everywhere; **metal, pop and disco only** | outline |
| **Prop** | held at the wing tip, ≤10 units past the outline, pointing back or down only | inside the wing part, after the Sleeve | showpiece: portal, parade, intro lineup | outline |
| **Stage** | a flat disc or riser under the feet, behind the legs | a new layer before `tail`, drawn by the surface's own ground | showpiece: portal, parade, intro lineup | frame |
| **Move** | a signature flourish: a new pose or beat in the cast | `CharacterFigure` pose | showpiece: parade and intro lineup; tap the portal bird to play it | motion |

Why split kit from showpieces:

- **Kit** is safe in every pose and every game. It never leaves the body, the wing or the tail, so
  JOUST, BRAWL, FAPPY, Dunlop Dash and the Mount ragdoll can draw it without touching a collider.
  It's what makes your bird *yours* mid-game.
- **Showpieces** are the loud, fun ones, and the ones that would break a game:
  - a Flying V in a JOUST lane reads as a weapon that does nothing;
  - a Prop on a ragdoll wing spins across the face;
  - a game owns its ground (deck, sand, street), so a Stage has nowhere to go;
  - a sim owns the pose, so a Move can't run.
  
  They appear where the bird is on show, and the parade and lineup are where the room is
  actually looking at birds.

**Slot rules, enforced by the model rather than by each drawing:**
- Nothing in any slot crosses y < 32 (the chin) in the head column, x > 34; only the Tail rises
  above it, out at the back. On a photo head, nothing crosses y < 37 at x > 45. Unchanged from the
  September rules except for the tail carve-out.
- No slot paints the head part. Nothing new may cross the face.
- The Tail slot *adds to* the genre tail and never replaces it. The tail is the silhouette's
  load-bearing organ (silhouette round verdict), and a swap would take the genre's statement away.
- Boots exist only on rails whose bird shows a shank. Broody shows 2.3 units, so country has no
  Boots slot and gets an extra Top instead.
- The Prop is checked at wing −62° (flap), −26° (bounce), +75° (ride) and +95° (hurt). No point may
  enter the head box (x 36–80, y −12..37) or drop below 72.75.

**The density budget.** The feasibility pass found that two items on one *region* turn to mush.
This model spreads them out, but a bird in a full kit plus a prop has four marks on 130px of bird,
and nobody has rendered that yet. Milestone 2b (§3) draws every genre's **full kit at 76px and at
blurred 130px** first. If it doesn't hold:
- **Fallback A:** limit the kit to three of the four slots, and grey the fourth tile out with "Your
  bird's full" until one is taken off.
- **Fallback B:** quieter Top styles.

Decide after looking, not before.

**What the picker mockup's quick drawings already show** (`wardrobe-picker.html`, every Look at
76px on a photo head):
- **Outline items carry the 76px row best.** Disco's tinsel, the stages, pop's tracksuit stripes
  and the white wedges all read. A whole-wing Sleeve reads as strongly as the render predicted.
- **Same-value kit items merge.** Metal's battle vest plus leather sleeve turns into one ink mass.
  That reads as "black leather", which is on genre, but it swallowed an ink Flying V whole. So
  **a Prop's default style must contrast with the Sleeve it's held against**, and every Look gets
  checked for neighbours sharing a value.
- **A Prop held over the body reads weakly.** The Flying V across the wing is a thin chevron at
  76px. The part that pokes *past* the outline is what reads, so the round should push props to
  the 10-unit limit.
- **Small tail tips are marginal.** Metal's lava tips are close to invisible at 76px. Tail items
  need to change the tail's outline (streamers, a bow), not just tint its points.

### 2.2 The rails

Version 1, per genre: three items per Top, two per Sleeve, Tail and Boots, two or three Props,
two Stages and two Moves, plus the shared rail. Every item still has to pass the 76px row.
Anything that fails is cut, not fixed in code (the plan's rule). The ✓ marks are milestone-2
survivors; everything else is a new drawing.

**Molten Metal** (spiky, chrome teamD: ink reads, white vanishes)

| Slot | Items |
|---|---|
| Top | battle vest ✓ (ink block, one team patch) · bullet-belt bandolier (an ink diagonal with gold dashes; a hot-sauce-bottle style as the gag) · biker jacket (ink, one lapel point) |
| Sleeve | leather sleeve (ink wing, the strongest read in the render) · flame sleeve (ink wing, ember flame tips on the trailing feathers) |
| Tail | lava tips (ember on the three blades) · chain loop round the tail root |
| Boots | combat boots (ink, chunky) · spiked boots (one cone each, ink) |
| Prop | Flying V, hung neck-down behind the wing · crossed drumsticks (chicken drumsticks) · wishbone held up as the horns |
| Stage | lava-crack disc · speaker cab edge behind the feet |
| Move | horns pump (wing thrust up for one beat) · double headbang (the photo nods, never spins) |
| Looks | *Thrash* (vest + leather sleeve + combat boots + Flying V) · *Pyro* (bandolier + flame sleeve + lava tips + lava disc) · *Drummer* (biker + drumsticks + cab) |

**Spice Girls** (stock bird, pink teamH: white and ink both read)

| Slot | Items |
|---|---|
| Top | crop jacket ✓ (if the slit survives) · tracksuit top with two stripes following the body edge (TF2's echo rule) · little black dress (ink) · Union Jack dress drawn in pink, white and ink (the cross reads by its geometry, and no new colour comes in) |
| Sleeve | tracksuit stripes (two white bands on the wing) · puff sleeve (a white puff at the shoulder, an outline change) |
| Tail | big bow (white, 10u+) · ribbon streamers |
| Boots | platform trainers (chunky white uppers; the sole can't go lower, so the "platform" is drawn above the toe line) · go-go boots (ink) |
| Prop | star mic, pointing back · chili-pepper mic ("Spice") · pom-pom · Union Jack flag on a stick |
| Stage | LED star riser · spotlight pool (no cone from above, which would cross the face) |
| Move | heart-point (the wing points at the room) · Sporty hop (a squash-and-hop; a backflip would spin the photo) |
| Looks | *Sporty* (tracksuit + stripes + platforms + pom-pom) · *Ginger* (Union Jack + flag + riser) · *Posh* (LBD + go-go + star mic) · *Baby* (crop jacket + puff + bow + spotlight). There's no *Scary*: leopard turned to mush, and that should be said rather than faked |

**Honky Tonk Heat** (broody, teamE orange: ink reads, white only with its outline, biggest chest, no boots)

| Slot | Items |
|---|---|
| Top | bandana ✓ (the best item of round one) · western yoke (an ink yoke band across the shoulders) · trophy buckle (one big oval at the belly; the egg-shaped buckle as a style) · fringed vest (fringe at the sides, never below the belly) |
| Sleeve | fringe along the trailing edge (an outline that flutters in the dance; country's strongest item on paper) · suede sleeve (ink) |
| Tail | bandana knotted on the tail plume · rope coil |
| Prop | lasso loop, ink and at least 14u so it's a loop and not an eye · corn cob · acoustic guitar, its round body in ink (a white head is what made round one's banjo an eye) |
| Stage | hay-bale edge behind the feet (it doesn't raise the bird) · sawdust ring |
| Move | thumbs in the belt loops (wings to hips for one beat) · boot-scoot heel-toe |
| Looks | *Rodeo* (buckle + fringe + lasso + hay) · *Honky-tonk* (yoke + suede + guitar + sawdust) · *Farmhand* (bandana + rope coil + corn cob) |

**Disco Inferno** (preener, cyan teamB: ink reads, white only with its outline; small chest, big tail)

| Slot | Items |
|---|---|
| Top | open shirt ✓ (one wedge) · dagger collar (two ink points spread at the shoulders, kept under the chin) · satin jacket (ink) |
| Sleeve | flare sleeve (ink wing with a white bell cuff) · satin sleeve (white, outlined) |
| Tail | tinsel streamers off the two sickle tips (moves; disco's strongest candidate) · feather boa wrapped on the tail |
| Boots | platform shoes (preener shows 16 units of leg, so this is the one genre where a platform reads) · roller skates |
| Prop | mirror-ball egg, held low, ink with white facets so it isn't an eye · hand fan · vinyl record with a team-colour label (a white label is an eye) |
| Stage | lit dance-floor tile, cycling on the beat (the strongest stage idea in the bank) · neon-flame floor edge |
| Move | the Night Fever point (the most legible pose in the bank) · the Bump (bumps the next bird in the parade) |
| Looks | *Fever* (open shirt + flare + platforms + lit floor) · *Studio 54* (collar + tinsel + fan) · *Roller* (satin + skates + vinyl) |

**Shared rail** (any team, drawn in that team's colour or ink so it never reads as another team):

| Slot | Items |
|---|---|
| Top | wing-night bib (ink, one sauce splat in team colour; the party's real uniform) · team sash |
| Prop | golden egg held aloft · a drumstick |
| Stage | egg nest |
| Move | **the Chicken Dance** (beak-pinch, flap, wiggle; the one dance every guest knows) |

The ALL ACCESS laminate is a necklace and stays rejected.

The bank also scores a dozen more per genre, plus 21 chicken gags (moonshine jug, man-in-the-moon
spoon, hot-sauce six-shooter, rubber chicken). Several are taste calls for Brad, listed in the
open questions.

**The cut list for milestone 2**, as drawn: cut the bracer, chain mail, sequin tee, sequin shirt,
plaid shirt, horseshoe, banjo as drawn, wing medallion, tambourine, mic as drawn and pick patch.
Keep the battle vest, crop jacket, star patch (as a Sleeve style, not a patch), bandana and open
shirt.

### 2.3 Colour and variants

- **Styles, not a free colour picker.** Each item ships one to three authored **styles**, each
  judged at 76px on its genre's body. A style is a choice of palette for that item's *base* region:
  - `ink`, the reliable one;
  - `white`, which keeps its 2u ink outline and is allowed only where it clears 3:1 or where the
    shape survives on its outline alone;
  - `team`, which reads only as an outlined shape on a team-coloured bird, so it suits outline items
    like fringe and tinsel;
  - and maybe **`gold`** (open question 4).
- **Each region of an item is flagged `team` or `fixed`** (the Gang Beasts rule), so shared items
  repaint per team and authored colours never get tinted into mud (the Fall Guys lesson).
- **Inner detail is judged against the item's own base**, not the bird. Gold dashes on an ink
  bandolier are fine on chrome.
- **Body colour, comb, tail shape and dance stay hashed and team-owned**, as the plan says. The
  wardrobe never recolours the bird itself; the Sleeve is a garment on the wing.
- The style swatch row only appears under a tile when that item has more than one style. Most
  items have one, which keeps the picker calm.

### 2.4 Team switching

- **The outfit belongs to the genre** (the plan's decision 6, kept). Switching team swaps the rail.
  The outfit you built on the other team stays in `outfits_json`, so switching back restores it.
- **First visit to a genre: bare, with the Looks offered first.** No outfit is seeded server-side,
  so the data stays honest about what a guest chose. The wardrobe opens on that genre's Looks row
  and a "Dress me" dice.
- **The team card shows the costume change.** Picking a team repaints the studio bird in that
  team's kit *and* the outfit stored for that genre, so flipping between two teams you've dressed
  for is a costume change you watch.
- **All genres' outfits go down to the pack** (overturns the plan's "only the picked team's outfit
  is exported"). The renderer picks the outfit for the player's *current* team genre. If Brad
  reseats someone on the night, they're still dressed whenever they've ever dressed for that
  genre, and the bird is bare otherwise. Nothing goes stale, because an item is only drawn when it
  belongs to the current genre's rail or the shared rail.
- **When picks close**, the wardrobe stays open, as the plan says. But the last `pack:pull` is what
  the TV gets. See open question 7.

### 2.5 The picker on a phone

The phone is 390 wide (DESIGN §2.2I, the Hearth language of `mockups/guest-portal`).

**On `/me`: a *Your bird* card**, third under *Your head* and *Your team*. It holds:
- the dressed bird, small, on its stage;
- a one-line summary in the show's voice (*"Leather, a Flying V and the horns."*);
- one primary button: **Open the wardrobe**.

Before a team is picked, the card says "Pick a team to open its wardrobe." This keeps `/me` short,
and the head studio stays the first job.

**`/me/wardrobe`: the focused editor** (a route, so the phone's back button works). From the top:

1. **The stage.** Your own bird with its photo head, large (about 40% of the viewport), idle, on its
   Stage item, in team colour. **Tap the bird to play its Move.** A small *TV size* pill flips the
   preview to 76px and 130px side by side on a dark strip, so a guest can see what the room will
   see. That's honest, and it tends to steer people away from quiet items on their own.
2. **Looks.** A horizontal row of the team's three or four named Looks plus a **🎲 Dress me**
   button. Shuffle draws only from the team's rail plus the shared rail, one item per slot. Each
   slot has a 60% chance of being filled, so the bird is dressed but not overloaded.
3. **Slot tabs.** Seven icon tabs (Top, Sleeve, Tail, Boots, Prop, Stage, Move), a dot on each
   filled slot, and Boots hidden on country. The tabs stick under the stage while the grid scrolls.
4. **The item grid.** Three tiles across, with **None** first. **Each tile is a zoomed crop of your
   own bird wearing that item**, cropped to the slot's region: the chest for Top, the wing for
   Sleeve and Prop, the tail for Tail, the feet for Boots and Stage. At 44px a whole bird shows
   nothing. Move tiles play the move on a loop. The tile you're wearing is ringed in primary.
   Tapping equips and saves right away, with an optimistic update copied from `useTeamPick`, and
   there's no Save button.
5. **Styles.** When the equipped item has more than one style, a row of two or three swatches sits
   under the grid.
6. **Your team.** At the foot, every teammate who has picked stands in the parade, dancing to a
   steady beat, dressed as they are right now. It's the social proof and the fun part, and it lets
   guests coordinate ("we're all wearing fringe"). It needs `outfit` on `PortalTeamMember`.

What's left out on purpose:
- No item names on tiles. A name goes in the status line when you tap ("Flying V").
- No locked or unlockable items. There's nothing to grind before a party.
- No per-region colour wheel.

### 2.6 Where outfits appear on the night

| Surface | Kit (Top, Sleeve, Tail, Boots) | Showpieces (Prop, Stage, Move) | How it gets there |
|---|---|---|---|
| SETUP lobby parade (130px, walk + dance) | ✓ | ✓ Stage replaces the shadow pool; a Move fires about every 8 bars, staggered by name hash so the line ripples rather than syncs; a pop bird's Move interrupts its team bounce for one bar and hands it back | free once the resolver passes `outfit` |
| MINIGAME_INTRO team lineup (173px, idle) | ✓ | ✓ each bird plays its Move once as its team is introduced, in seat order. **The best showcase on the night** | free |
| Player phone bird | ✓ | ✓ Prop and Stage; Move on tap | free |
| Teaser landing and teaser picker | ✓ (from the next `teaser:deploy`) | no | `parseTeaserRoster` |
| JOUST, FAPPY, Dunlop Dash, BRAWL relay birds | ✓ | ✗ | per-game figure plumbing (one shared base type) |
| Mount Your Hens ragdoll and the pile | ✓ (Top in the body part, Sleeve on both wings, Tail rides the body) | ✗ | figure plumbing + `PART_OF_LAYER` |
| Crowds, par ghosts, house hens, relay chips | ✗ (anonymous by design, or too small) | ✗ | — |

A post-party **keepsake card** (your bird in full kit with its Stage, Champ'd Up style) is a
cheap later win on `/me`.

### 2.7 Data shape and validation

```ts
// packages/shared/src/outfit — vocabulary only; the server, the cast, the Worker and the pull read it.
export const OUTFIT_SLOTS = ["top", "sleeve", "tail", "boots", "prop", "stage", "move"] as const;
export const OUTFIT_KIT_SLOTS = ["top", "sleeve", "tail", "boots"] as const;     // everywhere
export const OUTFIT_SHOWPIECE_SLOTS = ["prop", "stage", "move"] as const;      // on show only
export type OutfitSlot = (typeof OUTFIT_SLOTS)[number];
export type OutfitStyle = "ink" | "white" | "team" | "gold";

export type OutfitItem = {
  id: string;                         // kebab, permanent: "flying-v"
  slot: OutfitSlot;
  genres: readonly GenreKey[] | "shared";
  styles: readonly OutfitStyle[];     // first is the default
};
export type OutfitChoice = { item: string; style?: OutfitStyle };
export type Outfit = Partial<Record<OutfitSlot, OutfitChoice>>;
export type OutfitsByGenre = Partial<Record<GenreKey, Outfit>>;

export const OUTFIT_ITEMS: readonly OutfitItem[];                 // the catalogue
export const OUTFIT_LOOKS: Partial<Record<GenreKey, readonly { id: string; outfit: Outfit }[]>>;
```

- **Two readers, two strictness levels.**
  - `parseOutfit(genre, value)` is **strict** at the write boundary, `PUT /api/me/outfit
    { genre, outfit }`. Every slot key must be in `OUTFIT_SLOTS`. Every item must exist, sit in that
    slot and be on that genre's rail or the shared rail. A style must be one the item lists. Anything
    else returns 400 `outfit_invalid`.
  - `resolveWornOutfit(genre, value)` is **tolerant** everywhere downstream (export, pull, loader,
    cast). It drops any choice it doesn't recognise and keeps the rest. This is what lets Brad cut an
    item after guests have worn it. Their tile just goes back to None. The loader logs dropped
    choices once at boot.
- **Item ids are permanent.** A cut item is removed from the catalogue, and the tolerant reader
  quietly undresses it.
- **Size.** `outfits_json` is at most 9 genres × 7 slots. Cap the body at 2 KB in the Worker.
- **Flow.**
  - D1 `team_picks.outfits_json` (exists) → `PortalMe.team.outfitsByGenre` (exists).
  - `AdminGuestExport.outfits: OutfitsByGenre`, the whole map.
  - `pack:pull` writes `outfits` onto the player record (replace, not merge) and backs up as today.
  - `PlayersContentEntry.outfits` → `Player.outfits` → the surface resolves
    `outfit = resolveWornOutfit(theme.genre, player.outfits?.[theme.genre])` onto
    `CharacterAppearance.outfit`.
  - The arcade figures carry `outfit` (the already-resolved one) on a shared base figure type.
- **The cast draws by id.** `packages/cast/src/Character/Outfit/<slot>/<item>` holds one component
  per item, in the house idiom (no hex in the cast; ink, text and current colour only, plus a `gold`
  token if adopted).
- **A property test fails** if any catalogue item lacks a drawing, or any drawing lacks a catalogue
  entry.
- **A unit test runs the Prop sweep**: the prop's declared extent, rotated to −62°, −26°, +75° and
  +95° about the wing pivot, stays out of the head box. That puts feasibility rule 6 in the gate,
  not in a note.

### 2.8 Authoring rules for every item

These are the September rules plus what this round measured. Every item is judged on them in the
harness before it gets a catalogue id.

1. Nothing at y < 32 in the head column (x > 34). The Tail slot is the one exception: it may rise
   with the genre tail above the chin line, out at x < 34. On a photo head, nothing at y < 37 with
   x > 45. Top items start at `head.shoulders`. (The harness's chin check is global today, and it
   needs this carve-out for tail items.)
2. The smallest feature is 8 units; design to 13. The smallest stroke is 2 units. **No texture**:
   no sequins, mail, plaid, spots or studs.
3. Ink, outlined white, team or (maybe) gold only, at ≥3:1 against what it sits on. Never the leg
   orange as a fill.
4. No eyes, teeth or grins. At most one white point on the chest, no light ring or disc with a dark
   centre, no white U, and no light point within about 16 units of the head centre.
5. At most 10 units past the outline, back or down only. Run the Prop sweep.
6. Kit stays inside its part: Top inside the body outline (and so inside `CHARACTER_BODY`), Sleeve
   inside the wing plus its trailing-edge fringe, Tail at the genre tail's tips.
7. Judge at device scale 1: at 76px, at 130px blurred 1px, and in the full-kit row.
8. Neighbours differ in value. A Prop's default style contrasts with the Sleeve behind it, and a
   Look never puts two same-value items side by side unless the merged shape is the point (metal's
   leather).

### 2.9 Considered and left out

- **Auras and particles.** They're specks at TV size, they cost GPU in a parade the lobby
  performance pass already had to slim, and they compete with the flame backdrop.
- **A per-guest anthem or sting** (Rocket League). A 20-guest lobby can't play 20 stings, and the
  TV is one speaker already carrying the playlist.
- **Nameplate titles** (Splatoon). They're fun and cheap, but the bird wears a real face and a real
  name already. They could come later, on the intro lineup only.
- **Capes and back flags.** They read in the render, but they fight the tail (the genre's organ) on
  the spiky and preener birds. Maybe later, for stock and broody only.
- **Hats, shades, anything on the head.** Still rejected. A photographed head is not a place for a
  hat.

---

## 3. Phased build plan

Each milestone ends green on `pnpm lint && pnpm typecheck && pnpm test`. A client or cast change
also runs the pinned-port `pnpm test:e2e`, and a portal change runs `pnpm test:e2e:portal`.

**M2a: cut round one** (no code, about 10 minutes for Brad). Confirm the cut list in §2.2 against
`docs/screenshots/wardrobe/`.

**M2b: the slot round** (mockups only, no app code).
- Extend `apparel-harness.js` with the new layers (sleeve, tail, boots, prop, stage) and
  `wardrobe-harness.js` with the Prop sweep, a blurred 130px row and a **full-kit row**.
- Draw the v1 rails in §2.2 on drawn and costume heads.
- Draw the Moves as filmstrips in `rig.html`.
- Brad cuts on the 76px row. The full-kit row settles the density budget (§2.1).
- *Exit:* a signed-off catalogue, as a table in this doc.

**M3: the kit in the cast and the pack.** No portal UI. Tested from a hand-edited `players.json`.
- `packages/shared/src/outfit` (catalogue, guards, tolerant resolver, Looks).
- `Player.outfits` through the loader, the validator, the config write-back and `pack:pull`.
- `CharacterAppearance.outfit`.
- The cast draws Top, Sleeve, Tail and Boots in `CharacterFigure`, `CharacterWing`,
  `CharacterRagdollFigure`, the JOUST aim wing and MOUNT's `PART_OF_LAYER`.
- One shared base `*PlayerFigure` type for the five games carries `outfit`.
- e2e: a dressed player shows the right `data-outfit-*` markers in the parade and in one game.
- *Exit:* Brad can dress a bird by hand in the pack and see it on the TV in the parade and in a
  game.

**M4: showpieces.**
- Prop and Stage behind a `showpieces` prop on `Character`, opted into by the parade, the intro
  lineup, the player phone and the portal.
- The Moves as new poses in the cast, with the parade scheduler (every ~8 bars, hash-staggered) and
  the lineup's one-shot.
- Check lobby frame time with four page copies on a real GPU, as in the lobby performance pass.
- *Exit:* the parade dances in full kit at frame rate.

**M5: the wardrobe on `/me`.**
- `PUT /api/me/outfit`, the export carrying `outfits`, the *Your bird* card, `/me/wardrobe` (stage,
  TV-size pill, Looks and dice, tabs, crop tiles, styles), `outfit` on `PortalTeamMember` for the
  team strip.
- DESIGN §2.2I and SPEC updated. The plan's milestone 4 e2e: pick a team, dress, reload, still
  dressed, switch team and back, still dressed.
- *Exit:* deployed to wingnight.tv; a real `pack:pull --dry-run` shows outfits arriving.

**M6: extras** (any order, all optional): the keepsake card; more items per rail (the bank has
plenty); teammate-collision hints ("Two of your team are already in fringe"); nameplate titles on
the lineup.

M3 is useful without M5: Brad can dress the cast by hand for a party before the portal UI exists.
M4 can ship before M5 as well. If the party is close, the order that gets the most on the TV
soonest is M2b → M3 → M5 (kit only) → M4.

---

## Decisions this overturns

| # | Past decision | Where | Recommendation |
|---|---|---|---|
| 1 | Two first-cut slots, `torso` and `wing` | plan, "Data" and "The wardrobe itself" | **Seven slots**: four kit, three showpiece (§2.1) |
| 2 | "Nothing at the feet (8 units, a smudge)" | plan, September rules | **Boots slot** on metal, pop and disco, where the shank shows (5–16u). Not on country. `CHARACTER_FOOT` and the 72.75 sole line unchanged |
| 3 | Items are `bodyApparel` only, painted "in the `body` part" | plan, "The night"; harness | Items get **their own layers**: an outfit layer after the wing, items inside the wing, tail and legs, a Stage layer behind, and a Prop that may extend ≤10u past the outline. (The "in the body part" line was also a paint-order mistake; see §1.3) |
| 4 | "A genre states itself once: shaped, or moves, or wears, never two" | team-identity.md; DESIGN §cast | **Kept for the team**, and clarified for the player. The silhouette (and pop's bounce) is still the team's one statement. Items and a personal Move are the player's flavour, which the plan's decision 7 already allows for items. The new part is the Move: a one-bar interjection every ~8 bars, so pop's team motion still owns the parade |
| 5 | "Only the picked team's outfit is exported" | plan, decision 6 | **Export every genre's outfit**, and render the one for the player's current team, so a reseat on the night keeps the guest dressed |
| 6 | "A prop never adds a colour" | `Apparel/styles.ts`; DESIGN | **Open, not yet overturned.** It holds unless Brad wants **gold** as the one wardrobe accent (open question 4). The Union Jack is drawn in pink, white and ink precisely so it doesn't need an exception |
| 7 | Wardrobe chips are "a tiny bird wearing the item (`Character` at `still`)" | plan, `/me` | Chips are a **zoomed crop of your own bird** at the slot's region. A 44px whole bird shows nothing |

**Kept, explicitly:** necklaces stay rejected (so the medallion and the ALL ACCESS laminate are
out); nothing crosses or sits on a photographed face; `head.chin` stays the anchor; the colliders'
constants don't move; body colour, comb, tail shape and dance stay hashed and team-owned.

---

## Open questions for Brad

> **Answered 2026-10-14: Brad took the defaults.** All seven slots; gold is tested in the drawing
> round and decided at its cut; pop birds get personal Moves as a one-bar flourish; bare by default;
> country has no Boots; teammates see each other's outfits; props never in games; freezing the
> wardrobe with picks is decided in M5. The build runs per [bird-wardrobe-build-plan.md](../bird-wardrobe-build-plan.md).

1. **Seven slots, or start smaller?** I recommend all seven, phased (M3 kit, M4 showpieces). The
   minimum that still feels rich is Top, Sleeve, Tail and Prop.
2. **Is it OK that country has no Boots?** Its squat bird shows 2.3 units of leg, so boots would be
   invisible. Country gets a fourth Top and the biggest chest instead.
3. **Personal Moves.** Each bird gets one flourish in the parade and at the intro lineup, including
   pop birds, whose team motion is the bounce. Fine, or keep Moves off the pop team?
4. **Gold as a wardrobe accent?** It's iconic for buckles, bullets, the golden egg and the record.
   It breaks "a prop never adds a colour" and is weak on chrome and country orange, so it's only
   allowed on an ink base. Without it those items fall back to white.
5. **Bare by default?** A guest who never opens the wardrobe is bare on the night, with the genre
   silhouette only. The alternative is wearing their team's first Look automatically, as a team
   kit. I recommend bare: a guest's look should be a choice.
6. **Show teammates' outfits to each other** on the portal (the *Your team* strip)? Heads are
   already shared on the team tiles, so this adds nothing more sensitive.
7. **Lock the wardrobe with picks?** Today closing picks leaves the wardrobe open, but changes after
   the last `pack:pull` never reach the TV. Should closing picks also say "Wardrobe sent to the TV"
   and freeze it?
8. **Taste calls on gags:**
   - drumstick mic (cannibal comedy);
   - sauce bib;
   - moonshine jug;
   - the man-in-the-moon spoon (a cocaine joke, out unless you want it);
   - wishbone horns.
9. **Props in games: never?** I recommend never, because they read as weapons in JOUST and BRAWL
   and cross the face in the ragdoll. The one candidate for an exception is FAPPY, where the bird
   only flies.
