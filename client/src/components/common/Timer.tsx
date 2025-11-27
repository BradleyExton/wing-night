import React from 'react';
import { useTimer } from '../../hooks/useTimer';
import { TimerState } from '../../types';

interface TimerProps {
  timerState: TimerState | null;
  serverTime?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export function Timer({ timerState, serverTime, size = 'lg', showLabel = false }: TimerProps) {
  const { remaining, status, formatted } = useTimer(timerState, serverTime);

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl',
  };

  const getStatusClasses = () => {
    if (status === 'paused') return 'text-gray-400';
    if (status === 'expired') return 'text-red-500 animate-pulse';
    if (remaining <= 5) return 'text-red-500 animate-pulse-critical';
    if (remaining <= 10) return 'text-yellow-400 animate-pulse-warning';
    return 'text-white';
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      {showLabel && status === 'paused' && (
        <span className="text-gray-400 text-sm uppercase tracking-wider mb-1">Paused</span>
      )}
      <div className={`font-mono font-bold ${sizeClasses[size]} ${getStatusClasses()}`}>
        {status === 'expired' ? "TIME'S UP!" : formatted}
      </div>
      {status === 'paused' && (
        <span className="text-2xl mt-2">⏸️</span>
      )}
    </div>
  );
}
