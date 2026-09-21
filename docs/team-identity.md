# Team Identity — Design Decisions

Teams are currently told apart by a colour and a name. This doc turns each team's `genre` into a
full visual kit — typeface, wordmark treatment, emblem, ambient texture, entrance beat — so a metal
team reads as metal from across the room, not merely as "the red one". Decisions below were settled
up front (2026-09-18) from the audit in this session; implementation should not relitigate them
without updating this doc. `DESIGN.md` §0.1 and §2.8 get amended in phase 6 to match.

## Where teams appear today (the audit)

Colour plus text almost everywhere; the genre reaches only two places.

| Surface | Name | Colour | Genre | Cast |
|---|---|---|---|---|
| TV standings footer (`DisplayBoard/StandingsSurface`) | yes | column tint + edge | no | no |
| TV MINIGAME_INTRO (`StageSurface/MinigameIntroStageBody`) | headline | no | eyebrow text | no, roster is text |
| TV EATING meta, TURN_RESULTS, ROUND_RESULTS, FINAL_RESULTS | yes | dots / row gradient / gold | no | no |
| TV SETUP lobby strut (`SetupStageBody/CastWander`) | no | bird fill | apparel | yes |
| Host mini-rail pill, team rows, player chips, turn order, score override | yes | dot or border | no | no |
| Minigame marquees and labels (drawing, joust, trivia) | yes | generic dot | no | no |
| Admin wizard roster step | editable | no | not exposed | no |

Structural limits the kit removes:

- Colour is a hash of the positional team id (`resolveTeamColorVariant`), so it is neither authored
  nor related to the genre, and reordering `teams.json` recolours every team. (Closed by the kit:
  the theme owns colour, and the hash is no longer exported from the cast at all — see "The kit".)
- Only `resolveTeamApparel` and the intro eyebrow read `genre`.
- The minigame contract (`packages/minigames/core`) passes a name and a name map, nothing themeable.
- One system typeface everywhere; no webfonts.
- The cast never appears with its team on a turn-context screen.

## Genre vocabulary

`genre` stays free text in `teams.json` (the pack is hand-edited and the anthem cue already reads
it). A single resolver, `resolveGenreKey` in `@wingnight/shared`, maps it to a canonical key by
case-insensitive keyword containment, first match wins, in this order (it lives in shared rather
than the client so the cast's `resolveTeamApparel` reads the same table and "funk" can never be
disco to one and nothing to the other):

| Key | Keywords |
|---|---|
| `metal` | metal |
| `punk` | punk |
| `rock` | rock, grunge |
| `pop` | pop |
| `country` | country, folk, bluegrass |
| `disco` | disco, funk |
| `hiphop` | hip hop, hip-hop, hiphop, rap |
| `electronic` | electronic, edm, techno, house, synth |
| `classical` | classical, jazz, opera |
| `none` | anything else, or no genre |

`punk` precedes `rock` so "punk rock" is punk. `none` is a real kit (house sans, no emblem, no
texture, existing beats), not an error: a team with no genre renders exactly what it renders today.

## The kit

`resolveTeamThemeById(teams)` in `apps/client/src/utils/resolveTeamTheme` walks the teams in
seating order (the colour collision pass needs the earlier teams, so a seating index alone is not
enough) and returns one of these per team id; `resolveTeamTheme(team, teams)` picks one out, or
themes a team on its own for a fixture:

```ts
type TeamTheme = {
  genre: GenreKey;              // canonical key above
  colorToken: TeamColorToken;   // "teamA"–"teamH", chosen per "Colour" below
  colorVariant: TeamColorVariant; // the existing class bundle for that token, plus `tintClassName`
  fontClassName: string;        // Tailwind font token, e.g. "font-genre-metal"
  wordmark: WordmarkTreatment;  // "chrome" | "candy" | "rope" | "neon" | "torn" | "drip" | "scanline" | "plain"
  emblem: EmblemId | null;      // "skull-hen" | "star-mic" | "hat-horseshoe" | "mirrorball" | ...
  texture: TextureId | null;    // "lightning" | "confetti" | "woodgrain" | "lightdots" | ...
  entrance: EntranceId;         // "slam" | "bounce" | "swing" | "spin" | "rip" | "drop" | "glitch" | "beat"
  apparel: CharacterApparel | undefined; // folded in from the cast's resolveTeamApparel
  silhouette: CharacterSilhouette | undefined; // ...and resolveTeamSilhouette
  dance: CharacterDance | undefined; // ...and resolveTeamDance
};
```

