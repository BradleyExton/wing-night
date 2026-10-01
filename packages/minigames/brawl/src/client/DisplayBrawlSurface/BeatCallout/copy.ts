export const beatCalloutCopy = {
  handoffLead: "Hand it to",
  handoffName: (nextName: string | null): string => nextName ?? "the next player",
  bayLine: "Into the bay!",
  bellLine: "Time!",
  clearedLastLead: "Last block",
  clearedLastLine: "Street clear!"
} as const;
