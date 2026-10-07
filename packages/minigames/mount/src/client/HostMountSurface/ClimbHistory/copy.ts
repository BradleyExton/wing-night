import type { MountOutcome } from "@wingnight/shared";

export const climbHistoryCopy = {
  title: "Climbs",
  pending: "—",
  houseHen: "House hen",
  outcome: (outcome: MountOutcome | null, share: number): string => {
    if (outcome === null) {
      return "Skipped";
    }

    return outcome === "mounted" ? "Mounted" : `${Math.round(share * 100)}% of the way`;
  }
} as const;
