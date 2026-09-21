import { Phase } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { resolveGameStartCountdownSeconds } from "../../../utils/resolveGameStartCountdownSeconds";

const COUNTDOWN_POLL_MS = 100;

type UseGameStartHandoffProps = {
  phase: Phase | null;
  gameStartCountdownEndsAt: number | null;
  onStartGame?: () => void;
};

// The tablet holds the count-in's clock, because the server keeps no timers of
// its own: nothing in this room moves without a host tap, and the handoff at
// zero is the second half of the one the host already made. `onStartGame` is
// the SAME event both times — the server arms the count-in on the first and
// starts the night on the second — so a second tablet firing its own handoff,
// or a host that refreshed mid-count-in and re-armed this effect, costs
// nothing: whichever arrives second finds the room past INTRO and is dropped.
export const useGameStartHandoff = ({
  phase,
  gameStartCountdownEndsAt,
  onStartGame
}: UseGameStartHandoffProps): number | null => {
  const [nowTimestampMs, setNowTimestampMs] = useState(() => Date.now());
  const isCountingIn = phase === Phase.INTRO && gameStartCountdownEndsAt !== null;

  useEffect(() => {
    if (!isCountingIn) {
      return;
    }

    setNowTimestampMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowTimestampMs(Date.now());
    }, COUNTDOWN_POLL_MS);

    return (): void => {
      window.clearInterval(intervalId);
    };
  }, [isCountingIn, gameStartCountdownEndsAt]);

  useEffect(() => {
    if (!isCountingIn || gameStartCountdownEndsAt === null || onStartGame === undefined) {
      return;
    }

    const timeoutId = window.setTimeout(
      onStartGame,
      Math.max(0, gameStartCountdownEndsAt - Date.now())
    );

    return (): void => {
      window.clearTimeout(timeoutId);
    };
  }, [isCountingIn, gameStartCountdownEndsAt, onStartGame]);

  if (!isCountingIn) {
    return null;
  }

  return resolveGameStartCountdownSeconds(gameStartCountdownEndsAt, nowTimestampMs);
};
