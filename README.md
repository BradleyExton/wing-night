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

The game runs entirely on a local Wi-Fi network with no internet
required.

------------------------------------------------------------------------

# 📦 Monorepo Structure (pnpm Workspace)

Wing Night uses a pnpm workspace monorepo.

/ apps/ client/ \# React app (routes: /host, /display) server/ \#
Express + Socket.IO server

packages/ shared/ \# Shared types, schemas, socket contracts

content/ sample/ \# Safe, committed sample content local/ \# Custom
content (gitignored)

client/public/local-assets/ \# Images (gitignored)

SPEC.md AGENTS.md TASKS.md README.md pnpm-workspace.yaml

Shared types and validation schemas must live in `packages/shared` and
be imported by both client and server.

------------------------------------------------------------------------

# 🧱 Tech Stack (MVP)

Frontend: - React - TypeScript (strict mode) - Vite - Tailwind CSS -
Socket.IO client

Backend: - Node.js - Express - TypeScript - Socket.IO

Testing: - Vitest (unit + component) - Playwright (E2E)

State: - In-memory authoritative server state - No database in MVP

------------------------------------------------------------------------

# 🚀 Development Setup

1)  Use Node 22:

nvm install 22
nvm use 22

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

Host: http://`<your-ip>`{=html}:5173/host

Display: http://`<your-ip>`{=html}:5173/display

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
"timers": { "eatingSeconds": 120, "triviaSeconds": 30, "geoSeconds": 45,
"drawingSeconds": 60 } }

------------------------------------------------------------------------

# 🧪 Testing

Unit tests:

pnpm test

E2E tests:

pnpm playwright test

------------------------------------------------------------------------

# 🧠 Development Rules

See AGENTS.md for engineering guardrails.

------------------------------------------------------------------------

Stability \> cleverness\
Clarity \> complexity\
Fun \> perfection
