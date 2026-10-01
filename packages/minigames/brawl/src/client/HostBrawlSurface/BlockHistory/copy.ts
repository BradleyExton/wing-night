import type { BrawlOutcome } from "@wingnight/shared";

export const blockHistoryCopy = {
  title: "Blocks",
  pending: "—",
  outcome: (outcome: BrawlOutcome | null, goons: number): string => {
    if (outcome === "cleared") {
      return `Handed off · ${goons} down`;
    }

    if (outcome === "ko") {
      return `Into the bay · ${goons} down`;
    }

    if (outcome === "timeout") {
      return `The bell · ${goons} down`;
    }

    return "Skipped";
  }
} as const;
