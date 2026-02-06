import { GeoguesrGameState, formatDistance } from './types';

interface Team {
  id: string;
  name: string | null;
  score: number;
}

interface Player {
  id: string;
  name: string;
  teamId: string | null;
}

interface GeoguesrPlayerProps {
  player: Player;
  teams: Team[];
  gameState: GeoguesrGameState | null;
}

export function GeoguesrPlayer({ player, teams, gameState }: GeoguesrPlayerProps) {
  const myTeam = teams.find(t => t.id === player.teamId);
  const state = gameState;

  if (!state || !state.gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-xl text-gray-400">Waiting for game to start...</div>
      </div>
    );
  }

  if (state.gameEnded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <div className="text-xl">Round Complete!</div>
        </div>
      </div>
    );
  }

  const currentTeamId = state.teamOrder[state.currentTeamIndex];
  const currentTeam = teams.find(t => t.id === currentTeamId);
  const isMyTeamsTurn = currentTeamId === player.teamId;

  const teamsCompleted = state.teamOrder.filter(
    teamId => state.teamGuesses[teamId]?.submitted
  ).length;
  const totalTeams = state.teamOrder.length;

  const myGuess = player.teamId ? state.teamGuesses[player.teamId] : null;
  const hasMyTeamGuessed = myGuess?.submitted;

  const allTeamsGuessed = state.teamOrder.every(
    teamId => state.teamGuesses[teamId]?.submitted
  );

  // REVEAL phase - Show results
  if (state.phase === 'REVEAL' || allTeamsGuessed) {
    const myLocationId = player.teamId ? state.teamAssignments[player.teamId] : null;
    const myLocation = myLocationId
      ? state.locations.find(l => l.id === myLocationId)
      : null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🌍</div>
          <div className="text-xl font-bold">Results</div>
        </div>

        {/* My Team's Result */}
        {myTeam && myLocation && (
          <div className="bg-bg-card rounded-xl p-6 border border-gray-700">
            <div className="text-center mb-4">
              <div className="text-gray-400 mb-1">Your team's location</div>
              <div className="text-xl font-bold">{myLocation.name}</div>
            </div>

            {myGuess?.distance !== undefined ? (
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  +{myGuess.points || 0} points
                </div>
                <div className="text-gray-400">
                  {formatDistance(myGuess.distance)} away
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">No guess submitted</div>
            )}
          </div>
        )}

        {/* All Results */}
        <div className="bg-bg-card rounded-xl p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-3">All Results</div>
          <div className="space-y-2">
            {state.teamOrder
              .map(teamId => ({
                team: teams.find(t => t.id === teamId),
                guess: state.teamGuesses[teamId],
                location: state.locations.find(
                  l => l.id === state.teamAssignments[teamId]
                ),
              }))
              .sort((a, b) => (b.guess?.points || 0) - (a.guess?.points || 0))
              .map(({ team, guess, location }, i) => (
                <div
                  key={team?.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    team?.id === player.teamId ? 'bg-primary/20' : 'bg-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <div>
                      <div className="font-medium">{team?.name}</div>
                      <div className="text-xs text-gray-500">{location?.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">+{guess?.points || 0}</div>
                    {guess?.distance !== undefined && (
                      <div className="text-xs text-gray-500">
                        {formatDistance(guess.distance)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // WAITING or GUESSING phase
  return (
    <div className="space-y-6">
      <div className="text-center text-gray-400 text-sm">
        Round {state.currentRound}
      </div>

      {/* Status Card */}
      <div className="bg-bg-card rounded-xl p-6 border border-gray-700">
        {isMyTeamsTurn ? (
          // My team's turn
          <div className="text-center">
            {state.teamHasTablet ? (
              <>
                <div className="text-5xl mb-4 animate-pulse">🌍</div>
                <div className="text-xl font-bold text-primary mb-2">
                  Your team is guessing!
                </div>
                <div className="text-gray-400">
                  Discuss with your team and make your guess on the tablet
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">📱</div>
                <div className="text-xl font-bold text-primary mb-2">Your turn!</div>
                <div className="text-gray-400">
                  Get the tablet from the host to make your guess
                </div>
              </>
            )}
          </div>
        ) : hasMyTeamGuessed ? (
          // My team already guessed
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <div className="text-xl font-bold text-green-400 mb-2">Guess submitted!</div>
            <div className="text-gray-400">
              Waiting for other teams to finish...
            </div>
          </div>
        ) : (
          // Waiting for another team
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <div className="text-xl font-bold mb-2">
              {currentTeam?.name} is guessing...
            </div>
            <div className="text-gray-400">Your turn is coming up!</div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-bg-card rounded-xl p-4 border border-gray-700">
        <div className="text-center text-sm text-gray-400 mb-3">
          {teamsCompleted} of {totalTeams} teams done
        </div>
        <div className="flex justify-center gap-2">
          {state.teamOrder.map((teamId, i) => {
            const team = teams.find(t => t.id === teamId);
            const guess = state.teamGuesses[teamId];
            const isCurrent = i === state.currentTeamIndex;
            const isMe = teamId === player.teamId;

            return (
              <div
                key={teamId}
                className={`flex flex-col items-center ${isMe ? 'opacity-100' : 'opacity-70'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    guess?.submitted
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-primary animate-pulse'
                      : 'bg-gray-600'
                  }`}
                >
                  {guess?.submitted && <span className="text-black text-sm">✓</span>}
                </div>
                <div
                  className={`text-xs truncate max-w-[60px] ${
                    isMe ? 'text-primary font-bold' : 'text-gray-500'
                  }`}
                >
                  {team?.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Team Score */}
      {myTeam && (
        <div className="bg-bg-card rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{myTeam.name}</span>
            <span className="text-2xl font-bold text-primary">{myTeam.score} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
