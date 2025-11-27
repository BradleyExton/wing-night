const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Room endpoints
export const api = {
  // Rooms
  createRoom: () => request<{ room: { code: string; editCode: string }; urls: Record<string, string> }>('/rooms', { method: 'POST' }),

  getRoom: (code: string) => request<any>(`/rooms/${code}`),

  getRoomByEditCode: (editCode: string) => request<any>(`/rooms/edit/${editCode}`),

  getPreview: (code: string) => request<any>(`/rooms/${code}/preview`),

  updateRoom: (code: string, data: any) => request<any>(`/rooms/${code}`, { method: 'PUT', body: JSON.stringify(data) }),

  lockRoom: (code: string, locked: boolean) => request<any>(`/rooms/${code}/lock`, { method: 'PUT', body: JSON.stringify({ locked }) }),

  openRoom: (code: string) => request<any>(`/rooms/${code}/open`, { method: 'POST' }),

  advancePhase: (code: string, phase: string) => request<any>(`/rooms/${code}/phase`, { method: 'POST', body: JSON.stringify({ phase }) }),

  updateRounds: (code: string, rounds: any[]) => request<any>(`/rooms/${code}/rounds`, { method: 'PUT', body: JSON.stringify({ rounds }) }),

  deleteRoom: (code: string) => request<any>(`/rooms/${code}`, { method: 'DELETE' }),

  // Teams
  getTeams: (code: string) => request<any>(`/rooms/${code}/teams`),

  createTeam: (code: string, data: any) => request<any>(`/rooms/${code}/teams`, { method: 'POST', body: JSON.stringify(data) }),

  updateTeam: (code: string, teamId: string, data: any) => request<any>(`/rooms/${code}/teams/${teamId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTeam: (code: string, teamId: string) => request<any>(`/rooms/${code}/teams/${teamId}`, { method: 'DELETE' }),

  generateLogo: (code: string, teamId: string, prompt: string) => request<any>(`/rooms/${code}/teams/${teamId}/logo/generate`, { method: 'POST', body: JSON.stringify({ prompt }) }),

  adjustScore: (code: string, teamId: string, adjustment: number, reason?: string) => request<any>(`/rooms/${code}/teams/${teamId}/score`, { method: 'POST', body: JSON.stringify({ adjustment, reason }) }),

  // Players
  joinRoom: (code: string, playerName: string, sessionId?: string, expectedGuestId?: string) =>
    request<any>(`/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName, sessionId, expectedGuestId }),
    }),

  addPlayer: (code: string, data: any) => request<any>(`/rooms/${code}/players`, { method: 'POST', body: JSON.stringify(data) }),

  updatePlayer: (code: string, playerId: string, data: any) => request<any>(`/rooms/${code}/players/${playerId}`, { method: 'PUT', body: JSON.stringify(data) }),

  removePlayer: (code: string, playerId: string) => request<any>(`/rooms/${code}/players/${playerId}`, { method: 'DELETE' }),

  // Expected Guests
  getGuests: (code: string) => request<any>(`/rooms/${code}/guests`),

  addGuest: (code: string, data: any) => request<any>(`/rooms/${code}/guests`, { method: 'POST', body: JSON.stringify(data) }),

  updateGuest: (code: string, guestId: string, data: any) => request<any>(`/rooms/${code}/guests/${guestId}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteGuest: (code: string, guestId: string) => request<any>(`/rooms/${code}/guests/${guestId}`, { method: 'DELETE' }),

  // Game
  getCurrentRound: (code: string) => request<any>(`/rooms/${code}/rounds/current`),

  updateWing: (code: string, roundNumber: number, playerId: string, completed: boolean) =>
    request<any>(`/rooms/${code}/rounds/${roundNumber}/wings`, {
      method: 'POST',
      body: JSON.stringify({ playerId, completed }),
    }),

  markTeamWings: (code: string, roundNumber: number, teamId: string, completed: boolean) =>
    request<any>(`/rooms/${code}/rounds/${roundNumber}/wings/team/${teamId}`, {
      method: 'POST',
      body: JSON.stringify({ completed }),
    }),

  getWingStatus: (code: string, roundNumber: number) => request<any>(`/rooms/${code}/rounds/${roundNumber}/wings`),

  startTimer: (code: string, duration: number, type: string, teamId?: string) =>
    request<any>(`/rooms/${code}/timer/start`, {
      method: 'POST',
      body: JSON.stringify({ duration, type, teamId }),
    }),

  pauseTimer: (code: string) => request<any>(`/rooms/${code}/timer/pause`, { method: 'POST' }),

  resumeTimer: (code: string) => request<any>(`/rooms/${code}/timer/resume`, { method: 'POST' }),

  addTime: (code: string, secondsToAdd: number) =>
    request<any>(`/rooms/${code}/timer/add`, {
      method: 'POST',
      body: JSON.stringify({ secondsToAdd }),
    }),

  stopTimer: (code: string) => request<any>(`/rooms/${code}/timer/stop`, { method: 'POST' }),

  completeRound: (code: string, roundNumber: number) => request<any>(`/rooms/${code}/rounds/${roundNumber}/complete`, { method: 'POST' }),

  updateGameState: (code: string, gameState: any) => request<any>(`/rooms/${code}/game-state`, { method: 'PUT', body: JSON.stringify({ gameState }) }),

  endGame: (code: string, reason?: string) => request<any>(`/rooms/${code}/end`, { method: 'POST', body: JSON.stringify({ reason }) }),

  resetGame: (code: string, keepTeams: boolean, shuffleTeams: boolean) =>
    request<any>(`/rooms/${code}/reset`, {
      method: 'POST',
      body: JSON.stringify({ keepTeams, shuffleTeams }),
    }),
};

export default api;
