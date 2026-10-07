import { CONTESTANT_CONTROLLERS, type ContestantController } from "@wingnight/shared";

export const beatCalloutCopy = {
  // A phones turn hands nothing: the next player's phone has just come alive.
  handoffLead: (handset: ContestantController): string =>
    handset === CONTESTANT_CONTROLLERS.PHONE ? "Your phone is live," : "Hand it to",
  handoffName: (nextName: string | null): string => nextName ?? "the next player",
  bayLine: "Into the bay!",
  bellLine: "Time!",
  clearedLastLead: "Last block",
  clearedLastLine: "Street clear!"
} as const;
