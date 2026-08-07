---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-11
title: "Pre-flight config wizard on /admin (port Variant C, wire to config:* events, delete lab)"
status: ready   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-05

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-10, WN-5]      # WN-5 gates the Playwright AC below: until test_one boots its own servers, that spec can go green against a foreign dev server's code

blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed | heads-down; default checkpointed
# needs_prototype: false # true => prototype must complete before in-progress; default false
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
---

## Goal
Ship the pre-flight config wizard as a production /admin route — a port-variant rewrite of the prototype lab's Variant C wired to the config:* events — and delete the throwaway lab.

## Acceptance Criteria
**Slice 1 of 3.** gate1 rejected the original as eight deliverables over a 459-line prototype that
must decompose into ~15-25 files under the 260/140 caps. This slice is the spine: the route, seeding,
and apply for gameConfig only. Roster + prompt packs + lab deletion are WN-19.

- [ ] `/admin` is a real route in `resolveClientRoute` + `App.tsx` + `shouldCreateRoomSocket`, **and
      in `resolveSocketClientRole`** (`apps/client/src/socket/createRoomSocket/index.ts:25-32`), which
      returns HOST only for `route === 'HOST'`. Left unchanged, `/admin` connects as DISPLAY,
      `canClaimControl` is false, no host secret is issued, and because `emitSecretInvalid`
      early-returns for non-claimers every `config:*` call gets **no reply at all** rather than an
      error. Include the colocated `resolveClientRoute` test case its precedent has.
- [ ] The wizard seeds from `config:read` (merged disk content, not room state), edits a local draft,
      and Review's single action calls `config:apply`. Replies arrive on the **`config:result` emit**
      WN-10 landed (not an ack — read the shape off `apps/server`). A `CONFIG_LOCKED` rejection
      renders the locked state naming the reset-game escape hatch.
- [ ] Validation issues map inline to their fields via the issue `path` (e.g. `rounds[1].sauce`);
      Review is blocked while local validation fails.
- [ ] **Scope: gameConfig only.** Identity → Lineup → Clocks & Scoring → Review. Roster and prompt
      packs are WN-19; the lab and its eslint carve-out stay in place until then.
- [ ] **Document the host-auth coexistence rule.** `hostAuth/index.ts:5-13` is last-claim-wins on one
      module-scoped secret, so opening `/admin` mid-night silently invalidates the live `/host`
      session — and `wireHostControlClaim` re-claims without retrying the dropped action, so the
      host's next tap is a silent no-op and the two tabs ping-pong. State the rule in the Review-step
      copy and sequence the e2e spec so `/admin` and `/host` never claim concurrently. (WN-12 replaces
      this with a separate admin secret.)
- [ ] A proper rewrite composing `HostControlPanel` styleTokens + house idiom (styles.ts siblings,
      copy module, sr-only labels) — NOT a verbatim lab copy.
- [ ] **The e2e spec must not corrupt the repo's content.** `config:apply` writes the real
      `content/local/gameConfig.json` (`contentWriter/index.ts:108,117` against
      `DEFAULT_CONTENT_ROOT_DIR`), and local wins over sample
      (`contentLoaderUtils/index.ts:12-15`) — so the write **persists across processes and runs**.
      `tests/e2e/host-display-sync.spec.ts:34,39,44` asserts on exactly those round-1 values, and
      `playwright.config.ts:15-17` is `workers:1` / `fullyParallel:false` running alphabetically, so
      an `admin-*` spec sorts FIRST and leaves the suite red. Add a **content-root env override the
      server honours**, and point the e2e webServer at a throwaway dir — do not rely on a teardown
      that restores files, which leaks whenever a test fails mid-run (the WN-2 fixture lesson).
      Restoring SETUP phase is necessary but restores the phase, not the disk.
- [ ] One Playwright spec covers the happy path (open /admin, edit a round label, apply, assert
      display/host see it) and the `CONFIG_LOCKED` rejection, run via the manifest `test_one` form —
      `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e <spec>` — never the bare
      form (the defect WN-2 was rejected for). The spec restores SETUP phase before finishing.
- [ ] **The full `e2e` key is part of the finish line, not just `test_one`** — `test_one` runs the one
      spec and would not catch the cross-spec corruption above.
- [ ] **`pnpm lint`, `pnpm typecheck` and `pnpm test` all pass** — all three manifest verify keys.
      `lint` is the ONLY check enforcing the house component idiom this ticket's rewrite AC demands
      (`eslint.config.mjs:113-146` fires on `apps/client/src/components/**`, exactly where this
      lands). Naming only typecheck+test is the defect that got WN-16, WN-17 and this ticket rejected
      on 2026-08-07.

## Plan
Grilled 2026-08-05 (plan-work session; user at the table).

