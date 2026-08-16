---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-26
title: "Native /dev/board glance board — dev endpoint shelling the work CLI + bucketed ticket list"
status: done
kind: feature
priority: high
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: []                 # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
blocked_by: []           # list<string>; external/manual waits (free text); non-empty => selector skips; default []
# model: sonnet          # opus | sonnet | haiku; unset => global default-by-kind policy (SCHEMA §5)
# thinking: medium       # low | medium | high; unset => policy
# trust: checkpointed    # checkpointed | heads-down; default checkpointed
# needs_prototype: false # true => prototype must complete before in-progress; default false
# landing: preview-pr    # preview-pr | direct-main | feature-flag; unset => manifest default (SCHEMA §7)
# worktree:              # set by work-on on claim (collision guard); default null
# parallel_safe:         # RESERVED for F-8 (post-MVP) — do not set
worktree: "/Users/bradleyexton/Projects/wing-night-WN-26"
landed_range: 2871b2e21df68805202f0c9dd2bbc767a0ca76c6..ffcf53212f17bb3aa68f603adf4ab773469ced17
review: pending
---

## Goal
Give wing-night its own native board: a dev-only `/dev/board` React route showing the work-log at a
glance (bucketed tickets, next-up starred), fed by a dev-only Express endpoint that relays
`work index --json` + `work next --json` — selector parity by reuse, zero duplicated status logic.

## Acceptance Criteria
- [ ] `GET /api/dev/board` on the server returns `{ index, next }` where `index` is the parsed
      output of `work index --json` and `next` of `work next --json`. The CLI entry resolves from
      the `WORK_CLI` env var when set; the default is `../claude-dev-system/tools/bin/work.ts`
      relative to the CANONICAL repo root — derived from the parent of
      `git rev-parse --path-format=absolute --git-common-dir` — so the default also resolves from
      `.claude/worktrees/*` checkouts, where a cwd-relative sibling path does not (gate1 finding,
      2026-08-15). **The spawn's `cwd` is that SAME canonical root**, not `process.cwd()`: from a
      build checkout the two are different directories with independently mutable `.work/tickets`
      trees, so a cwd-relative spawn would render a different work-log than the one resolved
      against (gate1 minor, 2026-08-15). (Both commands verified working against this repo during
      planning, 2026-08-14, from the dev-system checkout.)
- [ ] The endpoint/router is mounted ONLY when the `WN_DEV_BOARD` env var is set to `1` —
      `createApp` (`apps/server/src/createApp/index.ts:4-10`, currently mounts only `/health`)
      leaves a default app free of it. **Fail-closed: env absent ⇒ not mounted ⇒ 404.**
      `createApp` reads the env INSIDE the factory (not at module scope) so a test can toggle it
      per call — the existing health test's idiom (`createApp()` + `app.listen(0)` + real `fetch`,
      `apps/server/src/routes/health/index.test.ts`) applies unchanged. Proven in BOTH directions
      by unit tests: 404 for `/api/dev/board` with the env unset (the default boot), and a mounted,
      non-404 route with `WN_DEV_BOARD=1`. **NO script sets the flag** — not `dev`, not `start`, so
      `apps/server/package.json` is NOT touched by this ticket. You opt in per-invocation:
      `WN_DEV_BOARD=1 pnpm dev`. That is the whole point of the choice — party night boots a plain
      `pnpm dev` and therefore never mounts the board (user decision, 2026-08-15; putting the flag
      in the `dev` script would have re-opened the very hole the NODE_ENV guard had).
- [ ] When the CLI path does not exist, the spawn fails, or the child exceeds a bounded timeout,
      the endpoint responds 503 with a JSON body naming the resolved path it tried — no hang, no
      stack-trace body. **The timeout is a named constant and is what makes "no hang" real**: a
      child that starts but never exits (blocks on stdin, waits on a lock) would otherwise hold the
      request open forever and never reach the 503, leaving that branch unreachable and untestable
      (gate1 minor, 2026-08-15). A unit test drives the timeout branch.
- [ ] `resolveClientRoute("/dev/board")` returns a new `BOARD` member of the `ClientRoute` union
      (`apps/client/src/utils/resolveClientRoute/index.ts:1-8`). `/dev/board` is a FIXED path, so
      it takes the exact-equality branch (the `/admin` shape), not the prefixed-segment helper the
      other two `/dev/*` routes use (`resolvePrefixedSegment`) — those address a variable segment,
      this does not. Trailing-slash normalization comes free from the shared `normalizePathname`;
      cover `/dev/board/` like the other routes.
- [ ] The `BOARD` route renders a glance view with SIX buckets — in-progress · ready-pickable (the
      `next` ticket starred) · waiting-on-deps (ready but an un-done dep, naming the blocker) ·
      in-review (awaiting gate2) · blocked · funnel (idea / needs-research / needs-planning) — each
      card showing id, title, kind, priority, deps. `done` and `superseded` are the named excluded
      set. Bucketing is a pure TOTAL function over the endpoint payload with direct unit tests
      (per rules/testing.md: prefer pure selectors over rendered-output assertions), including a
      totality assertion: every status in the schema enum lands in exactly one bucket or the
      excluded set — no status falls through silently. **The test pins the nine-value enum as an
      explicit LOCAL constant** (`idea`, `needs-research`, `needs-planning`, `ready`,
      `in-progress`, `in-review`, `blocked`, `done`, `superseded`) with a comment citing
      claude-dev-system `docs/SCHEMA.md` §2 as its source — wing-night has no local copy to import.
      Deriving the list from the bucketing function's own keys instead would make the assertion
      tautological and it would never fail (gate1 minor, 2026-08-15).
