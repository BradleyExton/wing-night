# Bird wardrobe: the build plan

Date: 2026-10-14. How the wardrobe recommended in
[research/bird-wardrobe.md](research/bird-wardrobe.md) gets built. Brad took the doc's defaults
(see its open questions), so the target is all seven slots: Top, Sleeve, Tail and Boots as kit;
Prop, Stage and Move as showpieces.

The work runs as a few large multi-agent runs, with Brad stepping in at three gates. The runs are
orchestrated from a Claude session. Their scripts are throwaway and live in that session, not in
the repo; the repo only gets this doc, the work itself and BACKLOG entries. "Done" means the gate
in `CLAUDE.md` passes and the screenshots are in hand.

## Gates (Brad)

| Gate | When | What Brad does | Time |
|---|---|---|---|
| 0 | before run 1 | Answer the open questions. **Done 2026-10-14: defaults.** | — |
| 1 | after run 1 | Open `mockups/cast/outfit-gallery.html` and keep or cut every candidate at 76px. Paste the cut list back. Decide on gold. **Cuts done 2026-10-20: [bird-wardrobe-gate-1.md](bird-wardrobe-gate-1.md), gold kept where it reads.** | ~30 min |
| 2 | after run 5 (done 2026-10-25; deployed 2026-10-25, Worker version 9b2d23cd) | Feel test on the real TV and tablet: the lobby parade in full kit, one game, `/me/wardrobe` on a phone. Then `pnpm teaser:deploy` and a `pack:pull`. **Feel test and calls done 2026-10-30: every call kept as shipped (see "Gate 2: what Brad decided"). The `pack:pull` waits until guests have dressed.** | ~30 min |

## Runs

| Run | Output | Shape |
|---|---|---|
| **1. Art factory** | `mockups/cast/outfit-harness.js` (slot layers, the prop sweep, the region rules, a full-kit row); per-genre pages `outfit-{metal,pop,country,disco}.html` with item modules under `mockups/cast/outfit-items/`; `outfit-moves.html` (Moves as filmstrips on the parted rig); `outfit-gallery.html` for Gate 1. Every item in 2–3 variants, each measured, then critiqued from 76px and blurred 130px renders, revised up to twice. | one harness agent, then a pipeline of 9 drawing units plus Moves, each with a critic loop, then the gallery and a completeness check |
| **2. Spine** | `packages/shared/src/outfit` (catalogue, strict and tolerant readers, Looks); `Player.outfits` through the loader, the validator, the config write-back and `pack:pull`; `CharacterAppearance.outfit`; the cast's outfit layers, with one finished example item per slot; a shared base `*PlayerFigure` for the five games; the Moves as cast poses. | in order, each step implement → review → gate → e2e |
| **3. Item port** | Every item that survived Gate 1 becomes a cast component plus a catalogue entry, pixel-checked against its harness drawing. | wide, split by file |
| **4. Portal** | `PUT /api/me/outfit`, outfits in the admin export, the *Your bird* card, `/me/wardrobe`, outfits on `PortalTeamMember`, `test:e2e:portal`. | 3–5 steps, alongside run 3 |
| **5. Polish audit** | Independent checks, each fixing what it finds: every Look in the real lobby parade; parade frame time (four page copies, real GPU); a face-crossing sweep of every prop through every pose and dance; the Mount ragdoll; `/me` at 390px. | wide |

## Run 2: what landed (2026-10-20)

On branch `claude/gallant-cohen-b15972`, from `claude/wardrobe-gate1-art-pass`.

- **Catalogue.** `packages/shared/src/outfit`: one entry per kept Gate 1 variant, id
  `<harness item>-<variant>` (`battle-vest-a`), because Gate 1 kept variants, not items; plus the nine
  Moves. 132 entries, matching the gallery. Looks come from the harness's `looks.js` (not its Full
  kit rows). `parseOutfit` is the strict reader for a guest's write; `resolveWornOutfit` the
  tolerant one everywhere downstream; `validateOutfitsByGenre` checks the pack's shape strictly and
  leaves membership to the tolerant reader.
- **Pack.** `outfits` on a player in `players.json` (genre -> slot -> `{ item, style? }`), carried
  as written through the loader and the config write-back; the boot warns about any choice it will
  not draw. `pack:pull` replaces a player's whole map with a dressed guest's and leaves it alone for
  an undressed guest (no outfits, or `{}`), so a hand-dressed bird survives a pull. Run 4 decides
  what the Worker sends for "cleared"; today a guest cannot undress a bird the pack already has.
