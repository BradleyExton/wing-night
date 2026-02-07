# Wing Night Testing Guide

This guide focuses on validating end-to-end game flow across all three screens (Host, Player, Display). It is optimized for quick smoke tests plus deeper phase-by-phase checks.

## Goals
- Validate phase progression and state sync across Host, Player, and Display.
- Catch regressions in join flow, team setup, timers, scoring, and round transitions.
- Exercise real-time updates and reconnection behavior.

## Local Setup
```bash
# From repo root
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:3000

Open three separate browser contexts to avoid shared session state:
- Host: normal window
- Player: incognito window or different browser profile
- Display: another window or a second browser

## Quick Smoke Test (15-20 min)
1. Create a room from the Home page and capture the `roomCode` and `editCode`.
2. Open URLs for each screen: Host `/host/:roomCode`, Player `/play/:roomCode`, Display `/display/:roomCode`.
3. In DRAFT, edit room name, date, max teams, and sauce lineup. Save and confirm preview updates.
4. Open the room (DRAFT -> LOBBY). Confirm Host and Display show LOBBY.
5. Join 2-4 players from the Player screen. Confirm they appear on Host and Display.
6. Create 2 teams. Assign players to teams. Confirm team counts sync everywhere.
7. Enter TEAM_SETUP. Update team names and logos. Confirm changes on Host and Display.
8. Start GAME_INTRO then ROUND_INTRO. Confirm round number and sauce data display correctly.
9. Enter EATING_PHASE. Start timer, pause, resume, and add time. Confirm all screens stay in sync.
10. Enter GAME_PHASE. If a game module is active, complete a minimal interaction.
11. Enter ROUND_RESULTS. Adjust scores or mark wings completed. Confirm scoreboard updates.
12. Advance to next round and repeat once. End game and confirm GAME_END summary.
13. Refresh a Player tab during any phase and confirm reconnection restores state.

## Phase-by-Phase Checklist
Phase: DRAFT
- Host can edit room settings, lineup, and teams.
- Preview endpoint reflects changes.

Phase: LOBBY
- Players can join.
- Host can lock/unlock room.
- Display shows current roster and team count.

Phase: TEAM_SETUP
- Players can claim teams and update team info.
- Team readiness toggles (if enabled) sync to Host.

Phase: GAME_INTRO
- Countdown appears and is consistent across screens.

Phase: ROUND_INTRO
- Correct round number and sauce details are shown.

Phase: EATING_PHASE
- Timer starts, pauses, resumes, and adds time with consistent remaining time.

Phase: GAME_PHASE
- Game UI renders without blocking Host controls.
- Any game input events sync to Host/Display.

Phase: ROUND_RESULTS
- Scores update and persist.
- Wing completion or round summary is visible.

Phase: GAME_END
- Final standings are correct and stable after refresh.

## Edge Cases Worth Checking
- Joining after GAME_INTRO should be blocked.
- Duplicate player names should be rejected.
- Max team size and max team count enforced.
- Locked room blocks join attempts.
- Walk-ins blocked when disabled.
- Player reconnect during an active timer keeps correct remaining time.

## API Shortcuts for Testing
Use the `editCode` to call host-only endpoints. You can pass it as an `x-edit-code` header or `?editCode=` query param.

```bash
# Advance phase directly
curl -X POST "http://localhost:3000/api/rooms/$ROOM_CODE/phase" \
  -H "content-type: application/json" \
  -H "x-edit-code: $EDIT_CODE" \
  -d '{"phase":"ROUND_INTRO"}'

# Open room (DRAFT -> LOBBY)
curl -X POST "http://localhost:3000/api/rooms/$ROOM_CODE/open" \
  -H "x-edit-code: $EDIT_CODE"

# Start timer
curl -X POST "http://localhost:3000/api/rooms/$ROOM_CODE/timer/start" \
  -H "content-type: application/json" \
  -H "x-edit-code: $EDIT_CODE" \
  -d '{"duration":90}'
```

## Proposed: Fast Scaffold for Smoke Tests
If we want a single command to stand up a full game with players and teams, these options are the most practical.

Option A: Local script using Prisma
- A `server/scripts/scaffold-room.ts` that creates a room, teams, and players directly in the DB.
- Outputs ready-to-open URLs and an edit code.
- Fastest for local dev, no API auth required.
Run:
```bash
cd server
npm run scaffold
```
With options:
```bash
cd server
npm run scaffold -- --teams 3 --players 2 --phase ROUND_INTRO
```

Option B: Dev-only API endpoint
- `POST /api/dev/scaffold` guarded by `NODE_ENV !== "production"` and a shared secret.
- Creates a room with teams, players, and an initial phase.
- Useful for remote smoke testing without DB access.

Option C: Dev UI panel
- A hidden Host-only dev panel with buttons like `Seed Demo Room` and `Jump Phase`.
- Lowest friction for non-engineers during live testing.

Recommended MVP
- Implement Option A first. It is lowest risk and fastest to iterate.
- Add Option C later for product or QA stakeholders.

## When You Find a Bug
- Capture room code, phase, and steps to reproduce.
- Save console errors from Host, Player, and Display.
- Note if a refresh fixes or preserves the issue.
