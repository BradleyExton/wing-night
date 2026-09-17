import type { JoustHitZone } from "@wingnight/shared";

// Shared by the host deck and the TV: what to call each place the shooter
// can land, and the miss.
export const joustHitZoneCopy: Record<JoustHitZone | "miss", { title: string; blurb: string }> =
  {
    head: { title: "Headshot", blurb: "Right between the eyes." },
    shaft: { title: "Body shot", blurb: "Solid contact. Not pretty." },
    balls: { title: "Low blow", blurb: "The crowd winces. The points are real." },
    miss: { title: "Whiff", blurb: "The desert claims another." }
  };

export const resolveHitZoneCopy = (
  hitZone: JoustHitZone | null
): { title: string; blurb: string } => {
  return joustHitZoneCopy[hitZone ?? "miss"];
};
