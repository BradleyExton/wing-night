import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateSessionId } from '../lib/roomCodes.js';
import { requireRoomHostOrEditCode, isRoomHostOrEditCode } from '../middleware/roomAuth.js';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const JOIN_RATE_WINDOW_MS = 60_000;
const JOIN_RATE_MAX = 5;
const joinAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: { ip: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = joinAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    joinAttempts.set(key, { count: 1, resetAt: now + JOIN_RATE_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > JOIN_RATE_MAX;
}

function clearRateLimit(key: string) {
  joinAttempts.delete(key);
}

function normalizePlayerName(name: unknown): string {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Join room (player with phone)
router.post('/:code/join', async (req, res) => {
  try {
    const { code } = req.params;
    const { playerName, sessionId: existingSessionId, expectedGuestId } = req.body;
    const rateKey = `${code}:${getClientIp(req)}`;

    if (isRateLimited(rateKey)) {
      return res.status(429).json({ error: 'Too many join attempts. Try again in a minute.' });
    }

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        teams: true,
        players: true,
        expectedGuests: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (existingSessionId) {
      const existingPlayer = await prisma.player.findUnique({
        where: { sessionId: existingSessionId },
        include: { team: true },
      });

      if (existingPlayer && existingPlayer.roomId === room.id) {
        const normalized = normalizePlayerName(playerName);
        if (normalized && existingPlayer.name.toLowerCase() !== normalized.toLowerCase()) {
          return res.status(400).json({ error: 'Name does not match existing session' });
        }

        const updated = await prisma.player.update({
          where: { id: existingPlayer.id },
          data: {
            isConnected: true,
            lastSeenAt: new Date(),
            disconnectedAt: null,
          },
          include: { team: true },
        });

        clearRateLimit(rateKey);
        return res.json({
          player: updated,
          room,
          isReconnection: true,
          sessionId: existingSessionId,
        });
      }
    }

    if (room.isLocked) {
      return res.status(403).json({ error: 'Room is locked' });
    }

    if (!['LOBBY', 'TEAM_SETUP'].includes(room.phase)) {
      return res.status(400).json({ error: 'Game has already started' });
    }

    const normalizedName = normalizePlayerName(playerName);
    if (!normalizedName) {
      return res.status(400).json({ error: 'Player name required' });
    }

    if (normalizedName.length > 24) {
      return res.status(400).json({ error: 'Player name too long' });
    }

    const lowerName = normalizedName.toLowerCase();
    const nameTaken = room.players.some((p) => p.name.toLowerCase() === lowerName);
    if (nameTaken) {
      return res.status(409).json({ error: 'Name already taken' });
    }

    const maxPlayers = room.maxTeams * room.maxPlayersPerTeam;
    if (room.players.length >= maxPlayers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    let expectedGuest = null as null | {
      id: string;
      name: string;
      roomId: string;
      teamId: string | null;
      claimedById: string | null;
    };
    if (expectedGuestId) {
      expectedGuest = await prisma.expectedGuest.findUnique({
        where: { id: expectedGuestId },
      });
      if (!expectedGuest || expectedGuest.roomId !== room.id) {
        return res.status(400).json({ error: 'Invalid expected guest' });
      }
      if (expectedGuest.claimedById) {
        return res.status(400).json({ error: 'Expected guest already claimed' });
      }
      if (expectedGuest.name.toLowerCase() !== lowerName) {
        return res.status(400).json({ error: 'Name does not match expected guest' });
      }
    }

    // Check walk-ins
    if (!room.allowWalkIns && !expectedGuestId) {
      const isExpected = room.expectedGuests.some(
        (g) => g.name.toLowerCase() === lowerName && !g.claimedById
      );
      if (!isExpected) {
        return res.status(403).json({ error: 'Walk-ins not allowed' });
      }
    }

    const sessionId = generateSessionId();
    let joinedVia = 'PHONE';
    let guestId = expectedGuestId;
    let assignedTeamId: string | null = null;

    // Try to claim expected guest spot
    if (expectedGuest) {
      joinedVia = 'EXPECTED_GUEST';
      assignedTeamId = expectedGuest.teamId;
    }

    if (assignedTeamId) {
      const team = await prisma.team.findUnique({ where: { id: assignedTeamId } });
      if (!team || team.roomId !== room.id) {
        return res.status(400).json({ error: 'Invalid expected guest team' });
      }
      if (team.currentSize >= team.maxSize) {
        return res.status(400).json({ error: 'Team is full' });
      }
    }

    const player = await prisma.player.create({
      data: {
        roomId: room.id,
        name: normalizedName,
        teamId: assignedTeamId,
        sessionId,
        isConnected: true,
        hasDevice: true,
        joinedVia,
        expectedGuestId: guestId,
        lastSeenAt: new Date(),
      },
      include: { team: { include: { players: true } } },
    });

    // Update expected guest if claiming
    if (guestId) {
      await prisma.expectedGuest.update({
        where: { id: guestId },
        data: {
          claimedById: player.id,
          claimedAt: new Date(),
        },
      });
    }

    // Update team size if assigned
    if (assignedTeamId) {
      const updatedTeam = await prisma.team.update({
        where: { id: assignedTeamId },
        data: { currentSize: { increment: 1 } },
        include: { players: true },
      });
      const io = req.app.get('io');
      io.to(code).emit('team-updated', { teamId: assignedTeamId, changes: { currentSize: updatedTeam.currentSize } });
      io.to(code).emit('player-updated', { playerId: player.id, changes: { teamId: assignedTeamId } });
    }

    const io = req.app.get('io');
    io.to(code).emit('player-joined', { player, team: player.team || undefined });

    clearRateLimit(rateKey);
    res.json({
      player,
      room,
      sessionId,
    });
  } catch (error) {
    console.error('Failed to join room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Add deviceless player (host adds)
router.post('/:code/players', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, teamId, hasDevice = false } = req.body;

    const room = await prisma.room.findUnique({
      where: { code },
      include: { players: true },
    });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const normalizedName = normalizePlayerName(name);
    if (!normalizedName) {
      return res.status(400).json({ error: 'Player name required' });
    }

    if (normalizedName.length > 24) {
      return res.status(400).json({ error: 'Player name too long' });
    }

    const lowerName = normalizedName.toLowerCase();
    const nameTaken = room.players.some((p) => p.name.toLowerCase() === lowerName);
    if (nameTaken) {
      return res.status(409).json({ error: 'Name already taken' });
    }

    const maxPlayers = room.maxTeams * room.maxPlayersPerTeam;
    if (room.players.length >= maxPlayers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team || team.roomId !== room.id) {
        return res.status(400).json({ error: 'Invalid team' });
      }
      if (team.currentSize >= team.maxSize) {
        return res.status(400).json({ error: 'Team is full' });
      }
    }

    const player = await prisma.player.create({
      data: {
        roomId: room.id,
        teamId,
        name: normalizedName,
        hasDevice,
        joinedVia: 'HOST_ADDED',
      },
      include: { team: true },
    });

    // Update team size
    if (teamId) {
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          currentSize: {
            increment: 1,
          },
        },
      });
      const io = req.app.get('io');
      io.to(code).emit('team-updated', { teamId, changes: { currentSize: updatedTeam.currentSize } });
    }

    const io = req.app.get('io');
    io.to(code).emit('player-joined', { player, team: player.team || undefined });

    res.json(player);
  } catch (error) {
    console.error('Failed to add player:', error);
    res.status(500).json({ error: 'Failed to add player' });
  }
});

// Update player
router.put('/:code/players/:playerId', async (req, res) => {
  try {
    const { code, playerId } = req.params;
    const { name, teamId, isReady, teamChangeRequested, requestedTeamId, sessionId } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (player.roomId !== room.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const isHost = isRoomHostOrEditCode(req, room);
    if (!isHost) {
      const headerSessionId = req.get('x-session-id');
      const effectiveSessionId = sessionId || headerSessionId;
      if (!effectiveSessionId || player.sessionId !== effectiveSessionId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const oldTeamId = player.teamId;
    let normalizedName: string | undefined;

    if (name !== undefined) {
      normalizedName = normalizePlayerName(name);
      if (!normalizedName) {
        return res.status(400).json({ error: 'Player name required' });
      }
      if (normalizedName.length > 24) {
        return res.status(400).json({ error: 'Player name too long' });
      }
      const nameTaken = await prisma.player.findFirst({
        where: {
          roomId: room.id,
          id: { not: playerId },
          name: { equals: normalizedName, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (nameTaken) {
        return res.status(409).json({ error: 'Name already taken' });
      }
    }

    if (teamId !== undefined && teamId) {
      const newTeam = await prisma.team.findUnique({ where: { id: teamId } });
      if (!newTeam || newTeam.roomId !== room.id) {
        return res.status(400).json({ error: 'Invalid team' });
      }
      if (teamId !== oldTeamId && newTeam.currentSize >= newTeam.maxSize) {
        return res.status(400).json({ error: 'Team is full' });
      }
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...(name !== undefined && { name: normalizedName }),
        ...(teamId !== undefined && { teamId }),
        ...(isReady !== undefined && { isReady }),
        ...(teamChangeRequested !== undefined && { teamChangeRequested }),
        ...(requestedTeamId !== undefined && { requestedTeamId }),
      },
      include: { team: true },
    });

    // Update team sizes if team changed
    const io = req.app.get('io');
    if (teamId !== undefined && teamId !== oldTeamId) {
      if (oldTeamId) {
        const oldTeam = await prisma.team.update({
          where: { id: oldTeamId },
          data: { currentSize: { decrement: 1 } },
        });
        io.to(code).emit('team-updated', { teamId: oldTeamId, changes: { currentSize: oldTeam.currentSize } });
      }
      if (teamId) {
        const newTeam = await prisma.team.update({
          where: { id: teamId },
          data: { currentSize: { increment: 1 } },
        });
        io.to(code).emit('team-updated', { teamId, changes: { currentSize: newTeam.currentSize } });
      }
    }

    // Broadcast player update to room
    const changes: Record<string, unknown> = {};
    if (name !== undefined) changes.name = name;
    if (teamId !== undefined) changes.teamId = teamId;
    if (isReady !== undefined) changes.isReady = isReady;
    if (teamChangeRequested !== undefined) changes.teamChangeRequested = teamChangeRequested;
    if (requestedTeamId !== undefined) changes.requestedTeamId = requestedTeamId;

    io.to(code).emit('player-updated', { playerId, changes });

    res.json(updated);
  } catch (error) {
    console.error('Failed to update player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Remove player
router.delete('/:code/players/:playerId', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code, playerId } = req.params;

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room || player.roomId !== room.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update team size
    if (player.teamId) {
      const updatedTeam = await prisma.team.update({
        where: { id: player.teamId },
        data: { currentSize: { decrement: 1 } },
      });
      const io = req.app.get('io');
      io.to(code).emit('team-updated', { teamId: player.teamId, changes: { currentSize: updatedTeam.currentSize } });
    }

    // Unclaim expected guest if needed
    if (player.expectedGuestId) {
      await prisma.expectedGuest.update({
        where: { id: player.expectedGuestId },
        data: {
          claimedById: null,
          claimedAt: null,
        },
      });
    }

    await prisma.player.delete({ where: { id: playerId } });

    const io = req.app.get('io');
    io.to(code).emit('player-left', { playerId });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to remove player:', error);
    res.status(500).json({ error: 'Failed to remove player' });
  }
});

// Upload player photo
router.post('/:code/players/:playerId/photo', upload.single('photo'), async (req, res) => {
  try {
    const { code, playerId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const existingPlayer = await prisma.player.findUnique({ where: { id: playerId } });
    if (!existingPlayer || existingPlayer.roomId !== room.id) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Ensure photos directory exists
    const photosDir = path.join(__dirname, '../../public/photos');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Process and save image
    const filename = `player-${playerId}-${Date.now()}.jpg`;
    const filepath = path.join(photosDir, filename);

    await sharp(file.buffer)
      .resize(256, 256, {
        fit: 'cover',
        position: 'attention',
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    const photoUrl = `/photos/${filename}`;

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { photoUrl },
      include: { team: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to upload photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Get expected guests
router.get('/:code/guests', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code } = req.params;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
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

    res.json(room.expectedGuests);
  } catch (error) {
    console.error('Failed to get guests:', error);
    res.status(500).json({ error: 'Failed to get guests' });
  }
});

// Add expected guest
router.post('/:code/guests', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, teamId } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team || team.roomId !== room.id) {
        return res.status(400).json({ error: 'Invalid team' });
      }
    }

    const guest = await prisma.expectedGuest.create({
      data: {
        roomId: room.id,
        name,
        teamId,
      },
      include: { team: true },
    });

    res.json(guest);
  } catch (error) {
    console.error('Failed to add guest:', error);
    res.status(500).json({ error: 'Failed to add guest' });
  }
});

// Update expected guest
router.put('/:code/guests/:guestId', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code, guestId } = req.params;
    const { name, teamId } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const existingGuest = await prisma.expectedGuest.findUnique({ where: { id: guestId } });
    if (!existingGuest || existingGuest.roomId !== room.id) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    if (teamId !== undefined && teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team || team.roomId !== room.id) {
        return res.status(400).json({ error: 'Invalid team' });
      }
    }

    const guest = await prisma.expectedGuest.update({
      where: { id: guestId },
      data: {
        ...(name !== undefined && { name }),
        ...(teamId !== undefined && { teamId }),
      },
      include: { team: true },
    });

    res.json(guest);
  } catch (error) {
    console.error('Failed to update guest:', error);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// Delete expected guest
router.delete('/:code/guests/:guestId', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code, guestId } = req.params;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const existingGuest = await prisma.expectedGuest.findUnique({ where: { id: guestId } });
    if (!existingGuest || existingGuest.roomId !== room.id) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    await prisma.expectedGuest.delete({ where: { id: guestId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete guest:', error);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

export default router;
