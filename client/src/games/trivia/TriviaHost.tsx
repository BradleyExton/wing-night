import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Card, CardHeader } from '../../components/common/Card';
import { TriviaGameState, createInitialTriviaState } from './types';
import { getRandomQuestions } from './questions';
import { api } from '../../lib/api';

interface Team {
  id: string;
  name: string | null;
  score: number;
}

interface TriviaHostProps {
  roomCode: string;
  teams: Team[];
  gameState: TriviaGameState | null;
  onUpdateGameState: (state: TriviaGameState) => Promise<void>;
  onAdjustScore: (teamId: string, amount: number) => Promise<void>;
  onEndGame: () => void;
  // Optional test mode callbacks (used instead of API calls)
  onMarkResult?: (correct: boolean, points: number) => void;
  onSkip?: () => void;
}

export function TriviaHost({
  roomCode,
  teams,
  gameState,
  onUpdateGameState,
  onAdjustScore,
  onEndGame,
  onMarkResult,
  onSkip,
}: TriviaHostProps) {
  const [saving, setSaving] = useState(false);
  const [answerHidden, setAnswerHidden] = useState(true); // Host can toggle to see answer

  // Use gameState directly from props (synced via socket)
  const state = gameState;

  // Initialize game state if not already set
  useEffect(() => {
    if (!state || !state.gameStarted) {
      const questions = getRandomQuestions(3);
      const initialState = createInitialTriviaState(questions);
      initialState.gameStarted = true;
      // Initialize teamAnswers for all teams
      teams.forEach(team => {
        initialState.teamAnswers[team.id] = [];
      });
      onUpdateGameState(initialState);
    }
  }, [state, teams, onUpdateGameState]);

  if (!state || !state.questions.length) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-xl">Loading trivia...</div>
        </div>
      </Card>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const isLastQuestion = state.currentQuestionIndex >= state.questions.length - 1;
  const buzzedTeam = teams.find(t => t.id === state.buzzedTeamId);
  const failedTeamIds = state.failedTeams || [];
  const remainingTeams = teams.filter(t => !failedTeamIds.includes(t.id));
  const isStealMode = failedTeamIds.length > 0 && !state.buzzedTeamId && state.questionActive;

  // Start the question (open for buzzing)
  const handleStartQuestion = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newState: TriviaGameState = {
        ...state,
        questionActive: true,
        buzzedTeamId: null,
        buzzedPlayerId: null,
        buzzedPlayerName: null,
        buzzLocked: false,
        failedTeams: [],
        showAnswer: false,
      };
      await onUpdateGameState(newState);
    } finally {
      setSaving(false);
    }
  };

  // Host marks the buzzing team's answer
  const handleMarkResult = async (correct: boolean) => {
    if (saving || !state.buzzedTeamId) return;
    setSaving(true);

    try {
      const points = currentQuestion.points || 100;
      if (onMarkResult) {
        // Test mode - use callback instead of API
        onMarkResult(correct, points);
      } else {
        // Real mode - call API
        await api.triviaResult(roomCode, correct, points);
      }
    } finally {
      setSaving(false);
    }
  };

  // Skip question (no one got it)
  const handleSkip = async () => {
    if (saving) return;
    setSaving(true);

    try {
      if (onSkip) {
        // Test mode - use callback instead of API
        onSkip();
      } else {
        // Real mode - call API
        await api.triviaSkip(roomCode);
      }
    } finally {
      setSaving(false);
    }
  };

  // Move to next question
  const handleNextQuestion = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newState: TriviaGameState = {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        showAnswer: false,
        questionActive: false,
        buzzedTeamId: null,
        buzzedPlayerId: null,
        buzzedPlayerName: null,
        buzzLocked: false,
        failedTeams: [],
      };
      setAnswerHidden(true); // Reset answer visibility for new question
      await onUpdateGameState(newState);
    } finally {
      setSaving(false);
    }
  };

  // End trivia game
  const handleEndTrivia = async () => {
    const newState = { ...state, gameEnded: true };
    await onUpdateGameState(newState);
    onEndGame();
  };

  // Calculate total round score
  const getRoundScore = (teamId: string): number => {
    const answers = state.teamAnswers[teamId] || [];
    return answers.filter(Boolean).length * (currentQuestion.points || 100);
  };

  return (
    <div className="space-y-4">
      {/* Question Progress */}
      <div className="text-center text-gray-400 text-sm">
        Question {state.currentQuestionIndex + 1} of {state.questions.length}
      </div>

      {/* Category Badge */}
      {currentQuestion.category && (
        <div className="text-center">
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
            {currentQuestion.category}
          </span>
        </div>
      )}

      {/* Question Card */}
      <Card className="bg-gradient-to-br from-bg-secondary to-bg-primary">
        <div className="text-center py-4">
          <div className="text-2xl font-bold mb-6">{currentQuestion.question}</div>

          {/* Answer - always available to host */}
          {state.showAnswer ? (
            // Final reveal (shown to everyone)
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
              <div className="text-sm text-green-400 mb-1">ANSWER</div>
              <div className="text-xl font-bold text-green-300">{currentQuestion.answer}</div>
            </div>
          ) : state.buzzedTeamId ? (
            // Team buzzed - host MUST see answer to judge
            <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
              <div className="text-sm text-yellow-400 mb-1">ANSWER (for judging)</div>
              <div className="text-xl font-bold text-yellow-300">{currentQuestion.answer}</div>
            </div>
          ) : answerHidden ? (
            // Hidden - host can reveal
            <button
              onClick={() => setAnswerHidden(false)}
              className="bg-bg-secondary hover:bg-bg-card px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              Click to reveal answer
            </button>
          ) : (
            // Host chose to reveal early
            <div className="bg-bg-secondary rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">ANSWER (host only)</div>
              <div className="text-xl font-bold text-gray-200">{currentQuestion.answer}</div>
              <button
                onClick={() => setAnswerHidden(true)}
                className="text-xs text-gray-500 hover:text-gray-400 mt-2"
              >
                Hide again
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Buzz-in Status */}
      <Card>
        <CardHeader>
          {isStealMode ? 'Steal Opportunity!' : 'Buzz-In Status'}
        </CardHeader>

        {/* Not started yet */}
        {!state.questionActive && !state.showAnswer && (
          <div className="text-center py-6">
            <Button onClick={handleStartQuestion} disabled={saving} size="lg">
              Start Question
            </Button>
            <p className="text-gray-500 text-sm mt-2">
              Players will be able to buzz in when you start
            </p>
          </div>
        )}

        {/* Waiting for buzz */}
        {state.questionActive && !state.buzzedTeamId && (
          <div className="text-center py-6">
            <div className="text-4xl mb-4 animate-pulse">
              {isStealMode ? '🔔' : '⏳'}
            </div>
            <div className="text-xl font-bold mb-2">
              {isStealMode ? 'Waiting for steal...' : 'Waiting for buzz...'}
            </div>
            {isStealMode && (
              <div className="text-gray-400 text-sm mb-4">
                {remainingTeams.map(t => t.name).join(', ')} can still buzz
              </div>
            )}
            <Button variant="secondary" onClick={handleSkip} disabled={saving}>
              Skip (No one got it)
            </Button>
          </div>
        )}

        {/* Team buzzed - waiting for host judgment */}
        {state.buzzedTeamId && buzzedTeam && (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🔔</div>
            <div className="text-2xl font-bold text-primary mb-2">
              {buzzedTeam.name} BUZZED!
            </div>
            {state.buzzedPlayerName && (
              <div className="text-gray-400 mb-4">
                {state.buzzedPlayerName} buzzed in
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleMarkResult(true)}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 px-8"
              >
                ✓ Correct
              </Button>
              <Button
                size="lg"
                variant="danger"
                onClick={() => handleMarkResult(false)}
                disabled={saving}
                className="px-8"
              >
                ✗ Wrong
              </Button>
            </div>
          </div>
        )}

        {/* Question complete - show answer revealed */}
        {state.showAnswer && !state.questionActive && (
          <div className="text-center py-4">
            <div className="text-green-400 mb-2">Question Complete</div>
          </div>
        )}
      </Card>

      {/* Team Scores for this round */}
      <Card>
        <CardHeader>Round Progress</CardHeader>
        <div className="space-y-2">
          {teams.map(team => {
            const hasFailed = failedTeamIds.includes(team.id);
            const gotThisQuestion = state.teamAnswers[team.id]?.[state.currentQuestionIndex];

            return (
              <div
                key={team.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  gotThisQuestion
                    ? 'bg-green-900/30 border border-green-500'
                    : hasFailed
                    ? 'bg-red-900/20 border border-red-500/50'
                    : 'bg-bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{team.name}</span>
                  {hasFailed && !state.showAnswer && (
                    <span className="text-red-400 text-xs">(wrong)</span>
                  )}
                </div>
                <span className="text-primary font-bold">
                  +{getRoundScore(team.id)} pts
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        {state.showAnswer && !isLastQuestion && (
          <Button className="flex-1" onClick={handleNextQuestion} disabled={saving}>
            Next Question
          </Button>
        )}
        {state.showAnswer && isLastQuestion && (
          <Button className="flex-1" onClick={handleEndTrivia} disabled={saving}>
            End Trivia
          </Button>
        )}
        {state.currentQuestionIndex > 0 && !isLastQuestion && (
          <Button variant="secondary" onClick={handleEndTrivia} disabled={saving}>
            End Early
          </Button>
        )}
      </div>
    </div>
  );
}
