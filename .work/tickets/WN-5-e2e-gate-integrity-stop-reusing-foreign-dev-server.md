---
id: WN-5
title: "E2E gate integrity: stop reusing foreign dev servers; make test_one honest from a clean checkout"
status: in-progress
kind: chore
priority: medium
created: 2026-08-04
deps: []
blocked_by: []
worktree: "/Users/bradleyexton/Projects/wing-night-WN-5"
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
- 2026-08-07T02:08:34.968Z claimed → in-progress @ /Users/bradleyexton/Projects/wing-night-WN-5
- 2026-08-07T02:11:47.230Z implemented: extracted resolvePort into tools/playwright-ports/index.mjs (env-overridable port with a fallback; a MALFORMED override throws instead of silently falling back — a typo'd port reverting to 5173 would reuse a live dev server, the exact dishonesty this ticket fights). playwright.config.ts now resolves WN_E2E_SERVER_PORT/WN_E2E_CLIENT_PORT (defaults 3000/5173), passes PORT to the server webServer env (gate1 finding 1), interpolates the client --port and adds --strictPort (gate1 finding 2). Manifest e2e/test_one pinned to CI=1 + 3100/5273 with a comment explaining the port choice. Root test script picks up the new colocated test via test:playwright-ports.
- 2026-08-07T02:17:45.527Z verify green (lint/typecheck/test). e2e run surfaced a latent bug the ticket did not anticipate: 'pnpm --filter <pkg> dev -- --host ... --port ...' forwards a LITERAL '--' to vite, which then ignores every following flag — so the pre-existing '--port 5173' was inert and only appeared to work because 5173 is vite's default. Proof: vite logged 'Port 5173 is in use, trying another one...' and bound 5174 while Playwright polled 5273. Fixed by switching the client webServer to 'pnpm --filter @wingnight/client exec vite --host 127.0.0.1 --port <n> --strictPort', which hands flags straight to vite (verified: binds 5273, 200 on both 127.0.0.1 and localhost). Without this the whole client-side port override would have been inert.
- 2026-08-07T02:17:52.145Z AC verification: manifest 'e2e' (CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e) → 8 passed (17.7s) with foreign dev servers deliberately holding [::1]:5173 and *:3000 throughout. manifest 'test_one' via 'work verify --test-one tests/e2e/smoke.spec.ts' → green on the same isolated ports. Interactive defaults unchanged (3000/5173, reuseExistingServer: !CI) so 'pnpm test:e2e' and the CI workflow ('pnpm playwright test') behave as before.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

## Links
- `playwright.config.ts` (webServer blocks); `.work/manifest.yml` `verify:` keys
- Related hygiene: stale worktrees under `.claude/worktrees/` (human decision — see WN-AUDIT-REPORT.md)
