import type { Phase } from "@wingnight/shared";

export const formatPhaseLabel = (phase: Phase): string => {
  return phase
    .toLowerCase()
    .split("_")
    .map((segment) => `${segment[0]?.toUpperCase() ?? ""}${segment.slice(1)}`)
    .join(" ");
};

export const formatClockSeconds = (remainingSeconds: number): string => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};
