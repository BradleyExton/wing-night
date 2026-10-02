import { useEffect, useState } from "react";
import type { BrawlMinigameBlock } from "@wingnight/shared";

import { HEART_CALLOUT_MS } from "../beats/index.js";

type CalloutBlock = Pick<BrawlMinigameBlock, "blockIndex" | "heartBought" | "status">;

/** The bought block the callout last opened for, and whether it is still up. */
export type HeartCalloutSeen = { blockIndex: number; isOpen: boolean } | null;

/**
 * What the callout should remember after this render, given the block on the wall: it opens the
 * first time a bought block is on the street (not through a hold — the wall is still showing the
 * block before), once per block; and it forgets a block that is no longer bought or that the team
 * has gone back before (a reset), so the offer can be bought and called out again. Pure.
 */
export const resolveHeartCalloutSeen = (
  seen: HeartCalloutSeen,
  block: CalloutBlock | null,
  isShowing: boolean
): HeartCalloutSeen => {
  if (block === null) {
    return seen;
  }

  if (seen !== null && (block.blockIndex < seen.blockIndex || (block.blockIndex === seen.blockIndex && !block.heartBought))) {
    return null;
  }

  const isBoughtOnStreet = isShowing && block.heartBought && block.status !== "done";

  return isBoughtOnStreet && seen?.blockIndex !== block.blockIndex ? { blockIndex: block.blockIndex, isOpen: true } : seen;
};

/**
 * Whether the wall's "*Name* bought a heart" callout is up (docs/minigames/brawl-spec.md §0.7):
 * for `HEART_CALLOUT_MS` from the first render that shows a bought block on the street. Worked out
 * DURING the render, like `useHeldBlock`'s hold and the beat callout it drives, never from the
 * mirror's events — so it is up under reduced motion and in a static-markup render alike.
 */
export const useHeartCallout = (block: CalloutBlock | null, isShowing: boolean): boolean => {
  const [seen, setSeen] = useState<HeartCalloutSeen>(null);
  const next = resolveHeartCalloutSeen(seen, block, isShowing);

  if (next !== seen) {
    // React's derived-state pattern: the render is thrown away and re-run with this state before
    // anything is committed.
    setSeen(next);
  }

  const openFor = next !== null && next.isOpen ? next.blockIndex : null;

  useEffect(() => {
    if (openFor === null) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setSeen((current) => (current !== null && current.blockIndex === openFor ? { ...current, isOpen: false } : current));
    }, HEART_CALLOUT_MS);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [openFor]);

  return isShowing && block !== null && block.heartBought && openFor === block.blockIndex;
};