The resolver is pure and DOM-free (tests run under `tsx --test`). Surfaces get themes from one map
per room state, `teamThemeByTeamId`, built inside `selectHostTeamMaps` on the host and
`resolveStageViewModel` on the display (which also pulls out `activeTeamTheme` and
`activeTeamPlayers`), so no surface calls the resolver on its own. That is enforced rather than
merely asked for: the cast no longer exports `resolveTeamColorVariant`, the bare id hash. Four host
surfaces and the TV's ROUND_RESULTS table were still calling it into 2026-09-20 — the host tablet
and the TV painted the same team two different colours all night, because the hash knows nothing of
the genre kit, an authored `color` or the collision pass. The hash survives only inside the cast, as
`resolveCharacterFillClassName`, for birds drawn where no seating list is in reach. The standings footer sits beside
the stage rather than inside it, so `DisplayBoard` builds the same map once more for it. `resolveTeamApparel` stays in the cast rather than being deleted: JOUST
dresses its lane birds from a display-view genre string, and the theme reads the same function, so
there is still one apparel table. The vocabulary is `hat`, `shades`, `medallion` — `lapels`
became `medallion` in the 2026-09-19 audit and `collar` was deleted on 2026-09-21, when most
genres stopped wearing props and started being SHAPED instead (`resolveTeamSilhouette`, and
`DESIGN.md` §2.8's "Genre carriers"). A genre states itself once: it is shaped, or it moves, or
it wears something, never two of the three. See `DESIGN.md` §2.8's apparel bullet for the
rules that redrawing turned up. `tintClassName` on the colour variant sets the `--tint` custom
property every wordmark treatment and texture keys off, which is how a component stays free of
inline styles.

### Colour

Precedence, first hit wins:

1. `color` on the team entry in `teams.json`, one of `teamA`–`teamH`. New optional field on
   `TeamsContentEntry` and `Team`, validated in `packages/shared/src/content/teams`.
2. The genre default: metal `teamD`, punk `teamC`, rock `teamA`, pop `teamH`, country `teamE`, disco
   `teamB`, hiphop `teamG`, electronic `teamF`, classical `teamA`. Nine genres over eight tokens
   means exactly one pair shares a default; rock and classical are the pair least likely to sit in
   one room, and the collision pass parts them if they do.
3. The existing id hash.

Then a collision pass in seating order: a team whose token is already taken by an earlier team
takes the next free token after it in A–H order, wrapping past H. Two teams never share a colour
while eight or fewer exist.

**Retuned 2026-09-19, from an audit of the four pack teams on a TV.** The ramp still has eight
slots and no new token was added, but three of them were the wrong colour. An accent has to
separate from the other accents AND from the reserved semantics in `DESIGN.md` §0.1, and measured
as CIE ΔE against the shipped palette:

| was | ΔE | now | ΔE |
|---|---|---|---|
| `teamD` #F43F5E vs `teamH` #FB7185 | **20** | `teamD` #D9DEE6 vs `teamH` #EC4899 | 76 |
| `teamD` #F43F5E vs reserved `heat` | **15** | `teamD` #D9DEE6 vs `heat` | 79 |
| `teamE` #FACC15 vs reserved `gold` | **10** | `teamE` #D98324 vs `gold` | 30 |

Metal and pop were one hue apart at two lightnesses — a single team across a room — while every
other pair in the pack sat between 87 and 113. Country was closer to the winner gold than most
teams are to each other, so it looked like it was winning on every screen.

`teamD` is **chrome, not a hue**: metal's own palette is the absence of colour, it is the slot
metal defaults to, and an achromatic accent is the one thing that can never collide with a hue.
Two consequences follow and are deliberate. Punk moved off `teamD` to `teamC`, because the two
genres most likely to share a party would otherwise have shared a default; classical took punk's
old `teamC`, landing on `teamA` beside rock. And a `candy` wordmark on `teamD` would be near-white
text with a near-white stroke — reachable only by a pop team walking the collision pass to D, which
needs five or more teams, so it is a known edge rather than a live bug.

`teamA` is still byte-identical to `primary`. It is the one overlap the audit found and left; no
pack team is rock, and moving it is a bigger change than this pass earns.

### Typography

Display faces are bundled, never fetched: woff2 files under `apps/client/public/fonts/<family>/`
with `@font-face` rules in `index.css` and one Tailwind `fontFamily` token per genre
(`font-genre-metal`, …). All candidates are SIL Open Font License, which permits bundling.
**Decided 2026-09-18 on the phase 1 mockup** (`apps/client/public/mockups/team-identity/`): the
lead face in each row is the pick. The other candidates are kept only so the board can re-open
a decision without rebuilding it.

| Key | Pick | Also on the board |
|---|---|---|
| `metal` | Metal Mania | Pirata One, New Rocker |
| `punk` | Bangers | Anton |
| `rock` | Anton | Bebas Neue |
| `pop` | Fredoka (700) | Lilita One, Bubblegum Sans |
| `country` | Rye | Alfa Slab One, Sancreek |
| `disco` | Monoton | Shrikhand, Righteous |
| `hiphop` | Permanent Marker | Rubik Spray Paint |
| `electronic` | Orbitron (800) | Audiowide |
| `classical` | Playfair Display (900) | Abril Fatface |
| `none` | the house sans stack | |

The treatments, emblems, textures and entrance beats shown on the board are decided with them:
chrome/skull-hen/lightning/slam, candy/star-mic/confetti/bounce, rope/hat-horseshoe/woodgrain/swing,
neon/mirrorball/lightdots/spin for the four pack genres, and the rest as `kit.js` lists them.
Phase 2 bundles exactly the picks, one woff2 each, not the whole board.

Legibility floors: the genre face is used only where the name renders at 24px or larger on the TV
and 20px or larger on the tablet. Below that the surface keeps the house sans and carries identity
with colour plus the emblem glyph. Faces are loaded with `font-display: block` (a 100ms wait beats a
sans-to-blackletter flash on a TV) and the active roster's faces are preloaded from `DisplayBoard`
(`GenreFontPreload`, one latin subset per face). The treatments, textures and entrance beats are
plain CSS classes in `index.css` (`team-wordmark-*`, `team-ambient-*`, `team-enter-*`), not
Tailwind arbitrary values, because they are multi-layer gradients and keyframe sets and because an
entrance's `animation` shorthand has to land after the utilities layer to win.

### Components

All in `apps/client/src/components`, colocated tests, folder-with-index convention.

- `TeamWordmark` — the name in the genre face with the treatment applied, at a caller-given size
  class. Treatments are CSS only (gradients, text-shadow, `-webkit-text-stroke`, a pseudo-element
  for glints); no per-letter markup. Falls back to plain house type for `none`.
- `TeamEmblem` — one inline SVG per emblem id, drawn in the cast's flat style (fills from the team
  colour, `text`, `bg`; 2-unit `bg` stroke), sized by the caller. Used at three scales: watermark,
  crest, glyph.
