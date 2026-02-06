import { useState } from 'react';
import { TriviaGameState } from './types';
import { api } from '../../lib/api';

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

interface TriviaPlayerProps {
  roomCode: string;
  player: Player;
  teams: Team[];
  gameState: TriviaGameState | null;
  // Optional test mode callback (used instead of API call)
  onBuzz?: (teamId: string, playerId: string, playerName: string) => void;
}

export function TriviaPlayer({
  roomCode,
  player,
  teams,
  gameState,
  onBuzz,
}: TriviaPlayerProps) {
  const [buzzing, setBuzzing] = useState(false);
  const [buzzError, setBuzzError] = useState<string | null>(null);

  const myTeam = teams.find(t => t.id === player.teamId);
  const state = gameState;

  if (!state || !state.gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-xl text-gray-400">Waiting for trivia to start...</div>
      </div>
    );
  }

  if (state.gameEnded) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="text-4xl mb-4">🏆</div>
          <div className="text-xl">Trivia Complete!</div>
        </div>
      </div>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const isBuzzedTeam = state.buzzedTeamId === player.teamId;
  const isBuzzedPlayer = state.buzzedPlayerId === player.id;
  const hasFailed = state.failedTeams?.includes(player.teamId || '') || false;
  const canBuzz = state.questionActive && !state.buzzLocked && !hasFailed && player.teamId;
  const isStealMode = (state.failedTeams?.length || 0) > 0 && !state.buzzedTeamId && state.questionActive;
  const buzzedTeam = teams.find(t => t.id === state.buzzedTeamId);

  const handleBuzz = async () => {
    if (!canBuzz || buzzing || !player.teamId) return;

    setBuzzing(true);
    setBuzzError(null);

    try {
      if (onBuzz) {
        // Test mode - use callback instead of API
        onBuzz(player.teamId, player.id, player.name);
      } else {
        // Real mode - call API
        await api.triviaBuzz(roomCode, player.teamId, player.id, player.name);
      }
    } catch (err) {
      // Someone else may have buzzed first
      setBuzzError(err instanceof Error ? err.message : 'Failed to buzz');
    } finally {
      setBuzzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Progress */}
      <div className="text-center text-gray-400 text-sm">
        Question {state.currentQuestionIndex + 1} of {state.questions.length}
      </div>

      {/* Category */}
      {currentQuestion.category && (
        <div className="text-center">
          <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-sm font-medium">
            {currentQuestion.category}
          </span>
        </div>
      )}

      {/* Question */}
      <div className="bg-bg-card rounded-xl p-6 border border-gray-700">
        <div className="text-xl font-bold text-center">
          {currentQuestion.question}
        </div>
      </div>

      {/* Buzz Button Area */}
      <div className="py-4">
        {/* Waiting for host to start */}
        {!state.questionActive && !state.showAnswer && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg">Waiting for host to start question...</div>
          </div>
        )}

        {/* Can buzz */}
        {canBuzz && (
          <button
            onClick={handleBuzz}
            disabled={buzzing}
            className={`w-full py-12 rounded-2xl text-3xl font-bold transition-all transform active:scale-95 ${
              isStealMode
                ? 'bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500'
                : 'bg-gradient-to-br from-primary to-orange-600 hover:from-primary/90 hover:to-orange-500'
            } text-black shadow-lg`}
          >
            {buzzing ? (
              <span className="animate-pulse">BUZZING...</span>
            ) : isStealMode ? (
              <>STEAL IT!</>
            ) : (
              <>BUZZ IN</>
            )}
          </button>
        )}

        {/* You buzzed - waiting */}
        {isBuzzedTeam && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🔔</div>
            {isBuzzedPlayer ? (
              <>
                <div className="text-2xl font-bold text-primary mb-2">YOU BUZZED!</div>
                <div className="text-gray-400">Waiting for host to judge...</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary mb-2">{state.buzzedPlayerName} BUZZED!</div>
                <div className="text-gray-400">Your teammate is answering...</div>
              </>
            )}
          </div>
        )}

        {/* Another team buzzed */}
        {state.buzzLocked && !isBuzzedTeam && buzzedTeam && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⏳</div>
            <div className="text-xl font-bold mb-2">{buzzedTeam.name} buzzed first!</div>
            <div className="text-gray-400">Waiting to see if they get it...</div>
          </div>
        )}

        {/* Your team failed - can't buzz anymore */}
        {hasFailed && state.questionActive && !state.buzzLocked && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">😔</div>
            <div className="text-xl font-bold text-red-400 mb-2">Wrong Answer</div>
            <div className="text-gray-400">
              {teams.filter(t => !state.failedTeams?.includes(t.id)).length > 0
                ? 'Waiting to see if another team steals...'
                : 'No teams left to answer'}
            </div>
          </div>
        )}

        {/* Answer revealed */}
        {state.showAnswer && (
          <div className="text-center py-8">
            <div className="bg-green-900/30 border border-green-500 rounded-xl p-6">
              <div className="text-sm text-green-400 mb-2">ANSWER</div>
              <div className="text-2xl font-bold text-green-300">{currentQuestion.answer}</div>
            </div>
          </div>
        )}

        {/* Error */}
        {buzzError && (
          <div className="text-center text-red-400 mt-4">
            {buzzError}
          </div>
        )}
      </div>

      {/* Team Score */}
      {myTeam && (
        <div className="bg-bg-card rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{myTeam.name}</span>
            <span className="text-2xl font-bold text-primary">{myTeam.score} pts</span>
          </div>
        </div>
      )}
    </div>
  );
}
