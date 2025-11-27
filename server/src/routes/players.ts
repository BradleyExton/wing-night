import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateSessionId } from '../lib/roomCodes.js';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

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

    if (room.isLocked) {
      return res.status(403).json({ error: 'Room is locked' });
    }

    if (!['LOBBY', 'TEAM_SETUP'].includes(room.phase)) {
      // Check if this is a reconnection
      if (existingSessionId) {
        const existingPlayer = await prisma.player.findUnique({
          where: { sessionId: existingSessionId },
          include: { team: true },
        });

        if (existingPlayer && existingPlayer.roomId === room.id) {
          return res.json({
            player: existingPlayer,
            room,
            isReconnection: true,
          });
        }
      }
      return res.status(400).json({ error: 'Game has already started' });
    }

    // Check if reconnecting with session ID
    if (existingSessionId) {
      const existingPlayer = await prisma.player.findUnique({
        where: { sessionId: existingSessionId },
        include: { team: true },
      });

      // Only reconnect if same room AND same name (or no new name provided)
      if (existingPlayer && existingPlayer.roomId === room.id) {
        const nameMatches = !playerName || existingPlayer.name.toLowerCase() === playerName.toLowerCase();

        if (nameMatches) {
          const updated = await prisma.player.update({
            where: { id: existingPlayer.id },
            data: {
              isConnected: true,
              lastSeenAt: new Date(),
              disconnectedAt: null,
            },
            include: { team: true },
          });

          return res.json({
            player: updated,
            room,
            isReconnection: true,
          });
        }
        // Name differs - fall through to create new player with new session
      }
    }

    // Check walk-ins
    if (!room.allowWalkIns && !expectedGuestId) {
      const isExpected = room.expectedGuests.some(
        (g) => g.name.toLowerCase() === playerName.toLowerCase() && !g.claimedById
      );
      if (!isExpected) {
        return res.status(403).json({ error: 'Walk-ins not allowed' });
      }
    }

    const sessionId = generateSessionId();
    let joinedVia = 'PHONE';
    let guestId = expectedGuestId;

    // Try to claim expected guest spot
    if (expectedGuestId) {
      const guest = await prisma.expectedGuest.findUnique({
        where: { id: expectedGuestId },
      });
      if (guest && !guest.claimedById) {
        joinedVia = 'EXPECTED_GUEST';
      }
    }

    const player = await prisma.player.create({
      data: {
        roomId: room.id,
        name: playerName,
        sessionId,
        isConnected: true,
        hasDevice: true,
        joinedVia,
        expectedGuestId: guestId,
        lastSeenAt: new Date(),
      },
      include: { team: true },
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
router.post('/:code/players', async (req, res) => {
  try {
    const { code } = req.params;
    const { name, teamId, hasDevice = false } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = await prisma.player.create({
      data: {
        roomId: room.id,
        teamId,
        name,
        hasDevice,
        joinedVia: 'HOST_ADDED',
      },
      include: { team: true },
    });

    // Update team size
    if (teamId) {
      await prisma.team.update({
        where: { id: teamId },
        data: {
          currentSize: {
            increment: 1,
          },
        },
      });
    }

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
    const { name, teamId, isReady, teamChangeRequested, requestedTeamId } = req.body;

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const oldTeamId = player.teamId;

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        ...(name !== undefined && { name }),
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
router.delete('/:code/players/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update team size
    if (player.teamId) {
      await prisma.team.update({
        where: { id: player.teamId },
        data: { currentSize: { decrement: 1 } },
      });
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
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to remove player:', error);
    res.status(500).json({ error: 'Failed to remove player' });
  }
});

// Upload player photo
router.post('/:code/players/:playerId/photo', upload.single('photo'), async (req, res) => {
  try {
    const { playerId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
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
router.get('/:code/guests', async (req, res) => {
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
router.post('/:code/guests', async (req, res) => {
  try {
    const { code } = req.params;
    const { name, teamId } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
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
router.put('/:code/guests/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    const { name, teamId } = req.body;

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
router.delete('/:code/guests/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    await prisma.expectedGuest.delete({ where: { id: guestId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete guest:', error);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

export default router;
