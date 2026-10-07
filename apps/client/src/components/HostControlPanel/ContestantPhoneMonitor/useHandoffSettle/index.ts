import { useEffect, useRef, useState } from "react";

// Long enough for the slowest handoff beat the wall plays over a leg that just ended (a SCHLONIC
// wipeout's punchline and card) to clear the mirror.
export const HANDOFF_SETTLE_MS = 2_500;

// Whether the leg in hand changed hands a moment ago. The leg moves on the instant the server
// says so, but the TV — and so the tablet's mirror of it — holds the leg that just ended for its
// handoff beat. A skip tapped then lands on the NEXT player's leg while the host is looking at
// the last one, the hole every arcade host surface closes by disabling its skip during the hold.
// The monitor has no hold of its own to read, so it waits out the longest one.
export const useHandoffSettle = (legIndex: number | null): boolean => {
  const previousLegIndexRef = useRef<number | null>(null);
  const [isSettling, setIsSettling] = useState(legIndex !== null && legIndex > 0);

  useEffect(() => {
    const previousLegIndex = previousLegIndexRef.current;

    previousLegIndexRef.current = legIndex;

    if (previousLegIndex !== null && previousLegIndex !== legIndex) {
      setIsSettling(true);
    }
  }, [legIndex]);

  useEffect(() => {
    if (!isSettling) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setIsSettling(false);
    }, HANDOFF_SETTLE_MS);

    return (): void => {
      window.clearTimeout(handle);
    };
  }, [isSettling, legIndex]);

  return isSettling;
};
