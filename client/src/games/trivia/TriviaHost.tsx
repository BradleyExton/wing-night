import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Card, CardHeader } from '../../components/common/Card';
import { TriviaGameState, TriviaQuestion, createInitialTriviaState } from './types';
import { getRandomQuestions } from './questions';

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
}

export function TriviaHost({
  roomCode,
  teams,
  gameState,
  onUpdateGameState,
  onAdjustScore,
  onEndGame,
}: TriviaHostProps) {
  const [state, setState] = useState<TriviaGameState | null>(gameState);
  const [revealedTeams, setRevealedTeams] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

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
      setState(initialState);
      onUpdateGameState(initialState);
    }
  }, []);

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
  const allTeamsAnswered = teams.every(t => revealedTeams.has(t.id));

  const handleMarkAnswer = async (teamId: string, correct: boolean) => {
    if (saving) return;
    setSaving(true);

    try {
      // Award points if correct
      if (correct) {
        await onAdjustScore(teamId, currentQuestion.points || 100);
      }

      // Track the answer
      const newState = { ...state };
      if (!newState.teamAnswers[teamId]) {
        newState.teamAnswers[teamId] = [];
      }
      newState.teamAnswers[teamId][state.currentQuestionIndex] = correct;

      // Mark this team as answered
      setRevealedTeams(prev => new Set([...prev, teamId]));

      setState(newState);
      await onUpdateGameState(newState);
    } finally {
      setSaving(false);
    }
  };

  const handleNextQuestion = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const newState = {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        showAnswer: false,
      };
      setState(newState);
      setRevealedTeams(new Set());
      await onUpdateGameState(newState);
    } finally {
      setSaving(false);
    }
  };

  const handleShowAnswer = async () => {
    const newState = { ...state, showAnswer: true };
    setState(newState);
    await onUpdateGameState(newState);
  };

  const handleEndTrivia = async () => {
    const newState = { ...state, gameEnded: true };
    setState(newState);
    await onUpdateGameState(newState);
    onEndGame();
  };

  // Calculate current round scores
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

          {/* Answer (hidden until revealed) */}
          {state.showAnswer ? (
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
              <div className="text-sm text-green-400 mb-1">ANSWER</div>
              <div className="text-xl font-bold text-green-300">{currentQuestion.answer}</div>
            </div>
          ) : (
            <Button onClick={handleShowAnswer} variant="secondary">
              Reveal Answer
            </Button>
          )}
        </div>
      </Card>

      {/* Team Scoring */}
      <Card>
        <CardHeader>Mark Team Answers</CardHeader>
        <div className="space-y-3">
          {teams.map(team => {
            const hasAnswered = revealedTeams.has(team.id);
            const wasCorrect = state.teamAnswers[team.id]?.[state.currentQuestionIndex];

            return (
              <div
                key={team.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  hasAnswered
                    ? wasCorrect
                      ? 'bg-green-900/30 border border-green-500'
                      : 'bg-red-900/30 border border-red-500'
                    : 'bg-bg-secondary'
                }`}
              >
                <div>
                  <span className="font-medium">{team.name}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    +{getRoundScore(team.id)} this round
                  </span>
                </div>

                {hasAnswered ? (
                  <span className={wasCorrect ? 'text-green-400' : 'text-red-400'}>
                    {wasCorrect ? 'Correct!' : 'Wrong'}
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkAnswer(team.id, true)}
                      disabled={saving || !state.showAnswer}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Correct
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleMarkAnswer(team.id, false)}
                      disabled={saving || !state.showAnswer}
                    >
                      Wrong
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-2">
        {allTeamsAnswered && !isLastQuestion && (
          <Button className="flex-1" onClick={handleNextQuestion} disabled={saving}>
            Next Question
          </Button>
        )}
        {(allTeamsAnswered && isLastQuestion) || state.currentQuestionIndex > 0 ? (
          <Button
            className={allTeamsAnswered && isLastQuestion ? 'flex-1' : ''}
            variant={allTeamsAnswered && isLastQuestion ? 'primary' : 'secondary'}
            onClick={handleEndTrivia}
            disabled={saving}
          >
            End Trivia
          </Button>
        ) : null}
      </div>

      {/* Skip hint */}
      {!allTeamsAnswered && !state.showAnswer && (
        <div className="text-center text-gray-500 text-sm">
          Reveal answer to enable scoring
        </div>
      )}
    </div>
  );
}
