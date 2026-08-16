---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-26
title: "Native /dev/board glance board — dev endpoint shelling the work CLI + bucketed ticket list"
status: in-progress
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

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- WN-27 (ticket detail, depends on this) · WN-13 (vendored surfaces — reuses this mounting shape)
- claude-dev-system CDS-149 (`work index --json` / `work next --json` — the machine seam)
- claude-dev-system `docs/DESIGN.md` §9.1 (board is a vendored, per-project surface; Harvest is the
  global view) · `docs/PROTOTYPING.md` §1 (surfaces table)
- `apps/client/src/utils/resolveClientRoute/index.ts` (route table) ·
  `apps/server/src/createApp/index.ts` (mount point) ·
  `apps/client/src/socket/createRoomSocket/index.ts:15-23` (server-URL resolution precedent)
