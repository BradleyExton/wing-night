import React from 'react';
import { Team } from '../../types';

interface TeamCardProps {
  team: Team;
  rank?: number;
  showScore?: boolean;
  showPlayers?: boolean;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

const teamColors = [
  'border-l-orange-500',
  'border-l-green-500',
  'border-l-blue-500',
  'border-l-purple-500',
  'border-l-amber-500',
  'border-l-cyan-500',
];

export function TeamCard({
  team,
  rank,
  showScore = false,
  showPlayers = false,
  onClick,
  selected,
  compact = false,
}: TeamCardProps) {
  const colorIndex = parseInt(team.id, 36) % teamColors.length;
  const borderColor = teamColors[colorIndex];

  return (
    <div
      className={`
        bg-bg-card rounded-lg border-l-4 ${borderColor}
        ${compact ? 'p-3' : 'p-4'}
        ${onClick ? 'cursor-pointer hover:bg-bg-card/80 transition-colors' : ''}
        ${selected ? 'ring-2 ring-primary' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {rank !== undefined && (
          <div className="text-2xl font-bold text-gray-500">#{rank}</div>
        )}

        {team.logoUrl ? (
          <img
            src={team.logoUrl.startsWith('/') ? `http://localhost:3000${team.logoUrl}` : team.logoUrl}
            alt={team.name || 'Team logo'}
            className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-lg object-cover`}
          />
        ) : (
          <div
            className={`${compact ? 'w-10 h-10 text-xl' : 'w-14 h-14 text-2xl'} rounded-lg bg-gray-700 flex items-center justify-center`}
          >
            {team.emoji || '🔥'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className={`font-semibold ${compact ? 'text-base' : 'text-lg'} truncate`}>
            {team.name || 'Unnamed Team'}
          </div>
          {showPlayers && team.players && (
            <div className="text-sm text-gray-400">
              {team.players.length} player{team.players.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {showScore && (
          <div className="text-right">
            <div className={`font-bold ${compact ? 'text-xl' : 'text-2xl'} text-primary`}>
              {team.score}
            </div>
            <div className="text-xs text-gray-500 uppercase">points</div>
          </div>
        )}
      </div>

      {showPlayers && !compact && team.players && team.players.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex flex-wrap gap-2">
            {team.players.map(player => (
              <div
                key={player.id}
                className="flex items-center gap-1.5 bg-gray-700/50 rounded-full px-2 py-1"
              >
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl.startsWith('/') ? `http://localhost:3000${player.photoUrl}` : player.photoUrl}
                    alt={player.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                    {player.name[0]}
                  </div>
                )}
                <span className="text-sm">{player.name}</span>
                {player.isConnected && (
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
