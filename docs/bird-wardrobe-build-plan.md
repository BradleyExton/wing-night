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
