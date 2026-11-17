import type { BrawlCrewHenState } from "@wingnight/shared";

export const crewSceneCopy = {
  go: "GO ▶",
  // Over each hen: whose she is, and what a teammate needs to know about her from across the room.
  tag: (playerName: string | null, slot: number, state: BrawlCrewHenState): string => {
    const name = playerName ?? `P${slot + 1}`;

    if (state === "down") {
      return `${name} — DOWN`;
    }

    return state === "away" ? `${name} · zzz` : name;
  }
} as const;
