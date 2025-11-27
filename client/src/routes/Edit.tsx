import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { RoomCode } from '../components/common/RoomCode';
import { api } from '../lib/api';
import type { Room, Round } from '../types';

export function Edit() {
  const { editCode } = useParams<{ editCode: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [totalRounds, setTotalRounds] = useState(8);

  useEffect(() => {
    loadRoom();
  }, [editCode]);

  const loadRoom = async () => {
    if (!editCode) return;
    try {
      const data = await api.getRoomByEditCode(editCode);
      setRoom(data);
      setName(data.name || '');
      setEventDate(data.eventDate ? data.eventDate.split('T')[0] : '');
      setTotalRounds(data.totalRounds);
    } catch (err) {
      setError('Room not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!room) return;
    setSaving(true);
    try {
      await api.updateRoom(room.code, {
        name: name || null,
        eventDate: eventDate || null,
        totalRounds,
      });
      await loadRoom();
    } catch (err) {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenRoom = async () => {
    if (!room) return;
    try {
      await api.openRoom(room.code);
      navigate(`/host/${room.code}`);
    } catch (err) {
      setError('Failed to open room');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-500 mb-4">{error || 'Room not found'}</div>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Game Setup</h1>
            <RoomCode code={room.code} size="sm" />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate(`/preview/${room.code}`)}>
              Preview
            </Button>
            <Button onClick={handleOpenRoom}>
              Open Room
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>Event Details</CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Event Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Brad's Birthday Wing Night"
                  className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Event Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>Game Settings</CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Number of Rounds</label>
                <select
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(parseInt(e.target.value))}
                  className="w-full bg-bg-secondary border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <option key={n} value={n}>{n} rounds</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>Hot Sauce Lineup</CardHeader>
            <div className="space-y-2">
              {room.rounds.slice(0, totalRounds).map((round, i) => (
                <div
                  key={round.id}
                  className="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg"
                >
                  <span className="font-bold text-primary w-8">#{i + 1}</span>
                  <span className="flex-1">{round.sauceName || 'TBD'}</span>
                  {round.sauceScovilles && (
                    <span className="text-sm text-gray-500">
                      {round.sauceScovilles.toLocaleString()} SHU
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleSave} loading={saving}>
              Save Draft
            </Button>
            <Button onClick={handleOpenRoom}>
              Open Room & Start Hosting
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
