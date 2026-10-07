export const beatCalloutCopy = {
  mountedLine: "Mounted!",
  stuckLine: "Stuck!",
  share: (share: number): string => `${Math.round(share * 100)}% of the way`,
  points: (points: number): string => `+${points}`,
  handoffLead: "Hand it to",
  handoffName: (name: string | null): string => name ?? "the next hen"
} as const;
