import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { RoomCode } from '../components/common/RoomCode';
import { api } from '../lib/api';

interface PreviewData {
  room: {
    code: string;
    name: string | null;
    phase: string;
    eventDate: string | null;
    totalRounds: number;
  };
  teams: Array<{
    id: string;
    name: string | null;
    logoUrl: string | null;
    maxSize: number;
    members: Array<{
      name: string;
      claimed: boolean;
      photoUrl: string | null;
    }>;
  }>;
  sauceLineup: Array<{
    round: number;
    name: string | null;
    scoville: number | null;
  }>;
  stats: {
    totalGuests: number;
    claimedSpots: number;
    openSpots: number;
  };
}

export function Preview() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      loadPreview();
    }
  }, [code]);

  const loadPreview = async () => {
    try {
      const data = await api.getPreview(code!);
      setPreview(data);
    } catch (err) {
      setError('Room not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-500 mb-4">{error || 'Room not found'}</div>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const eventDate = preview.room.eventDate ? new Date(preview.room.eventDate) : null;
  const isUpcoming = eventDate && eventDate > new Date();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold neon-glow mb-4">
            {preview.room.name || 'WING NIGHT'}
          </h1>
          {eventDate && (
            <div className="text-xl text-gray-400">
              {eventDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
          {isUpcoming && (
            <div className="mt-4">
              <CountdownTimer targetDate={eventDate!} />
            </div>
          )}
        </div>

        {/* Join section */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <RoomCode code={preview.room.code} showQR size="lg" />
            <Button size="lg" onClick={() => navigate(`/play/${preview.room.code}`)}>
              Join Game
            </Button>
          </div>
        </Card>

        {/* Teams */}
        {preview.teams.length > 0 && (
          <Card className="mb-8">
            <CardHeader>Teams</CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {preview.teams.map(team => (
                <div key={team.id} className="bg-bg-secondary rounded-lg p-4">
                  {team.logoUrl ? (
                    <img
                      src={`http://localhost:3000${team.logoUrl}`}
                      alt={team.name || 'Team'}
                      className="w-16 h-16 mx-auto rounded-lg object-cover mb-3"
                    />
                  ) : (
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gray-700 flex items-center justify-center text-2xl mb-3">
                      🔥
                    </div>
                  )}
                  <div className="text-center font-bold">{team.name || 'Team'}</div>
                  <div className="text-sm text-gray-400 text-center">
                    {team.members.length}/{team.maxSize} players
                  </div>
                  {team.members.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {team.members.map((member, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-0.5 rounded-full ${member.claimed ? 'bg-green-900/30 text-green-400' : 'bg-gray-700 text-gray-400'}`}
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Hot Sauce Lineup */}
        <Card>
          <CardHeader>Hot Sauce Lineup</CardHeader>
          <div className="space-y-2">
            {preview.sauceLineup.map((sauce, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 bg-bg-secondary rounded-lg"
              >
                <span className="font-bold text-primary w-8">#{sauce.round}</span>
                <span className="flex-1">{sauce.name || 'TBD'}</span>
                {sauce.scoville && (
                  <span className="text-sm text-gray-500">
                    {sauce.scoville.toLocaleString()} SHU
                  </span>
                )}
                <HeatIndicator level={sauce.round} total={preview.room.totalRounds} />
              </div>
            ))}
          </div>
        </Card>

        {/* Stats */}
        <div className="mt-8 text-center text-gray-400">
          <p>{preview.stats.totalGuests} expected guests</p>
          <p>{preview.stats.claimedSpots} confirmed</p>
        </div>
      </div>
    </div>
  );
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return null;

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex justify-center gap-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="text-3xl font-mono font-bold text-primary">{value}</div>
          <div className="text-xs text-gray-500 uppercase">{unit}</div>
        </div>
      ))}
    </div>
  );
}

function HeatIndicator({ level, total }: { level: number; total: number }) {
  const percentage = (level / total) * 100;
  const flames = Math.ceil((level / total) * 5);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < flames ? 'text-orange-500' : 'text-gray-600'}
        >
          🔥
        </span>
      ))}
    </div>
  );
}
