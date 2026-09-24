import { useEffect, useState } from "react";
import { resolveRevealDurationMs } from "@wingnight/minigames-core";
import type {
  SongGuessMinigameDisplayReveal,
  SongGuessMinigameDisplayView
} from "@wingnight/shared";

// A view the TV can put the card up for: the reveal phase with both halves
// ruled. The narrowing is a function rather than an `Extract` because the
// union member carries `reveal: … | null`, and the null is the whole point.
export type SongGuessRevealView = SongGuessMinigameDisplayView & {
  phase: "reveal";
  reveal: SongGuessMinigameDisplayReveal;
};

export const resolveLiveRevealView = (
  view: SongGuessMinigameDisplayView | null
): SongGuessRevealView | null => {
  if (view === null || view.phase !== "reveal" || view.reveal === null) {
    return null;
  }

  return view as SongGuessRevealView;
};

// Two reveals of the same slot are different moments — the set can repeat a
// cursor across turns — so the server stamp is part of the identity, as it is
// in DRAWING's `resolveRevealKey`.
export const resolveSongRevealKey = (view: SongGuessRevealView): string => {
  return `${view.songCursor}:${view.reveal.revealedAtMs}`;
};

export type HeldSongReveal = {
  key: string;
  view: SongGuessRevealView;
  // The window has run out; the hold is over even if the live view is still
  // the card (in which case the card stays because it is LIVE, not held).
  isExpired: boolean;
};

// The hold's bookkeeping, pure: what the surface should remember after seeing
// this render's live view. A reveal of a new key replaces the hold and opens a
// fresh window; the same key refreshes the card (the host changed a verdict)
// without restarting the clock; no live reveal leaves the hold as it was, so
// the card the room was reading outlives the server's advance.
export const resolveHeldSongReveal = (
  held: HeldSongReveal | null,
  liveReveal: SongGuessRevealView | null
): HeldSongReveal | null => {
  if (liveReveal === null) {
    return held;
  }

  const key = resolveSongRevealKey(liveReveal);

  if (held !== null && held.key === key) {
    return held.view === liveReveal ? held : { ...held, view: liveReveal };
  }

  return { key, view: liveReveal, isExpired: false };
};

export type RenderedSongView = {
  view: SongGuessMinigameDisplayView | null;
  // The card on screen is the hold, not the live view: the server has moved
  // on and the TV is giving the room the rest of its window.
  isHeld: boolean;
};

// The principle this serves: every prompt ends on a reveal-and-react beat,
// never a hard cut. The host's `nextSong` lands on the server the instant it
// is tapped — nothing here blocks it — but the TV keeps the card up until the
// window the server stamped has run its course FROM WHEN THE TV SAW IT. A
// host who reads the room and taps late sees the flip at once; a host who
// taps inside two seconds sees the TV finish the beat first.
export const resolveRenderedSongView = (
  view: SongGuessMinigameDisplayView | null,
  held: HeldSongReveal | null
): RenderedSongView => {
  if (resolveLiveRevealView(view) !== null) {
    return { view, isHeld: false };
  }

  if (held !== null && !held.isExpired) {
    return { view: held.view, isHeld: true };
  }

  return { view, isHeld: false };
};

// Timed from arrival rather than measured against `expiresAtMs`, for the same
// reason DRAWING's `useIsRevealVisible` is: the stamps are on the server's
// clock and the comparison would be on the TV's. See
// `resolveRevealDurationMs`.
export const useHeldSongReveal = (
  view: SongGuessMinigameDisplayView | null
): RenderedSongView => {
  const [held, setHeld] = useState<HeldSongReveal | null>(null);
  const liveReveal = resolveLiveRevealView(view);

  useEffect(() => {
    if (liveReveal === null) {
      return;
    }

    setHeld((previous) => resolveHeldSongReveal(previous, liveReveal));
  }, [liveReveal]);

  const heldKey = held?.key ?? null;
  const durationMs = held === null ? 0 : resolveRevealDurationMs(held.view.reveal);

  // Keyed on the HELD reveal, not the live one, so the timer survives the live
  // view moving on — that is the whole hold.
  useEffect(() => {
    if (heldKey === null) {
      return undefined;
    }

    const expiryTimer = setTimeout(() => {
      setHeld((previous) =>
        previous !== null && previous.key === heldKey
          ? { ...previous, isExpired: true }
          : previous
      );
    }, durationMs);

    return (): void => {
      clearTimeout(expiryTimer);
    };
  }, [durationMs, heldKey]);

  return resolveRenderedSongView(view, held);
};
