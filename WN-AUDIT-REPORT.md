# WN backlog audit + onboarding completion — 2026-08-04

Run scope: audit-only (no app code changed). Writes: `.work/**`, `TASKS.md` (handover block +
pointers), this report. One commit, not pushed.

## 1. TASKS.md reconciliation

**Tracker of record is now `.work/`** — TASKS.md carries a frozen-as-history header and every
open item points at its owning WN ticket.

Already-done-but-untracked drift found:

| Item | TASKS.md said | Reality (verified in code) |
|---|---|---|
| 9.1 | open (migrated to WN-1) | **Done** — WN-1 landed 2026-08-01 (`tests/e2e/host-display-sync.spec.ts`). Ticked. |
| 11.1 | open | **~90% shipped**: `toRoleScopedSnapshotEnvelope` + display-safe projection (`packages/shared/src/roomState/index.ts:264-320`), per-role socket rooms, tests in `apps/server/src/socketServer/roleScopedSnapshots.test.ts`. Only the explicit `socket.recovered` decision + a reconnect regression test remain → WN-4. |
| 11.8's "GEO/DRAWING unsupported states" | — | Overtaken: **GEO and DRAWING are full runtime plugins on main** (registries in `apps/{server,client}/src/minigames/registry`). |
| 12.3 | open | Mostly shipped: `docs/minigame-authoring-guide.md` is current; the "GEO scaffold" became a full implementation. Only the README reference is missing → WN-6. |
| D9 | open | Partially absorbed: AGENTS.md already carries the snapshot-privacy guardrails (lines 45, 62–67). Envelope + takeover-shell guardrails remain → WN-6. |

Confirmed genuinely remaining: 9.2 (WN-2), 11.1-remainder (WN-4), 12.1 (WN-7), 12.2 (WN-8),
D8 + D9-remainder + 12.3-remainder (WN-6). Spot-checked completed items (11.5/11.6 takeover
components, 10.6 reorder in `roomState/turnState`, role auth) — all real. Zero TODO/FIXME/HACK
markers in source. No player-facing dead ends found; gates green (below).

## 2. Verify-gate ground truth (2026-08-04)

| Gate | Result | Time |
|---|---|---|
| `pnpm typecheck` | ✅ pass | 5.1s |
| `pnpm test` | ✅ pass (all suites incl. 9 lint-rule tests) | 5.8s |
| `pnpm lint` | ❌ 72 errors + 18 warnings **raw**; **28 errors on the main tree** | 4.6s |
| e2e boot (one spec) | ✅ smoke.spec.ts 2/2 passed, fresh isolated stack | 4.2s (run), ~5.4s total |

**Lint vs WN-3's claimed 28:** the true main-tree baseline is **exactly 28 errors — WN-3's
claim holds** (13 hex-colors, 9 hardcoded-copy, 4 inline-style, 1 require-styles-import,
1 max-lines). The raw count is inflated to 72+18 because `eslint.config.mjs` doesn't ignore
`.claude/`, so stale agent worktrees under `.claude/worktrees/*` get linted. Fix added to
WN-3's scope.

**E2E caveat:** the manifest's `test_one` could not be run verbatim-honestly: port 5173 is
held by a Vite dev server running from the *unmerged* worktree `youthful-wu-2b0eb1`, so
`pnpm test:e2e <spec>` would have reused a server serving the wrong tree's code, and `CI=1`
refuses to boot on the occupied port. I proved the stack boots via a transient config (client
on 5174, no reuse), then deleted it. This gate-integrity hole is WN-5.

## 3. Onboarding checklist

