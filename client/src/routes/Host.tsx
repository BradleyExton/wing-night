import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { Timer } from '../components/common/Timer';
import { TeamCard } from '../components/common/TeamCard';
import { RoomCode } from '../components/common/RoomCode';
import { useRoom } from '../contexts/RoomContext';
import { api } from '../lib/api';

export function Host() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { room, joinAsHost, error: roomError, isConnected } = useRoom();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      joinAsHost(code)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [code]);

  const handleAdvancePhase = async (nextPhase: string) => {
    if (!room) return;
    try {
      await api.advancePhase(room.code, nextPhase);
    } catch (err) {
      setError('Failed to advance phase');
    }
  };

  const handleStartTimer = async (duration: number, type: string) => {
    if (!room) return;
    try {
      await api.startTimer(room.code, duration, type);
    } catch (err) {
      setError('Failed to start timer');
    }
  };

  const handlePauseTimer = async () => {
    if (!room) return;
    try {
      await api.pauseTimer(room.code);
    } catch (err) {
      setError('Failed to pause timer');
    }
  };

  const handleResumeTimer = async () => {
    if (!room) return;
    try {
      await api.resumeTimer(room.code);
    } catch (err) {
      setError('Failed to resume timer');
    }
  };

  const handleAddTime = async () => {
    if (!room) return;
    try {
      await api.addTime(room.code, 30);
    } catch (err) {
      setError('Failed to add time');
    }
  };

  const handleAdjustScore = async (teamId: string, amount: number) => {
    if (!room) return;
    try {
      await api.adjustScore(room.code, teamId, amount);
    } catch (err) {
      setError('Failed to adjust score');
    }
  };

  const handleAddTeam = async () => {
    if (!room) return;
    try {
      await api.createTeam(room.code, { createdBy: 'HOST' });
    } catch (err) {
      setError('Failed to create team');
    }
  };

  const handleEndGame = async () => {
    if (!room) return;
    try {
      await api.endGame(room.code, 'host_ended');
    } catch (err) {
      setError('Failed to end game');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Connecting...</div>
      </div>
    );
  }

  if (error || roomError || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-500 mb-4">{error || roomError || 'Failed to load room'}</div>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const currentRound = room.rounds.find(r => r.roundNumber === room.currentRoundNumber);

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Host Controls</div>
          <h1 className="text-2xl font-bold">{room.name || 'Wing Night'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <RoomCode code={room.code} size="sm" showQR />
        </div>
      </div>

      {/* Phase indicator */}
      <div className="bg-primary/20 rounded-lg px-4 py-2 mb-6 text-center">
        <span className="text-primary font-semibold">{room.phase.replace('_', ' ')}</span>
        {room.currentRoundNumber > 0 && (
          <span className="text-gray-400 ml-2">
            Round {room.currentRoundNumber} of {room.totalRounds}
          </span>
        )}
      </div>

      {/* Timer */}
      {room.timerState && (
        <div className="text-center mb-6">
          <Timer timerState={room.timerState} size="lg" showLabel />
          <div className="flex justify-center gap-2 mt-4">
            {room.timerState.isPaused ? (
              <Button size="sm" onClick={handleResumeTimer}>Resume</Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={handlePauseTimer}>Pause</Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleAddTime}>+30s</Button>
          </div>
        </div>
      )}

      {/* Phase-specific controls */}
      <div className="grid gap-4 mb-6">
        {room.phase === 'LOBBY' && (
          <>
            <Card>
              <CardHeader>Teams ({room.teams.length}/{room.maxTeams})</CardHeader>
              <div className="space-y-2">
                {room.teams.map(team => (
                  <TeamCard key={team.id} team={team} showPlayers compact />
                ))}
                {room.teams.length < room.maxTeams && (
                  <Button variant="ghost" className="w-full" onClick={handleAddTeam}>
                    + Add Team
                  </Button>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader>Players ({room.players.length})</CardHeader>
              <div className="flex flex-wrap gap-2">
                {room.players.map(player => (
                  <div
                    key={player.id}
                    className="bg-bg-secondary rounded-full px-3 py-1 text-sm flex items-center gap-2"
                  >
                    <span>{player.name}</span>
                    {player.isConnected && <span className="w-2 h-2 rounded-full bg-green-500" />}
                  </div>
                ))}
                {room.players.length === 0 && (
                  <div className="text-gray-500">No players yet. Share the room code!</div>
                )}
              </div>
            </Card>
            <Button
              className="w-full"
              onClick={() => handleAdvancePhase('TEAM_SETUP')}
              disabled={room.teams.length < 3}
            >
              Start Team Setup
              {room.teams.length < 3 && <span className="text-sm ml-2">(Need 3+ teams)</span>}
            </Button>
          </>
        )}

        {room.phase === 'TEAM_SETUP' && (
          <>
            <Card>
              <CardHeader>Team Setup Progress</CardHeader>
              <div className="space-y-2">
                {room.teams.map(team => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {team.logoUrl ? (
                        <img
                          src={`http://localhost:3000${team.logoUrl}`}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                          {team.emoji || '?'}
                        </div>
                      )}
                      <span className="font-medium">{team.name || 'Unnamed'}</span>
                    </div>
                    <span className={team.isReady ? 'text-green-500' : 'text-yellow-500'}>
                      {team.isReady ? 'Ready' : 'Setting up...'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Button
              className="w-full"
              onClick={() => handleAdvancePhase('GAME_INTRO')}
            >
              Start Game
            </Button>
          </>
        )}

        {room.phase === 'GAME_INTRO' && (
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold neon-glow">GET READY!</div>
            <Button onClick={() => handleAdvancePhase('ROUND_INTRO')}>
              Begin Round 1
            </Button>
          </div>
        )}

        {room.phase === 'ROUND_INTRO' && currentRound && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">Round {room.currentRoundNumber}</div>
            <div className="text-4xl text-primary font-bold neon-glow">
              {currentRound.sauceName}
            </div>
            {currentRound.sauceScovilles && (
              <div className="text-gray-400">
                {currentRound.sauceScovilles.toLocaleString()} Scoville Units
              </div>
            )}
            <Button onClick={() => {
              handleStartTimer(120, 'EATING_PHASE');
              handleAdvancePhase('EATING_PHASE');
            }}>
              Start Eating!
            </Button>
          </div>
        )}

        {room.phase === 'EATING_PHASE' && (
          <>
            <Card>
              <CardHeader>Wing Tracking</CardHeader>
              <div className="space-y-2">
                {room.teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                    <span>{team.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => api.markTeamWings(room.code, room.currentRoundNumber, team.id, true)}
                    >
                      Mark All Done
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
            <Button
              className="w-full"
              onClick={() => handleAdvancePhase('GAME_PHASE')}
            >
              End Eating & Start Game
            </Button>
          </>
        )}

        {room.phase === 'GAME_PHASE' && (
          <>
            <Card>
              <CardHeader>Manual Scoring</CardHeader>
              <div className="space-y-3">
                {room.teams.map(team => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
                    <div>
                      <span className="font-medium">{team.name}</span>
                      <span className="text-primary ml-2 font-bold">{team.score} pts</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleAdjustScore(team.id, 50)}>+50</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleAdjustScore(team.id, 100)}>+100</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleAdjustScore(team.id, -50)}>-50</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Button
              className="w-full"
              onClick={async () => {
                await api.completeRound(room.code, room.currentRoundNumber);
                handleAdvancePhase('ROUND_RESULTS');
              }}
            >
              End Game Phase
            </Button>
          </>
        )}

        {room.phase === 'ROUND_RESULTS' && (
          <>
            <Card>
              <CardHeader>Round {room.currentRoundNumber} Results</CardHeader>
              <div className="space-y-2">
                {[...room.teams].sort((a, b) => b.score - a.score).map((team, i) => (
                  <TeamCard key={team.id} team={team} rank={i + 1} showScore />
                ))}
              </div>
            </Card>
            {room.currentRoundNumber < room.totalRounds ? (
              <Button
                className="w-full"
                onClick={async () => {
                  await api.updateRoom(room.code, { currentRoundNumber: room.currentRoundNumber + 1 });
                  handleAdvancePhase('ROUND_INTRO');
                }}
              >
                Next Round
              </Button>
            ) : (
              <Button className="w-full" onClick={handleEndGame}>
                Show Final Results
              </Button>
            )}
          </>
        )}

        {room.phase === 'GAME_END' && (
          <div className="text-center space-y-6">
            <div className="text-2xl font-bold">Game Over!</div>
            {room.teams.length > 0 && (
              <>
                <div className="text-xl text-gray-400">Winner:</div>
                <TeamCard
                  team={[...room.teams].sort((a, b) => b.score - a.score)[0]}
                  showScore
                />
              </>
            )}
            <div className="space-y-2">
              {[...room.teams].sort((a, b) => b.score - a.score).map((team, i) => (
                <TeamCard key={team.id} team={team} rank={i + 1} showScore compact />
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => api.resetGame(room.code, true, false)}>
                Play Again
              </Button>
              <Button variant="secondary" onClick={() => navigate('/')}>
                End Session
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <Card className="mt-auto">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => window.open(`/display/${room.code}`, '_blank')}>
            Open TV Display
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/play/${room.code}`)}>
            Copy Join Link
          </Button>
          {room.phase !== 'GAME_END' && (
            <Button size="sm" variant="danger" onClick={handleEndGame}>
              End Game Early
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
