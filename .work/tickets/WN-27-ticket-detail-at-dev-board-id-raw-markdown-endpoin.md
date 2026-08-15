---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-27
title: "Ticket detail at /dev/board/<id> — raw-markdown endpoint + detail view"
status: ready            # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: medium
created: 2026-08-15

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-26]            # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
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
Layer a ticket-detail view onto the WN-26 board: `/dev/board/<id>` renders one ticket's frontmatter
summary plus its Goal / Acceptance Criteria / Plan / Progress / Evidence sections, served by a
dev-only endpoint that returns the ticket file's raw markdown.

## Acceptance Criteria
- [ ] `GET /api/dev/board/ticket/:id` returns `{ id, markdown }` for an existing ticket, resolving
      the file by globbing `<tickets_dir>/<ID>-*.md` under the manifest `tickets_dir`
      (`.work/manifest.yml` → `tickets_dir: .work/tickets`). It rejects any id not matching
      `^WN-\d+$` with 400 BEFORE touching the filesystem (no path traversal), and returns 404 for a
      well-formed id with no file. Unit tests cover all three paths.
- [ ] The endpoint lives on the same dev-only router as WN-26's `/api/dev/board` — absent when
      `NODE_ENV === "production"` (covered by the existing WN-26 gating test extended, or a sibling
      assertion).
- [ ] `resolveClientRoute` resolves `/dev/board/<id>` to a detail route with an id extractor,
      following the prefixed-segment idiom already in the file
      (`apps/client/src/utils/resolveClientRoute/index.ts:54-68` — `resolvePrefixedSegment` rejects
      the bare prefix and deeper paths); WN-26's bare `/dev/board` continues to resolve to `BOARD`
      (regression-asserted).
- [ ] The detail view renders the frontmatter summary (id, title, status, kind, priority, deps as
      links back to the board) and the markdown body sections. Markdown rendering stays
      dependency-light and inside the lazy-loaded board chunk — the party bundle does not grow; any
      section-splitting/parsing helpers are pure functions with direct unit tests.
- [ ] Board cards from WN-26 link to their detail pages, and the detail page links back to
      `/dev/board`.
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass (manifest `verify.lint` /
      `verify.typecheck` / `verify.test`) with the new endpoint, route-resolution, and view tests
      included.

## Plan
Split out of the WN-26 grill (2026-08-14) to keep each slice one-context-sized — the user chose
glance + detail as the board scope; this is the detail half.

- The detail endpoint deliberately does NOT go through the work CLI: it serves file content, not
  selector logic, so a direct `fs` read has no drift risk (the drift argument only binds status /
  pickability computation — see WN-26's Plan).
- Id validation before fs access is the security-relevant line: the id is user-controlled URL
  input; `^WN-\d+$` plus glob-by-prefix keeps it inside `tickets_dir`.
- Markdown rendering: implementer's choice, constrained to dependency-light and dev-chunk-only
  (a small renderer or hand-rolled section formatting both acceptable; it must not crash
  `tsx --test` — the WN-3 precedent: no top-level `window` / `import.meta.env` in module scope of
  tested files).

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- WN-26 (the board shell this layers on; mounting shape + server-URL resolution decided there)
- `apps/client/src/utils/resolveClientRoute/index.ts:54-68` (prefixed-segment idiom to follow)
- WN-3 (dev-only-surface `tsx --test` crash precedent — the constraint on the renderer choice)
