export interface TriviaQuestion {
  id: string;
  question: string;
  answer: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface TriviaConfig {
  questionCount: number;
  pointsPerQuestion: number;
  useBuiltInQuestions: boolean;
  customQuestions?: TriviaQuestion[];
}

export interface TriviaGameState {
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
  teamAnswers: Record<string, boolean[]>; // teamId -> array of correct/incorrect per question
  showAnswer: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
}

export const DEFAULT_TRIVIA_CONFIG: TriviaConfig = {
  questionCount: 3,
  pointsPerQuestion: 100,
  useBuiltInQuestions: true,
};

export function createInitialTriviaState(questions: TriviaQuestion[]): TriviaGameState {
  return {
    currentQuestionIndex: 0,
    questions,
    teamAnswers: {},
    showAnswer: false,
    gameStarted: false,
    gameEnded: false,
  };
}
