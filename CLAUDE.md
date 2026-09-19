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

## The night pack

The real content for a party — roster, teams, party music, generated heads, GEO photos, and the
`GEMINI_API_KEY` the avatar importer needs — lives in ONE directory outside the repo:

```text
~/wing-night-content/
  .env                       GEMINI_API_KEY (import:avatars, import:recreate and the
                             RECREATE forger at party time all read it here)
  local/players.json         roster; avatarSrc is pack-relative ("avatars/rob.png")
  local/teams.json           teams, genres, anthem filenames
  local/audio/lobby/*.mp3    SETUP lobby playlist
  local/teams/audio/*.mp3    team anthems
  local/assets/avatars/*     generated heads, served at /content-assets/avatars/…
  local/assets/geo/*         GEO photos, served at /content-assets/geo/…
  local/minigames/recreate.json  RECREATE targets: source photo, authored prompt, ingredients
  local/assets/recreate/targets/*   the targets import:recreate painted from that file
  local/assets/recreate/attempts/*  the forgeries the server painted on the night (keepsakes)
  local/avatar-sources/*     input photos + manifest for import:avatars
```

It is outside the repo because every session runs in its own worktree and all of this is
gitignored — inside, each worktree starts empty and the copies drift. `pnpm dev`, every
`.claude/launch.json` stack and both import tools resolve it with no setup: `resolveContentRootDir`
uses the pack when `~/wing-night-content` exists and the repo's `content/` when it does not.
`WN_CONTENT_ROOT_DIR` overrides both (see `.env.example`), which is how the e2e stack stays on its
own seeded root. The server logs the root it resolved at boot as `server:contentRoot`.

Anything the pack does not carry — `gameConfig.json`, the minigame prompt banks — falls back to the
repo's committed `content/sample/`, so the pack only holds what a party actually customises.

Asset paths in content are **pack-relative with no leading slash** (`avatars/rob.png`,
`geo/cottage.jpg`). `resolveContentAssetSrc` addresses those against the server origin, because the
client and server are always separate origins. A leading slash (`/sample-assets/geo/eiffel.svg`)
means "Vite serves this" and is left alone — that is the sample pack's committed placeholder art,
the only images still under `apps/client/public/`.

## Conventions

- Tests are colocated: `index.test.ts` next to `index.ts`. Name them `does X when Y`.
- A module with public exports is a folder with an `index.ts`, so consumers import the folder.
- Design prototypes live in `apps/client/public/mockups/` — look there before styling any surface.
- The client and server are always separate origins (no dev proxy), so server-served asset URLs must
  be absolute or they 404 on the TV.
