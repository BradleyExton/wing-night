// ============================================
// GAME PHASES
// ============================================

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

export type TeamSelectionMode = 'SELF_SELECT' | 'HOST_ASSIGN';

export type GameSelectionMode = 'PRE_SET' | 'HOST_CHOICE' | 'RANDOM';

export type JoinedVia = 'PHONE' | 'HOST_ADDED' | 'EXPECTED_GUEST';

export type LogoType = 'AI_GENERATED' | 'UPLOADED';

export type CreatedBy = 'HOST' | 'PLAYER';

export type MarkedBy = 'HOST' | 'SELF';

export type VotedVia = 'PHONE' | 'HOST_PROXY';

// ============================================
// TIMER STATE
// ============================================

export interface TimerState {
  isRunning: boolean;
  duration: number;
  startedAt: string | null;
  isPaused: boolean;
  pausedAt: string | null;
  remainingWhenPaused: number | null;
  type: TimerType;
  teamId?: string;
}

// ============================================
// ROOM
// ============================================

export interface Room {
  id: string;
  code: string;
  editCode: string;
  name: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  phase: GamePhase;
  teamSelectionMode: TeamSelectionMode;
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
  gameState: unknown | null;
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
}

// ============================================
// TEAM
// ============================================

export interface Team {
  id: string;
  roomId: string;
  name: string | null;
  emoji: string | null;
  logoUrl: string | null;
  logoType: LogoType | null;
  logoPrompt: string | null;
  aiAttemptsUsed: number;
  maxAiAttempts: number;
  currentSize: number;
  maxSize: number;
  isReady: boolean;
  score: number;
  totalWingsCompleted: number;
  totalWingsAttempted: number;
  createdBy: CreatedBy;
  createdById: string | null;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PLAYER
// ============================================

export interface Player {
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
  joinedVia: JoinedVia;
  wingsCompleted: number;
  wingsAttempted: number;
  expectedGuestId: string | null;
  teamChangeRequested: boolean;
  requestedTeamId: string | null;
  team?: Team;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// EXPECTED GUEST
// ============================================

export interface ExpectedGuest {
  id: string;
  roomId: string;
  teamId: string | null;
  name: string;
  photoUrl: string | null;
  claimedById: string | null;
  claimedAt: string | null;
  team?: Team;
  claimedBy?: Player;
  createdAt: string;
}

// ============================================
// ROUND
// ============================================

export interface Round {
  id: string;
  roomId: string;
  roundNumber: number;
  sauceName: string | null;
  sauceScovilles: number | null;
  sauceNotes: string | null;
  gameType: string | null;
  gameSelectionMode: GameSelectionMode;
  gameConfig: unknown | null;
  phase: string;
  startedAt: string | null;
  completedAt: string | null;
  roundResults: RoundResult[];
  wingResults: WingResult[];
  createdAt: string;
}

// ============================================
// ROUND RESULT
// ============================================

export interface RoundResult {
  id: string;
  roundId: string;
  teamId: string;
  wingPoints: number;
  gamePoints: number;
  bonusPoints: number;
  totalPoints: number;
  placement: number | null;
  team?: Team;
  createdAt: string;
}

// ============================================
// WING RESULT
// ============================================

export interface WingResult {
  id: string;
  roundId: string;
  playerId: string;
  completed: boolean;
  markedBy: MarkedBy;
  completedAt: string | null;
  player?: Player;
  createdAt: string;
}

// ============================================
// VOTE
// ============================================

export interface Vote {
  id: string;
  roomId: string;
  roundNumber: number;
  gameType: string;
  playerId: string;
  playerName: string;
  teamId: string;
  votedFor: string;
  votedVia: VotedVia;
  createdAt: string;
}

// ============================================
// GAME HISTORY
// ============================================

export interface GameHistory {
  id: string;
  roomId: string;
  gameNumber: number;
  winnerId: string;
  winnerName: string;
  winnerScore: number;
  finalScores: FinalScore[];
  stats: GameStats;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  createdAt: string;
}

export interface FinalScore {
  teamId: string;
  teamName: string;
  score: number;
  place: number;
}

export interface GameStats {
  totalWingsConsumed: number;
  mostWings: { playerName: string; count: number };
  hottestSauceSurvived: string;
  closestRound: { roundNumber: number; margin: number } | null;
  biggestComeback: { teamName: string; pointsGained: number } | null;
}

// ============================================
// API REQUESTS & RESPONSES
// ============================================

export interface CreateRoomRequest {
  hostName?: string;
}

export interface CreateRoomResponse {
  room: {
    code: string;
    editCode: string;
  };
  urls: {
    edit: string;
    preview: string;
    host: string;
    join: string;
    display: string;
  };
}

export interface JoinRoomRequest {
  playerName: string;
  sessionId?: string;
  expectedGuestId?: string;
}

export interface JoinRoomResponse {
  player: Player;
  room: Room;
}

export interface UpdateRoomRequest {
  name?: string;
  eventDate?: string;
  eventLocation?: string;
  teamSelectionMode?: TeamSelectionMode;
  maxTeams?: number;
  maxPlayersPerTeam?: number;
  allowWalkIns?: boolean;
  totalRounds?: number;
  soundEnabled?: boolean;
}

export interface CreateTeamRequest {
  name?: string;
  createdBy: CreatedBy;
  createdById?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  emoji?: string;
  isReady?: boolean;
}

export interface AddPlayerRequest {
  name: string;
  teamId?: string;
  hasDevice?: boolean;
}

export interface UpdatePlayerRequest {
  name?: string;
  teamId?: string;
  isReady?: boolean;
  teamChangeRequested?: boolean;
  requestedTeamId?: string;
}

export interface AddExpectedGuestRequest {
  name: string;
  teamId?: string;
}

export interface UpdateRoundRequest {
  sauceName?: string;
  sauceScovilles?: number;
  sauceNotes?: string;
  gameType?: string;
  gameSelectionMode?: GameSelectionMode;
  gameConfig?: unknown;
}

export interface WingCompletionRequest {
  playerId: string;
  completed: boolean;
}

export interface ScoreAdjustmentRequest {
  teamId: string;
  adjustment: number;
  reason?: string;
}

export interface PhaseAdvanceRequest {
  phase: GamePhase;
}

export interface TimerActionRequest {
  action: 'start' | 'pause' | 'resume' | 'add';
  duration?: number;
  type?: TimerType;
  teamId?: string;
  secondsToAdd?: number;
}

// ============================================
// SOCKET EVENTS
// ============================================

// Client -> Server
export interface ClientToServerEvents {
  'join-room': (data: { roomCode: string; sessionId?: string }) => void;
  'rejoin-room': (data: { roomCode: string; sessionId: string }) => void;
  'join-as-host': (data: { roomCode: string }) => void;
  'join-as-display': (data: { roomCode: string }) => void;
  'leave-room': () => void;
  'tablet-team-ready': (data: { teamId: string }) => void;
  'tablet-returned': () => void;
}

// Server -> Client
export interface ServerToClientEvents {
  'room-state': (data: { room: Room }) => void;
  'room-updated': (data: { changes: Partial<Room> }) => void;
  'room-locked': () => void;
  'room-unlocked': () => void;
  'player-joined': (data: { player: Player; team?: Team }) => void;
  'player-left': (data: { playerId: string; reason: string }) => void;
  'player-updated': (data: { playerId: string; changes: Partial<Player> }) => void;
  'player-connected': (data: { playerId: string }) => void;
  'player-disconnected': (data: { playerId: string }) => void;
  'team-created': (data: { team: Team }) => void;
  'team-updated': (data: { teamId: string; changes: Partial<Team> }) => void;
  'team-deleted': (data: { teamId: string }) => void;
  'team-logo-generating': (data: { teamId: string }) => void;
  'team-logo-generated': (data: { teamId: string; logoUrl: string }) => void;
  'team-ready-changed': (data: { teamId: string; isReady: boolean }) => void;
  'phase-changed': (data: { phase: GamePhase; previousPhase: GamePhase }) => void;
  'round-started': (data: { roundNumber: number; round: Round }) => void;
  'round-completed': (data: { roundNumber: number; results: RoundResult[] }) => void;
  'game-paused': (data: { reason?: string }) => void;
  'game-resumed': () => void;
  'timer-started': (data: { timerState: TimerState; serverTime: number }) => void;
  'timer-paused': (data: { remaining: number }) => void;
  'timer-resumed': (data: { timerState: TimerState; serverTime: number }) => void;
  'timer-updated': (data: { timerState: TimerState; serverTime: number; added?: number }) => void;
  'timer-expired': (data: { type: TimerType }) => void;
  'timer-sync': (data: { remaining: number; serverTime: number }) => void;
  'tablet-handoff-start': (data: { teamId: string; gameType: string }) => void;
  'tablet-team-started': (data: { teamId: string }) => void;
  'tablet-return-requested': (data: { teamId: string; reason: string }) => void;
  'tablet-mode-changed': (data: { mode: TabletMode; teamId?: string }) => void;
  'scores-updated': (data: { teamScores: Record<string, number> }) => void;
  'score-adjusted': (data: { teamId: string; adjustment: number; newTotal: number; reason?: string }) => void;
  'round-results': (data: { roundNumber: number; results: RoundResult[] }) => void;
  'wing-completed': (data: { playerId: string; roundNumber: number; completed: boolean }) => void;
  'wings-updated': (data: { roundNumber: number; wingStatus: Record<string, boolean> }) => void;
  'host-connected': () => void;
  'host-disconnected': (data: { isPaused: boolean }) => void;
  'host-reconnected': () => void;
  'display-connected': () => void;
  'display-disconnected': () => void;
  'show-on-tv': (data: { screen: string; data: unknown }) => void;
  'error': (data: { message: string; code?: string }) => void;
}

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "This game room doesn't exist.",
  ROOM_FULL: 'This game is full.',
  ROOM_LOCKED: 'This room is locked. Ask the host to unlock it.',
  GAME_ALREADY_STARTED: 'The game has already started.',
  INVALID_PHASE: "This action isn't available right now.",
  PLAYER_NOT_IN_ROOM: "You're not part of this game.",
  HOST_REQUIRED: 'Only the host can do this.',
  TEAM_FULL: 'This team is full.',
  MIN_TEAMS_REQUIRED: 'Need at least 3 teams to start.',
  UNASSIGNED_PLAYERS: 'All players must be on a team.',
} as const;

// ============================================
// DEFAULT HOT SAUCE LINEUP
// ============================================

export const DEFAULT_SAUCE_LINEUP = [
  { round: 1, name: "Frank's RedHot", scoville: 450 },
  { round: 2, name: 'Cholula', scoville: 1000 },
  { round: 3, name: 'Tabasco', scoville: 2500 },
  { round: 4, name: 'Sriracha', scoville: 2200 },
  { round: 5, name: 'Crystal', scoville: 4000 },
  { round: 6, name: 'El Yucateco', scoville: 8910 },
  { round: 7, name: "Dave's Insanity", scoville: 180000 },
  { round: 8, name: 'The Last Dab', scoville: 2000000 },
] as const;

// ============================================
// THEMATIC ROOM CODES
// ============================================

export const THEMATIC_CODES = [
  'FIRE', 'HEAT', 'BURN', 'SPCY', 'WING', 'BLAZ', 'SCOV',
  'PIKA', 'ZEST', 'KICK', 'MILD', 'BOMB', 'VOLT', 'FURY',
  'SEAR', 'CHAR', 'GLOW', 'ZING', 'SNAP', 'BOOM',
] as const;
