# Wing Night

LAN-first party game: an authoritative Node server, a host tablet surface and a TV display, synced
over Socket.IO. `SPEC.md` is the product scope, `DESIGN.md` the visual system, `AGENTS.md` the
engineering standards, `BACKLOG.md` what's left to build.

## Verify before claiming done

Every change ends in a runnable check, and the output is the evidence — "tests pass" is a claim, a
green run is proof. The full gate, in order:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

`pnpm test` **excludes Playwright**. Any change under `apps/client/src/**`,
`packages/minigames/**/*.tsx`, or `tests/e2e/**` also needs:

```bash
CI=1 WN_E2E_SERVER_PORT=3100 WN_E2E_CLIENT_PORT=5273 pnpm test:e2e
```

`CI=1` disables `reuseExistingServer` and the pinned ports keep the suite off 3000/5173, which are
routinely held on this machine. Without them a run can silently verify a foreign dev server's code
and report it green.

If a check fails, say so with the output. If a step was skipped, say that.

## Conventions

- Tests are colocated: `index.test.ts` next to `index.ts`. Name them `does X when Y`.
- A module with public exports is a folder with an `index.ts`, so consumers import the folder.
- Design prototypes live in `apps/client/public/mockups/` — look there before styling any surface.
- The client and server are always separate origins (no dev proxy), so server-served asset URLs must
  be absolute or they 404 on the TV.
