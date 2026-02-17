import type { Phase } from "@wingnight/shared";

type LogContext = Record<string, unknown>;

const hasContext = (context: LogContext | undefined): context is LogContext => {
  return context !== undefined;
};

export const logInfo = (message: string, context?: LogContext): void => {
  if (!hasContext(context)) {
    console.warn(message);
    return;
  }

  console.warn(message, context);
};

export const logError = (message: string, error?: unknown): void => {
  if (error === undefined) {
    console.error(message);
    return;
  }

  console.error(message, error);
};

export const logPhaseTransition = (
  previousPhase: Phase,
  nextPhase: Phase,
  currentRound: number
): void => {
  logInfo("server:phaseTransition", {
    previousPhase,
    nextPhase,
    currentRound
  });
};

export const logScoreMutation = (
  teamId: string,
  currentRound: number,
  wingPoints: number,
  minigamePoints: number,
  totalScore: number
): void => {
  logInfo("server:scoreMutation", {
    teamId,
    currentRound,
    wingPoints,
    minigamePoints,
    roundPoints: wingPoints + minigamePoints,
    totalScore
  });
};
