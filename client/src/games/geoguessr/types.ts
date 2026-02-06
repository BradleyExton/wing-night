// Geoguessr Game State Types

export interface GeoguesrLocation {
  id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  name: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TeamGuess {
  latitude: number | null;
  longitude: number | null;
  submitted: boolean;
  distance?: number; // Calculated after reveal (in meters)
  points?: number;
}

export interface GeoguesrGameState {
  // Game progression
  gameStarted: boolean;
  gameEnded: boolean;
  currentRound: number;
  totalRounds: number;

  // Team assignments - each team gets a DIFFERENT location per round
  teamAssignments: Record<string, string>; // teamId -> locationId

  // All available locations
  locations: GeoguesrLocation[];

  // Phase tracking
  phase: 'WAITING' | 'GUESSING' | 'REVEAL';

  // Team turns (for GUESSING phase)
  currentTeamIndex: number;
  teamOrder: string[]; // Team IDs in guessing order
  teamHasTablet: boolean; // Whether the current team has accepted the tablet

  // Guesses for current round
  teamGuesses: Record<string, TeamGuess>; // teamId -> guess

  // Cumulative scores across all rounds
  teamScores: Record<string, number>; // teamId -> total points
}

// Initial state factory
export function createInitialGeoguesrState(
  locations: GeoguesrLocation[],
  teamIds: string[],
  totalRounds: number = 1
): GeoguesrGameState {
  // Assign unique locations to each team
  const teamAssignments: Record<string, string> = {};
  const shuffledLocations = [...locations].sort(() => Math.random() - 0.5);

  teamIds.forEach((teamId, index) => {
    if (index < shuffledLocations.length) {
      teamAssignments[teamId] = shuffledLocations[index].id;
    }
  });

  // Initialize empty guesses for each team
  const teamGuesses: Record<string, TeamGuess> = {};
  teamIds.forEach(teamId => {
    teamGuesses[teamId] = {
      latitude: null,
      longitude: null,
      submitted: false,
    };
  });

  // Initialize scores
  const teamScores: Record<string, number> = {};
  teamIds.forEach(teamId => {
    teamScores[teamId] = 0;
  });

  return {
    gameStarted: true,
    gameEnded: false,
    currentRound: 1,
    totalRounds,
    teamAssignments,
    locations,
    phase: 'WAITING',
    currentTeamIndex: 0,
    teamOrder: teamIds,
    teamHasTablet: false,
    teamGuesses,
    teamScores,
  };
}

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Calculate points based on distance
export function calculatePoints(distanceMeters: number): number {
  if (distanceMeters <= 50) return 200;
  if (distanceMeters <= 100) return 180;
  if (distanceMeters <= 250) return 150;
  if (distanceMeters <= 500) return 120;
  if (distanceMeters <= 1000) return 100;
  if (distanceMeters <= 2000) return 75;
  if (distanceMeters <= 5000) return 50;
  if (distanceMeters <= 10000) return 25;
  return 10;
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
