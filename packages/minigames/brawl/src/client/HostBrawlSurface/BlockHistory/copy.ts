import type { BrawlOutcome } from "@wingnight/shared";

export const blockHistoryCopy = {
  title: "Blocks",
  pending: "—",
  // `worth` is what the block banked for the team: its goons and clean waves, and on a handoff the
  // hearts she walked off with.
  outcome: (outcome: BrawlOutcome | null, worth: number): string => {
    if (outcome === "cleared") {
      return `Handed off · ${worth} worth`;
    }

    if (outcome === "ko") {
      return `Into the bay · ${worth} worth`;
    }

    if (outcome === "timeout") {
      return `The bell · ${worth} worth`;
    }

    return "Skipped";
  }
} as const;
