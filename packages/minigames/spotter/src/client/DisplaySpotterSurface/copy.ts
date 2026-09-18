import type { SpotterShotBand } from "@wingnight/shared";

export const displaySpotterSurfaceCopy = {
  marqueeTitle: "Spotter",
  pendingChip: (points: number): string => `+${points} pending`,
  targetProgress: (current: number, total: number): string =>
    `Target ${current} of ${total}`,
  introMessage: "Holder: back to the TV. Everyone else: start shouting.",
  aimingStatus: (teamName: string): string => `${teamName} is calling the shots`,
  doneStatus: "All targets resolved",
  shotLabel: (band: SpotterShotBand, points: number): string => {
    if (band === "HIT") {
      return `HIT +${points}`;
    }

    if (band === "CLOSE") {
      return `CLOSE +${points}`;
    }

    return "MISS";
  },
  fieldLabel: "Spotter target field"
} as const;
