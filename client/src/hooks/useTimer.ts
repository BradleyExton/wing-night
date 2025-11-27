import { useState, useEffect, useCallback } from 'react';
import type { TimerState } from '../types';

interface UseTimerResult {
  remaining: number;
  status: 'idle' | 'running' | 'paused' | 'expired';
  formatted: string;
}

export function useTimer(timerState: TimerState | null, serverTime?: number): UseTimerResult {
  const [remaining, setRemaining] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'expired'>('idle');

  useEffect(() => {
    if (!timerState || !timerState.isRunning) {
      setStatus('idle');
      setRemaining(0);
      return;
    }

    if (timerState.isPaused) {
      setStatus('paused');
      setRemaining(timerState.remainingWhenPaused || 0);
      return;
    }

    // Calculate initial remaining time
    const now = serverTime || Date.now();
    const startedAt = new Date(timerState.startedAt!).getTime();
    const elapsed = (now - startedAt) / 1000;
    const initial = Math.max(0, timerState.duration - elapsed);

    setRemaining(Math.floor(initial));
    setStatus(initial > 0 ? 'running' : 'expired');

    if (initial <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setStatus('expired');
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState, serverTime]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    remaining,
    status,
    formatted: formatTime(remaining),
  };
}
