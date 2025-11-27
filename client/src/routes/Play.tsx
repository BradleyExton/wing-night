import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { Timer } from '../components/common/Timer';
import { TeamCard } from '../components/common/TeamCard';
import { useRoom } from '../contexts/RoomContext';
import { api } from '../lib/api';

export function Play() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, player, joinAsPlayer, error, isConnected } = useRoom();
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!code || !playerName.trim()) return;
    setJoining(true);
    setJoinError(null);
    try {
      await joinAsPlayer(code, playerName.trim());
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectTeam = async (teamId: string) => {
    if (!player || !room) return;
    try {
      await api.updatePlayer(room.code, player.id, { teamId });
      setSelectedTeamId(teamId);
    } catch (err) {
      console.error('Failed to select team');
    }
  };

  const handleReady = async () => {
    if (!player || !room) return;
    try {
      await api.updatePlayer(room.code, player.id, { isReady: !player.isReady });
    } catch (err) {
      console.error('Failed to toggle ready');
    }
  };

  // Not joined yet - show join form
  if (!player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-glow mb-2">WING NIGHT</h1>
          <div className="text-lg text-gray-400">Join room: <span className="font-mono text-primary">{code}</span></div>
        </div>

        <Card className="w-full max-w-sm">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
            <Button
              className="w-full"
              onClick={handleJoin}
              loading={joining}
              disabled={!playerName.trim()}
            >
              Join Game
            </Button>
            {(joinError || error) && (
              <p className="text-red-500 text-center">{joinError || error}</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Joined - show game state
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const myTeam = room.teams.find(t => t.id === player.teamId);
  const currentRound = room.rounds.find(r => r.roundNumber === room.currentRoundNumber);
  const sortedTeams = [...room.teams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-400">Playing as</div>
          <div className="font-bold text-lg">{player.name}</div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">{isConnected ? 'Connected' : 'Reconnecting...'}</span>
        </div>
      </div>

      {/* Team badge */}
      {myTeam && (
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            {myTeam.logoUrl ? (
              <img
                src={`http://localhost:3000${myTeam.logoUrl}`}
                alt={myTeam.name || 'Team'}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
                {myTeam.emoji || '🔥'}
              </div>
            )}
            <div className="flex-1">
              <div className="font-bold">{myTeam.name}</div>
              <div className="text-sm text-gray-400">{myTeam.players?.length || 0} players</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{myTeam.score}</div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>
        </Card>
      )}

      {/* Phase content */}
      <div className="flex-1">
        {room.phase === 'LOBBY' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>Pick Your Team</CardHeader>
              <div className="space-y-2">
                {room.teams.map(team => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    showPlayers
                    compact
                    selected={player.teamId === team.id}
                    onClick={() => handleSelectTeam(team.id)}
                  />
                ))}
              </div>
            </Card>
            {!player.teamId && (
              <p className="text-center text-gray-400">Select a team to join</p>
            )}
          </div>
        )}

        {room.phase === 'TEAM_SETUP' && myTeam && (
          <div className="space-y-4">
            <Card>
              <CardHeader>Team Setup</CardHeader>
              <div className="space-y-4">
                <div className="text-center">
                  {myTeam.logoUrl ? (
                    <img
                      src={`http://localhost:3000${myTeam.logoUrl}`}
                      alt={myTeam.name || 'Team'}
                      className="w-32 h-32 mx-auto rounded-xl object-cover mb-4"
                    />
                  ) : (
                    <div className="w-32 h-32 mx-auto rounded-xl bg-gray-700 flex items-center justify-center text-5xl mb-4">
                      {myTeam.emoji || '?'}
                    </div>
                  )}
                  <div className="text-xl font-bold">{myTeam.name}</div>
                </div>
                <div className="text-center text-gray-400">
                  Host is setting up the team logos and names
                </div>
              </div>
            </Card>
            <Button
              className="w-full"
              variant={player.isReady ? 'secondary' : 'primary'}
              onClick={handleReady}
            >
              {player.isReady ? "I'm Ready!" : 'Mark as Ready'}
            </Button>
          </div>
        )}

        {room.phase === 'GAME_INTRO' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold neon-glow animate-pulse">
                GET READY!
              </div>
              <div className="text-xl text-gray-400 mt-4">Game starting soon...</div>
            </div>
          </div>
        )}

        {room.phase === 'ROUND_INTRO' && currentRound && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl text-gray-400 mb-2">Round {room.currentRoundNumber}</div>
              <div className="text-4xl font-bold neon-glow mb-4">
                {currentRound.sauceName}
              </div>
              {currentRound.sauceScovilles && (
                <div className="text-primary">
                  {currentRound.sauceScovilles.toLocaleString()} SHU
                </div>
              )}
            </div>
          </div>
        )}

        {room.phase === 'EATING_PHASE' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Timer timerState={room.timerState} size="xl" />
            <div className="text-2xl font-bold mt-8">EAT THAT WING!</div>
            {currentRound && (
              <div className="text-xl text-primary mt-2">{currentRound.sauceName}</div>
            )}
          </div>
        )}

        {room.phase === 'GAME_PHASE' && (
          <div className="space-y-4">
            {room.timerState && (
              <div className="text-center">
                <Timer timerState={room.timerState} size="lg" />
              </div>
            )}
            <Card>
              <CardHeader>Current Standings</CardHeader>
              <div className="space-y-2">
                {sortedTeams.map((team, i) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    rank={i + 1}
                    showScore
                    compact
                    selected={team.id === player.teamId}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        {room.phase === 'ROUND_RESULTS' && (
          <div className="space-y-4">
            <div className="text-center text-xl font-bold">
              Round {room.currentRoundNumber} Complete!
            </div>
            <Card>
              <div className="space-y-2">
                {sortedTeams.map((team, i) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    rank={i + 1}
                    showScore
                    selected={team.id === player.teamId}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}

        {room.phase === 'GAME_END' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-bold neon-glow-gold mb-8">
              GAME OVER!
            </div>
            {sortedTeams[0] && (
              <div className="mb-6">
                <div className="text-xl text-gray-400 mb-2">Winner</div>
                <div className="text-3xl font-bold">{sortedTeams[0].name}</div>
                <div className="text-2xl text-primary">{sortedTeams[0].score} pts</div>
              </div>
            )}
            {myTeam && (
              <div className="text-gray-400">
                Your team: #{sortedTeams.findIndex(t => t.id === myTeam.id) + 1} place
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game paused overlay */}
      {room.isPaused && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-4xl font-bold mb-4">PAUSED</div>
            <div className="text-gray-400">Waiting for host...</div>
          </div>
        </div>
      )}
    </div>
  );
}
