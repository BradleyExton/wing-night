import { TriviaHost, TriviaDisplay, TriviaGameState } from './trivia';

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  HostComponent: React.ComponentType<any>;
  DisplayComponent: React.ComponentType<any>;
}

export const GAMES: Record<string, GameDefinition> = {
  trivia: {
    id: 'trivia',
    name: 'Trivia',
    description: 'Answer trivia questions to score points',
    icon: '❓',
    HostComponent: TriviaHost,
    DisplayComponent: TriviaDisplay,
  },
  // Future games can be added here:
  // drawing: { ... },
  // tongueTwister: { ... },
};

export function getGameById(id: string): GameDefinition | undefined {
  return GAMES[id];
}

export function getAvailableGames(): GameDefinition[] {
  return Object.values(GAMES);
}

// Re-export game types
export type { TriviaGameState };
