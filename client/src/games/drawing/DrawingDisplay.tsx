import { useEffect, useMemo, useState } from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingGameState, formatSeconds } from './types';

interface Team {
  id: string;
  name: string | null;
  score: number;
}

interface DrawingDisplayProps {
  gameState: DrawingGameState | null;
  teams: Team[];
}

export function DrawingDisplay({ gameState, teams }: DrawingDisplayProps) {
  const [now, setNow] = useState(Date.now());
  const teamMap = useMemo(() => new Map(teams.map(team => [team.id, team])), [teams]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  if (!gameState || gameState.gameType !== 'drawing') {
    return (
      <div className="text-center">
        <div className="text-3xl font-bold">Drawing Challenge</div>
        <div className="text-gray-400">Waiting for the host...</div>
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
      <div className="text-center space-y-4">
        <div className="text-6xl">🎨</div>
        <div className="text-3xl font-bold">Drawing Challenge</div>
        <div className="text-xl text-gray-400">
          {currentDrawer?.name || 'Next team'} is getting the tablet...
        </div>
      </div>
    );
  }

  if (gameState.phase === 'DRAWING') {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Drawing Team</div>
            <div className="text-2xl font-bold">{currentDrawer?.name || 'Team'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Time Left</div>
            <div className="text-3xl font-bold text-primary">
              {remainingSeconds !== null ? formatSeconds(remainingSeconds) : '--:--'}
            </div>
          </div>
        </div>
        <DrawingCanvas
          strokes={gameState.strokes}
          readonly
          className="w-full h-[60vh] md:h-[65vh]"
        />
      </div>
    );
  }

  if (gameState.phase === 'RESULT') {
    return (
      <div className="w-full space-y-6">
        <DrawingCanvas
          strokes={gameState.strokes}
          readonly
          className="w-full h-[50vh] md:h-[55vh]"
        />
        <div className="text-center">
          <div className="text-sm text-gray-400">The word was</div>
          <div className="text-4xl font-bold text-primary">{gameState.currentWord?.word}</div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'GAME_RESULTS') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-2">🏆</div>
          <div className="text-3xl font-bold">Drawing Results</div>
        </div>
        <div className="space-y-2">
          {teams
            .map(team => ({
              team,
              score: gameState.roundScores[team.id] || 0,
            }))
            .sort((a, b) => b.score - a.score)
            .map(({ team, score }, index) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 bg-bg-card rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                  <div className="text-xl font-bold">{team.name || 'Team'}</div>
                </div>
                <div className="text-2xl font-bold text-primary">+{score}</div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  return null;
}
