import { TriviaGameState } from './types';

interface Team {
  id: string;
  name: string | null;
  score: number;
}

interface TriviaDisplayProps {
  gameState: TriviaGameState | null;
  teams: Team[];
}

export function TriviaDisplay({ gameState, teams }: TriviaDisplayProps) {
  if (!gameState || !gameState.questions.length) {
    return (
      <div className="text-center">
        <div className="text-4xl font-bold mb-8 animate-pulse">TRIVIA</div>
        <div className="text-2xl text-gray-400">Loading questions...</div>
      </div>
    );
  }

  const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  // Calculate this round's scores
  const getRoundScore = (teamId: string): number => {
    const answers = gameState.teamAnswers[teamId] || [];
    return answers.filter(Boolean).length * (currentQuestion.points || 100);
  };

  return (
    <div className="text-center w-full max-w-5xl mx-auto">
      {/* Progress indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {gameState.questions.map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < gameState.currentQuestionIndex
                ? 'bg-green-500'
                : i === gameState.currentQuestionIndex
                ? 'bg-primary scale-125'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>

      {/* Category badge */}
      {currentQuestion.category && (
        <div className="mb-4">
          <span className="bg-primary/30 text-primary px-6 py-2 rounded-full text-xl font-semibold">
            {currentQuestion.category}
          </span>
        </div>
      )}

      {/* Question */}
      <div className="bg-bg-card rounded-2xl p-12 mb-8 shadow-2xl border border-gray-700">
        <div className="text-5xl font-bold leading-tight">
          {currentQuestion.question}
        </div>

        {/* Answer reveal */}
        {gameState.showAnswer && (
          <div className="mt-8 pt-8 border-t border-gray-600">
            <div className="text-xl text-green-400 mb-2">ANSWER</div>
            <div className="text-4xl font-bold text-green-300">
              {currentQuestion.answer}
            </div>
          </div>
        )}
      </div>

      {/* Team scores for this round */}
      <div className="grid grid-cols-3 gap-4">
        {sortedTeams.map((team, i) => {
          const roundScore = getRoundScore(team.id);
          const currentAnswer = gameState.teamAnswers[team.id]?.[gameState.currentQuestionIndex];
          const hasAnswered = currentAnswer !== undefined;

          return (
            <div
              key={team.id}
              className={`p-4 rounded-xl transition-all ${
                hasAnswered
                  ? currentAnswer
                    ? 'bg-green-900/40 border-2 border-green-500 scale-105'
                    : 'bg-red-900/40 border-2 border-red-500'
                  : i === 0
                  ? 'bg-primary/20 border border-primary'
                  : 'bg-bg-card border border-gray-700'
              }`}
            >
              <div className="text-2xl font-bold truncate">{team.name}</div>
              <div className="text-4xl font-bold text-primary">{team.score}</div>
              {roundScore > 0 && (
                <div className="text-green-400 text-lg">+{roundScore} this round</div>
              )}
              {hasAnswered && (
                <div className={`text-lg mt-1 ${currentAnswer ? 'text-green-400' : 'text-red-400'}`}>
                  {currentAnswer ? '✓ Correct!' : '✗ Wrong'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Question number */}
      <div className="mt-8 text-2xl text-gray-400">
        Question {gameState.currentQuestionIndex + 1} of {gameState.questions.length}
      </div>
    </div>
  );
}
