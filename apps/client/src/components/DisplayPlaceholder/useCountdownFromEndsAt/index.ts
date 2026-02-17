import { useEffect, useState } from "react";

const ONE_SECOND_IN_MILLISECONDS = 1000;
const LOW_TIME_THRESHOLD_IN_MILLISECONDS = 10_000;
const UPDATE_INTERVAL_IN_MILLISECONDS = 250;
const defaultNowProvider = (): number => Date.now();

export const getRemainingMillisecondsFromEndsAt = (
  endsAt: number,
  now: number
): number => {
  return Math.max(0, endsAt - now);
};

export const formatCountdownFromMilliseconds = (remainingMilliseconds: number): string => {
  const totalSeconds = Math.ceil(remainingMilliseconds / ONE_SECOND_IN_MILLISECONDS);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const isLowTimeRemaining = (remainingMilliseconds: number): boolean => {
  return (
    remainingMilliseconds > 0 &&
    remainingMilliseconds < LOW_TIME_THRESHOLD_IN_MILLISECONDS
  );
};

export const useCountdownFromEndsAt = (
  endsAt: number | null,
  nowProvider: () => number = defaultNowProvider
): {
  formattedValue: string;
  isLowTime: boolean;
} | null => {
  const [currentNow, setCurrentNow] = useState<number>(nowProvider);

  useEffect(() => {
    if (endsAt === null) {
      return;
    }

    setCurrentNow(nowProvider());

    const intervalHandle = setInterval(() => {
      setCurrentNow(nowProvider());
    }, UPDATE_INTERVAL_IN_MILLISECONDS);

    return () => {
      clearInterval(intervalHandle);
    };
  }, [endsAt, nowProvider]);

  if (endsAt === null) {
    return null;
  }

  const remainingMilliseconds = getRemainingMillisecondsFromEndsAt(endsAt, currentNow);

  return {
    formattedValue: formatCountdownFromMilliseconds(remainingMilliseconds),
    isLowTime: isLowTimeRemaining(remainingMilliseconds)
  };
};
