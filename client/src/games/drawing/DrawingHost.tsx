import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../components/common/Button';
import { Card, CardHeader } from '../../components/common/Card';
import { DrawingCanvas } from './DrawingCanvas';
import {
  DEFAULT_DRAWING_CONFIG,
  DrawingGameState,
  DrawingHistoryItem,
  createInitialDrawingState,
  formatSeconds,
} from './types';
import { buildWordQueue, parseCustomWords } from './words';

interface Team {
  id: string;
  name: string | null;
  score: number;
}

interface DrawingHostProps {
  roomCode: string;
  teams: Team[];
  gameState: DrawingGameState | null;
  onUpdateGameState: (state: DrawingGameState) => Promise<void>;
  onAdjustScore: (teamId: string, amount: number) => Promise<void>;
  onEndGame: () => void;
}

const SYNC_INTERVAL_MS = 120;

export function DrawingHost({
  teams,
  gameState,
  onUpdateGameState,
  onAdjustScore,
  onEndGame,
}: DrawingHostProps) {
  const [localState, setLocalState] = useState<DrawingGameState | null>(gameState);
  const [customWordsInput, setCustomWordsInput] = useState('');
  const [now, setNow] = useState(Date.now());
  const pendingSyncRef = useRef<DrawingGameState | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const teamIds = useMemo(() => teams.map(team => team.id), [teams]);
  const teamMap = useMemo(() => new Map(teams.map(team => [team.id, team])), [teams]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!teams.length) return;

    if (gameState && gameState.gameType === 'drawing' && gameState.gameStarted) {
      setLocalState(gameState);
      return;
    }

    const customWords = parseCustomWords(customWordsInput);
    const totalWords = teams.length * DEFAULT_DRAWING_CONFIG.wordsPerDrawer;
    const wordQueue = buildWordQueue(totalWords, customWords);
    const initial = createInitialDrawingState({
      teamIds,
      wordQueue,
      config: DEFAULT_DRAWING_CONFIG,
      customWords,
    });
    setLocalState(initial);
    void onUpdateGameState(initial);
  }, [gameState, teamIds, teams.length]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!localState || localState.phase !== 'DRAWING' || !localState.drawingEndsAt) return;
    const endsAt = new Date(localState.drawingEndsAt).getTime();
    if (now >= endsAt) {
      const nextState: DrawingGameState = {
        ...localState,
        phase: 'RESULT',
        drawingEndsAt: null,
      };
      updateState(nextState, true);
    }
  }, [now, localState]);

  const updateState = (nextState: DrawingGameState, immediate = false) => {
    setLocalState(nextState);

    if (immediate) {
      void onUpdateGameState(nextState);
      return;
    }

    pendingSyncRef.current = nextState;
    if (syncTimerRef.current) return;

    syncTimerRef.current = window.setTimeout(() => {
      const stateToSend = pendingSyncRef.current;
      pendingSyncRef.current = null;
      syncTimerRef.current = null;
      if (stateToSend) {
        void onUpdateGameState(stateToSend);
      }
    }, SYNC_INTERVAL_MS);
  };

  if (!localState) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-xl">Loading drawing game...</div>
        </div>
      </Card>
    );
  }

  const currentDrawer = localState.currentDrawerTeamId
    ? teamMap.get(localState.currentDrawerTeamId) || null
    : null;

  const remainingSeconds = localState.drawingEndsAt
    ? Math.max(0, Math.ceil((new Date(localState.drawingEndsAt).getTime() - now) / 1000))
    : null;

  const handleStartDrawing = () => {
    if (!localState.currentWord) return;
    const endsAt = new Date(Date.now() + localState.drawingTimeSec * 1000).toISOString();
    const nextState: DrawingGameState = {
      ...localState,
      phase: 'DRAWING',
      drawingEndsAt: endsAt,
      strokes: [],
    };
    updateState(nextState, true);
  };

  const handleRevealWord = () => {
    const nextState: DrawingGameState = {
      ...localState,
      phase: 'RESULT',
      drawingEndsAt: null,
    };
    updateState(nextState, true);
  };

  const advanceToNextWord = async (correct: boolean) => {
    const currentWord = localState.currentWord;
    const teamId = localState.currentDrawerTeamId;
    if (!currentWord || !teamId) return;

    const points = correct ? localState.pointsPerCorrect : 0;
    const historyEntry: DrawingHistoryItem = {
      word: currentWord.word,
      teamId,
      correct,
      points,
    };

    const nextHistory = [...localState.history, historyEntry];
    const nextScores = { ...localState.roundScores };
    if (correct) {
      nextScores[teamId] = (nextScores[teamId] || 0) + points;
      await onAdjustScore(teamId, points);
    }

    const nextIndex = localState.currentWordIndex + 1;
    const isComplete = nextIndex >= localState.wordQueue.length;

    if (isComplete) {
      const finalState: DrawingGameState = {
        ...localState,
        phase: 'GAME_RESULTS',
        gameEnded: true,
        currentWordIndex: nextIndex,
        currentDrawerTeamId: null,
        currentWord: null,
        strokes: [],
        drawingEndsAt: null,
        roundScores: nextScores,
        history: nextHistory,
      };
      updateState(finalState, true);
      return;
    }

    const nextWord = localState.wordQueue[nextIndex];
    const nextDrawerId = localState.drawerOrder[nextIndex];
    const nextState: DrawingGameState = {
      ...localState,
      phase: 'SELECT_DRAWER',
      currentWordIndex: nextIndex,
      currentWord: nextWord,
      currentDrawerTeamId: nextDrawerId,
      strokes: [],
      drawingEndsAt: null,
      roundScores: nextScores,
      history: nextHistory,
    };

    updateState(nextState, true);
  };

  const handleEndGame = () => {
    onEndGame();
  };

  const handleApplyCustomWords = () => {
    const customWords = parseCustomWords(customWordsInput);
    const totalWords = teamIds.length * localState.wordsPerDrawer;
    const wordQueue = buildWordQueue(totalWords, customWords);
    const drawerOrder: string[] = [];
    teamIds.forEach(teamId => {
      for (let i = 0; i < localState.wordsPerDrawer; i += 1) {
        drawerOrder.push(teamId);
      }
    });
    const nextState: DrawingGameState = {
      ...localState,
      wordQueue,
      currentWordIndex: 0,
      currentWord: wordQueue[0] || null,
      drawerOrder,
      currentDrawerTeamId: drawerOrder[0] || null,
      customWords,
      history: [],
      roundScores: teamIds.reduce<Record<string, number>>((acc, id) => {
        acc[id] = 0;
        return acc;
      }, {}),
    };
    updateState(nextState, true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center text-gray-400 text-sm">
        Word {Math.min(localState.currentWordIndex + 1, localState.wordQueue.length)} of {localState.wordQueue.length}
      </div>

      {localState.phase === 'SELECT_DRAWER' && (
        <div className="space-y-4">
          {localState.currentWordIndex === 0 && (
            <Card>
              <CardHeader>Custom Words (Optional)</CardHeader>
              <div className="space-y-3">
                <textarea
                  className="w-full rounded-lg bg-bg-secondary border border-gray-700 p-3 text-sm"
                  rows={3}
                  placeholder="Add custom words separated by commas or new lines"
                  value={customWordsInput}
                  onChange={(event) => setCustomWordsInput(event.target.value)}
                />
                <Button variant="secondary" onClick={handleApplyCustomWords}>
                  Update Word Queue
                </Button>
              </div>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-bg-secondary to-bg-primary">
            <div className="text-center py-6 space-y-3">
              <div className="text-sm text-gray-400">Pass tablet to</div>
              <div className="text-3xl font-bold text-primary">
                {currentDrawer?.name || 'Next Team'}
              </div>
              <div className="text-sm text-gray-400">Secret word</div>
              <div className="text-2xl font-bold">{localState.currentWord?.word || '...'}</div>
              <Button size="lg" onClick={handleStartDrawing}>
                Start Drawing
              </Button>
            </div>
          </Card>
        </div>
      )}

      {localState.phase === 'DRAWING' && (
        <div className="flex flex-col gap-4 min-h-[70vh]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Drawing Team</div>
              <div className="text-xl font-bold">
                {currentDrawer?.name || 'Team'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Time Left</div>
              <div className="text-2xl font-bold text-primary">
                {remainingSeconds !== null ? formatSeconds(remainingSeconds) : '--:--'}
              </div>
            </div>
          </div>

          <DrawingCanvas
            strokes={localState.strokes}
            onStrokesChange={(strokes) => {
              const nextState: DrawingGameState = {
                ...localState,
                strokes,
              };
              updateState(nextState, false);
            }}
            className="w-full flex-1 min-h-[50vh] md:min-h-[60vh]"
          />

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={handleRevealWord}>
              End Turn
            </Button>
          </div>
        </div>
      )}

      {localState.phase === 'RESULT' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>Reveal</CardHeader>
            <div className="text-center space-y-2 py-4">
              <div className="text-sm text-gray-400">The word was</div>
              <div className="text-3xl font-bold text-primary">
                {localState.currentWord?.word || '...'}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="py-4"
              onClick={() => void advanceToNextWord(true)}
            >
              Correct +{localState.pointsPerCorrect}
            </Button>
            <Button
              variant="secondary"
              className="py-4"
              onClick={() => void advanceToNextWord(false)}
            >
              Skip
            </Button>
          </div>
        </div>
      )}

      {localState.phase === 'GAME_RESULTS' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>Drawing Results</CardHeader>
            <div className="space-y-2">
              {teams
                .map(team => ({
                  team,
                  score: localState.roundScores[team.id] || 0,
                }))
                .sort((a, b) => b.score - a.score)
                .map(({ team, score }) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                  >
                    <div className="font-medium">{team.name || 'Team'}</div>
                    <div className="text-primary font-bold">+{score} pts</div>
                  </div>
                ))}
            </div>
          </Card>

          <Button className="w-full" onClick={handleEndGame}>
            End Game Phase
          </Button>
        </div>
      )}
    </div>
  );
}
