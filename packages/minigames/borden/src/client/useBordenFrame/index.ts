import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  BORDEN_WORLD,
  advanceBorden,
  createBordenStart,
  resolveBordenStretch,
  type BordenFrame,
  type BordenMinigameStretch,
  type BordenStretch
} from "@wingnight/shared";

const TICK_HZ = BORDEN_WORLD.tickHz;

/** A stalled tab owes at most half a second a paint: the base catches up, it never teleports. */
const MAX_TICKS_A_PAINT = 30;

type Anchor = { key: string; frame: BordenFrame; atMs: number };

const resolveScreenTick = (anchor: Anchor, nowMs: number): number => anchor.frame.tick + ((nowMs - anchor.atMs) * TICK_HZ) / 1000;

/**
 * Where a screen anchors when a frame arrives: the crew games' rule (brawl-crew-spec §0.5). "Tick
 * K" is pinned to this screen's own `performance.now()`. A frame further on than the screen had
 * got means its clock was behind, and it takes the frame's; a frame behind the screen (stamped a
 * network hop ago) is adopted for what it says while the screen's clock carries on, so the picture
 * never steps back.
 */
export const resolveBordenAnchor = (held: Anchor | null, key: string, frame: BordenFrame, nowMs: number): Anchor => {
  if (held === null || held.key !== key) {
    return { key, frame, atMs: nowMs };
  }

  const reached = resolveScreenTick(held, nowMs);

  return frame.tick >= reached ? { key, frame, atMs: nowMs } : { key, frame, atMs: nowMs - ((reached - frame.tick) * 1000) / TICK_HZ };
};

/**
 * One stretch of the base as this screen is drawing it: a little store, not React state, so the
 * chrome re-renders only for the values it shows (`useBaseValue`) while the scene repaints.
 */
export type BordenBase = {
  read: () => BordenFrame | null;
  /** Which run the frame belongs to; it changes when the stretch does. */
  key: () => string;
  subscribe: (listener: () => void) => () => void;
};

type BaseStore = BordenBase & { set: (key: string, frame: BordenFrame | null) => void };

const createBaseStore = (): BaseStore => {
  const listeners = new Set<() => void>();
  let frame: BordenFrame | null = null;
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

/** One value off the base, as React state; `select` must hand back a primitive. */
export const useBaseValue = <Value extends string | number | boolean | null>(
  base: BordenBase,
  select: (frame: BordenFrame | null) => Value
): Value => {
  const read = (): Value => select(base.read());

  return useSyncExternalStore(base.subscribe, read, read);
};

/** The whole frame, for the scene: re-rendered every frame this screen draws. */
export const useBaseFrame = (base: BordenBase): BordenFrame | null => useSyncExternalStore(base.subscribe, base.read, base.read);

/**
 * One stretch, live on this screen: the room's latest frame, stepped on here at sixty ticks a
 * second until the next one lands. A stretch still on the line has no frame, so it is drawn as its
 * pair at the start, carrying the bottles they were handed.
 */
export const useBordenFrame = (
  stretch: BordenMinigameStretch | null,
  course: { courseSeed: number }
): { base: BordenBase; layout: BordenStretch | null } => {
  const pair = stretch === null ? 0 : stretch.pair.length;
  const stretchIndex = stretch?.stretchIndex ?? 0;
  const bottles = stretch?.bottles.join(",") ?? "";
  const layout = useMemo(
    () => (stretch === null ? null : resolveBordenStretch({ seed: course.courseSeed, stretch: stretchIndex, pair: Math.max(1, pair) })),
    // Keyed on the stretch's own fields, never the stretch: its identity changes with every frame.
    [stretch === null, stretchIndex, pair, course.courseSeed]
  );
  const lineup = useMemo(() => {
    if (layout === null) {
      return null;
    }

    const start = createBordenStart(layout, { bottles: bottles === "" ? [] : (bottles.split(",") as BordenMinigameStretch["bottles"]) });

    return pair === 0 ? { ...start, hens: [] } : start;
  }, [layout, bottles, pair]);
  const storeRef = useRef<BaseStore | null>(null);
  const anchor = useRef<Anchor | null>(null);
  // A frame has landed that the loop has not drawn yet: the next paint draws it even when the
  // screen's clock has not moved past it.
  const isDirty = useRef(false);
  const roomFrame = stretch?.frame ?? null;
  const key = stretch === null ? "" : `${stretchIndex}:${stretch.startedAtMs ?? "line"}:${pair}`;

  storeRef.current ??= createBaseStore();

  const store = storeRef.current;

  useLayoutEffect(() => {
    if (roomFrame === null) {
      anchor.current = null;
      isDirty.current = false;
      store.set(key, lineup);

      return;
    }

    const isNewRun = anchor.current === null || anchor.current.key !== key;

    anchor.current = resolveBordenAnchor(anchor.current, key, roomFrame, performance.now());

    if (isNewRun) {
      store.set(key, roomFrame);
    } else {
      isDirty.current = true;
    }
  }, [key, roomFrame, lineup, store]);

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
        const drawn =
          from.outcome === null && reached > from.tick ? advanceBorden(from, layout, [], Math.min(reached, from.tick + MAX_TICKS_A_PAINT)) : from;

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

  return { base: store, layout };
};
