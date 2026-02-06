import { TriviaHost, TriviaDisplay, TriviaPlayer, TriviaGameState } from './trivia';
import { GeoguesrHost, GeoguesrDisplay, GeoguesrPlayer, GeoguesrGameState } from './geoguessr';

// Standardized team interface for all games
export interface MockTeam {
  id: string;
  name: string | null;
  score: number;
}

// Standardized player interface for testing
export interface MockPlayer {
  id: string;
  name: string;
  teamId: string | null;
}

// Standardized props interface for all game Host components
export interface GameHostProps {
  roomCode: string;
  teams: MockTeam[];
  gameState: unknown;
  onUpdateGameState: (state: unknown) => Promise<void>;
  onAdjustScore: (teamId: string, amount: number) => Promise<void>;
  onEndGame: () => void;
  // Optional test mode callbacks (used instead of API calls)
  onMarkResult?: (correct: boolean, points: number) => void;
  onSkip?: () => void;
  onSubmitGuess?: (teamId: string, lat: number, lng: number) => void;
}

// Standardized props interface for all game Display components
export interface GameDisplayProps {
  gameState: unknown;
  teams: MockTeam[];
}

// Standardized props interface for all game Player components
export interface GamePlayerProps {
  roomCode: string;
  player: MockPlayer;
  teams: MockTeam[];
  gameState: unknown;
  // Optional test mode callbacks (used instead of API calls)
  onBuzz?: (teamId: string, playerId: string, playerName: string) => void;
}

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  HostComponent: React.ComponentType<GameHostProps>;
  DisplayComponent: React.ComponentType<GameDisplayProps>;
  PlayerComponent?: React.ComponentType<GamePlayerProps>;
}

export const GAMES: Record<string, GameDefinition> = {
  trivia: {
    id: 'trivia',
    name: 'Trivia',
    description: 'Answer trivia questions to score points',
    icon: '❓',
    HostComponent: TriviaHost,
    DisplayComponent: TriviaDisplay,
    PlayerComponent: TriviaPlayer as React.ComponentType<GamePlayerProps>,
  },
  geoguessr: {
    id: 'geoguessr',
    name: 'Where in the World',
    description: 'Guess the location from a photo',
    icon: '🌍',
    HostComponent: GeoguesrHost as React.ComponentType<GameHostProps>,
    DisplayComponent: GeoguesrDisplay as React.ComponentType<GameDisplayProps>,
    PlayerComponent: GeoguesrPlayer as React.ComponentType<GamePlayerProps>,
  },
};

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES[id];
}

export function getAvailableGames(): GameDefinition[] {
  return Object.values(GAMES);
}

// Re-export game types
export type { TriviaGameState, GeoguesrGameState };
