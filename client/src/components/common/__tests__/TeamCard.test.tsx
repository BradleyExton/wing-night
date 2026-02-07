import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamCard } from '../TeamCard';
import type { Team, Player } from '../../../types';

const baseTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-1',
  roomId: 'room-1',
  name: 'Hot Sauce Heroes',
  emoji: '🔥',
  logoUrl: null,
  logoType: null,
  logoPrompt: null,
  aiAttemptsUsed: 0,
  maxAiAttempts: 3,
  currentSize: 0,
  maxSize: 6,
  isReady: false,
  score: 150,
  totalWingsCompleted: 0,
  totalWingsAttempted: 0,
  createdBy: 'HOST',
  createdById: null,
  players: [],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

const basePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: 'player-1',
  roomId: 'room-1',
  teamId: 'team-1',
  name: 'Alex',
  photoUrl: null,
  socketId: null,
  sessionId: null,
  isConnected: true,
  hasDevice: true,
  lastSeenAt: null,
  disconnectedAt: null,
  isReady: false,
  joinedAt: '2025-01-01T00:00:00Z',
  joinedVia: 'PHONE',
  wingsCompleted: 0,
  wingsAttempted: 0,
  expectedGuestId: null,
  teamChangeRequested: false,
  requestedTeamId: null,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

describe('TeamCard', () => {
  it('renders name and score when requested', () => {
    render(<TeamCard team={baseTeam()} showScore />);
    expect(screen.getByText('Hot Sauce Heroes')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('points')).toBeInTheDocument();
  });

  it('shows fallback name and emoji when missing', () => {
    render(<TeamCard team={baseTeam({ name: null, emoji: null })} />);
    expect(screen.getByText('Unnamed Team')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('shows player count and list when enabled', () => {
    const players = [basePlayer({ id: 'player-1', name: 'Alex' })];
    render(<TeamCard team={baseTeam({ players })} showPlayers />);
    expect(screen.getByText('1 player')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('renders a logo image when provided', () => {
    render(<TeamCard team={baseTeam({ logoUrl: 'https://example.com/logo.png' })} />);
    const img = screen.getByAltText('Hot Sauce Heroes') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/logo.png');
  });
});
