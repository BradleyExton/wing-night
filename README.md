# Wing Night 🔥

Wing Night is a host-led, in-person party game inspired by spicy wing
challenges and game-show mini-games.

Teams eat progressively hotter wings across multiple rounds. Immediately
after eating, teams compete in turn-based mini-games while dealing with
the spice.

This repository contains the **engine** only.\
Custom prompts, sauces, player names, and images are loaded locally and
are not committed.

See `SPEC.md` for the full product specification.

------------------------------------------------------------------------

# 🏗 Architecture Overview

Wing Night is a **LAN-first, realtime, authoritative-server**
application.

Core principles:

-   Server is the single source of truth
-   Clients render state and request mutations only
-   Realtime sync via WebSockets (Socket.IO)
-   Full state snapshot on reconnect
-   In-memory state only (MVP)
-   Engine/content separation
-   Fixed per-round team turn order (`MINIGAME_INTRO -> EATING -> MINIGAME_PLAY -> TURN_RESULTS` per team)
-   Active-team-only scoring mutations during EATING and mini-game play
-   Round totals applied once at `ROUND_RESULTS`
-   Host/display EATING and minigame surfaces show active team context (team name only) from snapshot turn fields
-   Mini-games run behind a module boundary (`packages/minigames/<minigameId>`)
-   Minigame host/display renderer surfaces are owned by their package modules (React-first in this iteration)
-   Authoritative engine snapshots (from server-side minigame selectors)
    project dedicated mini-game view models:
    -   `minigameHostView` for host controls
    -   `minigameDisplayView` for display-safe rendering

The game runs entirely on a local Wi-Fi network with no internet
required.

------------------------------------------------------------------------

# 🔁 Round Flow

Each round executes as:

1. `ROUND_INTRO` (once)
2. `MINIGAME_INTRO -> EATING -> MINIGAME_PLAY -> TURN_RESULTS` (repeat for each team turn)
3. `ROUND_RESULTS` (apply accumulated wing + mini-game points once per round)

Room snapshots carry team-turn context (`turnOrderTeamIds`,
`roundTurnCursor`, `activeRoundTeamId`, `completedRoundTurnTeamIds`,
`activeTurnTeamId`) so host/display surfaces rehydrate correctly after
refresh/reconnect.

------------------------------------------------------------------------

# 📦 Monorepo Structure (pnpm Workspace)

Wing Night uses a pnpm workspace monorepo.

```text
apps/
  client/                         # React app (routes: /host, /display, /dev/minigame/:minigameId)
  server/                         # Express + Socket.IO server

packages/
  shared/                         # Shared types, schemas, socket contracts
  minigames/core/                 # Generic minigame contract
  minigames/trivia/               # Trivia runtime + host/display renderer + sandbox scenarios
  minigames/geo/                  # GEO runtime + host/display renderer + sample content
  minigames/drawing/              # DRAWING runtime + host/display renderer + sample content

content/
  sample/                         # Safe, committed sample content

~/wing-night-content/             # The night pack: real party content (outside the repo)
```

SPEC.md AGENTS.md TASKS.md README.md pnpm-workspace.yaml

Shared types and validation schemas must live in `packages/shared` and
be imported by both client and server.

For fast minigame iteration, open `/dev` — it lists every minigame
sandbox and dev lab by name, so you never have to remember a slug. Each
sandbox (`/dev/minigame/<slug>`) previews the host + display surfaces
against the real runtime, and its Minigame dropdown hops to any other.

------------------------------------------------------------------------

# 🧱 Tech Stack (MVP)

Frontend: - React - TypeScript (strict mode) - Vite - Tailwind CSS -
Socket.IO client

Backend: - Node.js - Express - TypeScript - Socket.IO

Testing: - Vitest (unit + component) - Playwright (E2E)

State: - In-memory authoritative server state - No database in MVP

------------------------------------------------------------------------

# 🚀 Development Setup

1)  Use Node 25:

nvm install 25
nvm use 25

