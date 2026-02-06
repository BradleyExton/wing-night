import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { getGameById, MockTeam, MockPlayer } from '../../games';
import { TriviaGameState } from '../../games/trivia';
import {
  GeoguesrGameState,
  calculateDistance,
  calculatePoints,
} from '../../games/geoguessr';

type ViewMode = 'host' | 'display' | 'player' | 'all';

const DEFAULT_TEAMS: MockTeam[] = [
  { id: 'team-1', name: 'Hot Sauce Heroes', score: 0 },
  { id: 'team-2', name: 'Spicy Bois', score: 0 },
  { id: 'team-3', name: 'Wing Kings', score: 0 },
];

export function GameTestView() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = gameId ? getGameById(gameId) : undefined;

  const [viewMode, setViewMode] = useState<ViewMode>('host');
  const [teams, setTeams] = useState<MockTeam[]>(DEFAULT_TEAMS);
  const [gameState, setGameState] = useState<unknown>(null);
  const [showStateInspector, setShowStateInspector] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  // Player simulation state
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-1');
  const [mockPlayer, setMockPlayer] = useState<MockPlayer>({
    id: 'player-1',
    name: 'Test Player',
    teamId: 'team-1',
  });

  if (!game) {
    return <Navigate to="/test/games" replace />;
  }

  const HostComponent = game.HostComponent;
  const DisplayComponent = game.DisplayComponent;
  const PlayerComponent = game.PlayerComponent;

  const handleUpdateGameState = async (state: unknown) => {
    setGameState(state);
  };

  const handleAdjustScore = async (teamId: string, amount: number) => {
    setTeams(prev =>
      prev.map(t => (t.id === teamId ? { ...t, score: t.score + amount } : t))
    );
  };

  const handleEndGame = () => {
    setGameEnded(true);
  };

  const handleReset = () => {
    setGameState(null);
    setTeams(DEFAULT_TEAMS);
    setGameEnded(false);
  };

  const handleAddTeam = () => {
    const newId = `team-${teams.length + 1}`;
    setTeams(prev => [...prev, { id: newId, name: `Team ${teams.length + 1}`, score: 0 }]);
  };

  const handleRemoveTeam = (teamId: string) => {
    if (teams.length > 2) {
      setTeams(prev => prev.filter(t => t.id !== teamId));
    }
  };

  // Handle player team selection
  const handleSelectPlayerTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setMockPlayer(prev => ({ ...prev, teamId }));
  };

  // Handle buzz in test mode - simulates the server behavior
  const handleTestBuzz = (teamId: string, playerId: string, playerName: string) => {
    if (!gameState) return;

    const state = gameState as TriviaGameState;

    // Check if buzzing is allowed
    if (!state.questionActive || state.buzzLocked) return;
    if (state.failedTeams?.includes(teamId)) return;

    // Update game state with buzz
    const newState: TriviaGameState = {
      ...state,
      buzzedTeamId: teamId,
      buzzedPlayerId: playerId,
      buzzedPlayerName: playerName,
      buzzLocked: true,
    };

    setGameState(newState);
  };

  // Handle mark result in test mode - simulates the server behavior
  const handleTestMarkResult = (correct: boolean, points: number) => {
    if (!gameState) return;

    const state = gameState as TriviaGameState;
    if (!state.buzzedTeamId) return;

    const buzzedTeamId = state.buzzedTeamId;

    if (correct) {
      // Award points
      setTeams(prev =>
        prev.map(t => (t.id === buzzedTeamId ? { ...t, score: t.score + points } : t))
      );

      // Update team answers and show answer
      const teamAnswers = { ...state.teamAnswers };
      if (!teamAnswers[buzzedTeamId]) {
        teamAnswers[buzzedTeamId] = [];
      }
      teamAnswers[buzzedTeamId][state.currentQuestionIndex] = true;

      const newState: TriviaGameState = {
        ...state,
        showAnswer: true,
        questionActive: false,
        teamAnswers,
      };
      setGameState(newState);
    } else {
      // Wrong answer - add to failed teams, unlock for steal
      const failedTeams = [...(state.failedTeams || []), buzzedTeamId];
      const remainingTeams = teams.filter(t => !failedTeams.includes(t.id));

      let newState: TriviaGameState;
      if (remainingTeams.length === 0) {
        // All teams failed
        newState = {
          ...state,
          showAnswer: true,
          questionActive: false,
          buzzedTeamId: null,
          buzzedPlayerId: null,
          buzzedPlayerName: null,
          buzzLocked: false,
          failedTeams: [],
        };
      } else {
        // Open for steal
        newState = {
          ...state,
          failedTeams,
          buzzedTeamId: null,
          buzzedPlayerId: null,
          buzzedPlayerName: null,
          buzzLocked: false,
        };
      }
      setGameState(newState);
    }
  };

  // Handle skip in test mode
  const handleTestSkip = () => {
    if (!gameState) return;

    const state = gameState as TriviaGameState;

    const newState: TriviaGameState = {
      ...state,
      showAnswer: true,
      questionActive: false,
      buzzedTeamId: null,
      buzzedPlayerId: null,
      buzzedPlayerName: null,
      buzzLocked: false,
      failedTeams: [],
    };

    setGameState(newState);
  };

  // Handle geoguessr guess submission in test mode
  const handleTestSubmitGuess = (teamId: string, lat: number, lng: number) => {
    if (!gameState) return;

    const state = gameState as GeoguesrGameState;

    const newGuesses = { ...state.teamGuesses };
    newGuesses[teamId] = {
      latitude: lat,
      longitude: lng,
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
      state.teamOrder.forEach(tid => {
        const guess = newGuesses[tid];
        const locationId = state.teamAssignments[tid];
        const location = state.locations.find(l => l.id === locationId);

        if (guess?.latitude !== null && guess?.longitude !== null && location) {
          const distance = calculateDistance(
            guess.latitude!,
            guess.longitude!,
            location.latitude,
            location.longitude
          );
          const points = calculatePoints(distance);
          newGuesses[tid] = { ...guess, distance, points };
        }
      });
      newState.teamGuesses = newGuesses;
    }

    setGameState(newState);
  };

  // Get available view modes
  const viewModes: ViewMode[] = PlayerComponent
    ? ['host', 'display', 'player', 'all']
    : ['host', 'display', 'all'];

  const getViewLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'host': return 'Host';
      case 'display': return 'Display';
      case 'player': return 'Player';
      case 'all': return 'All';
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="bg-bg-card border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/test/games" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{game.icon}</span>
              <h1 className="text-xl font-bold">{game.name} Tester</h1>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-bg-secondary rounded-lg p-1">
              {viewModes.map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-primary text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {getViewLabel(mode)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player Team Selector - show when in player or all view */}
      {PlayerComponent && (viewMode === 'player' || viewMode === 'all') && (
        <div className="bg-bg-secondary border-b border-gray-700 p-3">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <span className="text-sm text-gray-400">Playing as:</span>
            <div className="flex gap-2">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleSelectPlayerTeam(team.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    selectedTeamId === team.id
                      ? 'bg-primary text-black'
                      : 'bg-bg-card text-gray-300 hover:bg-bg-card/80'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={mockPlayer.name}
              onChange={(e) => setMockPlayer(prev => ({ ...prev, name: e.target.value }))}
              className="bg-bg-card border border-gray-600 rounded px-3 py-1 text-sm w-32"
              placeholder="Player name"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        {gameEnded ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold mb-4">Game Ended!</h2>
            <div className="space-y-2 mb-8">
              {[...teams].sort((a, b) => {
                const scoreDelta = b.score - a.score;
                return scoreDelta !== 0 ? scoreDelta : a.id.localeCompare(b.id);
              }).map((team, i) => (
                <div
                  key={team.id}
                  className={`p-4 rounded-lg ${i === 0 ? 'bg-primary/20 border border-primary' : 'bg-bg-card'}`}
                >
                  <span className="font-bold">{i + 1}. {team.name}</span>
                  <span className="text-primary ml-4">{team.score} pts</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className={`max-w-7xl mx-auto ${viewMode === 'all' ? 'grid grid-cols-3 gap-6' : ''}`}>
            {/* Host View */}
            {(viewMode === 'host' || viewMode === 'all') && (
              <div className={viewMode === 'all' ? '' : 'max-w-2xl mx-auto'}>
                {viewMode === 'all' && (
                  <div className="text-sm text-gray-400 mb-2 text-center">HOST VIEW</div>
                )}
                <div className="bg-bg-card rounded-xl p-6 border border-gray-700">
                  <HostComponent
                    roomCode="TEST"
                    teams={teams}
                    gameState={gameState}
                    onUpdateGameState={handleUpdateGameState}
                    onAdjustScore={handleAdjustScore}
                    onEndGame={handleEndGame}
                    // Trivia-specific test callbacks
                    onMarkResult={handleTestMarkResult}
                    onSkip={handleTestSkip}
                    // Geoguessr-specific test callback
                    onSubmitGuess={handleTestSubmitGuess}
                  />
                </div>
              </div>
            )}

            {/* Player View */}
            {PlayerComponent && (viewMode === 'player' || viewMode === 'all') && (
              <div className={viewMode === 'all' ? '' : 'max-w-md mx-auto'}>
                {viewMode === 'all' && (
                  <div className="text-sm text-gray-400 mb-2 text-center">PLAYER VIEW</div>
                )}
                <div className="bg-bg-card rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
                  <PlayerComponent
                    roomCode="TEST"
                    player={mockPlayer}
                    teams={teams}
                    gameState={gameState}
                    onBuzz={handleTestBuzz}
                  />
                </div>
              </div>
            )}

            {/* Display View */}
            {(viewMode === 'display' || viewMode === 'all') && (
              <div className={viewMode === 'all' ? '' : 'max-w-4xl mx-auto'}>
                {viewMode === 'all' && (
                  <div className="text-sm text-gray-400 mb-2 text-center">TV DISPLAY</div>
                )}
                <div className="bg-bg-primary rounded-xl border border-gray-700 min-h-[500px] flex items-center justify-center p-8">
                  <DisplayComponent gameState={gameState} teams={teams} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-bg-card border-t border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Team Scores */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              {teams.map(team => (
                <div
                  key={team.id}
                  className="bg-bg-secondary rounded-lg px-4 py-2 flex items-center gap-3"
                >
                  <span className="text-sm">{team.name}</span>
                  <span className="text-xl font-bold text-primary">{team.score}</span>
                  {teams.length > 2 && (
                    <button
                      onClick={() => handleRemoveTeam(team.id)}
                      className="text-gray-500 hover:text-red-400 text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddTeam}
                className="text-gray-400 hover:text-white text-sm px-3 py-2"
              >
                + Add Team
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStateInspector(!showStateInspector)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  showStateInspector ? 'bg-primary text-black' : 'bg-bg-secondary text-gray-400 hover:text-white'
                }`}
              >
                {showStateInspector ? 'Hide State' : 'View State'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
              >
                Reset Game
              </button>
            </div>
          </div>

          {/* State Inspector */}
          {showStateInspector && (
            <div className="bg-bg-secondary rounded-lg p-4 max-h-48 overflow-auto">
              <div className="text-xs text-gray-400 mb-2">Game State (JSON)</div>
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {gameState ? JSON.stringify(gameState, null, 2) : 'null'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
