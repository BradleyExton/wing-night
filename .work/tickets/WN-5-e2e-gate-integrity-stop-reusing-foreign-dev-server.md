---
id: WN-5
title: "E2E gate integrity: stop reusing foreign dev servers; make test_one honest from a clean checkout"
status: ready
kind: chore
priority: medium
created: 2026-08-04
deps: []
blocked_by: []
---

## Goal
Make the Playwright gate deterministic about *which code it tests*. Today
`playwright.config.ts` hardcodes ports (server 3000, client 5173) and sets
`reuseExistingServer: !process.env.CI` — so the manifest's `test_one`
(`pnpm test:e2e {pattern}`, no `CI=1`) reuses whatever happens to hold 5173.

Audit evidence (2026-08-04): port 5173 was held by a Vite dev server running from the stale,
**unmerged** worktree `.claude/worktrees/youthful-wu-2b0eb1` (branch
`claude/visual-polish-pass-292818`, commit 93f297a, not an ancestor of main). In that state:
- `pnpm test:e2e <spec>` would silently test the *wrong tree's* client code — a green gate
  that verifies nothing about main;
- `CI=1 pnpm test:e2e` refuses to boot (port 5173 occupied), so the "isolated" mode is
  unavailable exactly when the dishonest mode is dangerous.

Workaround used during the audit: a transient config with client on 5174 and
`reuseExistingServer: false` — smoke spec passed 2/2 in 4.2s, proving the stack itself is fine.

Fix direction (planning to confirm): make ports env-overridable in `playwright.config.ts`
(e.g. `WN_E2E_CLIENT_PORT` / `WN_E2E_SERVER_PORT` defaulting to 5173/3000) and re-key the
manifest's `test_one`/`e2e` to run isolated on dedicated e2e ports, so both commands are honest
from a clean checkout regardless of what dev servers are live. Note the host machine context:
another project's dev server periodically holds port 3000, and wing-night dev itself is run
with `PORT=3001`.

## Acceptance Criteria
- [ ] `test_one` and `e2e` manifest commands boot their own servers on ports that do not
      collide with live dev servers (5173/3000 occupied must not break or corrupt the run)
- [ ] Neither command can silently reuse a server serving a different worktree's code
- [ ] `.work/manifest.yml` updated to match; comments explain the port choice
- [ ] The manifest `e2e` command (full Playwright suite, isolated ports) passes while a dev
      client is deliberately live on 5173

## Plan
Planned 2026-08-04 (autonomous backlog-audit run — decisions marked
`(self-answered — autonomous run)`).

Grill summary:
- **Scope:** `playwright.config.ts` + `.work/manifest.yml` only. Specs are clean — no spec or
  helper hardcodes a port/URL (verified: everything goes through `baseURL`), so the whole fix
  is config-side. Cuts: no CI workflow changes (CI has no port squatters), no worktree cleanup
  (human decision, tracked in WN-AUDIT-REPORT.md).
- **Design:** ports become env-overridable with **isolated-by-default gate commands**:
  `WN_E2E_SERVER_PORT` / `WN_E2E_CLIENT_PORT` default to 3000/5173 for interactive use
  (`reuseExistingServer` stays `!CI` there), and the manifest `test_one`/`e2e` commands pin
  `CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273` (dedicated e2e ports, chosen clear
  of 3000/3001/5173/5174 known-used on this machine) so gate runs always boot fresh servers
  and can never reuse a foreign tree's server. (self-answered — autonomous run; port numbers
  are easily changed if they collide with anything)
- **Edge cases:** `VITE_SOCKET_SERVER_URL` in the client webServer env must interpolate the
  server port var; `baseURL` must interpolate the client port var. If the dedicated port is
  occupied, Playwright fails loudly (correct behavior — a loud fail beats a dishonest green).
- **Architecture:** keep one `playwright.config.ts` (no second config file) — env vars are the
  seam. (self-answered — autonomous run)
- **Verification:** with a dev client deliberately live on 5173, `pnpm test:e2e
  tests/e2e/smoke.spec.ts` via the new manifest `test_one` must boot its own stack and pass;
  full `e2e` command must pass. The audit's manual 5174 run (smoke 2/2 in 4.2s) is the
  known-good baseline.

## Progress
<the executing agent appends here — the restart-safe log>

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- `playwright.config.ts` (webServer blocks); `.work/manifest.yml` `verify:` keys
- Related hygiene: stale worktrees under `.claude/worktrees/` (human decision — see WN-AUDIT-REPORT.md)
