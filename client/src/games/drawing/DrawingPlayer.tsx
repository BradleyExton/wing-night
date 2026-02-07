import { useEffect, useMemo, useState } from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingGameState, formatSeconds } from './types';

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

interface DrawingPlayerProps {
  player: Player;
  teams: Team[];
  gameState: DrawingGameState | null;
}

export function DrawingPlayer({ player, teams, gameState }: DrawingPlayerProps) {
  const [now, setNow] = useState(Date.now());
  const teamMap = useMemo(() => new Map(teams.map(team => [team.id, team])), [teams]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  if (!gameState || gameState.gameType !== 'drawing') {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div className="text-xl text-gray-400">Waiting for drawing game...</div>
      </div>
    );
  }

  const currentDrawer = gameState.currentDrawerTeamId
    ? teamMap.get(gameState.currentDrawerTeamId) || null
    : null;

  const remainingSeconds = gameState.drawingEndsAt
    ? Math.max(0, Math.ceil((new Date(gameState.drawingEndsAt).getTime() - now) / 1000))
    : null;

  if (gameState.phase === 'SELECT_DRAWER') {
    return (
      <div className="text-center space-y-4 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="text-4xl">🎨</div>
        <div className="text-xl font-bold">Drawing Challenge</div>
        <div className="text-gray-400">
          {currentDrawer?.name || 'Next team'} is getting the tablet...
        </div>
      </div>
    );
  }

  if (gameState.phase === 'DRAWING') {
    return (
      <div className="flex flex-col gap-4 min-h-[60vh]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Drawing Team</div>
            <div className="text-lg font-bold">{currentDrawer?.name || 'Team'}</div>
            {player.teamId === gameState.currentDrawerTeamId && (
              <div className="text-xs text-primary">Your team is drawing!</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Time Left</div>
            <div className="text-xl font-bold text-primary">
              {remainingSeconds !== null ? formatSeconds(remainingSeconds) : '--:--'}
            </div>
          </div>
        </div>

        <DrawingCanvas
          strokes={gameState.strokes}
          readonly
          className="w-full flex-1 min-h-[45vh] md:min-h-[55vh]"
        />

        <div className="text-center text-gray-400 text-sm">
          Shout out your guess!
        </div>
      </div>
    );
  }

  if (gameState.phase === 'RESULT') {
    return (
      <div className="flex flex-col gap-4 min-h-[60vh]">
        <DrawingCanvas
          strokes={gameState.strokes}
          readonly
          className="w-full flex-1 min-h-[40vh] md:min-h-[50vh]"
        />
        <div className="text-center">
          <div className="text-sm text-gray-400">The word was</div>
          <div className="text-2xl font-bold text-primary">{gameState.currentWord?.word}</div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'GAME_RESULTS') {
    const sorted = teams
      .map(team => ({
        team,
        score: gameState.roundScores[team.id] || 0,
      }))
      .sort((a, b) => b.score - a.score);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-3xl">🏆</div>
          <div className="text-xl font-bold">Round Results</div>
        </div>
        <div className="space-y-2">
          {sorted.map(({ team, score }) => (
            <div
              key={team.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                team.id === player.teamId ? 'bg-primary/20' : 'bg-bg-secondary'
              }`}
            >
              <div className="font-medium">{team.name || 'Team'}</div>
              <div className="text-primary font-bold">+{score}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