2)  Enable Corepack and pnpm:

corepack enable
corepack prepare pnpm@10 --activate

3)  Install dependencies:

pnpm install

4)  Start development:

pnpm dev

Or individually:

pnpm --filter @wingnight/server dev
pnpm --filter @wingnight/client dev

5)  Find your local IP address.

6)  Open on devices (same Wi-Fi):

Host: http://`<your-ip>`:5173/host

Display: http://`<your-ip>`:5173/display

------------------------------------------------------------------------

# 🔐 Host Authorization (MVP)

-   Server generates a hostSecret.
-   Host client stores it locally.
-   All mutating socket events require it.
-   Display is strictly read-only.
-   One implicit room only.
-   Default LAN mode: if `HOST_CONTROL_TOKEN` is not configured, any `/host` client can claim host control.
-   Optional hardened mode: set both `HOST_CONTROL_TOKEN` (server) and `VITE_HOST_CONTROL_TOKEN` (client) to require a matching host control token before host role is granted.

------------------------------------------------------------------------

# 📁 Content Packs

Loading priority:

1.  `<root>/local/`
2.  `<root>/sample/`
3.  `content/sample/` in the repo (floor, for the night pack only)

The root is `WN_CONTENT_ROOT_DIR` if set, otherwise the **night pack** at
`~/wing-night-content` when that directory exists, otherwise the repo's own
`content/`. The pack lives outside the repo so every checkout and worktree
shares one copy of the party's gitignored content, and carries only what a
party customises — everything else falls through to the committed sample pack.
See `.env.example` for the layout.

This enables private party content and open-source-safe engine
distribution.

------------------------------------------------------------------------

## players.json

<pack>/local/players.json

Example:

{ "players": \[ { "name": "Brad", "avatarSrc": "avatars/brad.png", "team":
"Molten Metal" }, { "name": "Mike" } \] }

`avatarSrc` is pack-relative (no leading slash): it names a file under
`<pack>/local/assets/`, which the server serves at `/content-assets/<path>`.
`pnpm import:avatars` writes both the file and this field.

`team` is optional and names a team from teams.json, matched ignoring
case and surrounding whitespace. A player who declares one starts the
night already seated on that team; a player who declares none starts
unassigned, for the host to seat in SETUP. A `team` that matches no
declared team is invalid content and fails the load with a clear error.

------------------------------------------------------------------------

## teams.json

<pack>/local/teams.json

fallback: content/sample/teams.json

Optional preset team shells for setup.

{ "teams": \[ { "name": "Team A" }, { "name": "Team B" } \] }

A team's roster is whichever players name it in players.json, in that
file's order — so a pack can arrive with teams already formed. Manual
team creation, player assignment and auto-assign all still work on top of
the preset seating until the game locks. Local teams override sample
teams when present.

A team may also declare `genre` (a label the TV shows on its spotlight
screen) and `anthems` (filenames under `<pack>/local/teams/audio/`):

{ "teams": \[ { "name": "Molten Metal", "genre": "metal", "anthems":
\["through-the-fire-and-flames.mp3", "highway-to-hell.mp3"\] } \] }

------------------------------------------------------------------------

## Party music

Two directories, both gitignored, both convention over configuration —
there is no music JSON to author.

<pack>/local/teams/audio/ — a team's anthems, named by teams.json.
Served at /team-audio/<filename>, local overriding sample. The display
plays one at MINIGAME_INTRO, rotating by round number: round 1 plays the
first anthem, round 2 the second, wrapping when the rounds outlast the
list. Deterministic, so a TV refreshed mid-screen comes back on the same
track.

<pack>/local/audio/lobby/ — background music while people arrive.
Served at /lobby-audio/<filename>. The playlist is simply whatever MP3s
are in the directory, sorted by filename, so 01-, 02- prefixes are the
ordering mechanism. It plays through SETUP only, sequentially, looping,
and hands the speaker back the moment the game starts. No directory, or
an empty one, means a silent setup screen — never an error.

