# Wing Night - Complete Specification Document
## Version 1.0 - Foundation Build

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Game Phases & State Machine](#5-game-phases--state-machine)
6. [Room Management](#6-room-management)
7. [Player & Team Management](#7-player--team-management)
8. [Host Controls](#8-host-controls)
9. [Tablet Handoff System](#9-tablet-handoff-system)
10. [Timer System](#10-timer-system)
11. [Round Management](#11-round-management)
12. [Scoring System](#12-scoring-system)
13. [End Game Flow](#13-end-game-flow)
14. [Reconnection & Error Handling](#14-reconnection--error-handling)
15. [Game Module Architecture](#15-game-module-architecture)
16. [API Endpoints](#16-api-endpoints)
17. [Socket Events](#17-socket-events)
18. [UI Specifications](#18-ui-specifications)
19. [Development Tools](#19-development-tools)
20. [Build Order](#20-build-order)
21. [Future Games Reference](#21-future-games-reference)

---

# 1. Project Overview

## What is Wing Night?

Wing Night is a multiplayer party game inspired by Hot Ones where teams eat progressively spicier wings while competing in challenges. The game uses a three-screen architecture: TV (display), Host Tablet (control), and Player Phones (optional participation).

## Core Philosophy

- **Social First**: Most gameplay is verbal. Phones are optional, not required.
- **Host is Game Master**: The host controls the pace. Nothing auto-advances without host action.
- **Flexibility Over Rigidity**: Things go wrong at parties. Host has escape hatches for everything.
- **Minimal Friction**: One-tap actions for routine operations. Confirmations only for destructive actions.

## Key Features

- Pre-game setup (DRAFT phase) for prepared hosts
- Real-time synchronized gameplay across all devices
- Team customization with AI-generated logos
- Flexible player management (device or deviceless)
- Modular game system (games added incrementally)
- Comprehensive host controls
- Game history and statistics

## Domain

- **Production**: wingnight.game
- **Development**: localhost:5173 (client), localhost:3000 (server)

---

# 2. Tech Stack

## Client

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "socket.io-client": "^4.6.2",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "qrcode.react": "^3.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/leaflet": "^1.9.8",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

## Server

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.2",
    "cors": "^2.8.5",
    "@prisma/client": "^5.7.1",
    "openai": "^4.20.1",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "prisma": "^5.7.1"
  }
}
```

## Infrastructure

| Component | Technology | Notes |
|-----------|------------|-------|
| Database | SQLite (dev) → PostgreSQL (prod) | Prisma ORM |
| Hosting | Railway | ~$5-10/month |
| AI Images | OpenAI DALL-E 3 | $0.04 per logo |
| Real-time | Socket.io | WebSocket with fallback |

---

# 3. Architecture

## Three-Screen Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    THREE-SCREEN SETUP                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📺 TV DISPLAY                                              │
│  ─────────────────────────────────────────────────────────  │
│  • Read-only display for the room                           │
│  • Shows game state, timers, scores, photos                 │
│  • Everyone watches this screen                             │
│  • URL: /display/:roomCode                                  │
│                                                             │
│  📱 HOST TABLET                                             │
│  ─────────────────────────────────────────────────────────  │
│  • Game master control center                               │
│  • Advances phases, manages players, adjusts scores         │
│  • Sometimes passed to teams for game input                 │
│  • URL: /host/:roomCode                                     │
│                                                             │
│  📱 PLAYER PHONES (Optional)                                │
│  ─────────────────────────────────────────────────────────  │
│  • Optional participation device                            │
│  • Used for: voting, team setup, viewing personal stats     │
│  • NOT required for core gameplay                           │
│  • URL: /play/:roomCode                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐    │
│  │    TV    │         │  SERVER  │         │  HOST    │    │
│  │ Display  │◄───────►│          │◄───────►│  Tablet  │    │
│  └──────────┘         │          │         └──────────┘    │
│       ▲               │ Socket.io│               │         │
│       │               │    +     │               │         │
│       │               │ Express  │               │         │
│       │               │    +     │               ▼         │
│  ┌──────────┐         │  Prisma  │         ┌──────────┐    │
│  │  Player  │◄───────►│          │◄───────►│  Player  │    │
│  │  Phone   │         │          │         │  Phone   │    │
│  └──────────┘         └──────────┘         └──────────┘    │
│                            │                               │
│                            ▼                               │
│                       ┌──────────┐                         │
│                       │ Database │                         │
│                       │ (SQLite/ │                         │
│                       │ Postgres)│                         │
│                       └──────────┘                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
wing-night/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Shared components
│   │   │   ├── tv/               # TV display components
│   │   │   ├── host/             # Host tablet components
│   │   │   └── player/           # Player phone components
│   │   ├── games/                # Game modules (future)
│   │   │   ├── trivia/
│   │   │   ├── geoguessr/
│   │   │   └── ...
│   │   ├── hooks/                # React hooks
│   │   ├── contexts/             # React contexts
│   │   ├── routes/               # Route components
│   │   │   └── dev/              # Development routes
│   │   ├── lib/                  # Utilities
│   │   ├── types/                # TypeScript types
│   │   └── dev/                  # Dev tools
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── routes/               # Express routes
│   │   ├── handlers/             # Socket event handlers
│   │   ├── games/                # Game modules (future)
│   │   │   ├── trivia/
│   │   │   ├── geoguessr/
│   │   │   └── ...
│   │   ├── lib/                  # Utilities
│   │   │   ├── prisma.ts         # Prisma client
│   │   │   ├── socket.ts         # Socket.io setup
│   │   │   └── openai.ts         # OpenAI client
│   │   └── index.ts              # Entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── shared/
│   └── types/
│       ├── index.ts              # Shared types
│       └── game.ts               # Game module interface
│
└── docs/
    └── SPEC.md                   # This document
```

---

# 4. Database Schema

## Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}

// ============================================
// ROOM
// ============================================

model Room {
  id                    String    @id @default(cuid())
  code                  String    @unique  // Join code (FIRE, HEAT, etc.)
  editCode              String    @unique  // Host edit code (for draft access)
  
  // Event info
  name                  String?   // "Brad's Birthday Wing Night"
  eventDate             DateTime?
  eventLocation         String?
  
  // Status
  phase                 String    @default("DRAFT")
  
  // Team configuration
  teamSelectionMode     String    @default("SELF_SELECT") // SELF_SELECT | HOST_ASSIGN
  maxTeams              Int       @default(6)
  maxPlayersPerTeam     Int       @default(6)
  allowWalkIns          Boolean   @default(true)
  
  // Room state
  isLocked              Boolean   @default(false)
  lockedAt              DateTime?
  
  // Host connection
  hostSocketId          String?
  hostConnected         Boolean   @default(false)
  hostDisconnectedAt    DateTime?
  
  // Display connection
  displaySocketId       String?
  displayConnected      Boolean   @default(false)
  
  // Round tracking
  currentRoundNumber    Int       @default(0)
  totalRounds           Int       @default(8)
  
  // Timer state
  timerState            Json?
  
  // Pause state
  isPaused              Boolean   @default(false)
  pausedAt              DateTime?
  pausedReason          String?
  
  // Game state (for current game)
  gameState             Json?
  
  // Sound settings
  soundEnabled          Boolean   @default(true)
  
  // End game
  endedAt               DateTime?
  endedReason           String?
  winnerId              String?
  finalStats            Json?
  
  // Play again tracking
  previousGameId        String?
  gameNumber            Int       @default(1)
  
  // Relationships
  teams                 Team[]
  players               Player[]
  rounds                Round[]
  expectedGuests        ExpectedGuest[]
  gameHistory           GameHistory[]
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// ============================================
// TEAM
// ============================================

model Team {
  id                String    @id @default(cuid())
  roomId            String
  
  // Team identity
  name              String?   @default("Team")
  emoji             String?
  logoUrl           String?
  logoType          String?   // AI_GENERATED | UPLOADED
  logoPrompt        String?
  
  // AI logo tracking
  aiAttemptsUsed    Int       @default(0)
  maxAiAttempts     Int       @default(3)
  
  // Team size
  currentSize       Int       @default(0)
  maxSize           Int       @default(6)
  
  // Ready state
  isReady           Boolean   @default(false)
  
  // Score
  score             Int       @default(0)
  
  // Wing tracking
  totalWingsCompleted Int     @default(0)
  totalWingsAttempted Int     @default(0)
  
  // Creation tracking
  createdBy         String    @default("HOST") // HOST | PLAYER
  createdById       String?
  
  // Relationships
  room              Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  players           Player[]
  expectedGuests    ExpectedGuest[]
  roundResults      RoundResult[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// ============================================
// PLAYER
// ============================================

model Player {
  id                  String    @id @default(cuid())
  roomId              String
  teamId              String?
  
  // Player identity
  name                String
  photoUrl            String?
  
  // Connection state
  socketId            String?
  sessionId           String?   @unique
  isConnected         Boolean   @default(false)
  hasDevice           Boolean   @default(true)
  lastSeenAt          DateTime?
  disconnectedAt      DateTime?
  
  // Ready state (for team setup)
  isReady             Boolean   @default(false)
  
  // Join tracking
  joinedAt            DateTime  @default(now())
  joinedVia           String    @default("PHONE") // PHONE | HOST_ADDED | EXPECTED_GUEST
  
  // Wing tracking
  wingsCompleted      Int       @default(0)
  wingsAttempted      Int       @default(0)
  
  // Link to expected guest
  expectedGuestId     String?   @unique
  
  // Team change request (for host-assign mode)
  teamChangeRequested Boolean   @default(false)
  requestedTeamId     String?
  
  // Relationships
  room                Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  team                Team?     @relation(fields: [teamId], references: [id])
  expectedGuest       ExpectedGuest? @relation(fields: [expectedGuestId], references: [id])
  wingResults         WingResult[]
  votes               Vote[]
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

// ============================================
// EXPECTED GUEST
// ============================================

model ExpectedGuest {
  id              String    @id @default(cuid())
  roomId          String
  teamId          String?
  
  // Guest info
  name            String
  photoUrl        String?
  
  // Claim status
  claimedById     String?
  claimedAt       DateTime?
  
  // Relationships
  room            Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  team            Team?     @relation(fields: [teamId], references: [id])
  claimedBy       Player?
  
  createdAt       DateTime  @default(now())
}

// ============================================
// ROUND
// ============================================

model Round {
  id                String    @id @default(cuid())
  roomId            String
  roundNumber       Int
  
  // Hot sauce info
  sauceName         String?
  sauceScovilles    Int?
  sauceNotes        String?
  
  // Game configuration
  gameType          String?   // trivia, geoguessr, drawing, etc. or null for manual
  gameSelectionMode String    @default("PRE_SET") // PRE_SET | HOST_CHOICE | RANDOM
  gameConfig        Json?
  
  // Phase tracking
  phase             String    @default("PENDING")
  startedAt         DateTime?
  completedAt       DateTime?
  
  // Relationships
  room              Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  roundResults      RoundResult[]
  wingResults       WingResult[]
  
  // Game-specific content (future)
  triviaQuestions   TriviaQuestion[]
  customLocations   CustomLocation[]
  drawingWords      DrawingWord[]
  
  createdAt         DateTime  @default(now())
  
  @@unique([roomId, roundNumber])
}

// ============================================
// ROUND RESULT
// ============================================

model RoundResult {
  id              String    @id @default(cuid())
  roundId         String
  teamId          String
  
  // Scores
  wingPoints      Int       @default(0)
  gamePoints      Int       @default(0)
  bonusPoints     Int       @default(0)
  totalPoints     Int       @default(0)
  
  // Placement
  placement       Int?      // 1st, 2nd, 3rd for this round
  
  // Relationships
  round           Round     @relation(fields: [roundId], references: [id], onDelete: Cascade)
  team            Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  
  @@unique([roundId, teamId])
}

// ============================================
// WING RESULT
// ============================================

model WingResult {
  id              String    @id @default(cuid())
  roundId         String
  playerId        String
  
  // Result
  completed       Boolean   @default(false)
  markedBy        String    @default("HOST") // HOST | SELF
  
  // Timing
  completedAt     DateTime?
  
  // Relationships
  round           Round     @relation(fields: [roundId], references: [id], onDelete: Cascade)
  player          Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  
  @@unique([roundId, playerId])
}

// ============================================
// VOTE
// ============================================

model Vote {
  id              String    @id @default(cuid())
  roomId          String
  roundNumber     Int
  gameType        String
  
  // Who voted
  playerId        String
  playerName      String
  teamId          String
  
  // Vote details
  votedFor        String    // Team ID or submission ID
  votedVia        String    // PHONE | HOST_PROXY
  
  // Relationships
  player          Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  
  @@unique([roomId, roundNumber, playerId])
}

// ============================================
// GAME HISTORY
// ============================================

model GameHistory {
  id              String    @id @default(cuid())
  roomId          String
  gameNumber      Int
  
  // Snapshot of final state
  winnerId        String
  winnerName      String
  winnerScore     Int
  
  // All team scores
  finalScores     Json      // [{ teamId, teamName, score, place }]
  
  // Stats
  stats           Json
  
  // Timestamps
  startedAt       DateTime
  endedAt         DateTime
  durationMinutes Int
  
  // Relationships
  room            Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
}

// ============================================
// GAME CONTENT (For Future Games)
// ============================================

model TriviaQuestion {
  id              String    @id @default(cuid())
  roomId          String
  roundId         String?
  
  question        String
  correctAnswer   String
  wrongAnswers    String    // JSON array
  category        String?
  difficulty      String?
  isCustom        Boolean   @default(false)
  
  used            Boolean   @default(false)
  usedInRound     Int?
  
  round           Round?    @relation(fields: [roundId], references: [id])
  
  createdAt       DateTime  @default(now())
}

model CustomLocation {
  id              String    @id @default(cuid())
  roomId          String
  roundId         String?
  
  name            String
  imageUrl        String
  latitude        Float
  longitude       Float
  hint            String?
  difficulty      String    @default("medium")
  
  used            Boolean   @default(false)
  usedInRound     Int?
  
  round           Round?    @relation(fields: [roundId], references: [id])
  
  createdAt       DateTime  @default(now())
}

model DrawingWord {
  id              String    @id @default(cuid())
  roomId          String
  roundId         String?
  
  word            String
  category        String?
  difficulty      String    @default("medium")
  isCustom        Boolean   @default(false)
  
  used            Boolean   @default(false)
  usedInRound     Int?
  
  round           Round?    @relation(fields: [roundId], references: [id])
  
  createdAt       DateTime  @default(now())
}
```

---

# 5. Game Phases & State Machine

## Phase Definitions

```typescript
type GamePhase = 
  | 'DRAFT'           // Host configuring (room not joinable)
  | 'LOBBY'           // Players joining, team formation
  | 'TEAM_SETUP'      // Teams customizing name/logo
  | 'GAME_INTRO'      // "Get Ready!" screen
  | 'ROUND_INTRO'     // "Round X" announcement
  | 'EATING_PHASE'    // Everyone eats wings
  | 'GAME_SELECTION'  // Host picks game (if not pre-set)
  | 'GAME_PHASE'      // Active gameplay
  | 'ROUND_RESULTS'   // Show round scores
  | 'GAME_END';       // Final results, winner
```

## State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME STATE MACHINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DRAFT ──────────────────────────────────────────────────►  │
│    │  (Host configuring, room not joinable)                 │
│    │                                                        │
│    │ Host clicks "Open Room"                                │
│    ▼                                                        │
│  LOBBY ──────────────────────────────────────────────────►  │
│    │  (Players joining, picking teams)                      │
│    │                                                        │
│    │ Host clicks "Start Team Setup"                         │
│    │ (Requires: all players on teams, min 3 teams)          │
│    ▼                                                        │
│  TEAM_SETUP ─────────────────────────────────────────────►  │
│    │  (Teams customize name/logo, mark ready)               │
│    │                                                        │
│    │ Host clicks "Start Game"                               │
│    │ (Requires: all teams ready, or host skips)             │
│    ▼                                                        │
│  GAME_INTRO ─────────────────────────────────────────────►  │
│    │  (5 second "Get Ready!" screen)                        │
│    │                                                        │
│    │ Host advances                                          │
│    ▼                                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ROUND LOOP (repeats for each round)                │    │
│  │                                                     │    │
│  │  ROUND_INTRO ────────────────────────────────────►  │    │
│  │    │  ("Round X - Sauce Name")                      │    │
│  │    │                                                │    │
│  │    │ Host clicks "Start Eating"                     │    │
│  │    ▼                                                │    │
│  │  EATING_PHASE ───────────────────────────────────►  │    │
│  │    │  (Timer, wing tracking)                        │    │
│  │    │                                                │    │
│  │    │ Host clicks "End Eating" (timer doesn't auto)  │    │
│  │    ▼                                                │    │
│  │  GAME_SELECTION (if gameType is HOST_CHOICE) ────►  │    │
│  │    │  (Host picks game)                             │    │
│  │    │                                                │    │
│  │    │ Host selects game                              │    │
│  │    ▼                                                │    │
│  │  GAME_PHASE ─────────────────────────────────────►  │    │
│  │    │  (Game-specific phases, or manual scoring)     │    │
│  │    │                                                │    │
│  │    │ Game completes or host ends                    │    │
│  │    ▼                                                │    │
│  │  ROUND_RESULTS ──────────────────────────────────►  │    │
│  │    │  (Show scores, updated standings)              │    │
│  │    │                                                │    │
│  │    │ Host clicks "Next Round"                       │    │
│  │    ▼                                                │    │
│  │  [Back to ROUND_INTRO for next round]               │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                         │                                   │
│                         │ After final round                 │
│                         ▼                                   │
│  GAME_END ──────────────────────────────────────────────►   │
│    │  (Winner reveal, final stats)                          │
│    │                                                        │
│    │ Host chooses: Play Again / Remix / New Game / End      │
│    ▼                                                        │
│  LOBBY (reset) OR Session closed                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Phase Transitions

| From | To | Trigger | Requirements |
|------|-----|---------|--------------|
| DRAFT | LOBBY | Host clicks "Open Room" | Basic settings configured |
| LOBBY | TEAM_SETUP | Host clicks "Start Team Setup" | All players on teams, min 3 teams |
| TEAM_SETUP | GAME_INTRO | Host clicks "Start Game" | All teams ready (or skipped) |
| GAME_INTRO | ROUND_INTRO | Host advances | None |
| ROUND_INTRO | EATING_PHASE | Host clicks "Start Eating" | None |
| EATING_PHASE | GAME_SELECTION | Host clicks "End Eating" | gameSelectionMode = HOST_CHOICE |
| EATING_PHASE | GAME_PHASE | Host clicks "End Eating" | Game pre-configured |
| GAME_SELECTION | GAME_PHASE | Host selects game | None |
| GAME_PHASE | ROUND_RESULTS | Game completes or host ends | None |
| ROUND_RESULTS | ROUND_INTRO | Host clicks "Next Round" | More rounds remaining |
| ROUND_RESULTS | GAME_END | Host clicks "Next Round" | Final round completed |
| GAME_END | LOBBY | Host clicks "Play Again" options | None |

---

# 6. Room Management

## DRAFT Phase

The DRAFT phase allows hosts to configure the entire game before anyone joins.

### Room Creation

```typescript
// POST /api/rooms/create
interface CreateRoomRequest {
  hostName?: string;
}

interface CreateRoomResponse {
  room: {
    code: string;      // e.g., "FIRE" - for joining
    editCode: string;  // e.g., "XYZABC123" - for editing
  };
  urls: {
    edit: string;      // /edit/XYZABC123
    preview: string;   // /preview/FIRE
    host: string;      // /host/FIRE (only works in LOBBY+)
    join: string;      // /play/FIRE
    display: string;   // /display/FIRE
  };
}
```

### Room Codes

Generate memorable, thematic 4-letter codes:

```typescript
const thematicCodes = [
  'FIRE', 'HEAT', 'BURN', 'SPCY', 'WING', 'BLAZ', 'SCOV', 
  'PIKA', 'ZEST', 'KICK', 'MILD', 'BOMB', 'VOLT', 'FURY'
];

function generateRoomCode(): string {
  // Try thematic codes first
  for (const code of shuffleArray(thematicCodes)) {
    const exists = await prisma.room.findUnique({ where: { code } });
    if (!exists) return code;
  }
  // Fall back to random 4-letter code
  return generateRandomCode(4);
}
```

### DRAFT Configuration

Host can configure:

1. **Basic Info**
   - Event name
   - Event date/time
   - Number of rounds (5-12)
   - Number of teams (3-6)
   - Team selection mode (self-select / host-assign)

2. **Guest List**
   - Add expected guests with names
   - Upload photos for guests
   - Pre-assign guests to teams (optional)
   - Allow/disallow walk-ins

3. **Hot Sauce Lineup**
   - Sauce name per round
   - Scoville rating (optional)
   - Notes (optional)
   - Use templates or customize

4. **Game Schedule**
   - Select game per round
   - Or set to "Host's Choice" (pick during game)
   - Or set to "Random"
   - Configure game-specific settings

## Preview Page

Public shareable page showing game details before it starts.

### URL Structure

```
/preview/:roomCode  - Public preview (read-only)
/edit/:editCode     - Host configuration
/play/:roomCode     - Player join (LOBBY+ only)
/host/:roomCode     - Host controls (LOBBY+ only)
/display/:roomCode  - TV display (LOBBY+ only)
```

### Preview Page Content

- Event name and date/time
- Countdown timer to event
- Team roster (who's confirmed)
- Hot sauce lineup with heat indicators
- Room code and join link
- QR code for easy joining

### Preview API

```typescript
// GET /api/rooms/:code/preview
interface PreviewResponse {
  room: {
    code: string;
    name: string;
    phase: string;
    eventDate: string | null;
    totalRounds: number;
  };
  teams: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    maxSize: number;
    members: Array<{
      name: string;
      claimed: boolean;
      photoUrl: string | null;
    }>;
  }>;
  sauceLineup: Array<{
    round: number;
    name: string;
    scoville: number | null;
  }>;
  stats: {
    totalGuests: number;
    claimedSpots: number;
    openSpots: number;
  };
}
```

## Room Lock

Host can lock the room to prevent new joins.

```typescript
// PUT /api/rooms/:code/lock
interface LockRoomRequest {
  locked: boolean;
}
```

When locked:
- New players cannot join
- Existing players can still reconnect
- Host can unlock anytime

---

# 7. Player & Team Management

## Player Types

| Type | Description | Can Vote | Needs Phone |
|------|-------------|----------|-------------|
| Device Player | Joined via phone | Yes | Yes |
| Deviceless Player | Added by host | Via Host Proxy | No |
| Expected Guest (unclaimed) | On guest list, not joined | No | - |
| Walk-in | Joined but not on guest list | Yes | Yes |

## Player Join Flow

### Step 1: Enter Room Code
Player visits /play/:roomCode or scans QR code.

### Step 2: Identify Self
If guest list exists:
- Show list of expected guests
- Player picks their name
- Or "I'm not on the list" for walk-ins

If no guest list:
- Player enters their name

### Step 3: Team Selection

**Self-Select Mode:**
- Player sees available teams
- Player can join existing team or create new team
- Player can switch teams until game starts

**Host-Assign Mode:**
- Player sees their assigned team
- Player can request team change (host approves)

### Step 4: Lobby Waiting
Player sees:
- Their team name and teammates
- Option to add photo
- "Waiting for host to start..."

## Team Management

### Team Creation

Both hosts AND players can create teams (in self-select mode).

```typescript
// POST /api/rooms/:code/teams
interface CreateTeamRequest {
  name?: string;          // Optional, defaults to "Team X"
  createdBy: 'HOST' | 'PLAYER';
  createdById?: string;   // Player ID if created by player
}
```

### Team Limits

| Setting | Default | Range |
|---------|---------|-------|
| Max teams per room | 6 | 3-6 |
| Max players per team | 6 | 2-8 |
| Min teams to start | 3 | 3 |
| Min players per team | 1 | 1 |

### Team Customization (TEAM_SETUP Phase)

Teams can customize:

1. **Team Name**
   - Any team member can edit
   - Real-time sync to all members
   - Max 30 characters

2. **Team Logo**
   - Option A: AI Generate (DALL-E 3)
     - Enter prompt
     - 3 attempts max
     - ~15 seconds generation time
     - MUST download immediately (URLs expire!)
   - Option B: Upload Photo
     - Max 5MB, JPG/PNG
     - Auto-crop to square (512x512)

3. **Mark Ready**
   - Individual player ready status
   - Team ready when all players ready
   - Host can override and mark team ready

### Photo Storage

```typescript
// AI-generated logos
/server/public/logos/team-{teamId}-{timestamp}.png

// Uploaded team photos
/server/public/logos/team-{teamId}-uploaded-{timestamp}.jpg

// Player photos
/server/public/photos/player-{playerId}-{timestamp}.jpg
```

Image processing:
```typescript
await sharp(file.path)
  .resize(512, 512, { 
    fit: 'cover',
    position: 'attention'  // Smart crop for faces
  })
  .jpeg({ quality: 85 })
  .toFile(outputPath);
```

## Adding Players Mid-Game

Host can add players after game starts:
- Add to any existing team
- Player starts with 0 points
- Team score unchanged
- Can participate immediately

Late join request flow:
1. Player visits join link
2. Sees "Game in progress"
3. Enters name, clicks "Request to Join"
4. Host gets notification
5. Host approves and assigns to team
6. Player is in

---

# 8. Host Controls

## Control Philosophy

1. **Host is Game Master** - Nothing advances without host action
2. **Flexibility Over Rigidity** - Escape hatches for everything
3. **Minimal Friction** - One-tap for routine actions
4. **Confirmation for Destructive Actions** - Kick, skip, end early

## Controls by Phase

### DRAFT Phase
- All configuration options
- Save draft
- Preview page
- Open room (→ LOBBY)
- Delete draft

### LOBBY Phase
| Control | Action |
|---------|--------|
| Add deviceless player | Create player without phone |
| Kick player | Remove with confirmation |
| Move player to team | Drag-drop or menu |
| Upload player photo | For any player |
| Create team | Up to max teams |
| Delete empty team | Only if no players |
| Rename team | Anytime |
| Lock/unlock room | Toggle |
| Change team mode | Self-select ↔ Host-assign |
| Edit game settings | Rounds, sauces, games |
| Show QR on TV | For easy joining |
| Start Team Setup | Requires all players on teams |

### TEAM_SETUP Phase
| Control | Action |
|---------|--------|
| View team progress | Name/logo/ready status |
| Override team name | Set name for team |
| Override team logo | Upload for team |
| Mark team ready | Force ready |
| Back to Lobby | Return to add players |
| Skip setup | Use defaults |
| Start Game | Requires all ready (or override) |

### ROUND_INTRO Phase
| Control | Action |
|---------|--------|
| Start Eating | Begin eating phase |
| Skip Eating | Jump to game |
| Change Game | Last chance to switch |

### EATING_PHASE
| Control | Action |
|---------|--------|
| Pause timer | Freeze countdown, show PAUSED |
| Resume timer | Continue |
| Add 30 seconds | Extend time |
| End timer now | Stop immediately |
| Mark player wing complete | Toggle per player |
| Mark all (team) | Quick action |
| End eating & start game | Progress to game |

### GAME_PHASE
| Control | Action |
|---------|--------|
| Pause game | Freeze, show menu |
| Resume | Continue |
| Restart game | Start game over |
| Skip to results | End game, score as-is |
| Skip entire round | No points, next round |
| End game early | Go to final results |
| Game-specific controls | Per game |

### ROUND_RESULTS Phase
| Control | Action |
|---------|--------|
| Show scoreboard | Display scores on TV |
| Show standings | Display rankings |
| Adjust score (+/-/custom) | Manual correction |
| Replay round | Redo entire round |
| Next round | Advance |
| End game now | Skip to final |

### GAME_END Phase
| Control | Action |
|---------|--------|
| Show winner | Celebration screen |
| Show standings | Final rankings |
| Show stats | Fun statistics |
| Photo moment | Freeze for photos |
| Play again | Same teams, reset scores |
| Remix teams | Shuffle players |
| New game | Back to lobby |
| End session | Close room |

## Emergency Controls (Always Available)

Via hamburger menu, accessible from any phase:
- Open TV display
- Share join link
- View room code
- Manage players
- Add deviceless player
- Pause game
- Sound mute toggle
- Restart current round
- Skip to next round
- End game early
- Close room (with confirmation)

---

# 9. Tablet Handoff System

## Two Tablet Modes

### HOST_CONTROL Mode (Default)
- Full game master controls
- Manage players, advance phases, adjust scores
- Host holds the tablet

### PLAYER_GAME Mode
- Temporary during specific games
- Limited to game interaction only
- No access to host controls
- Team holds the tablet
- Shows "Host Override" button in corner

## Handoff Flow

### 1. Host Initiates Handoff
```
Screen: "Hand tablet to [Team Name]"
Button: "Tap when team has the tablet"
Sound: Chime plays
Timer: PAUSED
```

### 2. Team Ready Screen
```
Screen: "[Team Name] - Your Turn!"
        "Tap START when ready"
Button: "START [GAME]"
Timer: STILL PAUSED
Host Override: Visible in corner
```

### 3. Team Plays
```
Screen: Game interface (map, canvas, etc.)
Timer: RUNNING (started when team tapped START)
Host Override: Always visible in corner
```

### 4. Turn Complete
```
Screen: "Return tablet to host"
        "Continuing in 3... 2... 1..."
Auto-advance: 3 seconds
Or: Tap anywhere to continue immediately
Sound: Success chime
```

### 5. Back to Host
- Next team's turn, OR
- Reveal results, OR
- Host control for next action

## Tablet State Machine

```typescript
type TabletMode = 
  | 'HOST_CONTROL'      // Host has full control
  | 'HANDOFF_TO_TEAM'   // "Hand to team" screen
  | 'TEAM_READY'        // "Tap START when ready"
  | 'PLAYER_GAME'       // Team is playing
  | 'RETURN_TO_HOST';   // "Return tablet" screen

const transitions = {
  'HOST_CONTROL': {
    'start_team_turn': 'HANDOFF_TO_TEAM'
  },
  'HANDOFF_TO_TEAM': {
    'team_received': 'TEAM_READY'
  },
  'TEAM_READY': {
    'team_starts': 'PLAYER_GAME',
    'host_override': 'HOST_CONTROL'
  },
  'PLAYER_GAME': {
    'turn_complete': 'RETURN_TO_HOST',
    'time_expired': 'RETURN_TO_HOST',
    'host_override': 'HOST_CONTROL'
  },
  'RETURN_TO_HOST': {
    'timeout_3s': 'HOST_CONTROL',
    'tap_continue': 'HOST_CONTROL'
  }
};
```

## Host Override

Always visible during player modes:
```
┌─────────────────────────────────────────┐
│  [Game Interface]                       │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  🔒 Player mode         [👑 HOST OVERRIDE]
└─────────────────────────────────────────┘
```

Tapping shows confirmation:
```
Return control to host?
This will end [Team]'s turn early.
[CANCEL]  [RETURN TO HOST]
```

## Games Using Tablet Handoff

| Game | Tablet Used For | Passed Between |
|------|-----------------|----------------|
| Geoguessr | Interactive map | Teams (sequential) |
| Drawing | Canvas | Individual drawers |
| Trivia | No handoff | Host keeps |
| AI Mad-Libs | No handoff | Host keeps |

---

# 10. Timer System

## Timer Requirements

1. **Synchronized** - All screens show same time
2. **Server is Truth** - Clients calculate from server state
3. **Pause/Resume** - Works correctly, preserves remaining
4. **Host Controls** - Pause, resume, add time, end early
5. **Manual Advance** - Timer expiry waits for host to proceed
6. **Sound Effects** - Warning, countdown, expiry (mutable)

## Timer State

```typescript
interface TimerState {
  isRunning: boolean;
  duration: number;           // Total duration in seconds
  startedAt: Date | null;     // Server time when started
  
  isPaused: boolean;
  pausedAt: Date | null;
  remainingWhenPaused: number | null;
  
  type: TimerType;
  teamId?: string;            // If for specific team
}

type TimerType = 
  | 'EATING_PHASE'
  | 'STUDY_PHASE'
  | 'TEAM_TURN'
  | 'DRAWING_TURN'
  | 'SUBMISSION'
  | 'VOTING';
```

## Timer Operations

### Start
```typescript
async function startTimer(roomId: string, type: TimerType, duration: number) {
  const timerState: TimerState = {
    isRunning: true,
    duration,
    startedAt: new Date(),
    isPaused: false,
    pausedAt: null,
    remainingWhenPaused: null,
    type
  };
  
  await updateRoom(roomId, { timerState });
  broadcast(roomCode, 'timer-started', { timerState, serverTime: Date.now() });
}
```

### Pause
```typescript
async function pauseTimer(roomId: string) {
  const remaining = calculateRemaining(room.timerState);
  
  const updated = {
    ...room.timerState,
    isPaused: true,
    pausedAt: new Date(),
    remainingWhenPaused: remaining
  };
  
  await updateRoom(roomId, { timerState: updated });
  broadcast(roomCode, 'timer-paused', { remaining });
}
```

### Resume
```typescript
async function resumeTimer(roomId: string) {
  const updated = {
    ...room.timerState,
    isRunning: true,
    isPaused: false,
    startedAt: new Date(),
    duration: room.timerState.remainingWhenPaused,
    pausedAt: null,
    remainingWhenPaused: null
  };
  
  await updateRoom(roomId, { timerState: updated });
  broadcast(roomCode, 'timer-resumed', { timerState: updated, serverTime: Date.now() });
}
```

### Add Time
```typescript
async function addTime(roomId: string, secondsToAdd: number) {
  const currentRemaining = calculateRemaining(room.timerState);
  const newDuration = currentRemaining + secondsToAdd;
  
  const updated = {
    ...room.timerState,
    startedAt: new Date(),
    duration: newDuration
  };
  
  await updateRoom(roomId, { timerState: updated });
  broadcast(roomCode, 'timer-updated', { timerState: updated, serverTime: Date.now() });
}
```

## Client Timer Display

```typescript
function useTimer(serverTimer: TimerState | null, serverTime: number) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [status, setStatus] = useState<'running' | 'paused' | 'expired' | 'idle'>('idle');
  
  useEffect(() => {
    if (!serverTimer || !serverTimer.isRunning) {
      setStatus('idle');
      return;
    }
    
    if (serverTimer.isPaused) {
      setStatus('paused');
      setRemaining(serverTimer.remainingWhenPaused);
      return;
    }
    
    // Calculate with latency adjustment
    const latency = Date.now() - serverTime;
    const elapsed = (serverTime - serverTimer.startedAt) / 1000 + (latency / 1000);
    const initial = Math.max(0, serverTimer.duration - elapsed);
    
    setRemaining(Math.floor(initial));
    setStatus('running');
    
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 0) {
          setStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [serverTimer, serverTime]);
  
  return { remaining, status };
}
```

## Timer Visual States

| State | Display | Styling |
|-------|---------|---------|
| Running | 0:45 | White |
| Warning (≤10s) | 0:08 | Yellow, pulsing |
| Critical (≤5s) | 0:03 | Red, fast pulse |
| Paused | ⏸️ 0:30 | Gray |
| Expired | TIME'S UP! | Red, shake animation |

## Sound Effects

| Event | Sound | Condition |
|-------|-------|-----------|
| 10 seconds | Warning beep | If not muted |
| 5-1 seconds | Tick each second | If not muted |
| Expired | Buzzer | If not muted |
| Pause | Pause sound | If not muted |
| Resume | Resume sound | If not muted |

Host can toggle all sounds via settings.

---

# 11. Round Management

## Round Structure

Each round consists of:
1. **Round Intro** - Announce round number and hot sauce
2. **Eating Phase** - Timer, everyone eats
3. **Game Phase** - Play a game (or manual scoring)
4. **Round Results** - Show scores for the round

## Round Configuration

```typescript
interface RoundConfig {
  roundNumber: number;
  
  // Hot sauce
  sauceName: string;
  sauceScovilles?: number;
  sauceNotes?: string;
  
  // Game
  gameType: string | null;        // null = manual scoring
  gameSelectionMode: 'PRE_SET' | 'HOST_CHOICE' | 'RANDOM';
  gameConfig?: GameConfig;
}
```

## Hot Sauce Lineup

Default template (8 rounds):
| Round | Sauce | Scoville |
|-------|-------|----------|
| 1 | Frank's RedHot | 450 |
| 2 | Cholula | 1,000 |
| 3 | Tabasco | 2,500 |
| 4 | Sriracha | 2,200 |
| 5 | Crystal | 4,000 |
| 6 | El Yucateco | 8,910 |
| 7 | Dave's Insanity | 180,000 |
| 8 | The Last Dab | 2,000,000 |

Host can customize or use templates.

## Wing Tracking

During EATING_PHASE, host marks who completed:

```typescript
// Toggle wing completion
POST /api/rooms/:code/rounds/:round/wings
{
  playerId: string;
  completed: boolean;
}

// Mark all for team
POST /api/rooms/:code/rounds/:round/wings/team/:teamId
{
  completed: boolean;
}
```

Wing completion affects:
- Team score (points per completed wing)
- Tie-breaker (most wings wins ties)
- Game stats (displayed at end)

## Game Selection

### Pre-Set Mode
Game configured during DRAFT. Skips selection screen.

### Host's Choice Mode
After eating, host sees game picker:
- List of available games
- Estimated duration
- Quick config options
- "Random" option

### Random Mode
System randomly picks from available games.

## Manual Scoring Mode

When no game is configured (or games not built yet):

```
┌─────────────────────────────────────────────────────────────┐
│  GAME PHASE - MANUAL SCORING                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Run your own game, then award points:                      │
│                                                             │
│  🔥 Spice Lords      [+100] [+50] [CUSTOM]    +150 pts     │
│  🌶️ Fire Breathers  [+100] [+50] [CUSTOM]    +100 pts     │
│  💥 Hot Shots        [+100] [+50] [CUSTOM]    +50 pts      │
│                                                             │
│  [CLEAR ALL]                      [END GAME PHASE]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# 12. Scoring System

## Point Sources

| Source | Points | Notes |
|--------|--------|-------|
| Wing completion | 50 per player | Per round |
| Game performance | Varies | Game-specific |
| Manual adjustment | Any | Host can adjust |

## Team Score Calculation

```typescript
interface TeamRoundScore {
  wingPoints: number;      // 50 × players who finished
  gamePoints: number;      // From game performance
  bonusPoints: number;     // Special achievements
  totalPoints: number;     // Sum of above
}

// Team's total score = sum of all round totals
```

## Round Multipliers (Future Enhancement)

Later rounds worth more to enable comebacks:

| Rounds | Multiplier |
|--------|------------|
| 1-2 | 1.0× |
| 3-4 | 1.2× |
| 5-6 | 1.4× |
| 7-8 | 1.6× |
| 9+ | 1.8× |

## Score Adjustments

Host can adjust scores anytime:
- Quick buttons: +50, -50
- Custom entry: Any amount
- Changes are visible to all ("Host adjusted +50 pts")

## Tie Breaker Rules

1. **Primary**: Team with more completed wings
2. **Secondary**: Team who won more rounds
3. **Still Tied**: Co-champions (celebrate both!)

---

# 13. End Game Flow

## End Game Triggers

| Trigger | Behavior |
|---------|----------|
| Final round completes | Auto-advance to GAME_END |
| Host ends early | Confirmation required, current scores final |

## GAME_END Sequence

### 1. Winner Reveal
- Dramatic countdown (3... 2... 1...)
- Winner announcement with celebration
- Confetti animation
- Team logo and members displayed

### 2. Final Standings
- All teams ranked 1st, 2nd, 3rd, etc.
- Final scores displayed
- Point breakdown available

### 3. Game Stats
Fun statistics from the game:
- Total wings consumed
- Most wings: [Player]
- Hottest moment survived
- Closest round
- Biggest comeback
- Perfect scores

### 4. Photo Moment
Host can freeze TV display for group photos.

### 5. What's Next Options

| Option | Behavior |
|--------|----------|
| **Play Again** | Keep teams, reset scores, restart rounds |
| **Remix Teams** | Shuffle players, reset scores |
| **New Game** | Back to lobby, reform teams |
| **End Session** | Close room, thank you screen |

## Game History

Save completed games for future reference:

```typescript
interface GameHistory {
  id: string;
  roomId: string;
  gameNumber: number;        // 1st, 2nd game tonight
  
  winnerId: string;
  winnerName: string;
  winnerScore: number;
  
  finalScores: Array<{
    teamId: string;
    teamName: string;
    score: number;
    place: number;
  }>;
  
  stats: GameStats;
  
  startedAt: Date;
  endedAt: Date;
  durationMinutes: number;
}
```

---

# 14. Reconnection & Error Handling

## Disconnection Types

| Type | Severity | Behavior |
|------|----------|----------|
| Player phone | Low | Game continues, host notified |
| Host tablet | High | Game auto-pauses |
| TV display | Medium | Game continues, host notified |
| Server restart | High | State restored from DB |

## Player Disconnection

Phone disconnects are non-issues since phones are optional.

**On disconnect:**
- Mark player as disconnected in DB
- Update connection status indicator
- Game continues normally

**On reconnect:**
- Session ID allows seamless rejoin
- Full state synced to player
- No action needed from host

## Host Disconnection

**On disconnect:**
- Game auto-pauses (if in progress)
- All screens show "Host disconnected"
- Waiting for host to reconnect

**On reconnect:**
- Host sees "Welcome back" with game status
- Can resume from where left off
- No data lost

## Host Takeover

If host can't return, new person takes the tablet:
- Opening /host/:roomCode makes you the host
- Previous host socket disconnected
- New host has full control

## Session Management

```typescript
// On first join
const sessionId = generateSecureId();
localStorage.setItem('wingnight-session', sessionId);

// On reconnect
socket.emit('rejoin-room', { sessionId, roomCode });

// Server validates and restores
socket.on('rejoin-room', async ({ sessionId, roomCode }) => {
  const player = await findPlayerBySession(sessionId, roomCode);
  if (player) {
    // Reconnect, sync full state
  } else {
    // New player, go through join flow
  }
});
```

## Connection Status Indicators

| Status | Icon | Threshold |
|--------|------|-----------|
| Connected | 🟢 | Active |
| Reconnecting | 🟡 | < 30 seconds |
| Disconnected | 🔴 | > 30 seconds |

## Error Handling

**Network errors:**
- Retry dialog with options
- "Try Again" or "Cancel"
- Specific error messages

**State errors:**
- Invalid phase transition → notify host
- Missing data → graceful fallback
- Server restart → auto-pause, restore

---

# 15. Game Module Architecture

## Overview

Games are plug-in modules with a standard interface. This allows:
- Building games independently
- Testing games in isolation
- Adding games without touching core code
- Parallel development by AI agents

## Game Module Interface

```typescript
// shared/types/game.ts

interface GameDefinition {
  id: string;                    // 'trivia', 'geoguessr'
  name: string;                  // 'Trivia'
  description: string;           // 'Teams answer questions'
  icon: string;                  // '🧠'
  
  requiresTablet: boolean;
  requiresPhones: boolean;
  minPlayers: number;
  
  estimatedDuration: (config: GameConfig, teamCount: number) => number;
  
  defaultConfig: GameConfig;
  configSchema: ConfigSchema;
  
  phases: GamePhase[];
}

interface GameConfig {
  timeLimit?: number;
  rounds?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  [key: string]: any;
}

interface GamePhase {
  id: string;
  name: string;
  duration?: number;
  
  tabletMode: 'HOST_CONTROL' | 'PLAYER_GAME';
  
  canSkip: boolean;
  autoAdvance?: number;
}

interface GameState {
  currentPhase: string;
  phaseData: any;
  scores: Record<string, number>;
}

interface GameModule {
  definition: GameDefinition;
  
  handlers: {
    startGame: (room: Room, config: GameConfig) => Promise<GameState>;
    handleAction: (room: Room, state: GameState, action: GameAction) => Promise<GameState>;
    calculateScores: (room: Room, state: GameState) => Record<string, number>;
  };
  
  components: {
    ConfigPanel: ComponentType;
    TVDisplay: ComponentType;
    HostTablet: ComponentType;
    PlayerPhone: ComponentType;
  };
}
```

## Game Registry

```typescript
// server/src/games/index.ts

const gameRegistry: Record<string, GameModule> = {};

export function registerGame(game: GameModule) {
  gameRegistry[game.definition.id] = game;
}

export function getGame(gameId: string): GameModule | null {
  return gameRegistry[gameId] || null;
}

export function getAvailableGames(): GameDefinition[] {
  return Object.values(gameRegistry).map(g => g.definition);
}
```

## Adding a New Game

1. Create folder: `/server/src/games/[gameId]/`
2. Create folder: `/client/src/games/[gameId]/`
3. Implement GameModule interface
4. Register in game registry
5. Game automatically appears in game selection

## Fallback: Manual Scoring

If no game configured or game not found:
- Show manual scoring interface
- Host awards points directly
- Full game flow still works

---

# 16. API Endpoints

## Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms | Create room |
| GET | /api/rooms/:code | Get room state |
| GET | /api/rooms/:code/preview | Get preview data (public) |
| PUT | /api/rooms/:code | Update room settings |
| PUT | /api/rooms/:code/lock | Lock/unlock room |
| POST | /api/rooms/:code/open | Move DRAFT → LOBBY |
| DELETE | /api/rooms/:code | Delete room |

## Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms/:code/join | Join room |
| POST | /api/rooms/:code/players | Add deviceless player |
| PUT | /api/rooms/:code/players/:id | Update player |
| DELETE | /api/rooms/:code/players/:id | Kick player |
| POST | /api/rooms/:code/players/:id/photo | Upload photo |

## Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms/:code/teams | Create team |
| PUT | /api/rooms/:code/teams/:id | Update team |
| DELETE | /api/rooms/:code/teams/:id | Delete team |
| POST | /api/rooms/:code/teams/:id/logo/generate | Generate AI logo |
| POST | /api/rooms/:code/teams/:id/logo/upload | Upload logo |

## Expected Guests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rooms/:code/guests | List expected guests |
| POST | /api/rooms/:code/guests | Add expected guest |
| PUT | /api/rooms/:code/guests/:id | Update guest |
| DELETE | /api/rooms/:code/guests/:id | Remove guest |
| POST | /api/rooms/:code/guests/:id/claim | Claim guest spot |

## Rounds

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rooms/:code/rounds | List rounds |
| PUT | /api/rooms/:code/rounds/:num | Update round config |
| POST | /api/rooms/:code/rounds/:num/wings | Update wing status |

## Game Flow

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms/:code/phase | Advance phase |
| POST | /api/rooms/:code/timer/start | Start timer |
| POST | /api/rooms/:code/timer/pause | Pause timer |
| POST | /api/rooms/:code/timer/resume | Resume timer |
| POST | /api/rooms/:code/timer/add | Add time |
| POST | /api/rooms/:code/scores | Adjust scores |

---

# 17. Socket Events

## Connection Events

| Event | Direction | Payload |
|-------|-----------|---------|
| connect | Client → Server | - |
| disconnect | Server → Client | { reason } |
| join-room | Client → Server | { roomCode, sessionId? } |
| rejoin-room | Client → Server | { roomCode, sessionId } |
| join-as-host | Client → Server | { roomCode } |
| join-as-display | Client → Server | { roomCode } |

## Room State Events

| Event | Direction | Payload |
|-------|-----------|---------|
| room-state | Server → Client | { fullRoomState } |
| room-updated | Server → Client | { changes } |
| room-locked | Server → Client | - |
| room-unlocked | Server → Client | - |

## Player Events

| Event | Direction | Payload |
|-------|-----------|---------|
| player-joined | Server → All | { player, team? } |
| player-left | Server → All | { playerId, reason } |
| player-updated | Server → All | { playerId, changes } |
| player-connected | Server → All | { playerId } |
| player-disconnected | Server → All | { playerId } |

## Team Events

| Event | Direction | Payload |
|-------|-----------|---------|
| team-created | Server → All | { team } |
| team-updated | Server → All | { teamId, changes } |
| team-deleted | Server → All | { teamId } |
| team-logo-generating | Server → All | { teamId } |
| team-logo-generated | Server → All | { teamId, logoUrl } |
| team-ready-changed | Server → All | { teamId, isReady } |

## Phase Events

| Event | Direction | Payload |
|-------|-----------|---------|
| phase-changed | Server → All | { phase, previousPhase } |
| round-started | Server → All | { roundNumber, round } |
| round-completed | Server → All | { roundNumber, results } |
| game-paused | Server → All | { reason } |
| game-resumed | Server → All | - |

## Timer Events

| Event | Direction | Payload |
|-------|-----------|---------|
| timer-started | Server → All | { timerState, serverTime } |
| timer-paused | Server → All | { remaining } |
| timer-resumed | Server → All | { timerState, serverTime } |
| timer-updated | Server → All | { timerState, serverTime, added } |
| timer-expired | Server → All | { type } |
| timer-sync | Server → All | { remaining, serverTime } |

## Tablet Handoff Events

| Event | Direction | Payload |
|-------|-----------|---------|
| tablet-handoff-start | Server → All | { teamId, gameType } |
| tablet-team-ready | Client → Server | { teamId } |
| tablet-team-started | Server → All | { teamId } |
| tablet-return-requested | Server → All | { teamId, reason } |
| tablet-returned | Client → Server | - |
| tablet-mode-changed | Server → All | { mode, teamId? } |

## Score Events

| Event | Direction | Payload |
|-------|-----------|---------|
| scores-updated | Server → All | { teamScores } |
| score-adjusted | Server → All | { teamId, adjustment, newTotal, reason } |
| round-results | Server → All | { roundNumber, results } |

## Wing Events

| Event | Direction | Payload |
|-------|-----------|---------|
| wing-completed | Server → All | { playerId, roundNumber, completed } |
| wings-updated | Server → All | { roundNumber, wingStatus } |

## Voting Events

| Event | Direction | Payload |
|-------|-----------|---------|
| voting-started | Server → All | { options, timeLimit } |
| vote-cast | Server → All | { playerId, votedFor, votedVia } |
| voting-ended | Server → All | { results } |

## Host Events

| Event | Direction | Payload |
|-------|-----------|---------|
| host-connected | Server → All | - |
| host-disconnected | Server → All | { isPaused } |
| host-reconnected | Server → All | - |

## Display Events

| Event | Direction | Payload |
|-------|-----------|---------|
| display-connected | Server → Host | - |
| display-disconnected | Server → Host | - |
| show-on-tv | Server → Display | { screen, data } |

---

# 18. UI Specifications

## Design System

### Colors

```css
/* Primary - Fire/Heat theme */
--color-primary: #FF6B35;      /* Orange */
--color-primary-dark: #E85A24;
--color-primary-light: #FF8C5A;

/* Secondary - Gold */
--color-secondary: #FFD700;
--color-secondary-dark: #FFC107;

/* Background - Dark (night-friendly) */
--color-bg-primary: #1A1A2E;
--color-bg-secondary: #16213E;
--color-bg-card: #202040;

/* Text */
--color-text-primary: #FFFFFF;
--color-text-secondary: #B8B8D0;
--color-text-muted: #6B6B80;

/* Status */
--color-success: #4CAF50;
--color-warning: #FFD700;
--color-error: #FF4444;
--color-info: #2196F3;

/* Team colors (auto-assigned) */
--team-1: #FF6B35;  /* Orange */
--team-2: #4CAF50;  /* Green */
--team-3: #2196F3;  /* Blue */
--team-4: #9C27B0;  /* Purple */
--team-5: #FF9800;  /* Amber */
--team-6: #00BCD4;  /* Cyan */
```

### Typography

```css
/* Headings */
font-family: 'Inter', 'Helvetica Neue', sans-serif;

/* Timer/Numbers */
font-family: 'Courier New', monospace;

/* Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
--text-5xl: 3rem;
```

### Spacing

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
```

## Responsive Breakpoints

| Device | Breakpoint | Target |
|--------|------------|--------|
| Phone | < 640px | Player phones |
| Tablet | 640px - 1024px | Host tablet |
| Desktop/TV | > 1024px | TV display |

## Component Patterns

### Buttons

```jsx
// Primary action
<button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
  Start Game
</button>

// Secondary action
<button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
  Cancel
</button>

// Destructive action
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
  Kick Player
</button>
```

### Cards

```jsx
<div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
  {/* Card content */}
</div>
```

### Timer Display

```jsx
<div className={cn(
  "font-mono text-4xl font-bold",
  remaining > 10 && "text-white",
  remaining <= 10 && remaining > 5 && "text-yellow-400 animate-pulse",
  remaining <= 5 && "text-red-500 animate-pulse"
)}>
  {formatTime(remaining)}
</div>
```

## Screen Layouts

### TV Display
- Full screen, landscape
- Large text for viewing from distance
- Minimal UI, focus on content
- Room code always visible (small, corner)

### Host Tablet
- Landscape preferred, portrait supported
- Control-heavy interface
- Quick action buttons
- Status overview

### Player Phone
- Portrait only
- Large touch targets
- Minimal scrolling
- Clear status indicators

---

# 19. Development Tools

## Dev Routes

Only available when `NODE_ENV=development`:

```
/dev                      - Dev tools index
/dev/lobby                - Lobby with mock data
/dev/team-setup           - Team customization
/dev/eating               - Eating phase
/dev/round-results        - Results screen
/dev/game-end             - Game end screen
/dev/tv/:phase            - TV display for any phase
/dev/host/:phase          - Host tablet for any phase
/dev/player/:phase        - Player phone for any phase
/dev/games/:gameId        - Game test harness
/dev/components           - Component playground
```

## Mock State System

```typescript
// Create mock room state for any phase
const mockState = createMockRoomState('EATING_PHASE', {
  teamCount: 3,
  roundNumber: 3,
  includeTimer: true
});

// Wrap component with mock state
<MockStateProvider initialState={mockState}>
  <EatingPhase />
  <DevControls />
</MockStateProvider>
```

## Dev Controls Overlay

Floating panel to manipulate state:
- Phase switcher
- Timer controls (set, pause, expire)
- Score adjustments
- Player/team management
- State inspector (JSON view)

## Test API Endpoints

```
POST /dev/create-test-room     - Create room in specific state
POST /dev/rooms/:code/set-phase - Jump to phase
POST /dev/rooms/:code/reset     - Reset to lobby
POST /dev/rooms/:code/simulate  - Simulate actions
```

## Multi-Window Development

```typescript
// Open all 3 screens for a room
function openAllScreens(roomCode: string) {
  window.open(`/display/${roomCode}`, 'tv', 'width=1920,height=1080');
  window.open(`/host/${roomCode}`, 'host', 'width=1024,height=768');
  window.open(`/play/${roomCode}`, 'player', 'width=375,height=812');
}
```

## Game Test Harness

Isolated environment for testing games:
- Screen type toggle (TV/Host/Player)
- Phase selector
- Mock game state
- Action simulation

---

# 20. Build Order

## Phase 1A: Foundation (No Games)

### Week 1: Project Setup
- [ ] Initialize monorepo structure
- [ ] Set up Vite + React + TypeScript client
- [ ] Set up Express + TypeScript server
- [ ] Configure Prisma with SQLite
- [ ] Set up Socket.io
- [ ] Create shared types package
- [ ] Basic health check endpoint

### Week 2: Room & Player Basics
- [ ] Room creation (DRAFT phase)
- [ ] Room code generation
- [ ] Room settings storage
- [ ] Basic player join flow
- [ ] Socket room joining
- [ ] State broadcasting

### Week 3: Lobby Phase
- [ ] Expected guests system
- [ ] Walk-in support
- [ ] Team creation (host + player)
- [ ] Team selection modes
- [ ] Deviceless players
- [ ] Player management UI
- [ ] Room lock functionality

### Week 4: Team Setup Phase
- [ ] Team name editing
- [ ] AI logo generation (DALL-E)
- [ ] Photo upload (teams + players)
- [ ] Image processing (sharp)
- [ ] Ready state system
- [ ] Host progress view

### Week 5: Round System
- [ ] Round configuration
- [ ] Hot sauce lineup
- [ ] ROUND_INTRO phase UI
- [ ] EATING_PHASE with timer
- [ ] Wing tracking
- [ ] Manual scoring (placeholder for games)
- [ ] ROUND_RESULTS phase

### Week 6: Timer & Host Controls
- [ ] Synchronized timer system
- [ ] Pause/resume/add time
- [ ] Host control panel (all phases)
- [ ] Emergency controls menu
- [ ] Sound effects with mute toggle

### Week 7: Three-Screen UI
- [ ] TV display (all phases)
- [ ] Host tablet (all phases)
- [ ] Player phone (all phases)
- [ ] Tablet handoff framework
- [ ] Responsive design polish

### Week 8: End Game & Polish
- [ ] GAME_END phase
- [ ] Winner reveal animation
- [ ] Final standings
- [ ] Game stats calculation
- [ ] Play again options
- [ ] Game history saving
- [ ] Reconnection handling
- [ ] Error handling

### Week 9: Preview & Deployment
- [ ] Public preview page
- [ ] QR code generation
- [ ] Countdown timer
- [ ] Railway deployment
- [ ] Domain setup
- [ ] End-to-end testing
- [ ] Development tools

## Phase 1B+: Add Games

After foundation complete:
- [ ] Finalize game module interface
- [ ] Create game spec templates
- [ ] Build first game (Trivia recommended)
- [ ] Parallel development of other games
- [ ] Integration testing

---

# 21. Future Games Reference

## Planned Games

| Game | Type | Tablet | Description |
|------|------|--------|-------------|
| Trivia | Verbal | Host keeps | Teams answer questions |
| Where in the World | Sequential | Team holds | Guess location from photo |
| Drawing Challenge | Sequential | Drawer holds | Draw word, team guesses |
| AI Mad-Libs | Phone input | Host keeps | Fill blanks, AI generates image |
| Tongue Twister | Verbal | Host keeps | Say phrases after hot wings |
| Name That Scene | Verbal | Host keeps | Identify movie from scene |

## Game Development Spec Template

When building each game, create a spec with:

1. **Overview** - ID, name, description, icon
2. **Requirements** - Tablet, phones, min players
3. **Game Flow** - Phase sequence with timing
4. **Configuration** - Settings and defaults
5. **Scoring** - How points are calculated
6. **Built-in Content** - Questions, locations, words needed
7. **Files to Create** - Server and client files

## Trivia Game (Reference Design)

### Flow
1. SHOWING_QUESTION - Display question, timer
2. TEAM_ANSWERING - Team discusses, gives verbal answer
3. HOST_JUDGES - Host marks correct/wrong
4. SHOWING_ANSWER - Reveal correct answer
5. (Repeat for all questions)
6. GAME_RESULTS - Points earned

### Config
- questionCount: 5 (3-10)
- timePerQuestion: 30s (15-60)
- categories: selectable
- difficulty: easy/medium/hard

### Scoring
- Correct: 100 points
- Wrong: 0 points

## Geoguessr Game (Reference Design)

### Flow
1. STUDY_PHASE - All teams study photo (30s)
2. TEAM_GUESSING - Sequential, each team places pin
3. REVEALING - Show all guesses + actual location
4. (Repeat for all locations)
5. GAME_RESULTS - Points by accuracy

### Config
- locationCount: 5 (3-8)
- studyTime: 30s
- guessTime: 60s per team
- difficulty: varies by location

### Scoring
- Distance-based (closer = more points)
- ≤50m: 200 pts, ≤100m: 180 pts, etc.

## Drawing Game (Reference Design)

### Flow
1. SELECT_DRAWER - Show word to drawer only
2. DRAWING - Drawer draws, team guesses verbally
3. RESULT - Show word, award points
4. (Repeat for all words)
5. (Rotate drawer to next team)
6. GAME_RESULTS

### Config
- wordsPerDrawer: 5 (3-8)
- drawingTime: 90s total
- categories: selectable
- customWords: allowed

### Scoring
- Correct guess: 100 points
- Time bonus possible

---

# Appendix A: Environment Variables

```env
# Server
DATABASE_URL="file:./dev.db"
PORT=3000
CLIENT_URL="http://localhost:5173"

# OpenAI (for DALL-E logos)
OPENAI_API_KEY="sk-..."

# Production
NODE_ENV="production"
DATABASE_URL="postgresql://..."
```

---

# Appendix B: Confirmation Dialogs

Actions requiring confirmation:
- Kick player
- Delete team
- Skip round
- End game early
- Close room
- Reset scores

---

# Appendix C: Error Messages

```typescript
const errorMessages = {
  ROOM_NOT_FOUND: 'This game room doesn\'t exist.',
  ROOM_FULL: 'This game is full.',
  ROOM_LOCKED: 'This room is locked. Ask the host to unlock it.',
  GAME_ALREADY_STARTED: 'The game has already started.',
  INVALID_PHASE: 'This action isn\'t available right now.',
  PLAYER_NOT_IN_ROOM: 'You\'re not part of this game.',
  HOST_REQUIRED: 'Only the host can do this.',
  TEAM_FULL: 'This team is full.',
  MIN_TEAMS_REQUIRED: 'Need at least 3 teams to start.',
  UNASSIGNED_PLAYERS: 'All players must be on a team.',
};
```

---

# Appendix D: Success Criteria

## Phase 1A Complete When:

- [ ] Host can create room in DRAFT, configure settings
- [ ] Preview page shows game details publicly
- [ ] Players can join via code or QR
- [ ] Teams form via self-select or host-assign
- [ ] Team customization works (name, AI logo, photo)
- [ ] Full round flow works (intro → eating → game → results)
- [ ] Manual scoring works in game phase
- [ ] Timer system synchronized across all screens
- [ ] Host controls work for all phases
- [ ] Tablet handoff framework functional
- [ ] End game shows winner, stats, play again options
- [ ] Game history saved
- [ ] Reconnection handling works
- [ ] Deployed to wingnight.game
- [ ] Three screens work together reliably

---

*Document Version: 1.0*
*Last Updated: November 2024*
*Phase: Foundation Build (No Games)*