- Home DECIDED: dedicated /admin route (standalone feel of the picked variant; HostControlPanel phase dispatch untouched; natural home for WN-12's passcode gate later).
- Roster DECIDED: wizard Roster edits the FILES (players.json/teams.json); the existing SETUP deck stays for live in-room tweaks; Apply-overwrites-live is the documented rule (surface this in the Review step copy).
- Implementation is the port-variant skill's job: lift structure/decisions from apps/client/src/components/HostControlPanel/ConfigSetupPrototype/VariantC.tsx, rewrite properly, delete the lab.
- **port-variant outputs 2 and 3 are SKIPPED-AND-SAID here, pending WN-13 — not dropped, and not a property of this project.** The skill is explicit that a target project has its *own vendored copy* of these routes: "in a target project these are the same files under its vendored route copy" (port-variant SKILL.md:30), and PROTOTYPING.md marks both the designs route and the component library "M2 (**vendored**, new)". wing-night just hasn't been given them yet — verified 2026-08-07, `resolveClientRoute` defines exactly `ROOT | HOST | DISPLAY | DEV_MINIGAME | NOT_FOUND` and `design/` is documentation, not a catalog app. That is an **onboarding gap (WN-13)**, not a reason the outputs don't apply. Per the skill's own Boundaries — "Three outputs, each conditional… Skip-and-say, don't skip-and-forget" — output 1 (fold the winner into prod as a proper rewrite) always applies and is the substance of this ticket. Record in `## Evidence` that outputs 2–3 were skipped *because the surfaces are not vendored yet*, naming WN-13. Do **not** block on WN-13; it can backfill this component's catalog entry afterwards.
- Response-shape dependency: WN-10 now has an AC requiring it to name the reply mechanism for `config:*` (ack callback vs a `config:result` emit), because `defineAuthorizedEvent` cannot express these events as-is. Read that decision off the landed WN-10 code rather than assuming an ack.

Pre-verified 2026-08-07 (standing fix: check every AC against landed code at planning time, not at
gate1). Confirmed real before this ticket goes near the queue: `resolveClientRoute` +
`shouldCreateRoomSocket` exist and are wired in `App.tsx:15,18,49,54`; `HostControlPanel/styleTokens`
exists and is the established import for sibling `styles.ts` files; the lab is committed at 9001a1f
with its dispatch at `HostControlPanel/index.tsx:87-89`; the eslint carve-out is at
`eslint.config.mjs:16`.
- The lab's ?locked= override and variant switcher die with the lab; locked state in prod derives only from live room phase.
- No needs_prototype: the UI direction was already prototyped and picked (2026-08-05).

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T12:10:05.264Z gate1 REJECTED (product-owner, needs-changes, confidence high) — demoted ready→needs-planning, routing to plan-work. Verdict: .work/verdicts/WN-11.gate1.json. Bottom line: every 'Pre-verified 2026-08-07' claim in the Plan checks out and WN-10's landed config:result / CONFIG_LOCKED / issues[].path shapes are exactly what ACs 2-3 assume — the ticket is worth doing, but three planning gaps would derail the session. MAJOR 1 (e2e blast radius, the one that lands silently): the mandated spec applies a changed round label via config:apply, which writes the repo's REAL content/local/gameConfig.json (contentWriter/index.ts:108,117 resolves against DEFAULT_CONTENT_ROOT_DIR = repo content/; there is no content-root env override), and local wins over sample in contentLoaderUtils/index.ts:12-15 — so the mutation persists across processes and runs. tests/e2e/host-display-sync.spec.ts:34,39,44 asserts on exactly those round-1 values ('Warm Up', 'Eating · Frank's', 'TRIVIA'), and playwright.config.ts:15-17 is workers:1 / fullyParallel:false running specs alphabetically, so an admin-*/config-* spec sorts FIRST and leaves the suite red. The ticket's SETUP-phase-restore AC (the WN-2 precedent) is the right instinct aimed at the wrong resource: it restores the phase, not the disk. None of the ticket's own checks catch it — test_one runs the single spec, and work verify runs only lint/typecheck/test. Planning fix: isolate the content root for e2e (or add a teardown that restores content/local), and make the full e2e key part of the finish line. MAJOR 2 (same class as WN-16/WN-17, third time today): the final AC names only pnpm typecheck + pnpm test while the manifest verify gate resolves lint → typecheck → test with lint first. Lint is the ONLY mandated check that enforces AC 5's 'house component idiom' — component-entry-file-name, require-styles-import-in-component-entry, no-inline-style-prop, no-hardcoded-component-jsx-text, no-hardcoded-hex-colors-in-styles, plus the 260/140 max-lines caps — all of which fire on apps/client/src/components/** (eslint.config.mjs:113-146), the exact path this lands under. It is also the only check that validates AC 6's edit to eslint.config.mjs itself. Stronger here than on the sibling spikes: this is production component code with no carve-out to hide behind. MAJOR 3 (scope): eight separable deliverables in one pass — /admin route + socket wiring, a five-step wizard, editors for five content files (incl. drawing packs, which the lab never designed — sampleDraft.ts:8-15 models drawing as a read-only COUNT), inline issue-path mapping, the CONFIG_LOCKED state, the lab deletion, two eslint.config.mjs edits + the typeof-window guard removal, and a two-scenario Playwright spec — over a 459-line prototype that must decompose under the 260/140 caps into ~15-25 new files with colocated tests. Recommended split: slice 1 = /admin route + config:read seeding + Review/apply for gameConfig only; slice 2 = Roster + prompt packs; the lab deletion + eslint carve-out removal rides the last slice. MINOR 1: AC 1's wiring list omits resolveSocketClientRole (apps/client/src/socket/createRoomSocket/index.ts:25-32), which returns HOST only for route === 'HOST' — left unchanged, /admin connects as DISPLAY, canClaimControl is false, no host secret is issued, and because emitSecretInvalid early-returns for non-claimers every config:* call gets NO reply at all rather than an error. Minor only because the mandated happy-path spec would fail loudly on it. MINOR 2: host auth is last-claim-wins on a single module-scoped secret (hostAuth/index.ts:5-13) — a second HOST-claiming surface means opening /admin mid-night silently invalidates the live /host session, and wireHostControlClaim re-claims but never retries the dropped action, so the host's next tap is a silent no-op and the two tabs ping-pong the claim. Name the coexistence rule and how the spec sequences /admin vs /host. INFO: two contract details to pin while re-planning — whether the wizard ever emits config:save at all (AC 3 says 'save/apply', AC 2 says apply is Review's single action), and the read/write shape asymmetry (ConfigContentSnapshot hands back players[]/teams[] while ConfigFileEdit.value must be the whole file object).
- 2026-08-07T16:22:58.436Z gate1 PASS on re-judgement (product-owner, attempt 2, confidence high, sha 15d5282) — recorded with --supersede over the round-1 needs-changes; the journal keeps both grades ordered. The round-1 verdict on the transport was STALE: it graded sha 09b039c, i.e. the ticket as it stood BEFORE commit 42043fb re-planned it, so acting on it would have re-demoted an already-re-planned ticket and spun the loop. Re-invoked the critic on the amended ticket per its own re-judgement rule (grade it as it now stands, not the diff between drafts). All three round-1 majors verified resolved against HEAD: (1) e2e blast radius — AC 7 now mandates a content-root env override the server honours plus a throwaway dir for the playwright webServer, explicitly rejecting a restore-teardown because it leaks whenever a test fails mid-run, and AC 9 puts the FULL e2e key on the finish line so the cross-spec corruption test_one cannot see is actually run; (2) the missing lint step — the final AC now names all three manifest verify keys (lint, typecheck, test), lint being the only check that enforces the house component idiom eslint.config.mjs:113-146 fires on apps/client/src/components/**; (3) over-scoping — cut to the gameConfig spine (Identity, Lineup, Clocks & Scoring, Review) with Roster + prompt packs + lab deletion + the eslint carve-out removal split into WN-19, which exists, is ready, and deps [WN-11]. Both round-1 minors were promoted to ACs in their own right: AC 1 names resolveSocketClientRole (createRoomSocket/index.ts:25-32 returns HOST only for route === 'HOST', so an unchanged /admin connects as DISPLAY and every config:* call gets no reply at all), and AC 5 names the last-claim-wins host secret (hostAuth/index.ts:5-13) plus the requirement that the spec sequence /admin and /host so they never claim concurrently. Deps WN-10 and WN-5 both confirmed done; WN-10's landed shapes (CONFIG_RESULT emit, CONFIG_ERROR_CODES.LOCKED, issues[].path) are exactly what ACs 2-3 assume. Three INFO findings carried for the implementer, none blocking: (a) the throwaway e2e content root must be SEEDED, not empty — loadContentFileWithFallback resolves <root>/local then <root>/sample and throws Missing content file if neither exists, and the server takes the destructive fatalError path on that (index.ts:18-23), while the repo has content/sample only; it fails loudly on the first mandated e2e run, so it cannot land silently; (b) the env override has exactly two prod call sites falling through to DEFAULT_CONTENT_ROOT_DIR (index.ts:18 reloadContentIntoRoomState, registerRoomStateHandlers/index.ts:367 createConfigService default arg) and playwright.config.ts:28-39 already has a webServer env block, which is what keeps AC 7 in-scope; (c) two prose drifts — the 'Slice 1 of 3' header names only one real follow-on slice (WN-19), and the eslint.config.mjs:14-16 ignore comment still credits WN-11 with deleting the lab when that is now WN-19's job per AC 4.
- 2026-08-07T16:23:02.281Z prototype: skipped (not in plan) — work ship-plan WN-11 --json emits select→gate1→implement→test→qa→browser→gate2→land with needsPrototype:false; the UI direction was already prototyped and picked on 2026-08-05 (Variant C), so there is no pipeline-time prototype detour. Routed on the emitted plan, not re-derived from prose.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Deps: WN-10 (config:* events), WN-5 (honest e2e gate). Prototype answer recorded in auto-memory (config-setup-ui-direction) and this Plan. Lab: apps/client/src/components/HostControlPanel/ConfigSetupPrototype/ — **committed** as of 9001a1f and dev-gated; delete it with `git rm -r` in this ticket's diff, along with its gate in HostControlPanel/index.tsx.