- `TeamLineup` — the team's players as `Character`s standing in formation, apparel and costume
  heads on, evenly spaced, facing the viewer. Reuses `resolvePlayerAppearance`; adds nothing to
  `Character` itself.
- `TeamAmbient` — the texture layer for a stage body: absolutely positioned, `z-1`, respects
  `prefers-reduced-motion` and the `DESIGN.md` §8 ambient rule (never competes with content).

### Surface rules

| Surface | Change |
|---|---|
| TV standings columns | `TeamWordmark` for the name; `TeamEmblem` as a low-alpha watermark right-aligned in the column; colour as today |
| TV MINIGAME_INTRO | `TeamAmbient` behind; crest-sized `TeamEmblem` in the eyebrow; `TeamWordmark` headline with the genre entrance beat; `TeamLineup` replaces the text roster line (no names under the birds, DESIGN.md §2.8) |
| TV TURN_RESULTS | `TeamWordmark` headline; ambient at half strength; dots row keeps colour |
| TV FINAL_RESULTS | `TeamWordmark` in gold (gold stays the winner colour per §0.1: the `winner` prop keeps the face and drops the treatment); ambient of the winning genre; a tie stays heat text with no kit |
| TV EATING meta, ROUND_RESULTS rows | glyph `TeamEmblem` before the name; name stays house type (below the floor) |
| TV now-playing pill | glyph before the anthem label |
| Host mini-rail pill | glyph next to the dot; wordmark only in the tall pill variant |
| Host team rows, chips, turn order, score override | glyph plus colour; no genre face |
| Minigame marquees (drawing, joust) | `TeamWordmark` in the marquee slot |
| Minigame labels (trivia display, joust/trivia host) | glyph plus name |
| Admin wizard | genre field on the roster step as a select over the vocabulary plus free text; live wordmark and emblem preview |

