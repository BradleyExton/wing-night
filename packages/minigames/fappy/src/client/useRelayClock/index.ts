import { useEffect, useState } from "react";

type RelayClockInput = {
  startedAtMs: number | null;
  endedAtMs: number | null;
};

// How often the readout ticks. A tenth of a second is smooth enough for a
// clock nobody is racing to the millisecond, and cheap enough for a tablet
// that is also running the game.
const CLOCK_INTERVAL_MS = 100;

// The relay's running time for a readout: the server's start stamp against
// this device's clock while it runs, and the server's own difference once it
// is over. The score only ever comes from the server's numbers; this is what
// the room watches while it waits for them.
export const useRelayClock = ({ startedAtMs, endedAtMs }: RelayClockInput): number | null => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const isRunning = startedAtMs !== null && endedAtMs === null;

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    setNowMs(Date.now());

    const handle = window.setInterval(() => {
      setNowMs(Date.now());
    }, CLOCK_INTERVAL_MS);

    return (): void => {
      window.clearInterval(handle);
    };
  }, [isRunning]);

  if (startedAtMs === null) {
    return null;
  }

  if (endedAtMs !== null) {
    return Math.max(0, endedAtMs - startedAtMs);
  }

  return Math.max(0, nowMs - startedAtMs);
};

export const formatRelayClock = (elapsedMs: number): string => {
  const totalTenths = Math.floor(elapsedMs / 100);
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
};
