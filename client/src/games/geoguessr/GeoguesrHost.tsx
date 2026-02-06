import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Card, CardHeader } from '../../components/common/Card';
import {
  GeoguesrGameState,
  createInitialGeoguesrState,
  calculateDistance,
  calculatePoints,
  formatDistance,
} from './types';
import { getRandomLocations } from './locations';
import { InteractiveMap, ResultMap } from './MapView';

interface Team {
  id: string;
  name: string | null;
  score: number;
}

interface GeoguesrHostProps {
  roomCode: string;
  teams: Team[];
  gameState: GeoguesrGameState | null;
  onUpdateGameState: (state: GeoguesrGameState) => Promise<void>;
  onAdjustScore: (teamId: string, amount: number) => Promise<void>;
  onEndGame: () => void;
  // Test mode callbacks
  onSubmitGuess?: (teamId: string, lat: number, lng: number) => void;
}

export function GeoguesrHost({
  teams,
  gameState,
  onUpdateGameState,
  onAdjustScore,
  onEndGame,
  onSubmitGuess,
}: GeoguesrHostProps) {
  const [saving, setSaving] = useState(false);
  const [guessPosition, setGuessPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize game state if not already set
  useEffect(() => {
    if (!gameState || !gameState.gameStarted) {
      const teamIds = teams.map(t => t.id);
      // Need at least as many locations as teams
      const locations = getRandomLocations(Math.max(teams.length, 6));
      const initialState = createInitialGeoguesrState(locations, teamIds, 1);
      onUpdateGameState(initialState);
    }
  }, [gameState, teams, onUpdateGameState]);

  // Reset guess position when team changes
  useEffect(() => {
    setGuessPosition(null);
  }, [gameState?.currentTeamIndex]);

  if (!gameState || !gameState.locations.length) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-xl">Loading game...</div>
        </div>
      </Card>
    );
  }

  const state = gameState;
  const currentTeamId = state.teamOrder[state.currentTeamIndex];
  const currentTeam = teams.find(t => t.id === currentTeamId);
  const currentLocationId = state.teamAssignments[currentTeamId];
  const currentLocation = state.locations.find(l => l.id === currentLocationId);

  const allTeamsGuessed = state.teamOrder.every(
    teamId => state.teamGuesses[teamId]?.submitted
  );
  const teamsRemaining = state.teamOrder.filter(
    teamId => !state.teamGuesses[teamId]?.submitted
  ).length;

  // Hand tablet to current team
  const handleHandTablet = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newState: GeoguesrGameState = {
        ...state,
        phase: 'GUESSING',
        teamHasTablet: true,
      };
      await onUpdateGameState(newState);
    } finally {
      setSaving(false);
    }
  };

  // Submit current team's guess
  const handleSubmitGuess = async () => {
    if (saving || !guessPosition || !currentTeamId) return;
    setSaving(true);

    try {
      if (onSubmitGuess) {
        // Test mode - use callback
        onSubmitGuess(currentTeamId, guessPosition.lat, guessPosition.lng);
      } else {
        // Real mode - update state directly
        const newGuesses = { ...state.teamGuesses };
        newGuesses[currentTeamId] = {
          latitude: guessPosition.lat,
          longitude: guessPosition.lng,
          submitted: true,
        };

        // Check if this was the last team
        const nextIndex = state.currentTeamIndex + 1;
        const allDone = nextIndex >= state.teamOrder.length;

        const newState: GeoguesrGameState = {
          ...state,
          teamGuesses: newGuesses,
          currentTeamIndex: allDone ? state.currentTeamIndex : nextIndex,
          teamHasTablet: false,
          phase: allDone ? 'REVEAL' : 'WAITING',
        };

        // If all done, calculate distances and points
        if (allDone) {
          state.teamOrder.forEach(teamId => {
            const guess = newGuesses[teamId];
            const locationId = state.teamAssignments[teamId];
            const location = state.locations.find(l => l.id === locationId);

            if (guess?.latitude !== null && guess?.longitude !== null && location) {
              const distance = calculateDistance(
                guess.latitude,
                guess.longitude,
                location.latitude,
                location.longitude
              );
              const points = calculatePoints(distance);
              newGuesses[teamId] = { ...guess, distance, points };
            }
          });
          newState.teamGuesses = newGuesses;
        }

        await onUpdateGameState(newState);
      }

      setGuessPosition(null);
    } finally {
      setSaving(false);
    }
  };

  // Skip current team (timeout or forfeit)
  const handleSkipTeam = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newGuesses = { ...state.teamGuesses };
      newGuesses[currentTeamId] = {
        latitude: null,
        longitude: null,
        submitted: true,
      };

      const nextIndex = state.currentTeamIndex + 1;
      const allDone = nextIndex >= state.teamOrder.length;

      const newState: GeoguesrGameState = {
        ...state,
        teamGuesses: newGuesses,
        currentTeamIndex: allDone ? state.currentTeamIndex : nextIndex,
        teamHasTablet: false,
        phase: allDone ? 'REVEAL' : 'WAITING',
      };

      // If all done, calculate distances and points
      if (allDone) {
        state.teamOrder.forEach(teamId => {
          const guess = newGuesses[teamId];
          const locationId = state.teamAssignments[teamId];
          const location = state.locations.find(l => l.id === locationId);

          if (guess?.latitude !== null && guess?.longitude !== null && location) {
            const distance = calculateDistance(
              guess.latitude,
              guess.longitude,
              location.latitude,
              location.longitude
            );
            const points = calculatePoints(distance);
            newGuesses[teamId] = { ...guess, distance, points };
          } else {
            newGuesses[teamId] = { ...guess, distance: undefined, points: 0 };
          }
        });
        newState.teamGuesses = newGuesses;
      }

      await onUpdateGameState(newState);
      setGuessPosition(null);
    } finally {
      setSaving(false);
    }
  };

  // Award points and end game
  const handleEndGame = async () => {
    // Award points to teams
    for (const teamId of state.teamOrder) {
      const guess = state.teamGuesses[teamId];
      if (guess?.points) {
        await onAdjustScore(teamId, guess.points);
      }
    }

    const newState = { ...state, gameEnded: true };
    await onUpdateGameState(newState);
    onEndGame();
  };

  // Return tablet to host (cancel team's turn)
  const handleReturnTablet = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newState: GeoguesrGameState = {
        ...state,
        teamHasTablet: false,
        phase: 'WAITING',
      };
      await onUpdateGameState(newState);
      setGuessPosition(null);
    } finally {
      setSaving(false);
    }
  };

  // WAITING PHASE - Hand tablet to team
  if (state.phase === 'WAITING' && !allTeamsGuessed) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-400 text-sm">
          Round {state.currentRound} - {teamsRemaining} team{teamsRemaining !== 1 ? 's' : ''} remaining
        </div>

        <Card className="bg-gradient-to-br from-bg-secondary to-bg-primary">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🌍</div>
            <div className="text-2xl font-bold mb-2">Hand tablet to</div>
            <div className="text-4xl font-bold text-primary mb-6">
              {currentTeam?.name || 'Team'}
            </div>
            <Button onClick={handleHandTablet} disabled={saving} size="lg">
              Ready - Start Turn
            </Button>
          </div>
        </Card>

        {/* Team Progress */}
        <Card>
          <CardHeader>Progress</CardHeader>
          <div className="space-y-2">
            {state.teamOrder.map((teamId, index) => {
              const team = teams.find(t => t.id === teamId);
              const guess = state.teamGuesses[teamId];
              const isCurrent = index === state.currentTeamIndex;

              return (
                <div
                  key={teamId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    guess?.submitted
                      ? 'bg-green-900/30 border border-green-500'
                      : isCurrent
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-bg-secondary'
                  }`}
                >
                  <span className="font-medium">{team?.name}</span>
                  <span className={guess?.submitted ? 'text-green-400' : 'text-gray-400'}>
                    {guess?.submitted ? 'Done' : isCurrent ? 'Up next' : 'Waiting'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // GUESSING PHASE - Team has tablet, show photo + map
  if (state.phase === 'GUESSING' && state.teamHasTablet && currentLocation) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-primary font-bold text-lg">
            {currentTeam?.name}'s Turn
          </div>
          <Button variant="secondary" size="sm" onClick={handleReturnTablet}>
            Return to Host
          </Button>
        </div>

        {/* Location Photo */}
        <Card>
          <div className="text-center mb-2 text-gray-400 text-sm">
            Where is this location?
          </div>
          <div className="aspect-video rounded-lg overflow-hidden bg-bg-secondary">
            <img
              src={currentLocation.imageUrl}
              alt="Mystery location"
              className="w-full h-full object-cover"
            />
          </div>
          {currentLocation.hint && (
            <div className="text-center mt-2 text-gray-500 text-sm">
              Hint: {currentLocation.hint}
            </div>
          )}
        </Card>

        {/* Interactive Map */}
        <Card>
          <CardHeader>
            {guessPosition ? 'Tap to adjust your pin' : 'Tap the map to place your pin'}
          </CardHeader>
          <InteractiveMap
            guessPosition={guessPosition}
            onMapClick={(lat, lng) => setGuessPosition({ lat, lng })}
            className="h-64"
          />
        </Card>

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={handleSubmitGuess}
            disabled={saving || !guessPosition}
            size="lg"
          >
            {guessPosition ? 'Submit Guess' : 'Place a pin first'}
          </Button>
          <Button variant="secondary" onClick={handleSkipTeam} disabled={saving}>
            Skip
          </Button>
        </div>
      </div>
    );
  }

  // REVEAL PHASE - Show all results
  if (state.phase === 'REVEAL' || allTeamsGuessed) {
    // Find best performer
    const bestTeamId = state.teamOrder.reduce((best, teamId) => {
      const currentGuess = state.teamGuesses[teamId];
      const bestGuess = state.teamGuesses[best];
      if (!currentGuess?.points) return best;
      if (!bestGuess?.points) return teamId;
      return currentGuess.points > bestGuess.points ? teamId : best;
    }, state.teamOrder[0]);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">🌍</div>
          <div className="text-2xl font-bold">Results</div>
        </div>

        {/* Results Grid */}
        <div className="space-y-4">
          {state.teamOrder.map(teamId => {
            const team = teams.find(t => t.id === teamId);
            const guess = state.teamGuesses[teamId];
            const locationId = state.teamAssignments[teamId];
            const location = state.locations.find(l => l.id === locationId);
            const isBest = teamId === bestTeamId && guess?.points;

            if (!location) return null;

            return (
              <Card
                key={teamId}
                className={isBest ? 'border-2 border-primary bg-primary/10' : ''}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-lg flex items-center gap-2">
                      {team?.name}
                      {isBest && <span className="text-primary">Best!</span>}
                    </div>
                    <div className="text-gray-400">{location.name}</div>
                  </div>
                  <div className="text-right">
                    {guess?.distance !== undefined ? (
                      <>
                        <div className="text-2xl font-bold text-primary">
                          +{guess.points || 0}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {formatDistance(guess.distance)}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500">No guess</div>
                    )}
                  </div>
                </div>
                <ResultMap
                  guessPosition={
                    guess?.latitude !== null && guess?.longitude !== null
                      ? { lat: guess.latitude!, lng: guess.longitude! }
                      : null
                  }
                  actualPosition={{ lat: location.latitude, lng: location.longitude }}
                  teamName={team?.name || 'Team'}
                  className="h-32"
                />
              </Card>
            );
          })}
        </div>

        {/* End Game */}
        <Button className="w-full" onClick={handleEndGame} size="lg">
          Award Points & End Game
        </Button>
      </div>
    );
  }

  return null;
}
