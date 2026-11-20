export const readyBeatCopy = {
  lead: (out: number, roster: number): string => (out === 0 ? "Step out on your phone" : `${out} of ${roster} on the street`),
  hint: (out: number, roster: number, isFirstBlock: boolean): string => {
    if (out === 0) {
      return "Tap STEP OUT and your hen walks on";
    }

    if (!isFirstBlock) {
      return "First thumb starts it";
    }

    return out >= roster ? "Everybody's out — over to the host" : "No phone? You sit this one out. Host starts the fight.";
  },
  tabletLead: "On the tablet",
  tabletLine: (playerName: string | null): string => (playerName === null ? "One hen, one block" : `${playerName}'s block`)
} as const;
