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
-   Fixed per-round team turn order (`EATING -> MINIGAME_INTRO -> MINIGAME_PLAY` per team)
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
2. `EATING -> MINIGAME_INTRO -> MINIGAME_PLAY` (repeat for each team turn)
3. `ROUND_RESULTS` (apply accumulated wing + mini-game points)

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
  minigames/geo/                  # GEO unsupported renderer/runtime scaffold
  minigames/drawing/              # DRAWING unsupported renderer/runtime scaffold

content/
  sample/                         # Safe, committed sample content
  local/                          # Custom content (gitignored)

apps/client/public/local-assets/  # Images (gitignored)
```

SPEC.md AGENTS.md TASKS.md README.md pnpm-workspace.yaml

Shared types and validation schemas must live in `packages/shared` and
be imported by both client and server.

For fast minigame iteration, use `/dev/minigame/trivia` (or `geo`,
`drawing`) to preview host + display surfaces with scenario presets and
interactive knobs.

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

------------------------------------------------------------------------

# 📁 Content Packs

Loading priority:

1.  content/local/ (gitignored)
2.  content/sample/

This enables private party content and open-source-safe engine
distribution.

------------------------------------------------------------------------

## players.json

content/local/players.json

Example:

{ "players": \[ { "name": "Brad", "avatarSrc":
"/local-assets/avatars/brad.jpg" }, { "name": "Mike" } \] }

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
