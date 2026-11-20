import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
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

/**
 * One block of the street as this screen is drawing it: a little store, not React state. The
 * fight moves sixty times a second and nothing a surface renders should re-render that often, so
 * the scene and the sounds subscribe and paint from the frame themselves, and the chrome reads
 * only the few values it shows (`useStreetValue`), re-rendering when one of them changes.
 */
export type CrewStreet = {
  /** The frame on screen now, or null before the street is laid out. */
  read: () => BrawlCrewFrame | null;
  /**
   * Which fight the frame belongs to: the block and the server clock it started on, or its line
   * before it starts. It changes when the street does, so a listener can tell a new fight from
   * the next frame of the old one.
   */
  key: () => string;
  /** Called after every frame this screen draws. Returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
};

type StreetStore = CrewStreet & { set: (key: string, frame: BrawlCrewFrame | null) => void };

const createStreetStore = (): StreetStore => {
  const listeners = new Set<() => void>();
  let frame: BrawlCrewFrame | null = null;
  let key = "";

  return {
    read: () => frame,
    key: () => key,
    subscribe: (listener) => {
      listeners.add(listener);

      return (): void => {
        listeners.delete(listener);
      };
    },
    set: (nextKey, nextFrame) => {
      if (nextKey === key && nextFrame === frame) {
        return;
      }

      key = nextKey;
      frame = nextFrame;
      listeners.forEach((listener) => {
        listener();
      });
    }
  };
};

/**
 * One value off the street, as React state: re-rendered only when the value itself changes.
 * `select` must hand back a primitive (a number, a string, a boolean, null) — it is compared by
 * identity after every frame.
 */
export const useStreetValue = <Value extends string | number | boolean | null>(
  street: CrewStreet,
  select: (frame: BrawlCrewFrame | null) => Value
): Value => {
  const read = (): Value => select(street.read());

  return useSyncExternalStore(street.subscribe, read, read);
};

type CrewStreetState = {
  street: CrewStreet;
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
): CrewStreetState => {
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
  const storeRef = useRef<StreetStore | null>(null);
  const anchor = useRef<Anchor | null>(null);
  // A frame has landed that the loop has not drawn yet: the next paint draws it even if the
  // screen's clock has not moved past it (a frame ahead of the screen, or a block's last).
  const isDirty = useRef(false);
  const serverFrame = block?.frame ?? null;
  const key = block === null ? "" : `${blockIndex}:${block.startedAtMs ?? "line"}:${crew}`;

  storeRef.current ??= createStreetStore();

  const store = storeRef.current;

  useLayoutEffect(() => {
    if (serverFrame === null) {
      anchor.current = null;
      isDirty.current = false;
      // The line, or nothing: drawn at once, there is no clock to wait for.
      store.set(key, lineup);

      return;
    }

    const isNewFight = anchor.current === null || anchor.current.key !== key;

    anchor.current = resolveCrewAnchor(anchor.current, key, serverFrame, performance.now());

    if (isNewFight) {
      store.set(key, serverFrame);
    } else {
      isDirty.current = true;
    }
  }, [key, serverFrame, lineup, store]);

  useEffect(() => {
    if (layout === null) {
      return undefined;
    }

    let handle = 0;

    const paint = (nowMs: number): void => {
      const held = anchor.current;

      if (held !== null) {
        const from = isDirty.current ? held.frame : (store.read() ?? held.frame);
        const reached = Math.floor(resolveScreenTick(held, nowMs));
        const drawn = from.outcome === null && reached > from.tick ? advanceBrawlCrew(from, layout, [], Math.min(reached, from.tick + MAX_TICKS_A_PAINT)) : from;

        isDirty.current = false;
        store.set(held.key, drawn);
      }

      handle = window.requestAnimationFrame(paint);
    };

    handle = window.requestAnimationFrame(paint);

    return (): void => {
      window.cancelAnimationFrame(handle);
    };
  }, [layout, store]);

  return { street: store, layout };
};