Both share the display's single audio element and the one-tap unlock
overlay, so a tap while guests are still arriving covers the whole night.

------------------------------------------------------------------------

## minigames/recreate.json

<pack>/local/minigames/recreate.json

The Forgery Studio's targets. Each one is a party photo, the prompt that
remixed it, the remix itself, and the visible ingredients that prompt put
in the picture — the ingredients are the whole scoring rubric.

{ "prompts": \[ { "id": "cottage-underwater", "title": "Cottage Weekend",
"sourceImageSrc": "geo/cottage.jpg", "targetImageSrc":
"recreate/targets/cottage-underwater.png", "prompt": "Everyone scuba
diving on the sea floor, a neon sign glowing behind them", "ingredients":
\["Underwater", "Scuba gear", "Neon sign"\] } \] }

Author the photo, the prompt and the ingredients, leave `targetImageSrc`
blank, then `pnpm import:recreate` paints the targets with the Gemini
image API (key in `<pack>/.env`) and fills the field in. Audition every
picture: an ingredient the model did not paint is not a fair tick. On the
night the server sends each team's prompt through the same pipeline and
saves the forgeries under `<pack>/local/assets/recreate/attempts/`. With
no key, the rules' `"liveGeneration": false`, or a refusal, the host
judges the prompt by ear and nothing stalls.

------------------------------------------------------------------------

## gameConfig.json

Defines rounds, sauces, scoring, timers, and scheduled mini-games.

{ "name": "House Party Pack", "rounds": \[ { "round": 1, "label": "Warm
Up", "sauce": "Frank's", "pointsPerPlayer": 2, "minigame": "TRIVIA" }
\], "minigameScoring": { "defaultMax": 15, "finalRoundMax": 20 },
"minigameRules": { "trivia": { "questionsPerTurn": 1 } }, "timers": {
"eatingSeconds": 120, "triviaSeconds": 30, "geoSeconds": 45,
"drawingSeconds": 60 } }

------------------------------------------------------------------------

# 🧪 Testing

Lint checks:

pnpm lint

Unit tests:

pnpm test

E2E tests:

pnpm test:e2e

or

pnpm playwright test

------------------------------------------------------------------------

# 🎨 Component Styling Convention

-   Keep component styles in colocated `styles.ts` files.
-   In component entry files (`index.tsx`), import styles as namespace:
    `import * as styles from "./styles"`.
-   Use semantic style export keys like `container`, `heading`, `card` and
    reference them as `styles.container`.
-   Do not suffix exported style identifiers with `ClassName`.

------------------------------------------------------------------------

# 🤖 CI (PR Checks)

GitHub Actions runs PR checks on every pull request targeting `main`.

Workflow:
- `.github/workflows/pr-checks.yml`
- `.github/workflows/pr-ui-screenshot.yml`
- `.github/workflows/playwright-smoke.yml` (non-blocking smoke visibility)
- Node: `25`
- Package manager: `pnpm@10.0.0`
- Install command: `pnpm install --frozen-lockfile`
- Concurrency: cancels in-progress runs for the same PR branch

Commands executed in CI:
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

Required status checks for branch protection:
- `PR Checks / lint`
- `PR Checks / test`
- `PR Checks / typecheck`
- `PR Checks / build`
- `PR UI Screenshot / screenshot-required`

UI screenshot policy:
- If a PR changes UI files in `apps/client`, the PR description must include at least one screenshot image.
- The check reads markdown image tags (`![...](...)`) and html image tags (`<img ... />`) in the PR body.
- Suggested Playwright MCP capture flow:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" open http://127.0.0.1:5173/host --headed
"$PWCLI" screenshot --filename output/playwright/pr-host.png
```

------------------------------------------------------------------------

# 🧠 Development Rules

See AGENTS.md for engineering guardrails.

------------------------------------------------------------------------

Stability \> cleverness\
Clarity \> complexity\
Fun \> perfection
