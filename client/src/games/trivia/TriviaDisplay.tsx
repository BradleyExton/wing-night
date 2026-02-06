import { TriviaGameState } from './types';
import type { Team } from '../../types';
import { sortTeamsByScore } from '../../lib/teams';

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
  const sortedTeams = sortTeamsByScore(teams);
  const buzzedTeam = teams.find(t => t.id === gameState.buzzedTeamId);
  const failedTeamIds = gameState.failedTeams || [];
  const isStealMode = failedTeamIds.length > 0 && !gameState.buzzedTeamId && gameState.questionActive;

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

      {/* Buzz-in Status Banner */}
      {!gameState.showAnswer && (
        <div className="mb-8">
          {/* Waiting for host to start */}
          {!gameState.questionActive && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-600">
              <div className="text-2xl text-gray-400">
                Get ready to buzz in...
              </div>
            </div>
          )}

          {/* Waiting for buzz */}
          {gameState.questionActive && !gameState.buzzedTeamId && (
            <div className={`rounded-xl p-6 border-2 ${
              isStealMode
                ? 'bg-yellow-900/30 border-yellow-500'
                : 'bg-primary/20 border-primary animate-pulse'
            }`}>
              <div className="text-4xl mb-2">
                {isStealMode ? '🔔' : '⚡'}
              </div>
              <div className="text-3xl font-bold">
                {isStealMode ? 'STEAL OPPORTUNITY!' : 'BUZZ IN!'}
              </div>
              {isStealMode && (
                <div className="text-xl text-gray-300 mt-2">
                  {teams.filter(t => !failedTeamIds.includes(t.id)).map(t => t.name).join(' or ')} can steal!
                </div>
              )}
            </div>
          )}

          {/* Team buzzed */}
          {gameState.buzzedTeamId && buzzedTeam && (
            <div className="bg-primary/30 rounded-xl p-8 border-2 border-primary">
              <div className="text-5xl mb-4">🔔</div>
              <div className="text-4xl font-bold text-primary">
                {buzzedTeam.name}
              </div>
              <div className="text-2xl text-gray-300 mt-2">
                is answering!
              </div>
              {gameState.buzzedPlayerName && (
                <div className="text-xl text-gray-400 mt-1">
                  ({gameState.buzzedPlayerName} buzzed in)
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Team scores */}
      <div className="grid grid-cols-3 gap-4">
        {sortedTeams.map((team, i) => {
          const roundScore = getRoundScore(team.id);
          const gotThisQuestion = gameState.teamAnswers[team.id]?.[gameState.currentQuestionIndex];
          const hasFailed = failedTeamIds.includes(team.id);
          const isBuzzed = gameState.buzzedTeamId === team.id;

          return (
            <div
              key={team.id}
              className={`p-4 rounded-xl transition-all ${
                isBuzzed
                  ? 'bg-primary/40 border-2 border-primary scale-105 animate-pulse'
                  : gotThisQuestion
                  ? 'bg-green-900/40 border-2 border-green-500 scale-105'
                  : hasFailed && !gameState.showAnswer
                  ? 'bg-red-900/30 border-2 border-red-500/50 opacity-60'
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
              {gotThisQuestion && (
                <div className="text-green-400 text-lg mt-1">
                  ✓ Correct!
                </div>
              )}
              {hasFailed && !gameState.showAnswer && (
                <div className="text-red-400 text-lg mt-1">
                  ✗ Wrong
                </div>
              )}
              {isBuzzed && (
                <div className="text-primary text-lg mt-1 animate-bounce">
                  Answering...
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
