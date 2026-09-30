import { useEffect, useState } from "react";

// Whether a reveal's answer is up: from the very render the reveal arrives in
// until `durationMs` after THIS surface saw it. `revealKey` names the reveal
// (two reveals of the same prompt are different moments, so games fold the
// revealed-at stamp in); `durationMs` is the server's window length.
//
// Timed from arrival rather than measured against the reveal's expiry stamp,
// because that stamp is on the SERVER's clock while the comparison would be on
// the TV's or the tablet's. Three devices, three clocks, a 2000ms window: a
// surface running two seconds fast found every window already closed and
// showed nobody an answer. The trade is that a surface joining mid-window gives
// the reveal its full length rather than the remainder — the right way round,
// since the window exists so the room can read the answer.
//
// Open on the first render, not one render later from an effect: the verdict
// empties the board in the same update that raises the reveal, and a render
// that saw the empty board before the held one would flash it blank.
export const useRevealWindow = (
  revealKey: string | null,
  durationMs: number
): boolean => {
  const [expiredRevealKey, setExpiredRevealKey] = useState<string | null>(null);

  useEffect(() => {
    if (revealKey === null || durationMs <= 0) {
      return undefined;
    }

    const expiryTimer = setTimeout(() => {
      setExpiredRevealKey(revealKey);
    }, durationMs);

    return (): void => {
      clearTimeout(expiryTimer);
    };
  }, [durationMs, revealKey]);

  return revealKey !== null && durationMs > 0 && expiredRevealKey !== revealKey;
};
