# Wing Night

A Hot Ones-inspired party game with real-time multiplayer across three screens.

## Architecture

- **Host** (`/host/:code`) - Tablet interface for game master to control phases, scoring, and timers
- **Player** (`/play/:code`) - Phone interface for players to join teams, ready up, and view status
- **Display** (`/display/:code`) - TV interface showing scoreboard, timer, and game state

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, TypeScript |
| Backend | Express, Prisma (SQLite), TypeScript |
| Real-time | Socket.IO |
| State | React Context (RoomContext) |

## Commands

```bash
# Development (starts both client:5173 and server:3000)
npm run dev

# Individual services
npm run dev:client
npm run dev:server

# Database
cd server && npx prisma studio    # GUI
cd server && npx prisma migrate dev  # Run migrations
```

## Project Structure

```
/client
  /src
    /components/common  - Reusable UI (Button, Card, Timer, etc.)
    /contexts          - RoomContext for shared state
    /routes            - Page components (Host, Play, Display, Edit)
    /lib               - API client, Socket.IO setup
    /types             - TypeScript interfaces

/server
  /src
    /routes            - REST API endpoints (rooms, players, teams, game)
    /handlers          - Socket.IO event handlers
    /lib               - Prisma client, utilities
  /prisma              - Schema and migrations

/docs
  SPEC.md              - Full product specification
```

## Game Phases

```
DRAFT → LOBBY → TEAM_SETUP → GAME_INTRO → ROUND_INTRO → EATING_PHASE → GAME_PHASE → ROUND_RESULTS → GAME_END
                                              ↑_________________________________↓ (repeats per round)
```

## Socket.IO Events

All events broadcast to room code as the channel (`io.to(code).emit(...)`).

| Event | Payload | Description |
|-------|---------|-------------|
| `phase-changed` | `{ phase }` | Game phase transition |
| `room-updated` | `{ changes }` | Room state changes |
| `player-updated` | `{ playerId, changes }` | Player state changes |
| `team-updated` | `{ teamId, changes }` | Team state changes (score, size) |
| `timer-started` | `{ timerState }` | Timer begins |
| `timer-paused` / `timer-resumed` | - | Timer control |
| `scores-updated` | `{ teamScores }` | Batch score update |

## API Routes

- `POST /api/rooms` - Create room
- `GET /api/rooms/:code` - Get room state
- `POST /api/rooms/:code/phase` - Advance phase
- `POST /api/rooms/:code/join` - Player joins
- `PUT /api/rooms/:code/players/:id` - Update player
- `POST /api/rooms/:code/teams/:id/score` - Adjust team score
- `POST /api/rooms/:code/timer/start|pause|resume|add` - Timer controls

## Code Patterns

- **Socket broadcasts**: Always emit socket events after database updates for real-time sync
- **Phase transitions**: Server handles `currentRoundNumber` increment when entering `ROUND_INTRO`
- **Session persistence**: Player sessionId stored in localStorage for reconnection
- **Team selection**: Players self-select teams in LOBBY/TEAM_SETUP phases

## Key Files

| File | Purpose |
|------|---------|
| `client/src/contexts/RoomContext.tsx` | All socket event handlers and room state |
| `server/src/routes/rooms.ts` | Room and phase management |
| `server/src/routes/players.ts` | Player join/update logic |
| `server/src/handlers/socket.ts` | Socket connection handling |
| `server/prisma/schema.prisma` | Database schema |
