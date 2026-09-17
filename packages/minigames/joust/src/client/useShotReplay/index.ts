import { useEffect, useRef, useState } from "react";
import type { JoustMinigameShot } from "@wingnight/shared";

// Client-local playback of a server-simulated track: the frame index climbs
// at the track's own rate from the moment a new shot arrives, then holds on
// the last frame. Keyed on the shot, not on the view object, so the ordinary
// snapshot rebroadcasts that happen while a shot is on screen never restart
// it. A display that refreshes mid-shot replays that shot once from the top,
// which is the right thing for the room to see.
export const useShotReplay = (shot: JoustMinigameShot | null): number => {
  const [frameIndex, setFrameIndex] = useState(0);
  const shotRef = useRef(shot);
  const shotKey = shot === null ? null : `${shot.shotNumber}:${shot.run.keyframes.length}`;

  shotRef.current = shot;

  useEffect(() => {
    const currentShot = shotRef.current;

    if (shotKey === null || currentShot === null) {
      setFrameIndex(0);
      return undefined;
    }

    const lastIndex = currentShot.run.keyframes.length - 1;
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The replay is the game, not decoration — but a viewer who asked for
    // less motion still gets the outcome, just without the flight.
    if (prefersReducedMotion || lastIndex <= 0) {
      setFrameIndex(Math.max(0, lastIndex));
      return undefined;
    }

    const startedAt = performance.now();
    const framesPerMs = currentShot.run.keyframeHz / 1000;
    let handle = 0;

    setFrameIndex(0);

    const step = (now: number): void => {
      const nextIndex = Math.min(lastIndex, Math.floor((now - startedAt) * framesPerMs));

      setFrameIndex(nextIndex);

      if (nextIndex < lastIndex) {
        handle = window.requestAnimationFrame(step);
      }
    };

    handle = window.requestAnimationFrame(step);

    return (): void => {
      window.cancelAnimationFrame(handle);
    };
  }, [shotKey]);

  return frameIndex;
};
