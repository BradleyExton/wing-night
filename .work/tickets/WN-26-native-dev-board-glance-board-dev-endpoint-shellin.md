---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-26
title: "Native /dev/board glance board — dev endpoint shelling the work CLI + bucketed ticket list"
status: ready            # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
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
---

## Goal
Give wing-night its own native board: a dev-only `/dev/board` React route showing the work-log at a
glance (bucketed tickets, next-up starred), fed by a dev-only Express endpoint that relays
`work index --json` + `work next --json` — selector parity by reuse, zero duplicated status logic.

## Acceptance Criteria
- [ ] `GET /api/dev/board` on the server returns `{ index, next }` where `index` is the parsed
      output of `work index --json` and `next` of `work next --json`, both run with cwd at the repo
      root. The CLI entry resolves from the `WORK_CLI` env var when set; the default is
      `../claude-dev-system/tools/bin/work.ts` relative to the CANONICAL repo root — derived from
      the parent of `git rev-parse --path-format=absolute --git-common-dir` — so the default also
      resolves from `.claude/worktrees/*` checkouts, where a cwd-relative sibling path does not
      (gate1 finding, 2026-08-15). (Both commands verified working against this repo during
      planning, 2026-08-14, from the dev-system checkout.)
- [ ] The endpoint/router is only mounted when `NODE_ENV !== "production"` — `createApp`
      (`apps/server/src/createApp/index.ts:4-10`, currently mounts only `/health`) keeps a
      production app free of it, proven by a unit test asserting 404 under
      `NODE_ENV=production`.
- [ ] When the CLI path does not exist or the spawn fails, the endpoint responds 503 with a JSON
      body naming the resolved path it tried — no hang, no stack-trace body.
- [ ] `resolveClientRoute("/dev/board")` returns a new `BOARD` member of the `ClientRoute` union
      (`apps/client/src/utils/resolveClientRoute/index.ts:1-8`), following the existing `/dev/*`
      convention (`:10-12`); trailing-slash normalization covered like the other routes.
- [ ] The `BOARD` route renders a glance view with SIX buckets — in-progress · ready-pickable (the
      `next` ticket starred) · waiting-on-deps (ready but an un-done dep, naming the blocker) ·
      in-review (awaiting gate2) · blocked · funnel (idea / needs-research / needs-planning) — each
      card showing id, title, kind, priority, deps. `done` and `superseded` are the named excluded
      set. Bucketing is a pure TOTAL function over the endpoint payload with direct unit tests
      (per rules/testing.md: prefer pure selectors over rendered-output assertions), including a
      totality assertion: every status in the schema enum lands in exactly one bucket or the
      excluded set — no status falls through silently.
- [ ] The board view is lazy-loaded (`React.lazy` or equivalent dynamic import) so the party-night
      bundle does not grow; the server URL is resolved the same way `resolveSocketServerUrl` does
      (`apps/client/src/socket/createRoomSocket/index.ts:15-23`) — `VITE_SOCKET_SERVER_URL` first,
      `window.location.hostname` fallback.
- [ ] `BOARD` is NOT added to the socket-creating routes (`shouldCreateRoomSocket`) — the board
      talks HTTP only; a negative test asserts no socket is created for it.
- [ ] The real path is demonstrated once, not only the mocked seam: one live `GET /api/dev/board`
      response — dev server running, real CLI spawn against this repo's work-log, no mock — is
      captured into `## Evidence` (curl output or `work evidence --url`) showing actual `index` +
      `next` data.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
      `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e` pass (manifest
      `verify.lint` / `verify.typecheck` / `verify.test` / `verify.e2e`), with the new endpoint,
      route-resolution, bucketing, and component tests included. The e2e key is in the gate because
      this ticket adds a Suspense boundary to `App.tsx`, the render root of every Playwright-spec'd
      surface, which has no unit coverage. (If port 3100 is squatted by a foreign next-server,
      re-port — don't kill.)

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

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-15T15:15:59.263Z gate1: needs-changes (product-owner, confidence high) — demoted ready → needs-planning; route to plan-work. Verdict summary: one blocker + three majors, all fixable in one plan-work amendment without re-decomposing the slice. (1) BLOCKER: last AC omits pnpm lint — verify.lint is in the default gate and is the only gate item reaching the seven wingnight component/styles ESLint rules the new board component must satisfy; amend last AC to lint → typecheck → test. (2) MAJOR: e2e key unnamed although React.lazy forces a Suspense boundary into App.tsx (render root of every Playwright-spec'd surface) and createApp gains a router; name the full e2e key (CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273) or add an App-level shell assertion. (3) MAJOR: AC-5 bucket enumeration drops in-review (the awaiting-gate2 state) — add an in-review bucket or an explicit excluded-set with a total-coverage assertion. (4) MAJOR: no AC exercises the real CLI spawn, and the WORK_CLI default ../claude-dev-system does not resolve from a .claude/worktrees build checkout (real CLI: /Users/bradleyexton/Projects/claude-dev-system/tools/bin/work.ts) — pin worktree-aware resolution and require one live payload demonstration. Minors (advisory): waiting-on-deps bucket re-derives dep-satisfaction client-side (parity claim overstated); scope at upper edge of one window (card chrome stays minimal; 260/140-line lint caps); component test must import the board entry directly — renderToStaticMarkup cannot resolve React.lazy. Full verdict: .work/verdicts/WN-26.gate1.json
- 2026-08-15T15:46:58.703Z re-planned after gate1 rejection (plan-work Mode B, grilled 2026-08-15): last AC now names the full gate lint → typecheck → test → e2e; in-review bucket added with totality assertion (done/superseded the named excluded set); WORK_CLI default resolves from the canonical repo root via git common dir with env override; new live-payload AC proves the real CLI path once. needs-planning → ready.

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
