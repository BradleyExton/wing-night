import { useEffect, useRef, useState } from "react";

export type BenchWalkTarget = {
  id: string;
  x: number;
};

export type BenchWalkPosition = {
  x: number;
  // On the way somewhere, and which way: a walking bird faces where it is going.
  isWalking: boolean;
  direction: 1 | -1;
};

/** World units a second: a bench bird crosses the width of the line in about a second. */
export const BENCH_WALK_SPEED = 14;

// Closer than this to a spot is standing on it — a bird a hair from its mark that kept walking
// would never settle into `still`.
const PARKED_EPSILON = 0.05;

/**
 * One frame of everyone walking to their spot: each x moves toward its target by at most a
 * frame's worth of stride and parks when it gets there. A newcomer appears on their mark rather
 * than walking in from nowhere. Pure, so the frame the room sees is the frame the test sees.
 */
export const stepBenchWalk = (
  positions: ReadonlyMap<string, number>,
  targets: readonly BenchWalkTarget[],
  elapsedMs: number,
  unitsPerSecond = BENCH_WALK_SPEED
): Map<string, number> => {
  const stride = (Math.max(0, elapsedMs) / 1000) * unitsPerSecond;
  const next = new Map<string, number>();

  for (const target of targets) {
    const current = positions.get(target.id);

    if (current === undefined) {
      next.set(target.id, target.x);
      continue;
    }

    const remaining = target.x - current;

    next.set(
      target.id,
      Math.abs(remaining) <= Math.max(stride, PARKED_EPSILON)
        ? target.x
        : current + Math.sign(remaining) * stride
    );
  }

  return next;
};

export const isBenchParked = (
  positions: ReadonlyMap<string, number>,
  targets: readonly BenchWalkTarget[]
): boolean =>
  targets.every((target) => {
    const current = positions.get(target.id);

    return current !== undefined && Math.abs(target.x - current) <= PARKED_EPSILON;
  });

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Client-only walking: every id keeps an animated x that tweens toward its target at a fixed
 * pace on requestAnimationFrame, the way FAPPY's handoff beats are the surface's own and never
 * the room's. Nothing here reaches the wire — a spot on the bench is presentation, and a display
 * that refreshes mid-walk simply finds everybody already on their marks. A viewer who asked for
 * less motion gets the teleport, as `useShotReplay` gives them the landing frame.
 */
export const useBenchWalk = (
  targets: readonly BenchWalkTarget[],
  unitsPerSecond = BENCH_WALK_SPEED
): ReadonlyMap<string, BenchWalkPosition> => {
  const targetsRef = useRef(targets);
  const positionsRef = useRef<ReadonlyMap<string, number>>(
    new Map(targets.map((target) => [target.id, target.x]))
  );
  const [, setFrame] = useState(0);
  // Only a change of marks starts a walk; the same marks arriving on a snapshot rebroadcast
  // must not restart one.
  const targetsKey = targets.map((target) => `${target.id}@${target.x.toFixed(2)}`).join("|");

  targetsRef.current = targets;

  useEffect(() => {
    const currentTargets = targetsRef.current;
    const teleport = prefersReducedMotion();

    // Reconcile at once — a newcomer lands on their mark, a leaver is forgotten — then keep
    // stepping until the last bird is parked, and not a frame longer.
    positionsRef.current = stepBenchWalk(
      positionsRef.current,
      currentTargets,
      teleport ? Number.POSITIVE_INFINITY : 0,
      unitsPerSecond
    );
    setFrame((frame) => frame + 1);

    if (isBenchParked(positionsRef.current, currentTargets)) {
      return undefined;
    }

    let handle = 0;
    let lastAt: number | null = null;

    const step = (now: number): void => {
      const elapsedMs = lastAt === null ? 0 : now - lastAt;

      lastAt = now;
      positionsRef.current = stepBenchWalk(
        positionsRef.current,
        currentTargets,
        elapsedMs,
        unitsPerSecond
      );
      setFrame((frame) => frame + 1);

      if (!isBenchParked(positionsRef.current, currentTargets)) {
        handle = window.requestAnimationFrame(step);
      }
    };

    handle = window.requestAnimationFrame(step);

    return (): void => {
      window.cancelAnimationFrame(handle);
    };
  }, [targetsKey, unitsPerSecond]);

  const result = new Map<string, BenchWalkPosition>();

  for (const target of targets) {
    const x = positionsRef.current.get(target.id) ?? target.x;
    const remaining = target.x - x;

    result.set(target.id, {
      x,
      isWalking: Math.abs(remaining) > PARKED_EPSILON,
      direction: remaining < 0 ? -1 : 1
    });
  }

  return result;
};
