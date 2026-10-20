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
| 2 | after run 5 | Feel test on the real TV and tablet: the lobby parade in full kit, one game, `/me/wardrobe` on a phone. Then `pnpm teaser:deploy` and a `pack:pull`. | ~30 min |

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
