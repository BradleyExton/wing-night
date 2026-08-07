---
# ─── Required ───────────────────────────────────────────────────────────────
id: WN-12
title: "Passcode admin auth (ADMIN_PASSCODE + adminSecret map) for the config wizard"
status: needs-planning   # idea | needs-research | needs-planning | ready | in-progress | in-review | done | blocked | superseded
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
- [ ] **`pnpm lint`, `pnpm typecheck` and `pnpm test` all pass** — all three manifest verify keys. `lint` entered the default gate when WN-3 landed; naming only typecheck+test got WN-16/WN-17/WN-11 rejected at gate1 on 2026-08-07.

## Plan
Grilled 2026-08-05 (plan-work session; user at the table).

- Auth scope DECIDED: v1 wizard (WN-11) rides hostSecret; this ticket is the hardening step, required before any public hosting, low priority until then.
- Design from the spike's Option B: passcode typed into the page, exchanged server-side — fixes the VITE_ bundle-leak weakness of HOST_CONTROL_TOKEN.
- Parked with this ticket: everything hosting-related (Dockerfile, static serving, socket-URL fallback fix, Fly volume) — mint separately when a domain is actually wanted. DB remains a no-go (spike verdict).

## Progress
<the executing agent appends here — the restart-safe log>
- 2026-08-07T18:16:07.558Z gate1 (product-owner critic, 2026-08-07): needs-changes — recorded at .work/verdicts/WN-12.gate1.json. Summary: premises all verify against the code and the goal is sound, but the finish line cannot detect this ticket's most likely regression — it rewires the one surface with a dedicated Playwright spec, and pnpm test provably excludes Playwright. MAJOR: the last AC omits the manifest e2e verify key; tests/e2e/admin-config-wizard.spec.ts is built on the exact host-secret ride-along this ticket removes (openWizard waits on config:read replying only after the host claim issues a secret; the spec sequences /host then /admin because the server keeps ONE host secret, last claim wins) — both premises are what WN-12 deletes, so the regression lands silently green. Precedent: WN-11, same surface, carried a dedicated AC naming the full e2e key. MINOR: no AC retires copy/admin.ts hostAuthCoexistenceWarning, which WN-11 scoped to live only until WN-12 lands. Verdict routes ready -> needs-planning; re-plan via plan-work (do not re-prompt).

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
Deps: WN-11. Spike findings: hostAuth (apps/server/src/hostAuth), open-by-default role grant (resolveAuthorizedSocketClientRole), README Host Authorization section.
