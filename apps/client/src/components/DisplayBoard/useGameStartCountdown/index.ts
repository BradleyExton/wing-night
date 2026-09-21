import { useEffect, useState } from "react";

import { resolveGameStartCountdownSeconds } from "../../../utils/resolveGameStartCountdownSeconds";

const COUNTDOWN_POLL_MS = 100;

type UseGameStartCountdownProps = {
  gameStartCountdownEndsAt: number | null;
};

// The TV's reading of the server's count-in. Polled rather than chained: the
// digit is a reading of a fixed instant, so a contended frame delays a tick
// without ever losing one.
export const useGameStartCountdown = ({
  gameStartCountdownEndsAt
}: UseGameStartCountdownProps): number | null => {
  const [nowTimestampMs, setNowTimestampMs] = useState(() => Date.now());

  useEffect(() => {
    if (gameStartCountdownEndsAt === null) {
      return;
    }

    setNowTimestampMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowTimestampMs(Date.now());
    }, COUNTDOWN_POLL_MS);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [gameStartCountdownEndsAt]);

  return resolveGameStartCountdownSeconds(gameStartCountdownEndsAt, nowTimestampMs);
};
