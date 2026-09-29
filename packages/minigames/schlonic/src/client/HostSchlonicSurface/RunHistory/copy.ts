export const runHistoryCopy = {
  title: "Runs",
  pending: "—",
  outcome: (outcome: "cleared" | "wiped" | "fell" | null, wings: number): string => {
    if (outcome === "cleared") {
      return `Post! +${wings}`;
    }

    if (outcome === "fell") {
      return "Into the roadworks";
    }

    if (outcome === "wiped") {
      return "Wiped out";
    }

    return "Skipped";
  }
} as const;
