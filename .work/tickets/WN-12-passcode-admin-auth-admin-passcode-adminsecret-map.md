---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-12
title: "Passcode admin auth (ADMIN_PASSCODE + adminSecret map) for the config wizard"
status: ready   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
kind: feature
priority: low
created: 2026-08-05

# ─── Optional (delete a line to take its default) ───────────────────────────
deps: [WN-11]                 # list<id>; DAG edges; must all be `done` before the SELECTOR picks this; default []
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
Gate the /admin config wizard behind a server-side passcode: ADMIN_PASSCODE env var exchanged for an adminSecret (per-secret map alongside hostAuth), replacing the wizard's host-secret ride-along.

## Acceptance Criteria
- [ ] An `adminAuth` server module mirrors the hostAuth issue/validate pattern but keeps admin and host secrets in separate slots so claiming one never invalidates the other; `ADMIN_PASSCODE` is read server-side only (never a VITE_ var — must not ship in the client bundle).
- [ ] A claim event (passcode → adminSecret) gates all `config:*` events, which switch from HostSecretPayload to the admin secret; /admin renders a passcode prompt when unclaimed; with `ADMIN_PASSCODE` unset the wizard stays open (LAN default, mirroring HOST_CONTROL_TOKEN's opt-in hardening).
- [ ] The SocketClientRole type-level tripwire (`packages/shared/src/socketClientRole/index.test-d.ts`) is consciously updated if an ADMIN role is added — or the design keeps HOST-role sockets with admin-gated events and documents why (decide in-ticket; either is acceptable).
- [ ] Unit tests: claim with right/wrong/absent passcode; admin claim does not invalidate host secret and vice versa; config events reject without a valid adminSecret when a passcode is configured.
- [ ] `pnpm typecheck` and `pnpm test` pass.

## Plan
Grilled 2026-08-05 (plan-work session; user at the table).

- Auth scope DECIDED: v1 wizard (WN-11) rides hostSecret; this ticket is the hardening step, required before any public hosting, low priority until then.
- Design from the spike's Option B: passcode typed into the page, exchanged server-side — fixes the VITE_ bundle-leak weakness of HOST_CONTROL_TOKEN.
- Parked with this ticket: everything hosting-related (Dockerfile, static serving, socket-URL fallback fix, Fly volume) — mint separately when a domain is actually wanted. DB remains a no-go (spike verdict).

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Deps: WN-11. Spike findings: hostAuth (apps/server/src/hostAuth), open-by-default role grant (resolveAuthorizedSocketClientRole), README Host Authorization section.
