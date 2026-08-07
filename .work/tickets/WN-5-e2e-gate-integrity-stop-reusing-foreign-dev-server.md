---
id: WN-5
title: "E2E gate integrity: stop reusing foreign dev servers; make test_one honest from a clean checkout"
status: in-review
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
- 2026-08-07T02:25:54.026Z browser-verify: skipped (non-UI)
- 2026-08-07T02:25:54.137Z qa: PASS (qa-reviewer, confidence high, sha 6b6f779). Reviewer independently re-ran the isolated suite (8 passed 17.5s with foreign servers live on 5173+3000) and mutation-tested the new unit tests (3 mutations, all caught). Two advisory MINORs left unaddressed per the minor/info non-blocking rule, carried for post-merge review: (1) the client webServer bypasses apps/client's own 'dev' script; the reviewer verified that simply DROPPING the literal '--' (i.e. 'pnpm --filter @wingnight/client dev --host ... --port ...') also forwards flags cleanly, which would fix the bug without duplicating the launch definition — a smaller diff worth adopting. (2) the config half of the fix (client command, --strictPort, server PORT env, pinned manifest ports) has no unit-level regression test; only resolvePort does. Plus one INFO: bare interactive 'pnpm test:e2e' still reuses 5173/3000 by design (Plan-sanctioned), and README does not mention the WN_E2E_* overrides.
- 2026-08-07T02:25:58.862Z handed off → in-review (verify green); awaiting land
- 2026-08-07T02:26:37.402Z re-attested at in-review (verify + qa re-run green) for e983d333
- 2026-08-07T02:27:21.848Z carried over from the pre-claim canonical checkout — prototype: skipped (not in plan) [recorded 2026-08-07T02:07:43Z]
- 2026-08-07T02:27:21.956Z carried over from the pre-claim canonical checkout [recorded 2026-08-07T02:07:50Z] — gate1: product-owner PASS (confidence high). Two MINOR findings the Plan omits — carry into implementation: (1) the server webServer block has NO env at all, so WN_E2E_SERVER_PORT would never reach the server process; the server reads process.env.PORT (apps/server/src/index.ts:17-18), so the block needs env: { PORT: String(serverPort) }. (2) the client dev command hardcodes the port as a string literal (--port 5173) separately from the clientPort const, so it must ALSO be interpolated — changing only baseURL would point Playwright at 5273 while Vite binds 5173. Also noted (info): work verify --test-one substitutes test_one into the test slot, so pinning CI=1 there flips retries 0->1 and the reporter to github+html for every single-spec gate run.

## Evidence
<test output + screenshot / preview URL, recorded before `done`>

<!-- captured-evidence:start -->
**Verify gate:** ✓ PASS (3 step(s))

```
✓ lint: pnpm lint
✓ typecheck: pnpm typecheck
✓ test: pnpm test
```

**Anti-blind-spot grep:** 4 symbol(s) with external call-sites reviewed:

- `env` → apps/client/src/components/HostControlPanel/ConfigSetupPrototype/index.tsx:23, apps/client/src/components/HostControlPanel/index.tsx:31, apps/client/src/socket/createRoomSocket/index.ts:16, apps/client/src/socket/createRoomSocket/index.ts:36, apps/client/src/vite-env.d.ts:10, apps/server/src/index.ts:17, apps/server/src/socketServer/index.ts:32, apps/server/src/socketServer/index.ts:38, … 1 more (run `work grep`)
- `parsedPort` → apps/server/src/index.ts:17, apps/server/src/index.ts:18
- `rawValue` → apps/client/src/components/HostControlPanel/ScoreOverrideSurface/index.tsx:12, apps/client/src/components/HostControlPanel/ScoreOverrideSurface/index.tsx:13
- `resolve` → apps/client/src/components/HostControlPanel/MinigameSurface/styles.ts:16, apps/server/src/contentLoader/contentLoaderUtils/index.ts:1, apps/server/src/contentLoader/contentLoaderUtils/index.ts:5, apps/server/src/contentLoader/loadContentFileWithFallback/index.ts:2, apps/server/src/contentLoader/loadContentFileWithFallback/index.ts:16, apps/server/src/contentLoader/loadContentFileWithFallback/index.ts:17, apps/server/src/minigames/runtime/index.ts:159, apps/server/src/routes/health/index.test.ts:10, … 5 more (run `work grep`)

