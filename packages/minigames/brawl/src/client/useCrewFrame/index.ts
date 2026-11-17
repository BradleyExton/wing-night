import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BRAWL_CREW_WORLD,
  advanceBrawlCrew,
  createBrawlCrewStart,
  resolveBrawlCrewBlock,
  type BrawlCrewBlock,
  type BrawlCrewFrame,
  type BrawlMinigameBlock
} from "@wingnight/shared";

const TICK_HZ = BRAWL_CREW_WORLD.tickHz;

/** A stalled tab owes at most half a second a paint: the street catches up, it never teleports. */
const MAX_TICKS_A_PAINT = 30;

type Anchor = { key: string; frame: BrawlCrewFrame; atMs: number };

/** The tick a screen's own clock says the fight has reached, from the frame it is anchored on. */
const resolveScreenTick = (anchor: Anchor, nowMs: number): number => {
  return anchor.frame.tick + ((nowMs - anchor.atMs) * TICK_HZ) / 1000;
};

/**
 * Where a screen anchors when a frame arrives (docs/minigames/brawl-crew-spec.md §0.5). It never
 * reads a wall clock: "tick K" is pinned to this screen's own `performance.now()`. A frame further
 * on than the screen had got to means the screen's clock was behind — it takes the frame's. A
 * frame behind the screen (the usual case: it was stamped a network hop ago) is adopted for what
 * it says, and the screen's clock carries on from where it was, so the picture never steps back.
 */
export const resolveCrewAnchor = (held: Anchor | null, key: string, frame: BrawlCrewFrame, nowMs: number): Anchor => {
  if (held === null || held.key !== key) {
    return { key, frame, atMs: nowMs };
  }

  const reached = resolveScreenTick(held, nowMs);

  return frame.tick >= reached
    ? { key, frame, atMs: nowMs }
    : { key, frame, atMs: nowMs - ((reached - frame.tick) * 1000) / TICK_HZ };
};

type CrewStreet = {
  /** The fight as this screen draws it now, stepped on from the last frame the server sent. */
  frame: BrawlCrewFrame | null;
  layout: BrawlCrewBlock | null;
};

/**
 * One block of the street, live on this screen: the server's latest frame, stepped forward here
 * at sixty ticks a second until the next one lands. A block still on the line has no frame, so it
 * is drawn as its crew standing at the start — the hens that have stepped out so far.
 */
export const useCrewFrame = (
  block: BrawlMinigameBlock | null,
  course: { courseSeed: number; blocksPerTurn: number }
): CrewStreet => {
  const crew = block === null ? 0 : (block.crewSize ?? block.crew.length);
  const blockIndex = block?.blockIndex ?? 0;
  const layout = useMemo(() => {
    // A line nobody has stepped onto yet is still a street: it is laid out as for one hen.
    return block === null
      ? null
      : resolveBrawlCrewBlock({ seed: course.courseSeed, blocks: course.blocksPerTurn, block: blockIndex, crew: Math.max(1, crew) });
    // Keyed on the block's own fields, never the block: its identity changes with every frame.
  }, [block === null, blockIndex, crew, course.courseSeed, course.blocksPerTurn]);
  const lineup = useMemo(() => {
    if (layout === null) {
      return null;
    }

    const start = createBrawlCrewStart(layout);

    return crew === 0 ? { ...start, hens: [] } : start;
  }, [layout, crew]);
  const anchor = useRef<Anchor | null>(null);
  const current = useRef<BrawlCrewFrame | null>(null);
  const [, setPaint] = useState(0);
  const serverFrame = block?.frame ?? null;
  const key = `${blockIndex}:${block?.startedAtMs ?? "line"}`;

  useLayoutEffect(() => {
    if (serverFrame === null) {
      anchor.current = null;
      current.current = null;

      return;
    }

    anchor.current = resolveCrewAnchor(anchor.current, key, serverFrame, performance.now());
    current.current = serverFrame;
  }, [key, serverFrame]);

  useEffect(() => {
    if (layout === null) {
      return undefined;
    }

    let handle = 0;

    const paint = (nowMs: number): void => {
      const held = anchor.current;
      const drawn = current.current;

      if (held !== null && drawn !== null && drawn.outcome === null) {
        const reached = Math.floor(resolveScreenTick(held, nowMs));

        if (reached > drawn.tick) {
          current.current = advanceBrawlCrew(drawn, layout, [], Math.min(reached, drawn.tick + MAX_TICKS_A_PAINT));
          setPaint((count) => count + 1);
        }
      }

      handle = window.requestAnimationFrame(paint);
    };

    handle = window.requestAnimationFrame(paint);

    return (): void => {
      window.cancelAnimationFrame(handle);
    };
  }, [layout]);

  return { frame: serverFrame === null ? lineup : (current.current ?? serverFrame), layout };
};
