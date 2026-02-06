import { Link } from 'react-router-dom';
import { getAvailableGames } from '../../games';

export function GameTester() {
  const games = getAvailableGames();

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎮</span>
            <h1 className="text-3xl font-bold">Mini-Game Tester</h1>
          </div>
          <p className="text-gray-400">
            Test mini-games in isolation without the full game flow.
            Select a game below to start testing.
          </p>
        </div>

        {/* Game List */}
        <div className="space-y-4">
          {games.map(game => (
            <Link
              key={game.id}
              to={`/test/games/${game.id}`}
              className="block bg-bg-card border border-gray-700 rounded-xl p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">{game.icon}</span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">{game.name}</h2>
                  <p className="text-gray-400">{game.description}</p>
                </div>
                <div className="text-primary font-semibold">
                  Test →
                </div>
              </div>
            </Link>
          ))}

          {games.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No games registered yet. Add games to the registry in
              <code className="mx-1 bg-bg-secondary px-2 py-1 rounded">src/games/index.ts</code>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-bg-secondary rounded-lg text-sm text-gray-400">
          <strong className="text-gray-300">Dev Note:</strong> This page is only available in development mode.
          New games added to the registry will automatically appear here.
        </div>

        {/* Back link */}
        <div className="mt-6">
          <Link to="/" className="text-gray-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
