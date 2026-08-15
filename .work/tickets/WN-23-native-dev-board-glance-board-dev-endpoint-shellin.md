---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-23
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
      root. The CLI entry is resolved from a `WORK_CLI` env var, defaulting to
      `../claude-dev-system/tools/bin/work.ts` relative to the repo root. (Both commands verified
      working against this repo during planning, 2026-08-14, from the dev-system checkout.)
- [ ] The endpoint/router is only mounted when `NODE_ENV !== "production"` — `createApp`
      (`apps/server/src/createApp/index.ts:4-10`, currently mounts only `/health`) keeps a
      production app free of it, proven by a unit test asserting 404 under
      `NODE_ENV=production`.
- [ ] When the CLI path does not exist or the spawn fails, the endpoint responds 503 with a JSON
      body naming the resolved path it tried — no hang, no stack-trace body.
- [ ] `resolveClientRoute("/dev/board")` returns a new `BOARD` member of the `ClientRoute` union
      (`apps/client/src/utils/resolveClientRoute/index.ts:1-8`), following the existing `/dev/*`
      convention (`:10-12`); trailing-slash normalization covered like the other routes.
- [ ] The `BOARD` route renders a glance view with buckets — in-progress · ready-pickable (the
      `next` ticket starred) · waiting-on-deps (ready but an un-done dep, naming the blocker) ·
      blocked · funnel (idea / needs-research / needs-planning) — each card showing id, title,
      kind, priority, deps. Bucketing is a pure function over the endpoint payload with direct unit
      tests (per rules/testing.md: prefer pure selectors over rendered-output assertions).
- [ ] The board view is lazy-loaded (`React.lazy` or equivalent dynamic import) so the party-night
      bundle does not grow; the server URL is resolved the same way `resolveSocketServerUrl` does
      (`apps/client/src/socket/createRoomSocket/index.ts:15-23`) — `VITE_SOCKET_SERVER_URL` first,
      `window.location.hostname` fallback.
- [ ] `BOARD` is NOT added to the socket-creating routes (`shouldCreateRoomSocket`) — the board
      talks HTTP only; a negative test asserts no socket is created for it.
- [ ] `pnpm typecheck` and `pnpm test` pass (manifest `verify.typecheck` / `verify.test`), with the
      new endpoint, route-resolution, bucketing, and component tests included.

## Plan
Grilled interactively 2026-08-14 (plan-work, four lenses). Decisions of record:

- **Data source — shell out to the work CLI, not in-server parsing** (user-decided). The endpoint
  spawns `node <WORK_CLI> index --json` / `next --json`. Rationale: the pickability logic is the
  drift-prone part; `--json` is the machine seam CDS-149 built and Harvest already consumes.
  Wing-night's vendored `tools/` has only the two hooks, no CLI — hence the `WORK_CLI` env with the
  sibling-checkout default. The spawn boundary is the ONE thing tests mock.
- **Scope — glance + detail across two slices** (user-decided). This slice is the glance board
  end-to-end; WN-24 layers the ticket-detail view on top. Review tab, structure tab, and any write
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

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- WN-24 (ticket detail, depends on this) · WN-13 (vendored surfaces — reuses this mounting shape)
- claude-dev-system CDS-149 (`work index --json` / `work next --json` — the machine seam)
- claude-dev-system `docs/DESIGN.md` §9.1 (board is a vendored, per-project surface; Harvest is the
  global view) · `docs/PROTOTYPING.md` §1 (surfaces table)
- `apps/client/src/utils/resolveClientRoute/index.ts` (route table) ·
  `apps/server/src/createApp/index.ts` (mount point) ·
  `apps/client/src/socket/createRoomSocket/index.ts:15-23` (server-URL resolution precedent)