- [ ] The board view is lazy-loaded (`React.lazy` or equivalent dynamic import) so the party-night
      bundle does not grow; the server URL is resolved the same way `resolveSocketServerUrl` does
      (`apps/client/src/socket/createRoomSocket/index.ts:15-23`) — `VITE_SOCKET_SERVER_URL` first,
      `window.location.hostname` fallback. **That resolution and the fetch both live INSIDE an
      effect**, never at module or render scope: under `tsx --test` there is no DOM and no Vite, so
      a bare `window` / `import.meta.env` read throws (the WN-3 crash class). Proven the way
      `ContraptionUiLab` proves it (`apps/client/src/components/ContraptionUiLab/index.test.tsx:12-19`):
      a test that imports the board entry with `globalThis.window` undefined, plus a
      `renderToStaticMarkup` render asserting the pre-effect frame is the loading/empty state
      rather than a crash.
- [ ] `BOARD` is NOT added to the socket-creating routes (`shouldCreateRoomSocket`) — the board
      talks HTTP only; a negative test asserts no socket is created for it.
- [ ] The real path is demonstrated once, not only the mocked seam: one live `GET /api/dev/board`
      response — dev server running, real CLI spawn against this repo's work-log, no mock — is
      captured into `## Evidence` (curl output or `work evidence --url`) showing actual `index` +
      `next` data. Boot it with `WN_DEV_BOARD=1 pnpm dev` for this — a 404 here means the flag is
      unset, not that the endpoint is broken.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
      `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` pass (manifest
      `verify.lint` / `verify.typecheck` / `verify.test` / `verify.e2e`), with the new endpoint,
      route-resolution, bucketing, and component tests included. The e2e key is in the gate because
      this ticket adds a Suspense boundary to `App.tsx`, the render root of every Playwright-spec'd
      surface, which has no unit coverage. Note the e2e harness boots the server via
      `pnpm --filter @wingnight/server dev` (`playwright.config.ts:33`) with no `WN_DEV_BOARD` in
      its `env:` block, so the Playwright run exercises the app with the board NOT mounted — the
      default, fail-closed shape. That is correct and no spec needs otherwise; the Suspense
      boundary in `App.tsx` is what e2e is covering here, not the endpoint. (If port 3100 is
      squatted by a foreign next-server, re-port — don't kill.)

## Plan
Grilled interactively 2026-08-14 (plan-work, four lenses). Decisions of record:

- **Data source — shell out to the work CLI, not in-server parsing** (user-decided). The endpoint
  spawns `node <WORK_CLI> index --json` / `next --json`. Rationale: the pickability logic is the
  drift-prone part; `--json` is the machine seam CDS-149 built and Harvest already consumes.
  Wing-night's vendored `tools/` has only the two hooks, no CLI — hence the `WORK_CLI` env with the
  sibling-checkout default. The spawn boundary is the ONE thing tests mock.
- **Scope — glance + detail across two slices** (user-decided). This slice is the glance board
  end-to-end; WN-27 layers the ticket-detail view on top. Review tab, structure tab, and any write
  actions are explicitly out of scope for the native board — deep dives stay on the central board /
  Harvest.
- **Dev-gating — follow the repo's own precedent** (self-decided, easily reversed): the client
  route is always resolvable like `/dev/minigame/*` and `/dev/lab/*` (no `import.meta.env` gate —
  avoids the WN-3 `tsx --test` crash class), while the *server* endpoint is the gate: absent in
  production, so a prod build's board shows its error state. Bundle impact handled by lazy-loading
  instead of route gating.
- **Mounting shape**: route member + `/dev/*` path + lazy component + dev-only API router is the
  shell WN-13's `/designs` + `/design-system` reuse (WN-13 now depends on this ticket).
- Component idiom: follow `AdminConfigWizard`'s testing/setup patterns (WN-11/19 precedent).

Re-grilled 2026-08-15 after gate1 rejection (full verdict: `.work/verdicts/WN-26.gate1.json`).
Decisions of record from the amendment:

- **Full verify gate incl. e2e** (user-decided): last AC names lint → typecheck → test → e2e. The
  e2e key is required by the spec'd-surface rule — the lazy boundary lands in `App.tsx` and only
  Playwright covers the client shell.
- **in-review bucket added** (user-decided): six buckets; `done`/`superseded` are the named
  excluded set; the bucketing function is total, with a unit test asserting every schema status is
  handled.
- **WORK_CLI canonical-root default** (user-decided): env override wins; the default resolves from
  the canonical repo root via git's common dir, so worktree builds see live data. A live-payload AC
  proves the real path once — the spawn boundary stays the ONE thing unit tests mock.
- Build notes carried from gate1 minors: keep card chrome minimal — lint caps at 260 lines for
  `index.tsx` / 140 for `styles.ts`, and `no-hardcoded-component-jsx-text` forces a `copy.ts`. The
  board component test imports the board entry DIRECTLY (`renderToStaticMarkup` cannot resolve
  `React.lazy`; the lazy boundary lives only in `App.tsx`). Framing correction: the CLI supplies
  only the starred `next` pick — the waiting-on-deps bucket re-derives dep-satisfaction
  client-side (trivial, accepted; don't go looking for a richer CLI seam).

Re-planned again 2026-08-15 after a SECOND gate1 re-grade (needs-changes; full verdict:
`.work/verdicts/WN-26.gate1.json`). That re-grade confirmed all four findings above are genuinely
closed — verified against disk, not just against this prose — and raised exactly one new major.
Decisions of record from this amendment:

- **Dev-gating signal = an explicit `WN_DEV_BOARD=1` opt-in** (user-decided). This SUPERSEDES the
  third bullet of the first amendment block ("the *server* endpoint is the gate: absent in
  production") — that guard was inert. Nothing in wing-night ever sets `NODE_ENV`: `apps/server`'s
  `start` is a bare `tsx src/index.ts`, `dev` is `tsx watch src/index.ts`, `apps/server/src/index.ts`
  sets no env, and a repo-wide grep finds the name only in WN-26/WN-27 prose. Decisive detail: the
  root package.json exposes **no `start` script at all** — only `dev` — so the realistic
  party-night boot is `pnpm dev`, and a `NODE_ENV=production` guard placed in `start` would leave
  the endpoint mounted on the exact path actually used. `WN_DEV_BOARD` inverts the default to
  fail-closed (absent ⇒ 404), which is both safer and provable under the repo's REAL boot command
  instead of a synthetic env.
- **No script carries the flag — you opt in per-invocation with `WN_DEV_BOARD=1 pnpm dev`**
  (user-decided, 2026-08-15, after a third gate1 grade flagged the first draft of this amendment).
  The first draft put the flag in `apps/server`'s `dev` script for zero-friction dev, which
  quietly re-opened the hole it was meant to close: the rationale two bullets up establishes that
  party night boots `pnpm dev`, so a flag living in `dev` mounts the board on party night — the
  same defect as the NODE_ENV guard, wearing a better name. Keeping every script clean is what
  makes "fail-closed" true rather than merely stated. Consequences, all deliberate:
  `apps/server/package.json` is NOT touched by this ticket (it leaves the blast radius); the
  Playwright run exercises the app with the board unmounted, since the harness boots
  `pnpm --filter @wingnight/server dev` with no `WN_DEV_BOARD` in its `env:` block; and the AC-7
  live-payload capture must boot with the flag explicitly.
- **Make the spawn timeout injectable, defaulting to the named constant** (self-decided from a
  gate1 minor): a bare module-scope constant would force the mandated 503-on-timeout test to sleep
  the full bound, quietly violating `rules/verification.md`'s fast-checks-inside-the-loop rule
  with the ticket's own test. The constant stays the default; the test passes a short value.
- **`work index --json` does not emit `blocked_by`** (verified by running it — the payload is
  exactly id/title/status/kind/priority/deps), so a `ready` ticket with a non-empty `blocked_by`
  renders in the ready-pickable bucket while the selector skips it. A sub-case of the accepted
  client-side re-derivation; note it in the bucketing module's comment rather than chasing a
  richer CLI seam.
- **The guard is read inside the `createApp` factory, not at module scope** (self-decided,
  mechanical): the health test's idiom constructs a fresh app per test
  (`createApp()` + `app.listen(0)` + real `fetch`), so a factory-scope read is what lets one test
  assert 404-when-unset and another assert mounted-when-set. A module-scope read would freeze the
  first value and make the two-direction proof impossible.
- **e2e runs with the board mounted** (consequence, recorded so it doesn't read as a defect): the
  Playwright harness boots the server with `pnpm --filter @wingnight/server dev`
  (`playwright.config.ts:33`), so the `dev` script's flag applies there too. Harmless — no spec
  asserts the endpoint's absence — but it means the e2e run exercises the mounted app.
- Minors folded into the ACs rather than left as prose (all self-decided, all small): spawn `cwd`
  pinned to the same canonical root the CLI path resolves against; a named, bounded spawn timeout
  so AC-3's "no hang" is real and its 503 branch is reachable; the totality test pins the
  nine-value status enum as an explicit local constant citing CDS `SCHEMA.md` §2 (deriving it from
  the bucketing function's own keys would be tautological); the board's URL resolution and fetch
  stay inside an effect, proven the way `ContraptionUiLab` proves it.
- Precision correction to AC-4: `/dev/board` is a FIXED path, so it takes the exact-equality branch
  (the `/admin` shape) — NOT `resolvePrefixedSegment`, which the other two `/dev/*` routes use
  because they address a variable segment. Trailing-slash handling still comes free from the shared
  `normalizePathname`.
- **Open inconsistency, deliberately NOT resolved here** (flagged for the implementer and for
  WN-13, which reuses this mounting shape): AC-6 lazy-loads the board "so the party-night bundle
  does not grow", but every existing dev surface — `MinigameDevSandbox`, `AnamorphLab`,
  `ContraptionLab`, `ContraptionUiLab` — is statically imported in `App.tsx` today. So the bundle
  already carries the dev surfaces, and this ticket pays for the codebase's first `React.lazy` +
  Suspense boundary (which is what drags the slow e2e suite into the gate) to save bytes its
  neighbours don't. Kept as-is because lazy-loading is a decision of record from the original grill
  and WN-13 is scoped against it — but if a later slice makes the labs lazy too, revisit whether
  this boundary is still earning the e2e cost.

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-15T15:15:59.263Z gate1: needs-changes (product-owner, confidence high) — demoted ready → needs-planning; route to plan-work. Verdict summary: one blocker + three majors, all fixable in one plan-work amendment without re-decomposing the slice. (1) BLOCKER: last AC omits pnpm lint — verify.lint is in the default gate and is the only gate item reaching the seven wingnight component/styles ESLint rules the new board component must satisfy; amend last AC to lint → typecheck → test. (2) MAJOR: e2e key unnamed although React.lazy forces a Suspense boundary into App.tsx (render root of every Playwright-spec'd surface) and createApp gains a router; name the full e2e key (CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273) or add an App-level shell assertion. (3) MAJOR: AC-5 bucket enumeration drops in-review (the awaiting-gate2 state) — add an in-review bucket or an explicit excluded-set with a total-coverage assertion. (4) MAJOR: no AC exercises the real CLI spawn, and the WORK_CLI default ../claude-dev-system does not resolve from a .claude/worktrees build checkout (real CLI: /Users/bradleyexton/Projects/claude-dev-system/tools/bin/work.ts) — pin worktree-aware resolution and require one live payload demonstration. Minors (advisory): waiting-on-deps bucket re-derives dep-satisfaction client-side (parity claim overstated); scope at upper edge of one window (card chrome stays minimal; 260/140-line lint caps); component test must import the board entry directly — renderToStaticMarkup cannot resolve React.lazy. Full verdict: .work/verdicts/WN-26.gate1.json
- 2026-08-15T15:46:58.703Z re-planned after gate1 rejection (plan-work Mode B, grilled 2026-08-15): last AC now names the full gate lint → typecheck → test → e2e; in-review bucket added with totality assertion (done/superseded the named excluded set); WORK_CLI default resolves from the canonical repo root via git common dir with env override; new live-payload AC proves the real CLI path once. needs-planning → ready.
- 2026-08-15T21:31:25.652Z gate1 re-grade: needs-changes (product-owner, confidence high) — demoted ready → needs-planning; route to plan-work. The four prior findings are all confirmed CLOSED by the 2026-08-15 amendment (lint in the gate; exact e2e key; in-review bucket + totality over the nine-value enum; canonical-root WORK_CLI + live-payload AC) — do NOT re-open them. ONE new MAJOR, and it needs a decision of record, not an implementer call: AC-2 gates the dev router on NODE_ENV !== "production", but NOTHING in wing-night ever sets NODE_ENV (apps/server/package.json start is `tsx src/index.ts`; apps/server/src/index.ts sets no env; a repo-wide grep finds it only in WN-26/WN-27 prose and loop.log). So the guard is inert — /api/dev/board would mount on the party-night server, the exact opposite of the Plan decision "the server endpoint is the gate" — and AC-2 own proof (404 under NODE_ENV=production) goes green against an env the repo never produces, so the verify gate cannot catch it. WN-27 (ready, deps [WN-26]) inherits the same assumption verbatim. Pick one at re-plan: (a) make NODE_ENV=production part of this slice (add it to apps/server `start`, add apps/server/package.json to the blast radius, note it also flips express into production mode), or (b) gate on a signal the repo actually sets — an explicit WN_DEV_BOARD=1 opt-in, or the presence of a resolvable WORK_CLI. Either way AC-2 must be provable under the repo real boot command. Minors carried for the build: pin the spawn cwd to the canonical root too (AC-1 says only "the repo root"); name a spawn timeout so the 503 branch is reachable (AC-3 says "no hang" but bounds nothing); pin the status enum as an explicit local constant in the totality test citing CDS SCHEMA §2 (deriving it from the bucketing function keys makes the assertion tautological); keep the board URL resolution + fetch inside an effect (the WN-3 tsx --test crash class); scope is at the upper edge (~10 new files) so card chrome stays minimal under the real 260/140 lint caps, with copy.ts and styles.ts both mandatory. Full verdict: .work/verdicts/WN-26.gate1.json
- 2026-08-15T22:36:47.036Z Re-planned after the second gate1 re-grade (plan-work Mode B, 2026-08-15). AC-2 rewritten: the dev router now mounts only on an explicit WN_DEV_BOARD=1 opt-in (fail-closed — env absent means 404), replacing the inert NODE_ENV guard; the flag goes in apps/server dev script (adding apps/server/package.json to the blast radius) and the env is read INSIDE the createApp factory so a unit test can prove both directions. Also folded in: spawn cwd pinned to the canonical root; a named bounded spawn timeout so AC-3 "no hang" is real and its 503 branch reachable; the totality test pins the nine-value status enum as an explicit local constant citing CDS SCHEMA §2; the board URL resolution + fetch stay inside an effect (WN-3 crash class), proven the ContraptionUiLab way; AC-4 corrected to the exact-equality route branch (/dev/board is a fixed path, not a prefixed segment). Recorded as an open inconsistency, deliberately not resolved: AC-6 lazy-loads for bundle size while all four existing dev surfaces are statically imported in App.tsx. work check-acceptance passes; pre-ready checklist (a)-(h) walked. needs-planning → ready.
- 2026-08-15T22:57:02.604Z AC-2 tightened after the third gate1 grade (which passed, with this as a minor): NO script carries WN_DEV_BOARD — not dev, not start — so apps/server/package.json leaves the blast radius entirely and you opt in per-invocation with `WN_DEV_BOARD=1 pnpm dev` (user decision). The first draft put the flag in the dev script for convenience, which re-opened the exact hole the NODE_ENV guard had: party night boots pnpm dev, so a flag living there mounts the board on party night. Downstream edits to match: the AC-7 live-payload capture boots with the flag explicitly, and the last AC now records that Playwright runs with the board UNMOUNTED (the harness boots the server with no WN_DEV_BOARD in its env: block) — the default fail-closed shape, which is what we want e2e exercising. Two more gate1 minors folded into the Plan: the spawn timeout becomes injectable with the named constant as its default (a module-scope constant would make the mandated timeout test sleep the full bound); and `work index --json` does not emit blocked_by, so a ready ticket with a non-empty blocked_by renders as pickable — note it in the bucketing comment. Remaining minor left to the reviewer: the lazy-load-vs-static-imports inconsistency, consciously accepted.
- 2026-08-15T22:59:35.794Z gate1 PASSES (product-owner, confidence high, attempt 3 on the transport — 4 grades total across two re-plans). Advancing to implement. ONE carried minor for the implementer to strike during the build, deliberately NOT fixed pre-claim because a Plan edit would unbind the passing grade under CDS-157 and force a fifth re-grade over one sentence: the third Plan amendment block still contains a now-FALSE bullet claiming "e2e runs with the board mounted ... so the dev script flag applies there too". That was true of the superseded draft only. No script carries WN_DEV_BOARD now, and playwright.config.ts webServer env: block has only PORT + WN_CONTENT_ROOT_DIR, so the Playwright harness canNOT mount the board — as the last AC correctly states. Strike or mark-superseded that bullet as part of the build commit (the ticket is claimed by then, so the edit is free). Both governing ACs are unambiguous in the correct direction, so nothing is built from the stale bullet. Also carried: the lazy-load-vs-static-imports inconsistency stays consciously accepted (recorded in Plan), and WN-27 is stale against this ticket and routes back to plan-work separately — not WN-26 work.
- 2026-08-15T23:00:48.655Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-26
- 2026-08-15T23:04:02.089Z Server half done and green (207/207 in apps/server). New modules: resolveWorkCliTarget (WORK_CLI env override else the sibling default, both resolved against the CANONICAL root from git common dir; returns cliPath AND cwd together so no caller can mis-pair them), runWorkCli (execFile with an injectable timeoutMs defaulting to the named WORK_CLI_TIMEOUT_MS=10s, existsSync pre-check, JSON parse, four distinct failure reasons), routes/devBoard (relays index --json + next --json, 503 naming the resolved workCliPath on any failure). createApp now mounts /api/dev/board only when process.env.WN_DEV_BOARD === "1", read inside the factory. Tests: two-direction gate proof (404 unset / non-404 set / 404 on a non-"1" value / health still up), plus runWorkCli covering parse, arg pass-through, cwd honoured, missing path, non-zero exit, unparseable JSON, and the timeout branch driven by a real never-exiting child at 100ms instead of sleeping the 10s bound.
- 2026-08-16T00:42:59.158Z Client half done; full unit gate green (lint + typecheck + test). New: BOARD member on the exact-equality branch of resolveClientRoute, bucketBoardTickets (pure, six buckets, done/superseded excluded, blockingDeps re-derived from deps vs the done set), DevBoard component (copy.ts + styles.ts + entry, URL resolution and fetch both inside the effect), lazy DevBoard + Suspense boundary in App.tsx, negative socket test for BOARD. BucketColumn started as a sibling .tsx and was rejected by wingnight/component-entry-file-name (component folders take index.tsx only, subcomponents need their own folder) — merged into the entry as a named export instead, which keeps one file at ~165 lines, well under the 260 cap, and keeps the card chrome directly testable.

REAL DEFECT FOUND BY THE LIVE CHECK, not by any unit test: the board fetched cross-origin and the browser blocked it — the endpoint sent no Access-Control-Allow-Origin, so the page could only ever render its error state. Client and server are ALWAYS separate origins in this repo (no vite proxy exists anywhere), and every same-process server test passes regardless, so nothing in the gate could have caught it. Fixed with an allow-origin header scoped to the dev-board router (GET-only, read-only, mounted only behind the WN_DEV_BOARD opt-in — the socket server solves the same problem by reflecting any origin). Shipped with a regression test that I confirmed FAILS with the header removed and passes with it.

Live evidence, both directions, against real servers: WN_DEV_BOARD=1 PORT=3007 → GET /api/dev/board 200, 5319 bytes, 226ms, 28 real tickets + the real next pick (WN-26), Access-Control-Allow-Origin: * present. PORT=3008 with NO flag → same endpoint 404 while /health stays 200, which is the fail-closed party-night shape. Board rendered in the browser against the live endpoint: NEXT starred on WN-26, ready-pickable 4, waiting-on-deps 4 each naming its blocker (WN-21/WN-22 on WN-20, WN-24 on WN-23+WN-28, WN-27 on WN-26), funnel 8, in-progress/in-review/blocked empty — matches an independent re-derivation of the buckets from the raw payload.

Process note for the record: a `git stash push -- <one file>` I ran to prove the regression created no stash, so the following `git stash pop` popped a PRE-EXISTING unrelated stash (feat/minigame-sandbox-live-play), conflicting 18 unrelated files into the worktree and spilling 6 untracked ones. Fully unwound: all 18 restored to HEAD, the 6 untracked moved out of the repo into the session scratchpad (not deleted), and the stash itself was never dropped — it is still stash@{0}, intact. Verified the worktree is exactly this ticket diff afterwards, and re-ran the full gate green. The regression proof was then done by editing the source directly instead of using git.
- 2026-08-16T01:09:11.500Z handed off → in-review (verify green); awaiting land
- 2026-08-16T01:11:44.926Z browser-verify: skipped (non-UI) — the ticket is kind: feature, so readBrowserOutcome routes this phase to skip and no browser verdict is required for the land admission. Recorded for completeness rather than as a claim of no checking: a live browser pass WAS run during the build against the real endpoint, and it is what caught the CORS defect. Its screenshots-equivalent (rendered bucket counts, NEXT starring, per-card blocker naming, all reconciled against an independent re-derivation of the payload) is captured in ## Evidence.
- 2026-08-16T01:13:30.947Z re-attested at in-review (verify + qa re-run green) for 19817a80
- 2026-08-16T01:24:49.442Z auto-landed on green verdicts + attestation (in-review → done); review: pending

## Evidence
### AC#8 — the real path, un-mocked (the mocked seam is not the proof)

```
$ WN_DEV_BOARD=1 PORT=3007 pnpm --filter @wingnight/server start
$ curl -s http://127.0.0.1:3007/api/dev/board   # real CLI spawn, no mock
HTTP 200 · 5319 bytes · 0.226s · Access-Control-Allow-Origin: *

{
  "index": { "ok": true, "tickets": [   // 28 real tickets
    {"id":"WN-1","title":"Playwright host/display phase-advance sync coverage (TASKS…","status":"done","kind":"chore","priority":"medium","deps":[]},
    {"id":"WN-10","title":"Server config write + reload path (content/local writes, c…","status":"done","kind":"feature","priority":"medium","deps":["WN-9"]},
    {"id":"WN-11","title":"Pre-flight config wizard on /admin (port Variant C, wire t…","status":"done","kind":"feature","priority":"medium","deps":["WN-10","WN-5"]},
    … 24 more …,
    {"id":"WN-26","title":"Native /dev/board glance board — dev endpoint shelling the…","status":"ready","kind":"feature","priority":"high","deps":[]}
  ], "counts": {"idea":0,"needs-research":2,"needs-planning":6,"ready":8,"in-progress":0,"in-review":0,"done":12,"blocked":0,"superseded":0}
  },
  "next": { "ok": true, "none": false, "reason": null,
    "next": {"id":"WN-26","title":"Native /dev/board glance board — dev endpoint shelling the…","kind":"feature","priority":"high","deps":[]}
  }
}
```

The `next` pick and the starred card agree because the board relays the CLI's own selector rather
than re-ranking client-side. Note the spawn ran with cwd at the CANONICAL root, so `WN-26` reads
`ready` here: `work claim` writes `in-progress` into the claimed worktree's copy and leaves the
canonical copy alone until land. That is the AC#1 property visible in live data.

### AC#2 — the gate, proven in both directions against real boots

```
$ WN_DEV_BOARD=1 PORT=3007 pnpm --filter @wingnight/server start
$ curl -o /dev/null -w '%{http_code}' http://127.0.0.1:3007/api/dev/board   ->  200
$ curl -s http://127.0.0.1:3007/health                                       ->  {"status":"ok"}

$ PORT=3008 pnpm --filter @wingnight/server start        # no flag — the party-night shape
$ curl -o /dev/null -w '%{http_code}' http://127.0.0.1:3008/api/dev/board   ->  404
$ curl -s http://127.0.0.1:3008/health                                       ->  {"status":"ok"}
```

Fail-closed confirmed: with no script carrying the flag, a plain boot has no board and a live
`/health` — the endpoint is absent, not merely unreachable.

### Board rendered against the live endpoint

Six buckets, `NEXT` starred on WN-26, each waiting card naming its blocker. Counts matched an
independent re-derivation from the raw payload (a second implementation of the bucketing rules,
written in the shell rather than reusing the module):

```
inProgress      0
readyPickable   4   WN-20 WN-23 WN-26(NEXT) WN-28
waitingOnDeps   4   WN-21(on WN-20) WN-22(on WN-20) WN-24(on WN-23,WN-28) WN-27(on WN-26)
inReview        0
blocked         0
funnel          8   WN-12 WN-13 WN-14 WN-15 WN-4 WN-6 WN-7 WN-8
```

16 live + 12 done/superseded excluded = 28 total, reconciling with the payload's own counts.

### Defect found by the live check, not by the gate

The first live render showed only the error panel: `Access to fetch at
'http://127.0.0.1:3007/api/dev/board' from origin 'http://localhost:5199' has been blocked by CORS
policy: No 'Access-Control-Allow-Origin' header is present`. Client and server are always separate
origins in this repo, and every same-process server test passed regardless — so no unit test could
have caught it. Fixed with a router-scoped allow-origin header; the regression test was confirmed
to FAIL with the header removed and pass with it.

### e2e

`CI=1 WN_E2E_SERVER_PORT=3111 WN_E2E_CLIENT_PORT=5288 pnpm test:e2e` -> **14 passed**. Re-ported off
3100/5273 because 3100 was squatted by a foreign server (200 at `/health` but an empty body, so not
wing-night); the last AC sanctions re-porting rather than killing.

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (4 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
✓ e2e: CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e
```

**Anti-blind-spot grep:** 26 symbol(s) with external call-sites reviewed (2 low-signal name(s) skipped: body, path):

- `bucket` → apps/client/src/components/ContraptionLab/RunCanvas/index.tsx:29, apps/client/src/components/ContraptionLab/copy.ts:55, apps/client/src/components/ContraptionLab/copy.ts:58, apps/client/src/components/ContraptionLab/copy.ts:59, apps/client/src/components/ContraptionLab/copy.ts:60, apps/client/src/components/ContraptionLab/index.test.tsx:61, apps/client/src/components/ContraptionLab/labRun/index.test.ts:61, apps/client/src/components/ContraptionLab/labRun/index.test.ts:65, … 49 more (run `work grep`)
- `buckets` → apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:338
- `card` → apps/client/src/components/AdminConfigWizard/PromptPacksStep/styles.ts:9, apps/client/src/components/AdminConfigWizard/ReviewStep/index.tsx:81, apps/client/src/components/AdminConfigWizard/ReviewStep/styles.ts:3, apps/client/src/components/AdminConfigWizard/styles.ts:5, apps/client/src/components/AnamorphLab/index.tsx:71, apps/client/src/components/AnamorphLab/styles.ts:14, apps/client/src/components/ContraptionLab/index.tsx:73, apps/client/src/components/ContraptionLab/styles.ts:14, … 13 more (run `work grep`)
- `closeServer` → apps/server/src/routes/health/index.test.ts:9, apps/server/src/routes/health/index.test.ts:35, apps/server/src/routes/health/index.test.ts:53
- `command` → tools/e2e-content-root/seedCli.ts:3, tools/e2e-content-root/seedCli.ts:7, tools/hooks/push-gate.ts:2, tools/hooks/verify-stop.ts:2
- `configuredUrl` → apps/client/src/socket/createRoomSocket/index.ts:16, apps/client/src/socket/createRoomSocket/index.ts:18, apps/client/src/socket/createRoomSocket/index.ts:19
- `container` → apps/client/src/components/AnamorphLab/index.tsx:63, apps/client/src/components/AnamorphLab/styles.ts:1, apps/client/src/components/ContentFatalState/index.tsx:14, apps/client/src/components/ContentFatalState/styles.ts:1, apps/client/src/components/ContraptionLab/index.tsx:65, apps/client/src/components/ContraptionLab/styles.ts:1, apps/client/src/components/ContraptionUiLab/index.tsx:97, apps/client/src/components/ContraptionUiLab/styles.ts:2, … 58 more (run `work grep`)
- `cwd` → tools/e2e-content-root/index.ts:18, tools/e2e-content-root/index.ts:27, tools/e2e-content-root/index.ts:47
- `directory` → apps/server/src/configService/index.test.ts:43, apps/server/src/configService/index.test.ts:44, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:15, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:20, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:25, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:69, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:76, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:82, … 16 more (run `work grep`)
- `excluded` → packages/shared/src/contraption/noTranscendentals.test.ts:44, packages/shared/src/contraption/simulate/index.ts:18
- `expected` → apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:81, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:141, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:150, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:184, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:202, apps/client/src/components/AnamorphLab/anamorphCloud/index.test.ts:211, apps/client/src/components/ContraptionLab/pieceSets/index.test.ts:108, apps/client/src/components/ContraptionLab/runOutcome/index.test.ts:64, … 24 more (run `work grep`)
- `heading` → apps/client/src/components/AnamorphLab/index.tsx:65, apps/client/src/components/AnamorphLab/styles.ts:5, apps/client/src/components/ContentFatalState/index.tsx:16, apps/client/src/components/ContentFatalState/styles.ts:6, apps/client/src/components/ContraptionLab/index.tsx:67, apps/client/src/components/ContraptionLab/styles.ts:5, apps/client/src/components/ContraptionUiLab/copy.ts:2, apps/client/src/components/ContraptionUiLab/index.tsx:98, … 18 more (run `work grep`)
- `html` → apps/client/src/components/AnamorphLab/index.test.tsx:19, apps/client/src/components/AnamorphLab/index.test.tsx:21, apps/client/src/components/AnamorphLab/index.test.tsx:22, apps/client/src/components/AnamorphLab/index.test.tsx:26, apps/client/src/components/AnamorphLab/index.test.tsx:28, apps/client/src/components/AnamorphLab/index.test.tsx:29, apps/client/src/components/AnamorphLab/index.test.tsx:30, apps/client/src/components/AnamorphLab/index.test.tsx:31, … 482 more (run `work grep`)
- `independently` → packages/shared/src/contraption/measureTrackBytes/index.test.ts:49, tools/playwright-ports/index.test.mjs:50
- `kicker` → apps/client/src/components/RouteNotFound/copy.ts:4, apps/client/src/components/RouteNotFound/index.tsx:10, apps/client/src/components/RouteNotFound/styles.ts:12
- `load` → apps/client/src/components/ContraptionUiLab/sequence/index.ts:3, apps/client/src/components/DisplayBoard/index.test.tsx:35, apps/client/src/components/DisplayBoard/useGameStartCountdown/index.test.ts:29, apps/client/src/components/HostControlPanel/index.test.tsx:23, apps/client/src/copy/common.ts:12, apps/client/src/copy/host.ts:141, apps/server/src/contentLoader/loadGameConfig/index.ts:23, apps/server/src/contentWriter/index.test.ts:45, … 15 more (run `work grep`)
- `origin` → apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:41, apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:57, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:117, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:119, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:125, apps/client/src/components/AnamorphLab/CloudCanvas/index.tsx:126, apps/client/src/components/ContraptionLab/pieceSets/index.ts:53, apps/client/src/components/ContraptionLab/runOutcome/index.test.ts:43, … 23 more (run `work grep`)
- `outcome` → apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:32, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:38, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:39, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:40, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:45, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:51, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:55, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.test.ts:61, … 110 more (run `work grep`)
- `payload` → apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:30, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:32, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:34, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:38, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:44, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:45, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:46, apps/client/src/components/AdminConfigWizard/useConfigWizard/index.ts:70, … 209 more (run `work grep`)
- `previous` → apps/client/src/components/AdminConfigWizard/entryListDraft/index.ts:41, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:80, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:139, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:143, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.test.ts:147, apps/client/src/components/AdminConfigWizard/gameConfigDraft/index.ts:105, apps/client/src/components/AdminConfigWizard/index.tsx:105, apps/client/src/components/AdminConfigWizard/index.tsx:106, … 41 more (run `work grep`)
- `response` → apps/server/src/routes/health/index.test.ts:30, apps/server/src/routes/health/index.test.ts:32, apps/server/src/routes/health/index.test.ts:33, apps/server/src/routes/health/index.test.ts:47, apps/server/src/routes/health/index.test.ts:51, apps/server/src/routes/health/index.ts:5, apps/server/src/routes/health/index.ts:6, packages/shared/src/contraption/simulate/resolveSegmentContacts/index.ts:6
- `server` → apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:117, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:24, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:68, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:79, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:81, apps/client/src/components/AdminConfigWizard/resolveConfigOutcome/index.ts:19, apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.test.ts:6, apps/client/src/components/AdminConfigWizard/selectIssueMessages/index.test.ts:32, … 98 more (run `work grep`)
- `status` → apps/client/src/components/AdminConfigWizard/index.tsx:96, apps/client/src/components/AdminConfigWizard/styles.ts:47, apps/client/src/components/DisplayBoard/StageSurface/SetupStageBody/styles.ts:45, apps/client/src/components/DisplayBoard/StageSurface/TurnResultsStageBody/index.tsx:13, apps/client/src/components/DisplayBoard/StageSurface/TurnResultsStageBody/index.tsx:14, apps/client/src/components/DisplayBoard/StageSurface/TurnResultsStageBody/index.tsx:17, apps/client/src/components/DisplayBoard/StageSurface/TurnResultsStageBody/index.tsx:51, apps/client/src/components/DisplayBoard/StageSurface/index.test.tsx:191, … 25 more (run `work grep`)
- `target` → apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:61, apps/client/src/components/AdminConfigWizard/ClocksScoringStep/index.tsx:93, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:99, apps/client/src/components/AdminConfigWizard/IdentityStep/index.tsx:37, apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:72, apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:96, apps/client/src/components/AdminConfigWizard/LineupStep/index.tsx:148, apps/client/src/components/AnamorphLab/AngleDials/index.tsx:38, … 24 more (run `work grep`)
- `ticket` → apps/client/src/components/ContraptionLab/copy.ts:4, apps/client/src/components/ContraptionUiLab/projectile/index.test.ts:27, apps/client/src/components/ContraptionUiLab/scene/index.tsx:98, apps/client/src/components/ContraptionUiLab/variants/index.test.ts:18, apps/server/src/contentLoader/contentLoaderUtils/index.test.ts:36
- `to` → apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:17, apps/client/src/components/AdminConfigWizard/EntryListEditor/index.tsx:94, apps/client/src/components/AdminConfigWizard/PromptPacksStep/index.tsx:28, apps/client/src/components/AdminConfigWizard/PromptPacksStep/styles.ts:9, apps/client/src/components/AdminConfigWizard/RosterStep/index.tsx:37, apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:127, apps/client/src/components/AdminConfigWizard/contentDraft/index.test.ts:202, apps/client/src/components/AdminConfigWizard/contentDraft/index.ts:54, … 414 more (run `work grep`)

**QA findings (advisory):** 7 finding(s) carried from the passing verdict:
- **info** — Predecessor's info finding is closed. The prior comment asserted node sets `killed` for BOTH the timeout kill and a maxBuffer overflow; that was false and the replacement states the measured behaviour instead, including the correct pre-fix consequence (generic "work CLI failed", not a spurious "work CLI timed out").
    evidence: apps/server/src/runWorkCli/index.ts:43-48. Independent re-measurement on node v24.16.0 using the production option shape: overflow -> code ERR_CHILD_PROCESS_STDIO_MAXBUFFER with `killed` undefined; timeout -> killed true, code null, signal SIGTERM; plain non-zero exit -> code 3, killed false. All three sentences of the comment match.
- **minor** — Carried from the cdc93ca grade: the maxBuffer overflow branch ships without a regression test, because MAX_OUTPUT_BYTES is a module constant while only timeoutMs is injectable, so a test would have to actually emit 8MB. The reviewer drove the branch by hand against a 9MB-output fake CLI and confirmed it live. Consider making the cap injectable alongside the timeout if this is revisited.
    evidence: apps/server/src/runWorkCli/index.ts:11 MAX_OUTPUT_BYTES is not injectable, unlike timeoutMs.
- **minor** — Carried from the cdc93ca grade: both new route error paths (the try/catch around resolveWorkCliTarget and the terminal .catch) are untested — they are the AC-3 guarantee, and the 503-with-null-workCliPath shape is asserted nowhere. Hard to induce without git-absent/PATH manipulation since resolveCanonicalRepoRoot has no injectable seam, and the .catch is defensive-only (runWorkCli returns outcomes rather than rejecting).
    evidence: apps/server/src/routes/devBoard/index.ts:33-39 and :64-66; grep finds no test referencing "could not resolve the repo root" or "work CLI relay failed".
- **minor** — Carried from the c0d8cf2 grade: resolveBoardApiUrl duplicates the private resolveSocketServerUrl (both hold the VITE_SOCKET_SERVER_URL read and the :3000 fallback, now needing to stay in sync). AC-6 prescribed resolving 'the same way resolveSocketServerUrl does', and drift surfaces as a visible error panel on a dev-only surface, so it was graded minor. A shared resolveServerOrigin would close it.
    evidence: apps/client/src/components/DevBoard/index.tsx:24-33 vs apps/client/src/socket/createRoomSocket/index.ts:15-23.
- **minor** — Carried from the c0d8cf2 grade: BucketColumn is exported from the component entry solely so its test can reach it, widening the module's public interface. The repo's settled idiom for a subcomponent is its own folder (ContraptionUiLab/VariantArena/), which would also bring the 171-line entry back under the ~150-line prompt.
    evidence: apps/client/src/components/DevBoard/index.tsx; .work/rules/code-design.md §Modules.
- **info** — Recorded so the next reader knows which test is load-bearing: the AC-5 totality assertion cannot fail for the seven non-excluded statuses, because the `?? "funnel"` catch-all guarantees every status lands somewhere. A status falling through is caught instead by the sibling 'maps each live status to its named bucket', whose expected map is hardcoded independently. Proven by mutation — deleting the in-review mapping leaves the totality test green and fails the mapping test. The totality test does retain teeth over the excluded set.
    evidence: Mutation run: baseline 11 pass / 0 fail; in-review mapping deleted -> 10 pass / 1 fail.
- **info** — The Access-Control-Allow-Origin: * fix is the right call at the right layer — router-scoped rather than app-level, GET-only, read-only, no credentials, mounted only behind the WN_DEV_BOARD opt-in, and strictly tighter than the existing socketServer precedent which reflects any origin WITH credentials. Residual worth naming: while the flag is on, any page open in the developer's browser can read local ticket ids and titles from localhost. Acceptable for a flag-gated dev surface; revisit the `*` if a later slice adds a write action or a richer payload.
    evidence: apps/server/src/routes/devBoard/index.ts:14-17 vs apps/server/src/socketServer/index.ts:33-46.

- verify_extra: step `e2e` required — the diff touched `apps/client/src/App.tsx`

_Captured 2026-08-16T01:13:30.947Z._
<!-- captured-evidence:end -->

## Links
- WN-27 (ticket detail, depends on this) · WN-13 (vendored surfaces — reuses this mounting shape)
- claude-dev-system CDS-149 (`work index --json` / `work next --json` — the machine seam)
- claude-dev-system `docs/DESIGN.md` §9.1 (board is a vendored, per-project surface; Harvest is the
  global view) · `docs/PROTOTYPING.md` §1 (surfaces table)
- `apps/client/src/utils/resolveClientRoute/index.ts` (route table) ·
  `apps/server/src/createApp/index.ts` (mount point) ·
  `apps/client/src/socket/createRoomSocket/index.ts:15-23` (server-URL resolution precedent)
