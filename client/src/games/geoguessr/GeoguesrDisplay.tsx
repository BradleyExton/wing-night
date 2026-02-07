import { GeoguesrGameState, formatDistance } from './types';
import { ResultMap } from './MapView';

interface Team {
  id: string;
  name: string | null;
  score: number;
}

interface GeoguesrDisplayProps {
  gameState: GeoguesrGameState | null;
  teams: Team[];
}

export function GeoguesrDisplay({ gameState, teams }: GeoguesrDisplayProps) {
  if (!gameState || !gameState.locations.length) {
    return (
      <div className="text-center">
        <div className="text-6xl font-bold mb-8 animate-pulse">WHERE IN THE WORLD</div>
        <div className="text-2xl text-gray-400">Loading game...</div>
      </div>
    );
  }

  const state = gameState;
  const currentTeamId = state.teamOrder[state.currentTeamIndex];
  const currentTeam = teams.find(t => t.id === currentTeamId);

  const teamsCompleted = state.teamOrder.filter(
    teamId => state.teamGuesses[teamId]?.submitted
  ).length;
  const totalTeams = state.teamOrder.length;

  const allTeamsGuessed = state.teamOrder.every(
    teamId => state.teamGuesses[teamId]?.submitted
  );

  // Get upcoming teams
  const upcomingTeams = state.teamOrder
    .slice(state.currentTeamIndex + 1)
    .map(id => teams.find(t => t.id === id))
    .filter(Boolean);

  // WAITING or GUESSING phase - Show who's guessing (no location!)
  if ((state.phase === 'WAITING' || state.phase === 'GUESSING') && !allTeamsGuessed) {
    return (
      <div className="text-center w-full max-w-5xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <div className="text-5xl font-bold mb-2">WHERE IN THE WORLD</div>
          <div className="text-2xl text-gray-400">Round {state.currentRound}</div>
        </div>

        {/* Current Team Status */}
        <div className="bg-bg-card rounded-2xl p-12 mb-8 shadow-2xl border border-gray-700">
          {state.teamHasTablet ? (
            <>
              <div className="text-6xl mb-6 animate-pulse">🌍</div>
              <div className="text-4xl font-bold text-primary mb-4">
                {currentTeam?.name}
              </div>
              <div className="text-2xl text-gray-300">is guessing...</div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-6">📱</div>
              <div className="text-3xl text-gray-300 mb-4">Hand tablet to</div>
              <div className="text-4xl font-bold text-primary">
                {currentTeam?.name}
              </div>
            </>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="text-xl text-gray-400 mb-4">
            {teamsCompleted} of {totalTeams} teams done
          </div>
          <div className="flex justify-center gap-2">
            {state.teamOrder.map((teamId, i) => {
              const guess = state.teamGuesses[teamId];
              const isCurrent = i === state.currentTeamIndex;
              return (
                <div
                  key={teamId}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    guess?.submitted
                      ? 'bg-green-500 scale-100'
                      : isCurrent
                      ? 'bg-primary scale-125 animate-pulse'
                      : 'bg-gray-600'
                  }`}
                >
                  {guess?.submitted && <span className="text-black">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Up next */}
        {upcomingTeams.length > 0 && (
          <div className="text-gray-400 text-xl">
            Next: {upcomingTeams.map(t => t?.name).join(' → ')}
          </div>
        )}

        {/* Team Scores */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {teams.map(team => (
            <div
              key={team.id}
              className={`p-4 rounded-xl ${
                team.id === currentTeamId
                  ? 'bg-primary/20 border-2 border-primary'
                  : 'bg-bg-card border border-gray-700'
              }`}
            >
              <div className="text-xl font-bold truncate">{team.name}</div>
              <div className="text-3xl font-bold text-primary">{team.score}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // REVEAL phase - Show all results
  if (state.phase === 'REVEAL' || allTeamsGuessed) {
    // Find best performer
    const bestTeamId = state.teamOrder.reduce((best, teamId) => {
      const currentGuess = state.teamGuesses[teamId];
      const bestGuess = state.teamGuesses[best];
      if (!currentGuess?.points) return best;
      if (!bestGuess?.points) return teamId;
      return currentGuess.points > bestGuess.points ? teamId : best;
    }, state.teamOrder[0]);

    const bestTeam = teams.find(t => t.id === bestTeamId);
    const bestGuess = state.teamGuesses[bestTeamId];

    return (
      <div className="text-center w-full max-w-6xl mx-auto">
        {/* Title */}
        <div className="mb-6">
          <div className="text-4xl font-bold mb-2">RESULTS</div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {state.teamOrder.map(teamId => {
            const team = teams.find(t => t.id === teamId);
            const guess = state.teamGuesses[teamId];
            const locationId = state.teamAssignments[teamId];
            const location = state.locations.find(l => l.id === locationId);
            const isBest = teamId === bestTeamId && guess?.points;

            if (!location) return null;

            return (
              <div
                key={teamId}
                className={`rounded-xl p-4 ${
                  isBest
                    ? 'bg-primary/30 border-2 border-primary'
                    : 'bg-bg-card border border-gray-700'
                }`}
              >
                <div className="font-bold text-xl mb-1 truncate">
                  {team?.name}
                  {isBest && ' ⭐'}
                </div>
                <div className="text-gray-400 text-sm mb-2 truncate">
                  {location.name}
                </div>
                <ResultMap
                  guessPosition={
                    guess?.latitude !== null && guess?.longitude !== null
                      ? { lat: guess.latitude!, lng: guess.longitude! }
                      : null
                  }
                  actualPosition={{ lat: location.latitude, lng: location.longitude }}
                  className="h-32 md:h-36 mb-2"
                />
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">
                    {guess?.distance !== undefined
                      ? formatDistance(guess.distance)
                      : 'No guess'}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    +{guess?.points || 0}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Winner Callout */}
        {bestGuess?.points && bestGuess.points > 0 && (
          <div className="bg-primary/20 rounded-xl p-6 border border-primary mb-8">
            <div className="text-xl text-gray-300 mb-2">Closest Guess</div>
            <div className="text-4xl font-bold text-primary">{bestTeam?.name}</div>
            <div className="text-2xl text-gray-300">
              {formatDistance(bestGuess.distance || 0)} away - {bestGuess.points} points!
            </div>
          </div>
        )}

        {/* Final Standings */}
        <div className="flex justify-center gap-6">
          {[...teams]
            .sort((a, b) => {
              const aPoints = state.teamGuesses[a.id]?.points || 0;
              const bPoints = state.teamGuesses[b.id]?.points || 0;
              return bPoints - aPoints;
            })
            .map((team, i) => (
              <div key={team.id} className="text-center">
                <div className="text-3xl mb-1">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                <div className="font-bold">{team.name}</div>
                <div className="text-primary font-bold">
                  +{state.teamGuesses[team.id]?.points || 0}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return null;
}
