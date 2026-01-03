import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticatedUser } from '../middleware/auth.js';

const router = Router();

// Get current user's profile
router.get('/me', ...authenticatedUser, async (req, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json(req.dbUser);
  } catch (error) {
    console.error('Failed to get user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get current user's rooms (games they've hosted)
router.get('/me/rooms', ...authenticatedUser, async (req, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const rooms = await prisma.room.findMany({
      where: { hostUserId: req.dbUser.id },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            score: true,
            logoUrl: true,
            _count: { select: { players: true } },
          },
        },
        _count: {
          select: { players: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Categorize rooms
    const activePhases = ['LOBBY', 'TEAM_SETUP', 'GAME_INTRO', 'ROUND_INTRO', 'EATING_PHASE', 'GAME_PHASE', 'ROUND_RESULTS'];
    const now = new Date();

    const categorized = {
      active: rooms.filter(r => activePhases.includes(r.phase)),
      upcoming: rooms.filter(r => r.phase === 'DRAFT' && r.eventDate && new Date(r.eventDate) > now),
      draft: rooms.filter(r => r.phase === 'DRAFT' && (!r.eventDate || new Date(r.eventDate) <= now)),
      completed: rooms.filter(r => r.phase === 'GAME_END'),
    };

    res.json({
      rooms,
      categorized,
      total: rooms.length,
    });
  } catch (error) {
    console.error('Failed to get user rooms:', error);
    res.status(500).json({ error: 'Failed to get user rooms' });
  }
});

// Get current user's game history (games they've played in)
router.get('/me/games', ...authenticatedUser, async (req, res) => {
  try {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const players = await prisma.player.findMany({
      where: { userId: req.dbUser.id },
      include: {
        room: {
          select: {
            id: true,
            code: true,
            name: true,
            eventDate: true,
            phase: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            score: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    res.json({
      games: players.map(p => ({
        roomId: p.room.id,
        roomCode: p.room.code,
        roomName: p.room.name,
        eventDate: p.room.eventDate,
        phase: p.room.phase,
        team: p.team,
        wingsCompleted: p.wingsCompleted,
        joinedAt: p.joinedAt,
      })),
      total: players.length,
    });
  } catch (error) {
    console.error('Failed to get user games:', error);
    res.status(500).json({ error: 'Failed to get user games' });
  }
});

export default router;
