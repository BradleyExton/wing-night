import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { calculateRoundResults } from '../lib/scoring.js';
import { requireRoomHostOrEditCode } from '../middleware/roomAuth.js';

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
router.post('/:code/rounds/:roundNumber/wings', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code, roundNumber } = req.params;
    const { playerId, completed } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player || player.roomId !== room.id) {
      return res.status(404).json({ error: 'Player not found' });
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

    const io = req.app.get('io');
    io.to(code).emit('wing-completed', { playerId, completed });

    res.json(wingResult);
  } catch (error) {
    console.error('Failed to update wing completion:', error);
    res.status(500).json({ error: 'Failed to update wing completion' });
  }
});

// Mark all wings for team
router.post('/:code/rounds/:roundNumber/wings/team/:teamId', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code, roundNumber, teamId } = req.params;
    const { completed } = req.body;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.roomId !== room.id) {
      return res.status(404).json({ error: 'Team not found' });
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

    const updatedRound = await prisma.round.findUnique({
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

    if (updatedRound) {
      const wingStatus: Record<string, boolean> = {};
      for (const result of updatedRound.wingResults) {
        wingStatus[result.playerId] = result.completed;
      }
      const io = req.app.get('io');
      io.to(code).emit('wings-updated', { wingStatus });
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
router.post('/:code/timer/start', requireRoomHostOrEditCode, async (req, res) => {
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

    await prisma.room.update({
      where: { code },
      data: {
        timerState: JSON.stringify(timerState),
      },
    });

    const io = req.app.get('io');
    io.to(code).emit('timer-started', { timerState });

    res.json({ timerState, serverTime: Date.now() });
  } catch (error) {
    console.error('Failed to start timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Pause timer
router.post('/:code/timer/pause', requireRoomHostOrEditCode, async (req, res) => {
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

    const io = req.app.get('io');
    io.to(code).emit('timer-updated', { timerState: updatedTimer });

    res.json({ remaining });
  } catch (error) {
    console.error('Failed to pause timer:', error);
    res.status(500).json({ error: 'Failed to pause timer' });
  }
});

// Resume timer
router.post('/:code/timer/resume', requireRoomHostOrEditCode, async (req, res) => {
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

    const io = req.app.get('io');
    io.to(code).emit('timer-updated', { timerState: updatedTimer });

    res.json({ timerState: updatedTimer, serverTime: Date.now() });
  } catch (error) {
    console.error('Failed to resume timer:', error);
    res.status(500).json({ error: 'Failed to resume timer' });
  }
});

// Add time
router.post('/:code/timer/add', requireRoomHostOrEditCode, async (req, res) => {
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

    const io = req.app.get('io');
    io.to(code).emit('timer-updated', { timerState: updatedTimer });

    res.json({ timerState: updatedTimer, serverTime: Date.now(), added: secondsToAdd });
  } catch (error) {
    console.error('Failed to add time:', error);
    res.status(500).json({ error: 'Failed to add time' });
  }
});

// Stop timer
router.post('/:code/timer/stop', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code } = req.params;

    await prisma.room.update({
      where: { code },
      data: {
        timerState: null,
      },
    });

    const io = req.app.get('io');
    io.to(code).emit('timer-updated', { timerState: null });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to stop timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// Calculate and save round results
router.post('/:code/rounds/:roundNumber/complete', requireRoomHostOrEditCode, async (req, res) => {
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

    const gameState = room.gameState ? JSON.parse(room.gameState) : {};
    const results = calculateRoundResults(room.teams, round.wingResults, gameState);

    const existingResults = await prisma.roundResult.findMany({
      where: { roundId: round.id },
      select: { teamId: true, totalPoints: true },
    });
    const existingByTeam = new Map(existingResults.map((r) => [r.teamId, r.totalPoints]));

    // Save round results
    const teamScores: Record<string, number> = {};
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const previousTotal = existingByTeam.get(result.teamId) ?? 0;
      const delta = result.totalPoints - previousTotal;

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
          placement: result.placement,
        },
        create: {
          roundId: round.id,
          teamId: result.teamId,
          wingPoints: result.wingPoints,
          gamePoints: result.gamePoints,
          totalPoints: result.totalPoints,
          placement: result.placement,
        },
      });

      let updatedScore: number;
      if (delta !== 0) {
        const updatedTeam = await prisma.team.update({
          where: { id: result.teamId },
          data: {
            score: {
              increment: delta,
            },
          },
        });
        updatedScore = updatedTeam.score;
      } else {
        const existingTeam = room.teams.find((t) => t.id === result.teamId);
        updatedScore = existingTeam?.score ?? 0;
      }
      teamScores[result.teamId] = updatedScore;
    }

    // Mark round complete
    await prisma.round.update({
      where: { id: round.id },
      data: {
        phase: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    const io = req.app.get('io');
    io.to(code).emit('scores-updated', { teamScores });

    res.json(results);
  } catch (error) {
    console.error('Failed to complete round:', error);
    res.status(500).json({ error: 'Failed to complete round' });
  }
});

// Trivia buzz-in endpoint
router.post('/:code/trivia/buzz', async (req, res) => {
  try {
    const { code } = req.params;
    const { teamId, playerId, playerName } = req.body;

    const room = await prisma.room.findUnique({
      where: { code },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const gameState = room.gameState ? JSON.parse(room.gameState) : null;
    if (!gameState) {
      return res.status(400).json({ error: 'No game state' });
    }

    // Check if question is active and no one has buzzed yet
    if (!gameState.questionActive) {
      return res.status(400).json({ error: 'Question not active' });
    }

    if (gameState.buzzLocked) {
      return res.status(400).json({ error: 'Already buzzed', buzzedTeamId: gameState.buzzedTeamId });
    }

    // Check if team already failed this question
    if (gameState.failedTeams?.includes(teamId)) {
      return res.status(400).json({ error: 'Team already failed this question' });
    }

    // Register the buzz
    const updatedState = {
      ...gameState,
      buzzedTeamId: teamId,
      buzzedPlayerId: playerId,
      buzzedPlayerName: playerName,
      buzzLocked: true,
    };

    await prisma.room.update({
      where: { code },
      data: {
        gameState: JSON.stringify(updatedState),
      },
    });

    // Broadcast to all clients
    const io = req.app.get('io');
    io.to(code).emit('trivia-buzz', {
      teamId,
      playerId,
      playerName,
    });
    io.to(code).emit('game-state-updated', { gameState: updatedState });

    res.json({ success: true, buzzedFirst: true });
  } catch (error) {
    console.error('Failed to process buzz:', error);
    res.status(500).json({ error: 'Failed to process buzz' });
  }
});

// Host marks answer correct or wrong
router.post('/:code/trivia/result', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code } = req.params;
    const { correct, pointsAwarded } = req.body;

    const room = await prisma.room.findUnique({
      where: { code },
      include: { teams: true },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const gameState = room.gameState ? JSON.parse(room.gameState) : null;
    if (!gameState || !gameState.buzzedTeamId) {
      return res.status(400).json({ error: 'No team has buzzed' });
    }

    const io = req.app.get('io');
    const buzzedTeamId = gameState.buzzedTeamId;

    if (correct) {
      // Award points
      const updatedTeam = await prisma.team.update({
        where: { id: buzzedTeamId },
        data: { score: { increment: pointsAwarded || 100 } },
      });

      // Update team answers for tracking
      const teamAnswers = gameState.teamAnswers || {};
      if (!teamAnswers[buzzedTeamId]) {
        teamAnswers[buzzedTeamId] = [];
      }
      teamAnswers[buzzedTeamId][gameState.currentQuestionIndex] = true;

      // Move to showing answer, question is complete
      const updatedState = {
        ...gameState,
        showAnswer: true,
        questionActive: false,
        teamAnswers,
      };

      await prisma.room.update({
        where: { code },
        data: { gameState: JSON.stringify(updatedState) },
      });

      // Broadcast correct answer
      io.to(code).emit('trivia-result', {
        correct: true,
        teamId: buzzedTeamId,
        pointsAwarded: pointsAwarded || 100,
      });
      io.to(code).emit('game-state-updated', { gameState: updatedState });

      const teamScores = Object.fromEntries(
        room.teams.map(team => [
          team.id,
          team.id === buzzedTeamId ? updatedTeam.score : team.score,
        ])
      );
      io.to(code).emit('scores-updated', { teamScores });
    } else {
      // Wrong answer - add to failed teams, unlock for steal
      const failedTeams = [...(gameState.failedTeams || []), buzzedTeamId];

      // Check if all teams have failed
      const allTeamIds = room.teams.map((t) => t.id);
      const remainingTeams = allTeamIds.filter((id) => !failedTeams.includes(id));

      let updatedState;
      if (remainingTeams.length === 0) {
        // All teams failed, show answer and end question
        updatedState = {
          ...gameState,
          showAnswer: true,
          questionActive: false,
          buzzedTeamId: null,
          buzzedPlayerId: null,
          buzzedPlayerName: null,
          buzzLocked: false,
          failedTeams: [],
        };
      } else {
        // Open for steal
        updatedState = {
          ...gameState,
          failedTeams,
          buzzedTeamId: null,
          buzzedPlayerId: null,
          buzzedPlayerName: null,
          buzzLocked: false,
          // questionActive stays true for steal opportunity
        };
      }

      await prisma.room.update({
        where: { code },
        data: { gameState: JSON.stringify(updatedState) },
      });

      io.to(code).emit('trivia-result', {
        correct: false,
        teamId: buzzedTeamId,
        stealAvailable: remainingTeams.length > 0,
        remainingTeams,
      });
      io.to(code).emit('game-state-updated', { gameState: updatedState });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to process result:', error);
    res.status(500).json({ error: 'Failed to process result' });
  }
});

// Host skips question (no one got it)
router.post('/:code/trivia/skip', requireRoomHostOrEditCode, async (req, res) => {
  try {
    const { code } = req.params;

    const room = await prisma.room.findUnique({ where: { code } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const gameState = room.gameState ? JSON.parse(room.gameState) : null;
    if (!gameState) {
      return res.status(400).json({ error: 'No game state' });
    }

    const updatedState = {
      ...gameState,
      showAnswer: true,
      questionActive: false,
      buzzedTeamId: null,
      buzzedPlayerId: null,
      buzzedPlayerName: null,
      buzzLocked: false,
      failedTeams: [],
    };

    await prisma.room.update({
      where: { code },
      data: { gameState: JSON.stringify(updatedState) },
    });

    const io = req.app.get('io');
    io.to(code).emit('trivia-skipped', {});
    io.to(code).emit('game-state-updated', { gameState: updatedState });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to skip question:', error);
    res.status(500).json({ error: 'Failed to skip question' });
  }
});

// Update game state (for trivia and other mini-games)
router.put('/:code/game-state', requireRoomHostOrEditCode, async (req, res) => {
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
router.post('/:code/end', requireRoomHostOrEditCode, async (req, res) => {
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
router.post('/:code/reset', requireRoomHostOrEditCode, async (req, res) => {
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
    io.to(code).emit('room-state', {
      room: {
        ...updated,
        timerState: updated.timerState ? JSON.parse(updated.timerState) : null,
        gameState: updated.gameState ? JSON.parse(updated.gameState) : null,
        finalStats: updated.finalStats ? JSON.parse(updated.finalStats) : null,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to reset game:', error);
    res.status(500).json({ error: 'Failed to reset game' });
  }
});

export default router;
