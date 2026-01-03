import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { api } from '../lib/api';

interface RoomSummary {
  id: string;
  code: string;
  editCode: string;
  name: string | null;
  eventDate: string | null;
  phase: string;
  createdAt: string;
  _count: {
    players: number;
  };
  teams: Array<{
    id: string;
    name: string | null;
    score: number;
    logoUrl: string | null;
    _count: { players: number };
  }>;
}

interface RoomsResponse {
  rooms: RoomSummary[];
  categorized: {
    active: RoomSummary[];
    upcoming: RoomSummary[];
    draft: RoomSummary[];
    completed: RoomSummary[];
  };
  total: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [rooms, setRooms] = useState<RoomsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadRooms();
    }
  }, [isLoaded, user]);

  const loadRooms = async () => {
    try {
      const data = await api.getUserRooms();
      setRooms(data);
    } catch (err) {
      setError('Failed to load your games');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    setCreating(true);
    setError(null);
    try {
      const result = await api.createRoom();
      navigate(`/edit/${result.room.editCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setCreating(false);
    }
  };

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      LOBBY: 'Lobby',
      TEAM_SETUP: 'Team Setup',
      GAME_INTRO: 'Starting',
      ROUND_INTRO: 'Round Intro',
      EATING_PHASE: 'Eating',
      GAME_PHASE: 'Playing',
      ROUND_RESULTS: 'Results',
      GAME_END: 'Completed',
    };
    return labels[phase] || phase;
  };

  const getPhaseColor = (phase: string) => {
    if (phase === 'DRAFT') return 'text-gray-400';
    if (phase === 'GAME_END') return 'text-green-400';
    return 'text-primary';
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.firstName || 'Host'}!</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleCreateRoom} loading={creating}>
              + New Game
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Active Games */}
        {rooms?.categorized.active && rooms.categorized.active.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active Games
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.categorized.active.map(room => (
                <GameCard
                  key={room.id}
                  room={room}
                  getPhaseLabel={getPhaseLabel}
                  getPhaseColor={getPhaseColor}
                  onHost={() => navigate(`/host/${room.code}`)}
                  onEdit={() => navigate(`/edit/${room.editCode}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Draft & Upcoming Games */}
        {rooms && (rooms.categorized.draft.length > 0 || rooms.categorized.upcoming.length > 0) && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Games</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...rooms.categorized.upcoming, ...rooms.categorized.draft].map(room => (
                <GameCard
                  key={room.id}
                  room={room}
                  getPhaseLabel={getPhaseLabel}
                  getPhaseColor={getPhaseColor}
                  onHost={() => navigate(`/host/${room.code}`)}
                  onEdit={() => navigate(`/edit/${room.editCode}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Games */}
        {rooms?.categorized.completed && rooms.categorized.completed.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Past Games</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.categorized.completed.map(room => (
                <GameCard
                  key={room.id}
                  room={room}
                  getPhaseLabel={getPhaseLabel}
                  getPhaseColor={getPhaseColor}
                  onHost={() => navigate(`/host/${room.code}`)}
                  onEdit={() => navigate(`/edit/${room.editCode}`)}
                  completed
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {rooms?.total === 0 && (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🍗</div>
            <h3 className="text-xl font-semibold mb-2">No games yet</h3>
            <p className="text-gray-400 mb-6">Create your first Wing Night game!</p>
            <Button onClick={handleCreateRoom} loading={creating}>
              Create Game
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function GameCard({
  room,
  getPhaseLabel,
  getPhaseColor,
  onHost,
  onEdit,
  completed = false,
}: {
  room: RoomSummary;
  getPhaseLabel: (phase: string) => string;
  getPhaseColor: (phase: string) => string;
  onHost: () => void;
  onEdit: () => void;
  completed?: boolean;
}) {
  const eventDate = room.eventDate ? new Date(room.eventDate) : null;
  const winner = completed && room.teams.length > 0
    ? [...room.teams].sort((a, b) => b.score - a.score)[0]
    : null;

  return (
    <Card className="hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{room.name || 'Wing Night'}</h3>
          {eventDate && (
            <p className="text-sm text-gray-400">
              {eventDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        <span className={`text-sm font-medium ${getPhaseColor(room.phase)}`}>
          {getPhaseLabel(room.phase)}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
        <span>{room._count.players} players</span>
        <span>{room.teams.length} teams</span>
        <span className="font-mono">{room.code}</span>
      </div>

      {winner && (
        <div className="bg-bg-secondary rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-500 mb-1">Winner</div>
          <div className="font-semibold">{winner.name}</div>
          <div className="text-primary">{winner.score} pts</div>
        </div>
      )}

      <div className="flex gap-2">
        {room.phase === 'DRAFT' ? (
          <Button size="sm" className="flex-1" onClick={onEdit}>
            Edit
          </Button>
        ) : (
          <Button size="sm" className="flex-1" onClick={onHost}>
            {completed ? 'View' : 'Host'}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Settings
        </Button>
      </div>
    </Card>
  );
}