| Check | Result |
|---|---|
| `w validate` | ✅ green (8 tickets, prefix WN) |
| `w rules sync --check` | ✅ current (code-design, testing; CLAUDE.md managed block unchanged) |
| `w index --write` | ✅ regenerates cleanly/idempotently |
| `w next` | ✅ sensible — returns WN-3 (WN-2 also pickable; WN-1 dep done) |
| Hooks | ✅ `.claude/settings.json` → `tools/hooks/verify-stop.ts` + `push-gate.ts`; both exist and dry-run clean (exit 0); push-gate correctly blocks `git push` (exit 2). Harmless `MODULE_TYPELESS_PACKAGE_JSON` warning — cosmetic. |
| Skills symlink | ✅ `.claude/skills → ~/Projects/claude-dev-system/skills` resolves; contents listed fine |
| Manifest verify commands | ✅ all run; ⚠️ `test_one`/`e2e` are not clean-checkout-honest when dev servers squat the hardcoded ports → WN-5 |
| Manifest `src_globs` | ⚠️ fixed in place: added `packages/minigames/**/src/**/*.tsx` (drawing/geo client surfaces were uncovered) and `tools/**/*.ts` + `tools/**/*.mjs` (hooks, eslint plugin, importer) |
| TASKS.md handover | ✅ frozen-as-history header + per-item WN pointers; no content deleted |

## 4. Ticket inventory

| Id | Title | Status | Why |
|---|---|---|---|
| WN-2 | Playwright display refresh-rehydrate (9.2) | ready (pre-existing) | Last E2E-milestone slice; deps (WN-1) done |
| WN-3 | Lint burn-down + restore lint gate | **ready (promoted this run)** | 28 errors verified + error map written into the plan; `.claude/**` ignore added to scope |
| WN-4 | Close out 11.1 reconnect/recovery decision | needs-planning | New — the only real remainder of 11.1 |
| WN-5 | E2E gate integrity (foreign server reuse) | **ready (promoted this run)** | New — found live during this audit; config-only fix |
| WN-6 | Docs alignment (D8 + D9 + 12.3 remainders) | needs-planning | New — one docs-only slice bundling the three doc leftovers |
| WN-7 | Cross-title game shell contract ADR (12.1) | needs-research | New — architectural; open questions in Goal; **not promoted deliberately** |
| WN-8 | Extract reusable orchestrator package (12.2) | needs-research, deps: WN-7 | New — executes whatever WN-7 decides; not promoted |

Promotions made (per the 2–3 smallest/safest allowance): WN-3 and WN-5, both planned via
autonomous plan-work with every self-answered decision marked
`(self-answered — autonomous run)` in their `## Plan`.

## 5. Proposed blessed queue for the first overnight drain

1. **WN-5** — e2e gate integrity first: it makes every later ticket's e2e evidence honest, is
   config-only, and `w next` ordering aside, an untrustworthy gate poisons everything after it.
2. **WN-3** — lint burn-down; restores the third gate, mechanical, fully mapped.
3. **WN-2** — refresh-rehydrate spec; test-only, helpers already exist from WN-1, and it runs
   against the now-trustworthy e2e gate.

Excluded and why: **WN-4** (needs a planning pass — small design decision on recovery
semantics), **WN-6** (docs-only, low value for an overnight slot, better with human taste),
**WN-7/WN-8** (architectural/direction-setting — needs-research by design; do not drain).

## 6. Open decisions only the human can make

1. **Unmerged visual-polish worktree**: `.claude/worktrees/youthful-wu-2b0eb1` (branch
   `claude/visual-polish-pass-292818`, commit 93f297a) is **not in main** and still has a live
   Vite dev server (pid 53177) squatting port 5173. Merge, salvage, or discard? (The other two
   worktrees' commits are already in main — they're deletable litter, but I left all three
   untouched per the single-writer guard.)
2. **Branch litter**: ~18 stale branches (book-club game variants, old phase branches,
   `feat/geo-minigame`, etc.). The book-club branches (VERDICT/MERIDIAN and friends, built for
   the July 2026 night) are the interesting ones — they're the concrete evidence WN-7's ADR
   should be grounded in. Keep, merge, or mine-then-delete?
3. **Minigame roadmap ideas** (`docs/minigames/`: song-guess spec, emoji-charades spec,
   read-the-room idea): none minted as tickets — they're product decisions, not audit
   leftovers. Say the word and they become WN tickets.
4. **The unpushed commit**: main is 1 ahead of origin (aeb99af, onboarding) plus this audit
   commit — pushing is left to you.
