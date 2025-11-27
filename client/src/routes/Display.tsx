import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Timer } from '../components/common/Timer';
import { TeamCard } from '../components/common/TeamCard';
import { RoomCode } from '../components/common/RoomCode';
import { useRoom } from '../contexts/RoomContext';

export function Display() {
  const { code } = useParams<{ code: string }>();
  const { room, joinAsDisplay, error, isConnected } = useRoom();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (code) {
      joinAsDisplay(code)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-4xl font-bold neon-glow animate-pulse">WING NIGHT</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="text-2xl text-red-500 mb-4">{error || 'Room not found'}</div>
        </div>
      </div>
    );
  }

  const currentRound = room.rounds.find(r => r.roundNumber === room.currentRoundNumber);
  const sortedTeams = [...room.teams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-bg-primary p-8 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-5xl font-bold neon-glow">{room.name || 'WING NIGHT'}</h1>
          {room.currentRoundNumber > 0 && (
            <div className="text-2xl text-gray-400 mt-2">
              Round {room.currentRoundNumber} of {room.totalRounds}
            </div>
          )}
        </div>
        <RoomCode code={room.code} showQR size="lg" />
      </div>

      {/* Main content based on phase */}
      <div className="flex-1 flex items-center justify-center">
        {room.phase === 'DRAFT' && (
          <div className="text-center">
            <div className="text-4xl font-bold mb-4">Setting up...</div>
            <div className="text-xl text-gray-400">Host is configuring the game</div>
          </div>
        )}

        {room.phase === 'LOBBY' && (
          <div className="text-center w-full max-w-4xl">
            <div className="text-4xl font-bold mb-8">Join the Game!</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {room.teams.map(team => (
                <TeamCard key={team.id} team={team} showPlayers />
              ))}
            </div>
            <div className="text-2xl text-gray-400">
              {room.players.length} player{room.players.length !== 1 ? 's' : ''} joined
            </div>
          </div>
        )}

        {room.phase === 'TEAM_SETUP' && (
          <div className="text-center w-full max-w-4xl">
            <div className="text-4xl font-bold mb-8">Team Setup</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {room.teams.map(team => (
                <div
                  key={team.id}
                  className={`p-6 rounded-xl ${team.isReady ? 'bg-green-900/30 border border-green-500' : 'bg-bg-card border border-gray-700'}`}
                >
                  {team.logoUrl ? (
                    <img
                      src={`http://localhost:3000${team.logoUrl}`}
                      alt={team.name || 'Team'}
                      className="w-24 h-24 mx-auto rounded-xl object-cover mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 mx-auto rounded-xl bg-gray-700 flex items-center justify-center text-4xl mb-4">
                      {team.emoji || '?'}
                    </div>
                  )}
                  <div className="text-xl font-bold">{team.name || 'Team'}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {team.isReady ? 'Ready!' : 'Setting up...'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {room.phase === 'GAME_INTRO' && (
          <div className="text-center">
            <div className="text-8xl font-bold neon-glow animate-pulse">
              GET READY!
            </div>
          </div>
        )}

        {room.phase === 'ROUND_INTRO' && currentRound && (
          <div className="text-center">
            <div className="text-3xl text-gray-400 mb-4">Round {room.currentRoundNumber}</div>
            <div className="text-8xl font-bold neon-glow mb-8">
              {currentRound.sauceName}
            </div>
            {currentRound.sauceScovilles && (
              <div className="text-3xl text-primary">
                {currentRound.sauceScovilles.toLocaleString()} Scoville Units
              </div>
            )}
          </div>
        )}

        {room.phase === 'EATING_PHASE' && (
          <div className="text-center">
            <Timer timerState={room.timerState} size="xl" showLabel />
            <div className="mt-8 text-4xl font-bold">EAT THOSE WINGS!</div>
            {currentRound && (
              <div className="mt-4 text-2xl text-primary">{currentRound.sauceName}</div>
            )}
          </div>
        )}

        {room.phase === 'GAME_PHASE' && (
          <div className="text-center w-full max-w-4xl">
            <div className="text-4xl font-bold mb-8">GAME TIME</div>
            {room.timerState && <Timer timerState={room.timerState} size="lg" />}
            <div className="grid grid-cols-2 gap-4 mt-8">
              {sortedTeams.map((team, i) => (
                <TeamCard key={team.id} team={team} rank={i + 1} showScore />
              ))}
            </div>
          </div>
        )}

        {room.phase === 'ROUND_RESULTS' && (
          <div className="text-center w-full max-w-4xl">
            <div className="text-4xl font-bold mb-8">Round {room.currentRoundNumber} Results</div>
            <div className="space-y-4">
              {sortedTeams.map((team, i) => (
                <TeamCard key={team.id} team={team} rank={i + 1} showScore />
              ))}
            </div>
          </div>
        )}

        {room.phase === 'GAME_END' && (
          <div className="text-center w-full max-w-4xl">
            <div className="text-6xl font-bold neon-glow-gold mb-8">
              WINNER!
            </div>
            {sortedTeams[0] && (
              <div className="mb-8">
                {sortedTeams[0].logoUrl ? (
                  <img
                    src={`http://localhost:3000${sortedTeams[0].logoUrl}`}
                    alt={sortedTeams[0].name || 'Winner'}
                    className="w-48 h-48 mx-auto rounded-2xl object-cover mb-4"
                  />
                ) : (
                  <div className="w-48 h-48 mx-auto rounded-2xl bg-secondary flex items-center justify-center text-8xl mb-4">
                    {sortedTeams[0].emoji || '🏆'}
                  </div>
                )}
                <div className="text-5xl font-bold">{sortedTeams[0].name}</div>
                <div className="text-3xl text-primary mt-2">{sortedTeams[0].score} points</div>
              </div>
            )}
            <div className="space-y-2 mt-8">
              {sortedTeams.slice(1).map((team, i) => (
                <TeamCard key={team.id} team={team} rank={i + 2} showScore compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer scoreboard (always visible during game) */}
      {['EATING_PHASE', 'GAME_PHASE', 'ROUND_INTRO'].includes(room.phase) && (
        <div className="mt-8 grid grid-cols-6 gap-2">
          {sortedTeams.map((team, i) => (
            <div
              key={team.id}
              className={`p-3 rounded-lg ${i === 0 ? 'bg-primary/20 border border-primary' : 'bg-bg-card'}`}
            >
              <div className="text-lg font-bold truncate">{team.name}</div>
              <div className="text-2xl font-bold text-primary">{team.score}</div>
            </div>
          ))}
        </div>
      )}

      {/* Connection indicator */}
      <div className="absolute bottom-4 right-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
      </div>
    </div>
  );
}
