# Wing Night

A **Hot Ones-inspired** multiplayer party game with real-time synchronization across three screens: Host (tablet), Player (phone), and Display (TV).

## Features

- **Three-Screen Architecture** - Host controls the game on a tablet, players join on phones, scoreboard displays on TV
- **Real-Time Multiplayer** - Instant synchronization via Socket.IO across all connected devices
- **Customizable Hot Sauce Lineup** - Configure your own sauce progression with Scoville ratings
- **AI-Generated Team Logos** - Optional DALL-E 3 integration for creating unique team mascots
- **QR Code Joining** - Players scan a code to instantly join the room
- **Timer Management** - Pause, resume, and add time with host controls
- **Auto-Reconnection** - Players automatically reconnect if they lose connection

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS v4, TypeScript |
| Backend | Express, Prisma, PostgreSQL, TypeScript |
| Real-time | Socket.IO |
| AI (optional) | OpenAI DALL-E 3 |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/BradleyExton/wing-night.git
cd wing-night

# Install dependencies
npm install
```

### Environment Setup

Create `server/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wingnight"

# Optional: Enable AI logo generation
OPENAI_API_KEY="sk-..."
```

### Database Setup

```bash
cd server
npx prisma migrate dev
```

### Run Development Server

```bash
# From root directory - starts both client and server
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3000

## Game Flow

```
DRAFT → LOBBY → TEAM_SETUP → GAME_INTRO → ROUND_INTRO → EATING_PHASE → GAME_PHASE → ROUND_RESULTS → GAME_END
                                               ↑________________________________↓ (repeats per round)
```

| Phase | Description |
|-------|-------------|
| **DRAFT** | Host configures event details and sauce lineup |
| **LOBBY** | Room is open, players join and select teams |
| **TEAM_SETUP** | Teams customize their names and logos |
| **GAME_INTRO** | Countdown before the game begins |
| **ROUND_INTRO** | Reveal the current round's hot sauce |
| **EATING_PHASE** | Timer runs while teams eat their wings |
| **GAME_PHASE** | Mini-game or trivia for bonus points |
| **ROUND_RESULTS** | Show standings after the round |
| **GAME_END** | Final scores and winner celebration |

## Project Structure

```
wing-night/
├── client/                    # React frontend
│   └── src/
│       ├── components/common/ # Reusable UI (Button, Card, Timer, etc.)
│       ├── contexts/          # RoomContext for shared state
│       ├── routes/            # Page components (Host, Play, Display, Edit)
│       ├── lib/               # API client, Socket.IO setup
│       └── types/             # TypeScript interfaces
│
├── server/                    # Express backend
│   └── src/
│       ├── routes/            # REST API endpoints
│       ├── handlers/          # Socket.IO event handlers
│       └── lib/               # Prisma client, OpenAI integration
│   └── prisma/                # Database schema & migrations
│
└── docs/
    └── SPEC.md                # Full product specification
```

## Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/` | Home | Create new room or join existing |
| `/host/:code` | Host | Game master controls |
| `/play/:code` | Player | Phone interface for players |
| `/display/:code` | Display | TV scoreboard view |
| `/edit/:editCode` | Editor | Configure room before opening |
| `/preview/:code` | Preview | Public room preview page |

## API Reference

### Rooms
- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:code` - Get room state
- `PUT /api/rooms/:code` - Update room settings
- `POST /api/rooms/:code/phase` - Advance game phase
- `POST /api/rooms/:code/open` - Open room for players

### Players
- `POST /api/rooms/:code/join` - Join a room
- `PUT /api/rooms/:code/players/:id` - Update player

### Teams
- `POST /api/rooms/:code/teams` - Create team
- `PUT /api/rooms/:code/teams/:id` - Update team
- `POST /api/rooms/:code/teams/:id/score` - Adjust score
- `POST /api/rooms/:code/teams/:id/logo` - Generate AI logo

### Timer
- `POST /api/rooms/:code/timer/start` - Start timer
- `POST /api/rooms/:code/timer/pause` - Pause timer
- `POST /api/rooms/:code/timer/resume` - Resume timer
- `POST /api/rooms/:code/timer/add` - Add time

## Deployment

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a PostgreSQL database
3. Connect your GitHub repository
4. Set environment variables:
   - `DATABASE_URL` - Auto-configured by Railway if using their PostgreSQL
   - `NODE_ENV=production`
   - `OPENAI_API_KEY` - Optional, for logo generation

The app will auto-deploy on push to main.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | `development` or `production` |
| `OPENAI_API_KEY` | No | Enables AI logo generation |
| `PORT` | No | Server port (default: 3000) |

## Development

### Available Scripts

```bash
# Run both client and server in development
npm run dev

# Run individually
npm run dev:client    # Vite dev server on :5173
npm run dev:server    # Express server on :3000

# Build for production
npm run build

# Database management
cd server
npx prisma studio     # Open database GUI
npx prisma migrate dev # Run migrations
```

## Socket Events

All events broadcast to the room code channel.

| Event | Payload | Description |
|-------|---------|-------------|
| `room-state` | `{ room }` | Full room state on join |
| `phase-changed` | `{ phase }` | Game phase transition |
| `player-joined` | `{ player, team? }` | New player joined |
| `player-updated` | `{ playerId, changes }` | Player state changed |
| `team-updated` | `{ teamId, changes }` | Team state changed |
| `timer-started` | `{ timerState }` | Timer began |
| `timer-paused` | - | Timer paused |
| `timer-resumed` | `{ timerState }` | Timer resumed |
| `scores-updated` | `{ teamScores }` | Batch score update |

## License

MIT
