export interface DrawingWord {
  id: string;
  word: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface DrawingPoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  t?: number; // timestamp
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface DrawingHistoryItem {
  word: string;
  teamId: string;
  correct: boolean;
  points: number;
}

export interface DrawingGameState {
  gameType: 'drawing';
  gameStarted: boolean;
  gameEnded: boolean;
  phase: 'SELECT_DRAWER' | 'DRAWING' | 'RESULT' | 'GAME_RESULTS';

  drawerOrder: string[]; // sequence of team IDs for each word
  currentWordIndex: number;
  currentDrawerTeamId: string | null;

  wordQueue: DrawingWord[];
  currentWord: DrawingWord | null;

  strokes: DrawingStroke[];
  drawingEndsAt: string | null; // ISO timestamp
  drawingTimeSec: number;
  wordsPerDrawer: number;
  pointsPerCorrect: number;

  roundScores: Record<string, number>;
  history: DrawingHistoryItem[];
  customWords?: string[];
}

export interface DrawingConfig {
  wordsPerDrawer: number;
  drawingTimeSec: number;
  pointsPerCorrect: number;
}

export const DEFAULT_DRAWING_CONFIG: DrawingConfig = {
  wordsPerDrawer: 5,
  drawingTimeSec: 90,
  pointsPerCorrect: 100,
};

export function createInitialDrawingState(params: {
  teamIds: string[];
  wordQueue: DrawingWord[];
  config?: DrawingConfig;
  customWords?: string[];
}): DrawingGameState {
  const config = params.config || DEFAULT_DRAWING_CONFIG;
  const drawerOrder: string[] = [];

  params.teamIds.forEach(teamId => {
    for (let i = 0; i < config.wordsPerDrawer; i += 1) {
      drawerOrder.push(teamId);
    }
  });

  const roundScores: Record<string, number> = {};
  params.teamIds.forEach(teamId => {
    roundScores[teamId] = 0;
  });

  const currentWord = params.wordQueue.length > 0 ? params.wordQueue[0] : null;
  const currentDrawerTeamId = drawerOrder.length > 0 ? drawerOrder[0] : null;

  return {
    gameType: 'drawing',
    gameStarted: true,
    gameEnded: false,
    phase: 'SELECT_DRAWER',
    drawerOrder,
    currentWordIndex: 0,
    currentDrawerTeamId,
    wordQueue: params.wordQueue,
    currentWord,
    strokes: [],
    drawingEndsAt: null,
    drawingTimeSec: config.drawingTimeSec,
    wordsPerDrawer: config.wordsPerDrawer,
    pointsPerCorrect: config.pointsPerCorrect,
    roundScores,
    history: [],
    customWords: params.customWords,
  };
}

export function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
