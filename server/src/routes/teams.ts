import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { generateTeamLogo } from '../lib/openai.js';
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

// Create team
router.post('/:code/teams', async (req, res) => {
  try {
    const { code } = req.params;
    const { name, createdBy, createdById } = req.body;

    const room = await prisma.room.findUnique({
      where: { code },
      include: { teams: true },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.teams.length >= room.maxTeams) {
      return res.status(400).json({ error: 'Maximum teams reached' });
    }

    const teamNumber = room.teams.length + 1;
    const team = await prisma.team.create({
      data: {
        roomId: room.id,
        name: name || `Team ${teamNumber}`,
        createdBy: createdBy || 'HOST',
        createdById,
        maxSize: room.maxPlayersPerTeam,
      },
      include: {
        players: true,
      },
    });

    // Broadcast to all clients in the room
    const io = req.app.get('io');
    io.to(code).emit('team-created', { team });

    res.json(team);
  } catch (error) {
    console.error('Failed to create team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get teams for room
router.get('/:code/teams', async (req, res) => {
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
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room.teams);
  } catch (error) {
    console.error('Failed to get teams:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

// Update team
router.put('/:code/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, emoji, isReady } = req.body;

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name !== undefined && { name }),
        ...(emoji !== undefined && { emoji }),
        ...(isReady !== undefined && { isReady }),
      },
      include: {
        players: true,
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Failed to update team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team
router.delete('/:code/teams/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { players: true },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.players.length > 0) {
      return res.status(400).json({ error: 'Cannot delete team with players' });
    }

    await prisma.team.delete({ where: { id: teamId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Generate AI logo
router.post('/:code/teams/:teamId/logo/generate', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { prompt } = req.body;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.aiAttemptsUsed >= team.maxAiAttempts) {
      return res.status(400).json({ error: 'Maximum AI attempts reached' });
    }

    // Generate logo
    const logoUrl = await generateTeamLogo(prompt, teamId);

    // Update team
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        logoUrl,
        logoType: 'AI_GENERATED',
        logoPrompt: prompt,
        aiAttemptsUsed: team.aiAttemptsUsed + 1,
      },
      include: {
        players: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to generate logo:', error);
    res.status(500).json({ error: 'Failed to generate logo' });
  }
});

// Upload team logo
router.post('/:code/teams/:teamId/logo/upload', upload.single('logo'), async (req, res) => {
  try {
    const { teamId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Ensure logos directory exists
    const logosDir = path.join(__dirname, '../../public/logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }

    // Process and save image
    const filename = `team-${teamId}-uploaded-${Date.now()}.jpg`;
    const filepath = path.join(logosDir, filename);

    await sharp(file.buffer)
      .resize(512, 512, {
        fit: 'cover',
        position: 'attention',
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);

    const logoUrl = `/logos/${filename}`;

    // Update team
    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        logoUrl,
        logoType: 'UPLOADED',
        logoPrompt: null,
      },
      include: {
        players: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to upload logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Adjust team score
router.post('/:code/teams/:teamId/score', async (req, res) => {
  try {
    const { code, teamId } = req.params;
    const { adjustment, reason } = req.body;

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        score: {
          increment: adjustment,
        },
      },
    });

    // Broadcast score update to all clients
    const io = req.app.get('io');
    io.to(code).emit('team-updated', { teamId, changes: { score: team.score } });

    res.json({
      teamId: team.id,
      adjustment,
      newTotal: team.score,
      reason,
    });
  } catch (error) {
    console.error('Failed to adjust score:', error);
    res.status(500).json({ error: 'Failed to adjust score' });
  }
});

export default router;
