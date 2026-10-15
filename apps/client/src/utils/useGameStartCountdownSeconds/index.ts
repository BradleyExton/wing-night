import { useEffect, useState } from "react";

import { resolveGameStartCountdownSeconds } from "../resolveGameStartCountdownSeconds";

const COUNTDOWN_POLL_MS = 100;

type CountdownReading = {
  endsAt: number | null;
  nowTimestampMs: number;
};

// A polled reading belongs to the count-in it was taken for. The render that
// first sees a new `endsAt` runs before the effect that polls it, so the only
// reading in hand is one from before the host tapped — mount time, or a
// previous count-in — and reading the digit off it paints 3 plus however long
// the screen sat idle. That frame reads the live clock instead.
export const resolveCountdownReadingNow = (
  reading: CountdownReading,
  gameStartCountdownEndsAt: number | null,
  liveNowTimestampMs: number
): number => {
  return reading.endsAt === gameStartCountdownEndsAt
    ? reading.nowTimestampMs
    : liveNowTimestampMs;
};

// Both surfaces' reading of the server's count-in. Polled rather than chained:
// the digit is a reading of a fixed instant, so a contended frame delays a tick
// without ever losing one.
export const useGameStartCountdownSeconds = (
  gameStartCountdownEndsAt: number | null
): number | null => {
  const [reading, setReading] = useState<CountdownReading>(() => ({
    endsAt: gameStartCountdownEndsAt,
    nowTimestampMs: Date.now()
  }));

  useEffect(() => {
    if (gameStartCountdownEndsAt === null) {
      return;
    }

    const readClock = (): void => {
      setReading({ endsAt: gameStartCountdownEndsAt, nowTimestampMs: Date.now() });
    };

    readClock();
    const intervalId = window.setInterval(readClock, COUNTDOWN_POLL_MS);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [gameStartCountdownEndsAt]);

  return resolveGameStartCountdownSeconds(
    gameStartCountdownEndsAt,
    resolveCountdownReadingNow(reading, gameStartCountdownEndsAt, Date.now())
  );
};
