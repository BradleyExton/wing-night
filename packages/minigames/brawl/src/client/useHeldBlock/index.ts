import { useEffect, useState } from "react";
import type { BrawlMinigameDisplayView, BrawlMinigameHostView } from "@wingnight/shared";

import { CLEARED_BEAT_MS, KO_BEAT_MS, TIMEOUT_BEAT_MS } from "../beats/index.js";

/** How a held block ended. `skipped` is the block that never happened: nothing to show, only who is next. */
export type BlockHoldOutcome = "cleared" | "ko" | "timeout" | "skipped";

export type BlockHold = {
  /** The block the surface keeps on screen: the one that just ended. */
  blockIndex: number;
  /** How it ended, which is what the room is being shown. */
  outcome: BlockHoldOutcome;
  /** The worth it put down, so a card can say so without going back to the block. */
  goons: number;
  /** Whether the tablet is changing hands or the team is through. */
  kind: "handoff" | "finish";
  startedAtMs: number;
};

type BlockView = Pick<BrawlMinigameHostView | BrawlMinigameDisplayView, "blockIndex" | "blocksPerTurn" | "blocks">;

/**
 * What a change in the block in hand means for the picture. The view moves its cursor the instant
 * the server has refereed a block; the surfaces do not, so the room sees how it ended — and whose
 * tablet it is now — before the street goes back to a start line.
 */
export const resolveBlockHold = (previousBlockIndex: number | null, view: BlockView, nowMs: number): BlockHold | null => {
  if (previousBlockIndex === null || view.blockIndex <= previousBlockIndex) {
    return null;
  }

  const endedBlock = view.blocks[previousBlockIndex];

  if (endedBlock === undefined || endedBlock.status !== "done") {
    return null;
  }

  return {
    blockIndex: previousBlockIndex,
    // A skipped block has no result and nothing to show — it must not be announced as the bell.
    outcome: endedBlock.skipped ? "skipped" : (endedBlock.result?.outcome ?? "timeout"),
    goons: endedBlock.result?.goons ?? 0,
    kind: view.blockIndex >= view.blocksPerTurn ? "finish" : "handoff",
    startedAtMs: nowMs
  };
};

const HOLD_DURATION_MS: Record<BlockHoldOutcome, number> = {
  cleared: CLEARED_BEAT_MS,
  ko: KO_BEAT_MS,
  timeout: TIMEOUT_BEAT_MS,
  // Nothing plays, but the room still needs to hear whose tablet it is now.
  skipped: TIMEOUT_BEAT_MS
};

/** How long a hold keeps the ended block on screen: its beat. */
export const resolveBlockHoldDurationMs = (hold: BlockHold): number => {
  return HOLD_DURATION_MS[hold.outcome];
};

/** The block a surface should draw while a hold may be running: the held one, else the one in hand. */
export const resolveShownBlockIndex = (view: Pick<BlockView, "blockIndex" | "blocksPerTurn">, hold: BlockHold | null): number => {
  return hold === null ? Math.max(0, Math.min(view.blockIndex, view.blocksPerTurn - 1)) : hold.blockIndex;
};

/**
 * The block a surface should draw right now, and the hold it is in, if any (`useHeldRun`'s twin).
 * A hold lasts the block's ending beat plus whatever slack the caller needs (the TV's replay runs
 * behind the tablet); a reset drops it at once.
 *
 * The hold is derived DURING the render that sees the cursor move, not in an effect after it: an
 * effect commits one frame with the cursor already on the next block and no hold yet, and both
 * surfaces key their street on the block they show — so that frame remounted the next block's
 * street, and the hold then remounted the ended one, replaying its slide-in under the beat.
 */
export const useHeldBlock = (view: BlockView, slackMs = 0): { shownBlockIndex: number; hold: BlockHold | null } => {
  const [tracked, setTracked] = useState<{ blockIndex: number | null; hold: BlockHold | null }>({
    blockIndex: null,
    hold: null
  });
  let { hold } = tracked;

  if (tracked.blockIndex !== view.blockIndex) {
    const nextHold = resolveBlockHold(tracked.blockIndex, view, Date.now());

    if (nextHold !== null) {
      hold = nextHold;
    } else if (tracked.blockIndex !== null && view.blockIndex < tracked.blockIndex) {
      hold = null;
    }

    // React's derived-state pattern: the render is thrown away and re-run with this state before
    // anything is committed.
    setTracked({ blockIndex: view.blockIndex, hold });
  }

  useEffect(() => {
    if (hold === null) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setTracked((current) => (current.hold === hold ? { ...current, hold: null } : current));
    }, resolveBlockHoldDurationMs(hold) + slackMs);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [hold, slackMs]);

  return { shownBlockIndex: resolveShownBlockIndex(view, hold), hold };
};
