// Re-export all types from shared package
// In production, you'd import from @wing-night/shared
// For now, we'll duplicate the essential types

export type GamePhase =
  | 'DRAFT'
  | 'LOBBY'
  | 'TEAM_SETUP'
  | 'GAME_INTRO'
  | 'ROUND_INTRO'
  | 'EATING_PHASE'
  | 'GAME_SELECTION'
  | 'GAME_PHASE'
  | 'ROUND_RESULTS'
  | 'GAME_END';

export type TabletMode =
  | 'HOST_CONTROL'
  | 'HANDOFF_TO_TEAM'
  | 'TEAM_READY'
  | 'PLAYER_GAME'
  | 'RETURN_TO_HOST';

export type TimerType =
  | 'EATING_PHASE'
  | 'STUDY_PHASE'
  | 'TEAM_TURN'
  | 'DRAWING_TURN'
  | 'SUBMISSION'
  | 'VOTING';

export type TimerState = {
  isRunning: boolean;
  duration: number;
  startedAt: string | null;
  isPaused: boolean;
  pausedAt: string | null;
  remainingWhenPaused: number | null;
  type: TimerType;
  teamId?: string;
};

export type Player = {
  id: string;
  roomId: string;
  teamId: string | null;
  name: string;
  photoUrl: string | null;
  socketId: string | null;
  sessionId: string | null;
  isConnected: boolean;
  hasDevice: boolean;
  lastSeenAt: string | null;
  disconnectedAt: string | null;
  isReady: boolean;
  joinedAt: string;
  joinedVia: string;
  wingsCompleted: number;
  wingsAttempted: number;
  expectedGuestId: string | null;
  teamChangeRequested: boolean;
  requestedTeamId: string | null;
  team?: Team;
  createdAt: string;
  updatedAt: string;
};

export type Team = {
  id: string;
  roomId: string;
  name: string | null;
  emoji: string | null;
  logoUrl: string | null;
  logoType: string | null;
  logoPrompt: string | null;
  aiAttemptsUsed: number;
  maxAiAttempts: number;
  currentSize: number;
  maxSize: number;
  isReady: boolean;
  score: number;
  totalWingsCompleted: number;
  totalWingsAttempted: number;
  createdBy: string;
  createdById: string | null;
  players: Player[];
  createdAt: string;
  updatedAt: string;
};

export type ExpectedGuest = {
  id: string;
  roomId: string;
  teamId: string | null;
  name: string;
  photoUrl: string | null;
  claimedById: string | null;
  claimedAt: string | null;
  team?: Team;
  createdAt: string;
};

export type Round = {
  id: string;
  roomId: string;
  roundNumber: number;
  sauceName: string | null;
  sauceScovilles: number | null;
  sauceNotes: string | null;
  gameType: string | null;
  gameSelectionMode: string;
  gameConfig: unknown | null;
  phase: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export type GameState = {
  roundScores?: Record<string, number>;
  [key: string]: unknown;
};

export type Room = {
  id: string;
  code: string;
  editCode: string;
  name: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  phase: GamePhase;
  teamSelectionMode: string;
  maxTeams: number;
  maxPlayersPerTeam: number;
  allowWalkIns: boolean;
  isLocked: boolean;
  lockedAt: string | null;
  hostSocketId: string | null;
  hostConnected: boolean;
  hostDisconnectedAt: string | null;
  displaySocketId: string | null;
  displayConnected: boolean;
  currentRoundNumber: number;
  totalRounds: number;
  timerState: TimerState | null;
  isPaused: boolean;
  pausedAt: string | null;
  pausedReason: string | null;
  gameState: GameState | null;
  soundEnabled: boolean;
  endedAt: string | null;
  endedReason: string | null;
  winnerId: string | null;
  finalStats: unknown | null;
  previousGameId: string | null;
  gameNumber: number;
  teams: Team[];
  players: Player[];
  rounds: Round[];
  expectedGuests: ExpectedGuest[];
  createdAt: string;
  updatedAt: string;
};

export type WingStatus = {
  [playerId: string]: boolean;
};
