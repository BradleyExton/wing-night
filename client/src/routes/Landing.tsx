import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { api } from '../lib/api';

export function Landing() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const result = await api.createRoom();
      navigate(`/edit/${result.room.editCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/play/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold neon-glow mb-4">
          WING NIGHT
        </h1>
        <p className="text-xl text-gray-400">
          Hot Ones inspired party game
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <Button
          variant="primary"
          size="lg"
          className="w-full text-xl py-4"
          onClick={handleCreate}
          loading={creating}
        >
          Host a Game
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-primary text-gray-500">or join a game</span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="flex-1 bg-bg-card border border-gray-700 rounded-lg px-4 py-3 text-lg font-mono tracking-widest text-center uppercase focus:outline-none focus:border-primary"
            maxLength={4}
          />
          <Button type="submit" variant="secondary" size="lg" disabled={!joinCode.trim()}>
            Join
          </Button>
        </form>

        {error && (
          <p className="text-red-500 text-center">{error}</p>
        )}
      </div>

      <div className="mt-16 text-center text-gray-500 text-sm">
        <p>Eat wings. Play games. Crown a champion.</p>
      </div>
    </div>
  );
}