### Minigame contract

`packages/minigames/core` display and host props gain `activeTeamTheme: TeamTheme | null` and
`teamThemeByTeamId: Map<string, TeamTheme>`, alongside the existing name props (which stay, so
untouched packages keep compiling). `TeamTheme` moves to `@wingnight/shared` so the type crosses the
package boundary; the resolver stays in the client. The sandbox fixture in core gets two themed fake
teams so every package's dev route shows the kit.

## Non-goals

- No per-player theming; identity is the team's, players carry it through the cast.
- No fonts, emblems or textures authored in the pack or uploaded through the wizard; the kit is
  code, the pack only names a genre.
- No new colour tokens and no change to the two-accent budget outside the exemption in phase 6.
- No sound changes; anthems already carry the genre.

## Phases

Each phase ends on `pnpm lint && pnpm typecheck && pnpm test` and, since every phase touches
client tsx, `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e`. Commit to main
after each.

1. **Mockup.** `apps/client/public/mockups/team-identity/`: a kit board rendering the four pack
   teams as wordmark candidates, emblem, colour, texture and entrance, plus a standings footer and
   an intro spotlight built from the leading picks. Ends on a font decision recorded in this doc.
   **Done 2026-09-18.**
2. **Foundation.** Bundle the chosen faces; `resolveTeamTheme` with tests, absorbing
   `resolveTeamApparel` and the colour precedence; the `color` content field; `TeamWordmark`,
   `TeamEmblem`, `TeamLineup`, `TeamAmbient`; `teamThemeById` on both surfaces.
   **Done 2026-09-18.** Nothing on screen changes in this phase: every surface still reads the
   id-hash colour, so the lobby strut (`CastWander`) and the standings dots stay on one table until
   phase 3 moves the TV onto the theme in a single commit.
3. **TV headline moments.** Standings, MINIGAME_INTRO, TURN_RESULTS, FINAL_RESULTS, and the SETUP
   strut's colour and apparel off `teamThemeByTeamId`. **Done 2026-09-18**, previewed on the
   night pack at 1920×1080: lobby, metal and pop intros, turn results. Entrance beats take their
   cue from a `[--enter-delay:…]` utility so they slot into a surface's existing reveal sequence.
4. **Host surfaces.** Mini-rail pill, team setup rows, player chips, turn order, score override.
5. **Minigames.** Core contract and fixture, then drawing, joust, trivia.
6. **Authoring and docs.** Wizard genre field and preview (closes the "Team genre and anthems are
   unreachable from the wizard" backlog item's genre half), `DESIGN.md` §0.1 exemption for genre
   type, emblems and textures as content-not-chrome, §2.8 pointing here, and the standings/intro
   sections updated.
