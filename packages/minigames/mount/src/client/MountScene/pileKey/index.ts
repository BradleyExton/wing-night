import type { MountPile } from "@wingnight/shared";

/**
 * A pile's identity as a string, for memoising what is drawn from it. Every server echo hands the
 * surfaces a fresh deep copy of the same pile, and the stuck hens must not redraw sixty times a
 * second because of it; the key changes only when a hen joins or leaves, or the line moves.
 */
export const resolvePileKey = (pile: MountPile): string => {
  const hens = pile.hens
    .map((hen) => `${hen.playerId ?? "-"}@${hen.pose.rump.x},${hen.pose.rump.y},${hen.pose.beak.x},${hen.pose.beak.y}`)
    .join("|");

  return `${pile.seed}:${pile.goose}:${pile.highLine.height},${pile.highLine.x},${pile.highLine.playerId ?? "goose"}:${hens}`;
};