- **Cast.** `CharacterAppearance.outfit`, resolved by the surface with `resolvePlayerOutfit(player,
  genre)`. Top on the body's rig between the wing and the head; Sleeve in the wing (and
  `CharacterWingFigure`, which FAPPY's beating wing and JOUST's aim wing draw); Tail in the tail;
  Boots on each leg (not in `ride`); the ragdoll gets the kit with a Sleeve on both wings and the
  Top on an `outfit` layer (MOUNT's `PART_OF_LAYER`). Prop and Stage only with `showpieces`
  (parade, intro lineup, player phone); `stage="none"` + `CharacterStage` let the parade lay the
  Stage in the shadow pool's place. Every worn item carries `data-outfit-slot`, `-item`, `-style`
  and `-side`. `wardrobeGold` is the gold style's token.
- **Six ported items**, all metal so one sample bird wears them: battle-vest-a, flame-sleeve-a,
  chain-loop-b, combat-boots-a, flying-v-a, lava-disc-a, each path-for-path equal to its harness
  drawing. The other 117 are run 3; a `todo` test counts them.
- **Games.** `CastPlayerFigure` (shared) is the one figure JOUST, FAPPY, Dunlop Dash, BRAWL and
  MOUNT alias, built by `toCastPlayerFigure` with the outfit read for the team's genre.
- **Moves.** `CHARACTER_MOVES` and `move` on the figure: one bar, once, in place of the pose.
  Keyframes are generated from the Moves page's key poses (`wingFlip` included) into
  `packages/cast/src/moves.css`, imported by both client entries; a test keeps the file equal to
  the generator. Nothing schedules a Move yet: the parade's every-8-bars stagger, the Bump's partner
  half and the lineup's one-shot are run 3/M4.
- **Known edges.** On a `wing="none"` surface the Top paints under the separately drawn wing (FAPPY
  always, JOUST while a bird aims). The Top's second body layer starts its loop when it mounts, so a
  bird dressed mid-parade can run a frame out of step until its next pose change.
  A Prop rides the wing's rig, so `wingFlip` mirrors it too: on the chicken dance's clap the Flying V
  points forward across the chest. The harness's prop sweep predates the flip; run 5's face-crossing
  sweep should take the flipped wing in.

## Run 3: what landed (2026-10-20)

On branch `claude/objective-napier-8ad040`, from run 2's `claude/gallant-cohen-b15972`.

- **Every kept item is drawn.** The other 117 ported, one commit per rail; `OUTFIT_DRAWINGS` holds
  all 123 in catalogue order and "does draw every catalogue item" is a real test now. Builders an
  item shares with its rail sit in `Outfit/paths/<unit>` (metalKit, metalShow, popKit, popShow,
  countryKit, countryShow, discoKit, sharedRail); fixed geometry is written out.
- **Checked against the harness, case by case.** Each item's `draw(ctx)` against the cast's markup
  on every body it is worn on (shared: all four), every catalogue style, both heads, both legs:
  every shape in order (d strings exactly, composed transforms, resolved clips) and its paint mapped
  to tokens, animations included (timing, delays, reduced motion, keyframe bodies). All 123 match.
  The script is not in the repo; it is `check-outfit.mts` in the run's shared notes folder.
- **The item context carries `silhouette`.** Shared items place themselves per body from the
  harness's per-silhouette tables.
- **The Prop sweep measures what shows.** `Outfit/propSweep` walks the outline (curves, arcs and
  straight edges sampled, clips honoured) the way the harness's `samplePoints` did, and the test now
  sweeps every prop on every body, style and head. Run 2's read of path vertices padded by the
  2-unit ink failed 13 kept props by a unit or two at the head box; on the shape's own edge, the
  line Gate 1 judged, all pass. The Moves' extremes are still run 5's.
- **Disco's lit Stages animate in the cast.** Their keyframes (`outfit-*`) sit with the cast's in
  `apps/client/src/index.css`, one set for every team through `currentColor`.
- **Known edges.**
  - Pop items are drawn on the harness's stock bird (round body, fan tail). A pop player whose name
    picks the tall or wide body or the plume tail wears the Tops clipped to their own body, but
    puff-sleeve a paints a stock-shaped wing over theirs, and the bows and streamers sit on the
    fan's tips.
  - wing-night-bib b's sauce is ink on the spiky body and the team colour elsewhere: the harness
    measured the team colour against white (only chrome fails), which an item cannot see. A chrome
    team on another body would get a faint splat.
  - Two harness quirks are kept as the browser drew them: satin-jacket a's star patch is round
    (the harness wrote its join twice; the first wins), and pom-pom a's far pom is white mixed
    70% over ink (`color-mix` of the two tokens, its only non-token colour).
  - battle-vest a, combat-boots a and flying-v a keep their own copies of geometry their rail's
    `paths` module now also builds.

## Run 4: what landed (2026-10-20)

On main since 2026-10-20 (6edac63a, a fast-forward that brought runs 2 and 3 and the Gate 1 art pass
with it). Not deployed: the Worker change goes live with the next `pnpm teaser:deploy`, and needs no
D1 migration (`outfits_json` was already in 0005).

- **`PUT /api/me/outfit { genre, outfit }`.** Read strictly for that genre (`parseOutfit`; 400
  `outfit_invalid`), body capped at 2 KB (`OUTFIT_REQUEST_MAX_BYTES`, 413), and refused with 409
  `no_team` unless the guest is seated on a roster team of that genre — a page left open across a
  team switch is told, not obeyed. One statement sets just that genre's key in `outfits_json`
  (`json_set`), only while the row still names the team it checked. Picks closing leaves the
  wardrobe open (research §2.4); open question 7 is still Brad's.
- **"Cleared" is `{}` for the genre.** A guest who strips a genre bare stores `{ metal: {} }`.
  The export sends every genre as stored (an orphaned pick's outfits too, since they are per
  genre), and the pull's whole-map replace treats that as a dressed map: the pack's bird goes
  bare. A guest who never opened the wardrobe still exports `{}` and leaves the pack alone. The
  dry run says `Rob: metal -> (bare)`. Unit-tested in the Worker, the pull and the outfit
  readers, and end to end in `tests/e2e-portal/wardrobe.spec.ts` (UI → export → `planPull`).
- **`TeamPick.outfitsByGenre` is `OutfitsByGenre`** (the team pick's string draft is gone), and
  `PortalTeamMember.outfit` carries each member's outfit for their team's genre, read tolerantly.
- **`/me`.** `PortalHeadBird` takes an `outfit` (showpieces on, except in a row): the studio bird,
  the members on the team tiles and the new *Your bird* card all wear it, so a team tap is a
  costume change. The card is third; before a team it says "Pick a team to open its wardrobe."
- **`/me/wardrobe`** (`PortalWardrobe`): the stage (tap plays the Move; TV size shows 130px
  blurred and 76px kit only), the status line, Dress me and the Looks, the rail (sticky tabs, no
  Boots on country, None first, three across), style swatches, and the team dancing to the beat
  clock with no music. Every tap saves through `useOutfitSave`: optimistic like `useTeamPick`, and
  serial — a tap while a save flies replaces whatever was waiting, and a refusal puts the stored
  outfit back. The pure parts (summary, dice, a tap, a swatch, which Look is on, the crops) are
  `PortalWardrobe/wardrobeState`, tested.
- **Tiles are your own bird, cropped.** `OUTFIT_SLOT_CROPS` started from the mockup's and was
  widened to the cast's items as drawn, checked on the spiky, preener and broody bodies (pop's
  stock bird was not in the e2e roster). Every window is square, because a wide one letterboxes
  and the letterbox shows the bird around it. Top and Sleeve tiles draw without the Prop, which
  otherwise hides the garment being tried.
- **Known edges, for run 5.**
  - A photo head pokes into the right edge of the Prop and Tail tiles; the crops are one set for
    every body, not per silhouette.
  - Brad's admin "Unseat" deletes the pick's row, outfits and all; reseating keeps them.
  - The whole-map replace still loses a genre Brad dressed by hand that the guest never touched
    (run 2's open question); a per-genre merge would fix it and keep "cleared" working.
  - Move tiles loop by re-keying the figure every 2.6 s; a Move playing on the stage is not tied
    to a beat.

## Run 5: what landed (2026-10-25)

Five agents, one per slice, each in its own worktree; merged and committed by the orchestrating
session (63d49e2d..c8e742b2). Screenshots in `docs/screenshots/wardrobe/run-5/`.

- **Parade and lineup.** Moves are scheduled (`apps/client/src/utils/resolveCastMoves`, beats
  from `useRoomBeat`, which reads the display's `data-beat` and never touches the audio graph):
  every 8 bars on a bar the bird's name picks, one bar in place of the pose (a pop bird's bounce
  too), the Bump answered by the bird behind, and the intro lineup waving each seat's Move once,
  a beat apart. Every genre's Props landed across a neighbour, not just metal: members now space
  by margin (looser next to a showpiece), each face paints over the back of the bird in front,
  and the row stands about 10 bird units off the floor so Stages and dips are not clipped. The
  dance is 17 s (was 14) so eight bars fit at 120 bpm. Full kit measured no slower than bare
  with four page copies on the GPU.
- **Cast.** The Prop sweep runs every prop on every body, style and head through the four
  poses, the four dances and every Move frame (wingFlip and the Bump's answer included). On a
  flipped wing the Prop is parked on the body (`--cast-move-prop`), which cleared 29 prop/genre
  offenders on the chicken dance's clap and heart-point; golden-egg a moved off the face and the
  floor. corn-cob a is redrawn (gold cobs in white husks) and reads as corn; pop's bows and
  streamers tie to the plume's tips; a Top put on mid-parade takes the body's loop start times
  (`CharacterFigure/bodyLoops`). The harness follows the two redrawn items; `check-outfit` is
  123 ok. A part's jig and pose layers are keyed, so a jig coming or going no longer slides the
  part in from the wrong transform (the parade also keys the bird on its Move).
- **Games.** `layer` on `CharacterFigure` (`whole` / `underWing` / `overWing`): FAPPY's beat and
  JOUST's aim turn their wing between the two slices, so the Top paints over it as on the rig.
  `CharacterWingFigure` (now its own module) takes the silhouette's mitered join. The Mount
  ragdoll, the pile, BRAWL and Dunlop Dash were checked in full kit and needed nothing.
- **Portal.** The portal e2e roster has a pop team and a spec walks `/me` and `/me/wardrobe` in
  every genre at 390x844. Rail tabs, the TV-size pill, swatches and the shell's top links reach
  44px; photo heads no longer clip or sit under the pill (the stage bird is 208px tall at 844px,
  was about 256). `OUTFIT_SLOT_CROPS` is per body, and kit and Prop tiles draw the bird without
  its head; Stage and Move tiles keep it. A tapped Move starts on the next beat; Move tiles loop
  on the clock.
- **Data.** Unseat keeps the row and empties its team name (`UNSEATED_TEAM_NAME`, read back as
  no pick everywhere), so outfits survive it; no migration. The export still sends an unseated
  guest's outfits, as it does an orphan's (Brad: keep it, 2026-10-25). `pack:pull` merges per genre: each genre the guest
  carries replaces the player's, the rest are kept; the dry run reads
  `Rob: disco (none) -> dressed, metal dressed -> (bare); keeps pop`. Run 2's whole-map replace
  and run 4's two data edges are gone.
- **Open calls for Brad, at Gate 2.**
  - The parade's lift (about 18px at 1080p) and the 17 s dance.
  - Headless kit tiles in the wardrobe, and the smaller stage bird (or move the pill instead).
  - corn-cob a's gold is 1.3:1 against country orange; the ink outline carries the edge.
  - heart-point jabs with an empty wing now that the Prop parks.
  - Some Tops (battle-vest a most) are drawn only where the chest shows beside the wing at rest,
    so a raised wing (JOUST's aim, FAPPY's downbeat) shows bare body.
  - JOUST's lane birds are about 40px on the tablet; kit barely reads there.
  - sporty-hop's jump leaves the Move tile for a moment; team-sash a/b overhang the tall stock
    body's back a little more than on round.
- **Not covered by e2e.** No sample-pack player wears a Move, so no Playwright spec sees one
  play; giving one sample player a Move would (sample round 1 drives five specs, so check them).

## Gate 2: what Brad decided (2026-10-30)

The night pack had no outfits yet, so the feel test ran the LAN stack (`wing-night-party` in
`.claude/launch.json`) on a scratch copy of the pack: every file linked to the real one except
`players.json`. That copy dressed each bird in a Look for its genre, filled the empty slots and
added a Move, with each open call's item placed on purpose. The real pack was not touched.

Every open call is kept as shipped:

- The parade's ~18px lift and the 17 s dance: keep both.
- Headless kit and Prop tiles, and the 208px stage bird: keep both (the pill stays put).
- corn-cob a's gold against country orange: reads, keep it.
- heart-point's empty-wing jab with the Prop parked: fine.
- Tops that show bare body under a raised wing (battle-vest a most): live with it.
- JOUST's ~40px lane birds: leave them.
- sporty-hop leaving its Move tile: leave it.
- team-sash a/b overhanging the tall body: fine.

**Still open: the real `pack:pull`.** The portal holds what guests do on wingnight.tv, and
nothing reaches the night pack until a pull. The party server reads the pack at boot, so restart
the stack after one. On 2026-10-30 the dry run showed one guest (Brad, a head, no team pick and no
outfit) and no outfit changes, so the pull waits until guests have dressed. It merges, so
pulling again later is safe.

## Rules every agent brief carries

- **Process hygiene.** Stop only processes you started, by the PID you captured. Never `pkill`,
  `killall` or `kill` by pattern.
- **Stay in your files.** Parallel agents share a worktree, so each one owns a named set of files
  and touches nothing else. Code writers that could overlap get their own worktree.
- **Check siblings before shared infrastructure.** Before run 2, diff the other `claude/*`
  worktrees, including uncommitted trees, for outfit or cast work.
- **The authoring rules** in research/bird-wardrobe.md §2.8, measured in the harness wherever they
  can be.
- **No commits from agents.** The orchestrating session reviews and commits after each run.
