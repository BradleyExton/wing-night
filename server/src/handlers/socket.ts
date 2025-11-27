import { Server, Socket } from 'socket.io';
import prisma from '../lib/prisma.js';

interface RoomSockets {
  host?: string;
  display?: string;
  players: Map<string, string>; // sessionId -> socketId
}

const roomConnections = new Map<string, RoomSockets>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    let currentRoomCode: string | null = null;
    let currentRole: 'host' | 'display' | 'player' | null = null;
    let currentSessionId: string | null = null;

    // Join room as player
    socket.on('join-room', async ({ roomCode, sessionId }) => {
      try {
        const room = await prisma.room.findUnique({
          where: { code: roomCode },
          include: {
            teams: { include: { players: true } },
            players: { include: { team: true } },
            rounds: { orderBy: { roundNumber: 'asc' } },
            expectedGuests: { include: { team: true } },
          },
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
          return;
        }

        socket.join(roomCode);
        currentRoomCode = roomCode;
        currentRole = 'player';
        currentSessionId = sessionId || null;

        // Initialize room connections
        if (!roomConnections.has(roomCode)) {
          roomConnections.set(roomCode, { players: new Map() });
        }

        if (sessionId) {
          roomConnections.get(roomCode)!.players.set(sessionId, socket.id);

          // Update player connection status
          const player = await prisma.player.findUnique({
            where: { sessionId },
          });

          if (player) {
            await prisma.player.update({
              where: { id: player.id },
              data: {
                socketId: socket.id,
                isConnected: true,
                lastSeenAt: new Date(),
                disconnectedAt: null,
              },
            });

            io.to(roomCode).emit('player-connected', { playerId: player.id });
          }
        }

        // Send room state
        socket.emit('room-state', {
          room: {
            ...room,
            timerState: room.timerState ? JSON.parse(room.timerState) : null,
            gameState: room.gameState ? JSON.parse(room.gameState) : null,
            finalStats: room.finalStats ? JSON.parse(room.finalStats) : null,
          },
        });
      } catch (error) {
        console.error('Failed to join room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Join as host
    socket.on('join-as-host', async ({ roomCode }) => {
      try {
        const room = await prisma.room.findUnique({
          where: { code: roomCode },
          include: {
            teams: { include: { players: true } },
            players: { include: { team: true } },
            rounds: { orderBy: { roundNumber: 'asc' } },
            expectedGuests: { include: { team: true } },
          },
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
          return;
        }

        socket.join(roomCode);
        currentRoomCode = roomCode;
        currentRole = 'host';

        // Initialize room connections
        if (!roomConnections.has(roomCode)) {
          roomConnections.set(roomCode, { players: new Map() });
        }
        roomConnections.get(roomCode)!.host = socket.id;

        // Update room host status
        await prisma.room.update({
          where: { code: roomCode },
          data: {
            hostSocketId: socket.id,
            hostConnected: true,
            hostDisconnectedAt: null,
          },
        });

        // Notify all clients
        io.to(roomCode).emit('host-connected');

        // If game was paused due to host disconnect, resume
        if (room.isPaused && room.pausedReason === 'host_disconnected') {
          await prisma.room.update({
            where: { code: roomCode },
            data: {
              isPaused: false,
              pausedAt: null,
              pausedReason: null,
            },
          });
          io.to(roomCode).emit('game-resumed');
        }

        // Send room state
        socket.emit('room-state', {
          room: {
            ...room,
            timerState: room.timerState ? JSON.parse(room.timerState) : null,
            gameState: room.gameState ? JSON.parse(room.gameState) : null,
            finalStats: room.finalStats ? JSON.parse(room.finalStats) : null,
          },
        });
      } catch (error) {
        console.error('Failed to join as host:', error);
        socket.emit('error', { message: 'Failed to join as host' });
      }
    });

    // Join as display
    socket.on('join-as-display', async ({ roomCode }) => {
      try {
        const room = await prisma.room.findUnique({
          where: { code: roomCode },
          include: {
            teams: { include: { players: true } },
            players: { include: { team: true } },
            rounds: { orderBy: { roundNumber: 'asc' } },
            expectedGuests: { include: { team: true } },
          },
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
          return;
        }

        socket.join(roomCode);
        currentRoomCode = roomCode;
        currentRole = 'display';

        // Initialize room connections
        if (!roomConnections.has(roomCode)) {
          roomConnections.set(roomCode, { players: new Map() });
        }
        roomConnections.get(roomCode)!.display = socket.id;

        // Update room display status
        await prisma.room.update({
          where: { code: roomCode },
          data: {
            displaySocketId: socket.id,
            displayConnected: true,
          },
        });

        // Notify host
        const roomConns = roomConnections.get(roomCode);
        if (roomConns?.host) {
          io.to(roomConns.host).emit('display-connected');
        }

        // Send room state
        socket.emit('room-state', {
          room: {
            ...room,
            timerState: room.timerState ? JSON.parse(room.timerState) : null,
            gameState: room.gameState ? JSON.parse(room.gameState) : null,
            finalStats: room.finalStats ? JSON.parse(room.finalStats) : null,
          },
        });
      } catch (error) {
        console.error('Failed to join as display:', error);
        socket.emit('error', { message: 'Failed to join as display' });
      }
    });

    // Leave room
    socket.on('leave-room', async () => {
      if (currentRoomCode) {
        await handleDisconnect(socket, io, currentRoomCode, currentRole, currentSessionId);
        socket.leave(currentRoomCode);
        currentRoomCode = null;
        currentRole = null;
        currentSessionId = null;
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (currentRoomCode) {
        await handleDisconnect(socket, io, currentRoomCode, currentRole, currentSessionId);
      }
    });

    // Tablet handoff events
    socket.on('tablet-team-ready', async ({ teamId }) => {
      if (currentRoomCode) {
        io.to(currentRoomCode).emit('tablet-team-started', { teamId });
      }
    });

    socket.on('tablet-returned', async () => {
      if (currentRoomCode) {
        io.to(currentRoomCode).emit('tablet-mode-changed', { mode: 'HOST_CONTROL' });
      }
    });
  });

  return io;
}

async function handleDisconnect(
  socket: Socket,
  io: Server,
  roomCode: string,
  role: 'host' | 'display' | 'player' | null,
  sessionId: string | null
) {
  try {
    const roomConns = roomConnections.get(roomCode);

    if (role === 'host') {
      if (roomConns) {
        roomConns.host = undefined;
      }

      // Update room host status
      const room = await prisma.room.update({
        where: { code: roomCode },
        data: {
          hostConnected: false,
          hostDisconnectedAt: new Date(),
        },
      });

      // Auto-pause if game is in progress
      const activePhases = ['EATING_PHASE', 'GAME_PHASE', 'ROUND_INTRO', 'ROUND_RESULTS'];
      if (activePhases.includes(room.phase)) {
        await prisma.room.update({
          where: { code: roomCode },
          data: {
            isPaused: true,
            pausedAt: new Date(),
            pausedReason: 'host_disconnected',
          },
        });
        io.to(roomCode).emit('game-paused', { reason: 'Host disconnected' });
      }

      io.to(roomCode).emit('host-disconnected', { isPaused: activePhases.includes(room.phase) });
    } else if (role === 'display') {
      if (roomConns) {
        roomConns.display = undefined;
      }

      await prisma.room.update({
        where: { code: roomCode },
        data: {
          displayConnected: false,
        },
      });

      // Notify host
      if (roomConns?.host) {
        io.to(roomConns.host).emit('display-disconnected');
      }
    } else if (role === 'player' && sessionId) {
      if (roomConns) {
        roomConns.players.delete(sessionId);
      }

      const player = await prisma.player.findUnique({
        where: { sessionId },
      });

      if (player) {
        await prisma.player.update({
          where: { id: player.id },
          data: {
            isConnected: false,
            disconnectedAt: new Date(),
          },
        });

        io.to(roomCode).emit('player-disconnected', { playerId: player.id });
      }
    }
  } catch (error) {
    console.error('Error handling disconnect:', error);
  }
}

// Helper function to broadcast room updates
export async function broadcastRoomUpdate(io: Server, roomCode: string, changes: Record<string, unknown>) {
  io.to(roomCode).emit('room-updated', { changes });
}

