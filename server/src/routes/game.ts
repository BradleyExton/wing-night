import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// Get current round
router.get('/:code/rounds/current', async (req, res) => {
  try {
    const { code } = req.params;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        rounds: {
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const currentRound = room.rounds.find(
      (r) => r.roundNumber === room.currentRoundNumber
    );

    res.json(currentRound || null);
  } catch (error) {
    console.error('Failed to get current round:', error);
    res.status(500).json({ error: 'Failed to get current round' });
  }
});

// Update wing completion
router.post('/:code/rounds/:roundNumber/wings', async (req, res) => {
  try {
    const { code, roundNumber } = req.params;
    const { playerId, completed } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const round = await prisma.round.findUnique({
      where: {
        roomId_roundNumber: {
          roomId: room.id,
          roundNumber: parseInt(roundNumber),
        },
      },
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    const wingResult = await prisma.wingResult.upsert({
      where: {
        roundId_playerId: {
          roundId: round.id,
          playerId,
        },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        roundId: round.id,
        playerId,
        completed,
        completedAt: completed ? new Date() : null,
        markedBy: 'HOST',
      },
    });

    // Update player wing count
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (player) {
      const allWingResults = await prisma.wingResult.findMany({
        where: { playerId },
      });
      const completedCount = allWingResults.filter((w) => w.completed).length;

      await prisma.player.update({
        where: { id: playerId },
        data: {
          wingsCompleted: completedCount,
          wingsAttempted: allWingResults.length,
        },
      });

      // Update team wing count if player has team
      if (player.teamId) {
        const teamPlayers = await prisma.player.findMany({
          where: { teamId: player.teamId },
        });
        const totalCompleted = teamPlayers.reduce(
          (sum, p) => sum + p.wingsCompleted,
          0
        );
        const totalAttempted = teamPlayers.reduce(
          (sum, p) => sum + p.wingsAttempted,
          0
        );

        await prisma.team.update({
          where: { id: player.teamId },
          data: {
            totalWingsCompleted: totalCompleted,
            totalWingsAttempted: totalAttempted,
          },
        });
      }
    }

    res.json(wingResult);
  } catch (error) {
    console.error('Failed to update wing completion:', error);
    res.status(500).json({ error: 'Failed to update wing completion' });
  }
});

// Mark all wings for team
router.post('/:code/rounds/:roundNumber/wings/team/:teamId', async (req, res) => {
  try {
    const { code, roundNumber, teamId } = req.params;
    const { completed } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const round = await prisma.round.findUnique({
      where: {
        roomId_roundNumber: {
          roomId: room.id,
          roundNumber: parseInt(roundNumber),
        },
      },
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    const teamPlayers = await prisma.player.findMany({
      where: { teamId },
    });

    for (const player of teamPlayers) {
      await prisma.wingResult.upsert({
        where: {
          roundId_playerId: {
            roundId: round.id,
            playerId: player.id,
          },
        },
        update: {
          completed,
          completedAt: completed ? new Date() : null,
        },
        create: {
          roundId: round.id,
          playerId: player.id,
          completed,
          completedAt: completed ? new Date() : null,
          markedBy: 'HOST',
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark team wings:', error);
    res.status(500).json({ error: 'Failed to mark team wings' });
  }
});

// Get wing status for round
router.get('/:code/rounds/:roundNumber/wings', async (req, res) => {
  try {
    const { code, roundNumber } = req.params;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const round = await prisma.round.findUnique({
      where: {
        roomId_roundNumber: {
          roomId: room.id,
          roundNumber: parseInt(roundNumber),
        },
      },
      include: {
        wingResults: true,
      },
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    const wingStatus: Record<string, boolean> = {};
    for (const result of round.wingResults) {
      wingStatus[result.playerId] = result.completed;
    }

    res.json(wingStatus);
  } catch (error) {
    console.error('Failed to get wing status:', error);
    res.status(500).json({ error: 'Failed to get wing status' });
  }
});

// Start timer
router.post('/:code/timer/start', async (req, res) => {
  try {
    const { code } = req.params;
    const { duration, type, teamId } = req.body;

    const timerState = {
      isRunning: true,
      duration,
      startedAt: new Date().toISOString(),
      isPaused: false,
      pausedAt: null,
      remainingWhenPaused: null,
      type,
      teamId,
    };

    const room = await prisma.room.update({
      where: { code },
      data: {
        timerState: JSON.stringify(timerState),
      },
    });

    res.json({ timerState, serverTime: Date.now() });
  } catch (error) {
    console.error('Failed to start timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Pause timer
router.post('/:code/timer/pause', async (req, res) => {
  try {
    const { code } = req.params;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room || !room.timerState) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    const timer = JSON.parse(room.timerState);
    const elapsed = (Date.now() - new Date(timer.startedAt).getTime()) / 1000;
    const remaining = Math.max(0, timer.duration - elapsed);

    const updatedTimer = {
      ...timer,
      isPaused: true,
      pausedAt: new Date().toISOString(),
      remainingWhenPaused: remaining,
    };

    await prisma.room.update({
      where: { code },
      data: {
        timerState: JSON.stringify(updatedTimer),
      },
    });

    res.json({ remaining });
  } catch (error) {
    console.error('Failed to pause timer:', error);
    res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// Resume timer
router.post('/:code/timer/resume', async (req, res) => {
  try {
    const { code } = req.params;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room || !room.timerState) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    const timer = JSON.parse(room.timerState);

    const updatedTimer = {
      ...timer,
      isRunning: true,
      isPaused: false,
      startedAt: new Date().toISOString(),
      duration: timer.remainingWhenPaused,
      pausedAt: null,
      remainingWhenPaused: null,
    };

    await prisma.room.update({
      where: { code },
      data: {
        timerState: JSON.stringify(updatedTimer),
      },
    });

    res.json({ timerState: updatedTimer, serverTime: Date.now() });
  } catch (error) {
    console.error('Failed to resume timer:', error);
    res.status(500).json({ error: 'Failed to resume timer' });
  }
});

// Add time
router.post('/:code/timer/add', async (req, res) => {
  try {
    const { code } = req.params;
    const { secondsToAdd } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room || !room.timerState) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    const timer = JSON.parse(room.timerState);

    let currentRemaining: number;
    if (timer.isPaused) {
      currentRemaining = timer.remainingWhenPaused;
    } else {
      const elapsed = (Date.now() - new Date(timer.startedAt).getTime()) / 1000;
      currentRemaining = Math.max(0, timer.duration - elapsed);
    }

    const newDuration = currentRemaining + secondsToAdd;

    const updatedTimer = {
      ...timer,
      startedAt: new Date().toISOString(),
      duration: newDuration,
      ...(timer.isPaused && { remainingWhenPaused: newDuration }),
    };

    await prisma.room.update({
      where: { code },
      data: {
        timerState: JSON.stringify(updatedTimer),
      },
    });

    res.json({ timerState: updatedTimer, serverTime: Date.now(), added: secondsToAdd });
  } catch (error) {
    console.error('Failed to add time:', error);
    res.status(500).json({ error: 'Failed to add time' });
  }
});

// Stop timer
router.post('/:code/timer/stop', async (req, res) => {
  try {
    const { code } = req.params;

    await prisma.room.update({
      where: { code },
      data: {
        timerState: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to stop timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// Calculate and save round results
router.post('/:code/rounds/:roundNumber/complete', async (req, res) => {
  try {
    const { code, roundNumber } = req.params;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        teams: {
          include: {
            players: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const round = await prisma.round.findUnique({
      where: {
        roomId_roundNumber: {
          roomId: room.id,
          roundNumber: parseInt(roundNumber),
        },
      },
      include: {
        wingResults: true,
      },
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    const results: Array<{
      teamId: string;
      wingPoints: number;
      gamePoints: number;
      totalPoints: number;
    }> = [];

    for (const team of room.teams) {
      // Calculate wing points (50 per completed wing)
      const teamPlayerIds = team.players.map((p) => p.id);
      const teamWingResults = round.wingResults.filter((w) =>
        teamPlayerIds.includes(w.playerId)
      );
      const completedWings = teamWingResults.filter((w) => w.completed).length;
      const wingPoints = completedWings * 50;

      // Game points from manual scoring (stored in gameState)
      const gameState = room.gameState ? JSON.parse(room.gameState) : {};
      const gamePoints = gameState.roundScores?.[team.id] || 0;

      const totalPoints = wingPoints + gamePoints;

      results.push({
        teamId: team.id,
        wingPoints,
        gamePoints,
        totalPoints,
      });
    }

    // Sort by total points and assign placements
    results.sort((a, b) => b.totalPoints - a.totalPoints);

    // Save round results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      await prisma.roundResult.upsert({
        where: {
          roundId_teamId: {
            roundId: round.id,
            teamId: result.teamId,
          },
        },
        update: {
          wingPoints: result.wingPoints,
          gamePoints: result.gamePoints,
          totalPoints: result.totalPoints,
          placement: i + 1,
        },
        create: {
          roundId: round.id,
          teamId: result.teamId,
          wingPoints: result.wingPoints,
          gamePoints: result.gamePoints,
          totalPoints: result.totalPoints,
          placement: i + 1,
        },
      });

      // Update team total score
      await prisma.team.update({
        where: { id: result.teamId },
        data: {
          score: {
            increment: result.totalPoints,
          },
        },
      });
    }

    // Mark round complete
    await prisma.round.update({
      where: { id: round.id },
      data: {
        phase: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    res.json(results);
  } catch (error) {
    console.error('Failed to complete round:', error);
    res.status(500).json({ error: 'Failed to complete round' });
  }
});

// Update game state (for trivia and other mini-games)
router.put('/:code/game-state', async (req, res) => {
  try {
    const { code } = req.params;
    const { gameState } = req.body;

    const room = await prisma.room.update({
      where: { code },
      data: {
        gameState: JSON.stringify(gameState),
      },
    });

    // Broadcast game state update to all clients
    const io = req.app.get('io');
    io.to(code).emit('game-state-updated', { gameState });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update game state:', error);
    res.status(500).json({ error: 'Failed to update game state' });
  }
});

// End game
router.post('/:code/end', async (req, res) => {
  try {
    const { code } = req.params;
    const { reason } = req.body;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        teams: {
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const winner = room.teams[0];
    const finalScores = room.teams.map((team, index) => ({
      teamId: team.id,
      teamName: team.name,
      score: team.score,
      place: index + 1,
    }));

    // Calculate stats
    const stats = {
      totalWingsConsumed: room.teams.reduce(
        (sum, t) => sum + t.totalWingsCompleted,
        0
      ),
      mostWings: { playerName: 'TBD', count: 0 }, // Would need to calculate
      hottestSauceSurvived: 'The Last Dab',
      closestRound: null,
      biggestComeback: null,
    };

    // Save game history
    await prisma.gameHistory.create({
      data: {
        roomId: room.id,
        gameNumber: room.gameNumber,
        winnerId: winner.id,
        winnerName: winner.name || 'Team 1',
        winnerScore: winner.score,
        finalScores: JSON.stringify(finalScores),
        stats: JSON.stringify(stats),
        startedAt: room.createdAt,
        endedAt: new Date(),
        durationMinutes: Math.round(
          (Date.now() - room.createdAt.getTime()) / 60000
        ),
      },
    });

    // Update room
    const updated = await prisma.room.update({
      where: { code },
      data: {
        phase: 'GAME_END',
        endedAt: new Date(),
        endedReason: reason || 'completed',
        winnerId: winner.id,
        finalStats: JSON.stringify(stats),
      },
      include: {
        teams: {
          orderBy: { score: 'desc' },
          include: { players: true },
        },
      },
    });

    // Broadcast phase change to all clients
    const io = req.app.get('io');
    io.to(code).emit('phase-changed', { phase: 'GAME_END' });

    res.json({
      room: updated,
      winner,
      finalScores,
      stats,
    });
  } catch (error) {
    console.error('Failed to end game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Reset game (play again)
router.post('/:code/reset', async (req, res) => {
  try {
    const { code } = req.params;
    const { keepTeams, shuffleTeams } = req.body;

    const room = await prisma.room.findUnique({
      where: { code },
      include: {
        teams: true,
        players: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Reset team scores
    await prisma.team.updateMany({
      where: { roomId: room.id },
      data: {
        score: 0,
        isReady: false,
        totalWingsCompleted: 0,
        totalWingsAttempted: 0,
      },
    });

    // Reset player stats
    await prisma.player.updateMany({
      where: { roomId: room.id },
      data: {
        isReady: false,
        wingsCompleted: 0,
        wingsAttempted: 0,
      },
    });

    // Delete old wing results
    const rounds = await prisma.round.findMany({
      where: { roomId: room.id },
    });
    for (const round of rounds) {
      await prisma.wingResult.deleteMany({
        where: { roundId: round.id },
      });
      await prisma.roundResult.deleteMany({
        where: { roundId: round.id },
      });
    }

    // Reset round phases
    await prisma.round.updateMany({
      where: { roomId: room.id },
      data: {
        phase: 'PENDING',
        startedAt: null,
        completedAt: null,
      },
    });

    // Shuffle teams if requested
    if (shuffleTeams && room.players.length > 0) {
      const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
      const teams = room.teams;
      const playersPerTeam = Math.ceil(shuffledPlayers.length / teams.length);

      for (let i = 0; i < shuffledPlayers.length; i++) {
        const teamIndex = Math.floor(i / playersPerTeam);
        if (teamIndex < teams.length) {
          await prisma.player.update({
            where: { id: shuffledPlayers[i].id },
            data: { teamId: teams[teamIndex].id },
          });
        }
      }
    }

    // Reset room state
    const newPhase = keepTeams ? 'TEAM_SETUP' : 'LOBBY';
    const updated = await prisma.room.update({
      where: { code },
      data: {
        phase: newPhase,
        currentRoundNumber: 0,
        timerState: null,
        isPaused: false,
        pausedAt: null,
        pausedReason: null,
        gameState: null,
        endedAt: null,
        endedReason: null,
        winnerId: null,
        finalStats: null,
        gameNumber: room.gameNumber + 1,
      },
      include: {
        teams: {
          include: { players: true },
        },
        players: true,
        rounds: true,
      },
    });

    // Broadcast phase change to all clients
    const io = req.app.get('io');
    io.to(code).emit('phase-changed', { phase: newPhase });

    res.json(updated);
  } catch (error) {
    console.error('Failed to reset game:', error);
    res.status(500).json({ error: 'Failed to reset game' });
  }
});

export default router;
