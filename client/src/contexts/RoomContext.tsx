import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Room, Player, Team, TimerState, WingStatus } from '../types';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { api } from '../lib/api';

interface RoomContextType {
  room: Room | null;
  player: Player | null;
  sessionId: string | null;
  isConnected: boolean;
  isHost: boolean;
  isDisplay: boolean;
  wingStatus: WingStatus;
  error: string | null;
  joinAsPlayer: (code: string, name: string, expectedGuestId?: string) => Promise<void>;
  joinAsHost: (code: string) => Promise<void>;
  joinAsDisplay: (code: string) => Promise<void>;
  leave: () => void;
  refreshRoom: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('wing-night-session')
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isDisplay, setIsDisplay] = useState(false);
  const [wingStatus, setWingStatus] = useState<WingStatus>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    socket.on('room-state', (data: { room: Room }) => {
      setRoom(data.room);
    });

    socket.on('room-updated', (data: { changes: Partial<Room> }) => {
      setRoom(prev => prev ? { ...prev, ...data.changes } : null);
    });

    socket.on('player-joined', (data: { player: Player; team?: Team }) => {
      setRoom(prev => {
        if (!prev) return null;
        const players = [...prev.players, data.player];
        const teams = data.team
          ? prev.teams.map(t => t.id === data.team!.id ? data.team! : t)
          : prev.teams;
        return { ...prev, players, teams };
      });
    });

    socket.on('player-left', (data: { playerId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        const players = prev.players.filter(p => p.id !== data.playerId);
        return { ...prev, players };
      });
    });

    socket.on('player-updated', (data: { playerId: string; changes: Partial<Player> }) => {
      setRoom(prev => {
        if (!prev) return null;

        // Update player in players array
        const updatedPlayer = prev.players.find(p => p.id === data.playerId);
        const players = prev.players.map(p =>
          p.id === data.playerId ? { ...p, ...data.changes } : p
        );

        // If teamId changed, update team.players arrays
        let teams = prev.teams;
        if (data.changes.teamId !== undefined && updatedPlayer) {
          const oldTeamId = updatedPlayer.teamId;
          const newTeamId = data.changes.teamId;

          teams = prev.teams.map(t => {
            // Remove player from old team
            if (t.id === oldTeamId) {
              return { ...t, players: t.players.filter(p => p.id !== data.playerId) };
            }
            // Add player to new team
            if (t.id === newTeamId) {
              const playerToAdd = { ...updatedPlayer, ...data.changes };
              return { ...t, players: [...t.players, playerToAdd] };
            }
            return t;
          });
        }

        return { ...prev, players, teams };
      });
      // Also update the current player if it's them
      setPlayer(prev => {
        if (!prev || prev.id !== data.playerId) return prev;
        return { ...prev, ...data.changes };
      });
    });

    socket.on('team-created', (data: { team: Team }) => {
      setRoom(prev => {
        if (!prev) return null;
        return { ...prev, teams: [...prev.teams, data.team] };
      });
    });

    socket.on('team-updated', (data: { teamId: string; changes: Partial<Team> }) => {
      setRoom(prev => {
        if (!prev) return null;
        const teams = prev.teams.map(t =>
          t.id === data.teamId ? { ...t, ...data.changes } : t
        );
        return { ...prev, teams };
      });
    });

    socket.on('team-deleted', (data: { teamId: string }) => {
      setRoom(prev => {
        if (!prev) return null;
        const teams = prev.teams.filter(t => t.id !== data.teamId);
        return { ...prev, teams };
      });
    });

    socket.on('phase-changed', (data: { phase: string }) => {
      setRoom(prev => prev ? { ...prev, phase: data.phase as Room['phase'] } : null);
    });

    socket.on('timer-started', (data: { timerState: TimerState }) => {
      setRoom(prev => prev ? { ...prev, timerState: data.timerState } : null);
    });

    socket.on('timer-paused', () => {
      setRoom(prev => {
        if (!prev?.timerState) return prev;
        return { ...prev, timerState: { ...prev.timerState, isPaused: true } };
      });
    });

    socket.on('timer-resumed', (data: { timerState: TimerState }) => {
      setRoom(prev => prev ? { ...prev, timerState: data.timerState } : null);
    });

    socket.on('timer-updated', (data: { timerState: TimerState }) => {
      setRoom(prev => prev ? { ...prev, timerState: data.timerState } : null);
    });

    socket.on('scores-updated', (data: { teamScores: Record<string, number> }) => {
      setRoom(prev => {
        if (!prev) return null;
        const teams = prev.teams.map(t => ({
          ...t,
          score: data.teamScores[t.id] ?? t.score,
        }));
        return { ...prev, teams };
      });
    });

    socket.on('wing-completed', (data: { playerId: string; completed: boolean }) => {
      setWingStatus(prev => ({ ...prev, [data.playerId]: data.completed }));
    });

    socket.on('wings-updated', (data: { wingStatus: WingStatus }) => {
      setWingStatus(data.wingStatus);
    });

    socket.on('game-paused', () => {
      setRoom(prev => prev ? { ...prev, isPaused: true } : null);
    });

    socket.on('game-resumed', () => {
      setRoom(prev => prev ? { ...prev, isPaused: false } : null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('error');
      socket.off('room-state');
      socket.off('room-updated');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('player-updated');
      socket.off('team-created');
      socket.off('team-updated');
      socket.off('team-deleted');
      socket.off('phase-changed');
      socket.off('timer-started');
      socket.off('timer-paused');
      socket.off('timer-resumed');
      socket.off('timer-updated');
      socket.off('scores-updated');
      socket.off('wing-completed');
      socket.off('wings-updated');
      socket.off('game-paused');
      socket.off('game-resumed');
    };
  }, []);

  const joinAsPlayer = useCallback(async (code: string, name: string, expectedGuestId?: string) => {
    try {
      setError(null);
      const result = await api.joinRoom(code, name, sessionId || undefined, expectedGuestId);

      if (result.sessionId) {
        localStorage.setItem('wing-night-session', result.sessionId);
        setSessionId(result.sessionId);
      }

      setPlayer(result.player);
      setIsHost(false);
      setIsDisplay(false);

      const socket = connectSocket();
      socket.emit('join-room', { roomCode: code, sessionId: result.sessionId || sessionId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
      throw err;
    }
  }, [sessionId]);

  const joinAsHost = useCallback(async (code: string) => {
    try {
      setError(null);
      const roomData = await api.getRoom(code);
      setRoom(roomData);
      setIsHost(true);
      setIsDisplay(false);

      const socket = connectSocket();
      socket.emit('join-as-host', { roomCode: code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join as host');
      throw err;
    }
  }, []);

  const joinAsDisplay = useCallback(async (code: string) => {
    try {
      setError(null);
      const roomData = await api.getRoom(code);
      setRoom(roomData);
      setIsHost(false);
      setIsDisplay(true);

      const socket = connectSocket();
      socket.emit('join-as-display', { roomCode: code });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join as display');
      throw err;
    }
  }, []);

  const leave = useCallback(() => {
    const socket = getSocket();
    socket.emit('leave-room');
    disconnectSocket();
    setRoom(null);
    setPlayer(null);
    setIsHost(false);
    setIsDisplay(false);
    setWingStatus({});
  }, []);

  const refreshRoom = useCallback(async () => {
    if (!room) return;
    try {
      const roomData = await api.getRoom(room.code);
      setRoom(roomData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh room');
    }
  }, [room]);

  return (
    <RoomContext.Provider
      value={{
        room,
        player,
        sessionId,
        isConnected,
        isHost,
        isDisplay,
        wingStatus,
        error,
        joinAsPlayer,
        joinAsHost,
        joinAsDisplay,
        leave,
        refreshRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
