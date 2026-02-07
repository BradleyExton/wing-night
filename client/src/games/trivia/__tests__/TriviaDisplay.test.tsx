import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TriviaDisplay } from '../TriviaDisplay';
import type { TriviaGameState } from '../types';
import type { Team } from '../../../types';

const baseTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  roomId: 'room-1',
  name: 'Team 1',
  emoji: '🔥',
  logoUrl: null,
  logoType: null,
  logoPrompt: null,
  aiAttemptsUsed: 0,
  maxAiAttempts: 3,
  currentSize: 0,
  maxSize: 6,
  isReady: false,
  score: 0,
  totalWingsCompleted: 0,
  totalWingsAttempted: 0,
  createdBy: 'HOST',
  createdById: null,
  players: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const baseGameState = (overrides: Partial<TriviaGameState> = {}): TriviaGameState => ({
  currentQuestionIndex: 0,
  questions: [
    {
      id: 'q1',
      question: 'What is spicy?',
      answer: 'Peppers',
      category: 'Food',
      points: 100,
    },
  ],
  teamAnswers: {},
  showAnswer: false,
  gameStarted: true,
  gameEnded: false,
  buzzedTeamId: null,
  buzzedPlayerId: null,
  buzzedPlayerName: null,
  buzzLocked: false,
  failedTeams: [],
  questionActive: false,
  ...overrides,
});

describe('TriviaDisplay', () => {
  it('shows loading state when questions are empty', () => {
    render(<TriviaDisplay gameState={baseGameState({ questions: [] })} teams={[]} />);
    expect(screen.getByText('TRIVIA')).toBeInTheDocument();
    expect(screen.getByText('Loading questions...')).toBeInTheDocument();
  });

  it('shows buzz prompt when question is active and no buzzed team', () => {
    render(
      <TriviaDisplay
        gameState={baseGameState({ questionActive: true })}
        teams={[baseTeam(), baseTeam({ id: 'team-2', name: 'Team 2' })]}
      />
    );
    expect(screen.getByText('BUZZ IN!')).toBeInTheDocument();
  });

  it('shows steal opportunity when failed teams exist', () => {
    render(
      <TriviaDisplay
        gameState={baseGameState({ questionActive: true, failedTeams: ['team-1'] })}
        teams={[baseTeam(), baseTeam({ id: 'team-2', name: 'Team 2' })]}
      />
    );
    expect(screen.getByText('STEAL OPPORTUNITY!')).toBeInTheDocument();
    expect(screen.getByText(/Team 2.*can steal!/i)).toBeInTheDocument();
  });

  it('shows buzzed team banner when a team buzzes', () => {
    render(
      <TriviaDisplay
        gameState={baseGameState({ questionActive: true, buzzedTeamId: 'team-1' })}
        teams={[baseTeam()]}
      />
    );
    expect(screen.getByText('is answering!')).toBeInTheDocument();
    expect(screen.getAllByText('Team 1').length).toBeGreaterThan(0);
  });

  it('shows answer when reveal is active', () => {
    render(
      <TriviaDisplay
        gameState={baseGameState({ showAnswer: true })}
        teams={[baseTeam()]}
      />
    );
    expect(screen.getByText('ANSWER')).toBeInTheDocument();
    expect(screen.getByText('Peppers')).toBeInTheDocument();
  });
});
