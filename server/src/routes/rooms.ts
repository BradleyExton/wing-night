import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateRoomCode, generateEditCode } from '../lib/roomCodes.js';
import { authenticatedUser } from '../middleware/auth.js';

const router = Router();

const DEFAULT_SAUCE_LINEUP = [
  { round: 1, name: "Frank's RedHot", scoville: 450 },
  { round: 2, name: 'Cholula', scoville: 1000 },
  { round: 3, name: 'Tabasco', scoville: 2500 },
  { round: 4, name: 'Sriracha', scoville: 2200 },
  { round: 5, name: 'Crystal', scoville: 4000 },
  { round: 6, name: 'El Yucateco', scoville: 8910 },
  { round: 7, name: "Dave's Insanity", scoville: 180000 },
  { round: 8, name: 'The Last Dab', scoville: 2000000 },
];

// Create room - requires authentication
router.post('/', ...authenticatedUser, async (req, res) => {
  try {
    const code = await generateRoomCode();
    const editCode = generateEditCode();

    // req.dbUser is guaranteed to exist due to authenticatedUser middleware
    const hostUserId = req.dbUser!.id;

    const room = await prisma.room.create({
      data: {
        code,
        editCode,
        phase: 'DRAFT',
        hostUserId,
        rounds: {
          create: DEFAULT_SAUCE_LINEUP.map((sauce) => ({
            roundNumber: sauce.round,
            sauceName: sauce.name,
            sauceScovilles: sauce.scoville,
          })),
        },
      },
      include: {
        teams: true,
        players: true,
        rounds: true,
        expectedGuests: true,
      },
    });

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.json({
      room: {
        code: room.code,
        editCode: room.editCode,
      },
      urls: {
        edit: `${baseUrl}/edit/${room.editCode}`,
        preview: `${baseUrl}/preview/${room.code}`,
        host: `${baseUrl}/host/${room.code}`,
        join: `${baseUrl}/play/${room.code}`,
        display: `${baseUrl}/display/${room.code}`,
      },
    });
  } catch (error) {
    console.error('Failed to create room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room by code
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        teams: {
          include: {
            players: true,
          },
        },
        players: {
          include: {
            team: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        expectedGuests: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Parse JSON fields
    const response = {
      ...room,
      timerState: room.timerState ? JSON.parse(room.timerState) : null,
      gameState: room.gameState ? JSON.parse(room.gameState) : null,
      finalStats: room.finalStats ? JSON.parse(room.finalStats) : null,
    };

    res.json(response);
  } catch (error) {
    console.error('Failed to get room:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Get room by edit code (for host draft access)
router.get('/edit/:editCode', async (req, res) => {
  try {
    const { editCode } = req.params;
    const room = await prisma.room.findUnique({
      where: { editCode },
      include: {
        teams: {
          include: {
            players: true,
          },
        },
        players: true,
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        expectedGuests: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      ...room,
      timerState: room.timerState ? JSON.parse(room.timerState) : null,
      gameState: room.gameState ? JSON.parse(room.gameState) : null,
      finalStats: room.finalStats ? JSON.parse(room.finalStats) : null,
    });
  } catch (error) {
    console.error('Failed to get room:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Get preview data (public)
router.get('/:code/preview', async (req, res) => {
  try {
    const { code } = req.params;
    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        teams: {
          include: {
            players: true,
            expectedGuests: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          select: {
            roundNumber: true,
            sauceName: true,
            sauceScovilles: true,
          },
        },
        expectedGuests: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const totalGuests = room.expectedGuests.length;
    const claimedSpots = room.expectedGuests.filter((g) => g.claimedById).length;

    res.json({
      room: {
        code: room.code,
        name: room.name,
        phase: room.phase,
        eventDate: room.eventDate,
        totalRounds: room.totalRounds,
      },
      teams: room.teams.map((team) => ({
        id: team.id,
        name: team.name,
        logoUrl: team.logoUrl,
        maxSize: team.maxSize,
        members: [
          ...team.players.map((p) => ({
            name: p.name,
            claimed: true,
            photoUrl: p.photoUrl,
          })),
          ...team.expectedGuests
            .filter((g) => !g.claimedById)
            .map((g) => ({
              name: g.name,
              claimed: false,
              photoUrl: g.photoUrl,
            })),
        ],
      })),
      sauceLineup: room.rounds.map((r) => ({
        round: r.roundNumber,
        name: r.sauceName,
        scoville: r.sauceScovilles,
      })),
      stats: {
        totalGuests,
        claimedSpots,
        openSpots: totalGuests - claimedSpots,
      },
    });
  } catch (error) {
    console.error('Failed to get preview:', error);
    res.status(500).json({ error: 'Failed to get preview' });
  }
});

// Update room
router.put('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const {
      name,
      eventDate,
      eventLocation,
      teamSelectionMode,
      maxTeams,
      maxPlayersPerTeam,
      allowWalkIns,
      totalRounds,
      soundEnabled,
    } = req.body;

    const room = await prisma.room.update({
      where: { code },
      data: {
        ...(name !== undefined && { name }),
        ...(eventDate !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }),
        ...(eventLocation !== undefined && { eventLocation }),
        ...(teamSelectionMode !== undefined && { teamSelectionMode }),
        ...(maxTeams !== undefined && { maxTeams }),
        ...(maxPlayersPerTeam !== undefined && { maxPlayersPerTeam }),
        ...(allowWalkIns !== undefined && { allowWalkIns }),
        ...(totalRounds !== undefined && { totalRounds }),
        ...(soundEnabled !== undefined && { soundEnabled }),
      },
      include: {
        teams: true,
        players: true,
        rounds: true,
        expectedGuests: true,
      },
    });

    res.json(room);
  } catch (error) {
    console.error('Failed to update room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Lock/unlock room
router.put('/:code/lock', async (req, res) => {
  try {
    const { code } = req.params;
    const { locked } = req.body;

    const room = await prisma.room.update({
      where: { code },
      data: {
        isLocked: locked,
        lockedAt: locked ? new Date() : null,
      },
    });

    res.json({ isLocked: room.isLocked });
  } catch (error) {
    console.error('Failed to lock/unlock room:', error);
    res.status(500).json({ error: 'Failed to lock/unlock room' });
  }
});

// Open room (DRAFT -> LOBBY)
router.post('/:code/open', async (req, res) => {
  try {
    const { code } = req.params;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.phase !== 'DRAFT') {
      return res.status(400).json({ error: 'Room is already open' });
    }

    const updated = await prisma.room.update({
      where: { code },
      data: { phase: 'LOBBY' },
      include: {
        teams: true,
        players: true,
        rounds: true,
        expectedGuests: true,
      },
    });

    // Broadcast phase change to any connected clients
    const io = req.app.get('io');
    io.to(code).emit('phase-changed', { phase: 'LOBBY' });

    res.json(updated);
  } catch (error) {
    console.error('Failed to open room:', error);
    res.status(500).json({ error: 'Failed to open room' });
  }
});

// Advance phase
router.post('/:code/phase', async (req, res) => {
  try {
    const { code } = req.params;
    const { phase } = req.body;

    // Get current room state to determine additional updates
    const currentRoom = await prisma.room.findUnique({ where: { code } });
    if (!currentRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Build update data
    const updateData: Record<string, unknown> = { phase };

    // When transitioning to ROUND_INTRO, increment currentRoundNumber if it's 0
    // or if coming from ROUND_RESULTS (starting a new round)
    if (phase === 'ROUND_INTRO') {
      if (currentRoom.currentRoundNumber === 0) {
        updateData.currentRoundNumber = 1;
      } else if (currentRoom.phase === 'ROUND_RESULTS') {
        updateData.currentRoundNumber = currentRoom.currentRoundNumber + 1;
      }
    }

    const room = await prisma.room.update({
      where: { code },
      data: updateData,
      include: {
        teams: {
          include: {
            players: true,
          },
        },
        players: true,
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
        expectedGuests: true,
      },
    });

    // Broadcast phase change to all clients in the room
    const io = req.app.get('io');
    io.to(code).emit('phase-changed', { phase });

    // Also broadcast room update if currentRoundNumber changed
    if (updateData.currentRoundNumber) {
      io.to(code).emit('room-updated', { changes: { currentRoundNumber: updateData.currentRoundNumber } });
    }

    res.json(room);
  } catch (error) {
    console.error('Failed to advance phase:', error);
    res.status(500).json({ error: 'Failed to advance phase' });
  }
});

// Update rounds
router.put('/:code/rounds', async (req, res) => {
  try {
    const { code } = req.params;
    const { rounds } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Update each round
    for (const round of rounds) {
      await prisma.round.upsert({
        where: {
          roomId_roundNumber: {
            roomId: room.id,
            roundNumber: round.roundNumber,
          },
        },
        update: {
          sauceName: round.sauceName,
          sauceScovilles: round.sauceScovilles,
          sauceNotes: round.sauceNotes,
          gameType: round.gameType,
          gameSelectionMode: round.gameSelectionMode,
        },
        create: {
          roomId: room.id,
          roundNumber: round.roundNumber,
          sauceName: round.sauceName,
          sauceScovilles: round.sauceScovilles,
          sauceNotes: round.sauceNotes,
          gameType: round.gameType,
          gameSelectionMode: round.gameSelectionMode || 'PRE_SET',
        },
      });
    }

    const updatedRoom = await prisma.room.findUnique({
      where: { code },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    res.json(updatedRoom?.rounds);
  } catch (error) {
    console.error('Failed to update rounds:', error);
    res.status(500).json({ error: 'Failed to update rounds' });
  }
});

// Delete room
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    await prisma.room.delete({ where: { code } });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