**QA findings (advisory):** 3 finding(s) carried from the passing verdict:
- **minor** — The client webServer bypasses the client package's own `dev` script (`pnpm --filter @wingnight/client exec vite ...`) when a strictly smaller fix was available: simply dropping the literal `--`. This duplicates the client's launch definition in two places (apps/client/package.json `"dev": "vite"` and playwright.config.ts:46), so if `dev` ever grows a flag, a wrapper, or a mode, the e2e stack silently stops launching what `pnpm dev` launches. code-design §Utilities/§Modules: a duplicated source-of-truth is the anti-pattern here; the seam should stay the package script, with env/flags as the variable part.
    evidence: I reproduced the implementer's `--` claim in a scratch pnpm 10.33.4 workspace (/tmp/wn5-pnpm-probe): `pnpm --filter demo dev -- --host 127.0.0.1 --port 5273` yields ARGV `["--","--host","127.0.0.1","--port","5273"]` — the claim is CORRECT, the old flags were genuinely inert. But the same probe shows `pnpm --filter demo dev --host 127.0.0.1 --port 5273` (no `--`) yields ARGV `["--host","127.0.0.1","--port","5273"]` — clean forwarding through the package's own script, with neither flag swallowed by pnpm. That form fixes the bug without bypassing `dev`. Current behavior is correct, so this is advisory only.
- **minor** — The substantive half of the fix ships without an automated regression test. `tools/playwright-ports/index.test.mjs` covers only the pure `resolvePort` helper; the actual gate-integrity changes — the client webServer command (the `dev -- <flags>` inert-flag bug fixed mid-implementation), `--strictPort`, the server `env: { PORT }` wiring, and the manifest's pinned 3100/5273 — have no test that would fail if reverted. testing.md §Test quality: "Bug fixes ship with a regression test that fails without the fix." A cheap guard (assert the resolved `webServer` commands/urls off the imported config, or assert the command does not match /\bdev\s+--\s/) would lock in the discovered bug.
    evidence: Test diff covers resolvePort only (10 cases, all env-injection through the public interface). Calibrated to minor rather than major because a reversion fails LOUDLY, not silently: with the flags inert again, Vite binds its default 5173 while Playwright polls 5273 and the webServer block times out red — exactly the symptom the implementer logged at Progress 02:17:45. Separately, CI=1 alone closes the dishonest-green path (Playwright refuses to start when reuseExistingServer=false and the URL already answers), so a silent wrong-tree pass is not reachable even if this regressed.
- **info** — The bare interactive `pnpm test:e2e` (no env, no CI) still reuses whatever holds 5173/3000, so the wrong-tree-reuse hazard remains reachable outside the gate — and README.md:220 documents exactly that invocation with no mention of the isolated form. This is NOT a deviation: the approved Plan explicitly chose it ("`reuseExistingServer` stays `!CI` there") and the ACs are scoped to the manifest commands. Flagged only so the residual is a known one; a one-line README note on the `WN_E2E_*` overrides would close it.
    evidence: playwright.config.ts:32,48 `reuseExistingServer: !process.env.CI` with defaults 3000/5173 (lines 9-10). Ticket Plan §Design mandates this. README.md:218-224 lists `pnpm test:e2e` / `pnpm playwright test` unqualified.

_Captured 2026-08-07T02:26:37.402Z._
<!-- captured-evidence:end -->

## Links
- `playwright.config.ts` (webServer blocks); `.work/manifest.yml` `verify:` keys
- Related hygiene: stale worktrees under `.claude/worktrees/` (human decision — see WN-AUDIT-REPORT.md)
