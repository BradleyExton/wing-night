import { useEffect, useRef, type PointerEvent } from "react";
import { BRAWL_WORLD } from "@wingnight/shared";

import { peckZoneCopy } from "./copy.js";
import * as styles from "./styles.js";

/**
 * How often a held peck thumb pecks again: the sim's cooldown, plus two ticks so the repeat lands
 * just after the cooldown opens rather than a frame before it (when the sim would drop it).
 */
export const PECK_REPEAT_MS = Math.round(((BRAWL_WORLD.peckCooldownTicks + 2) * 1000) / BRAWL_WORLD.tickHz);

type PeckZoneProps = {
  /** Whether a thumb here pecks: false through a beat, a handoff, or a team that is through. */
  isArmed: boolean;
  isGlyphFaded: boolean;
  peck: () => void;
  onTouch: () => void;
};

// The right half of the arena. Any finger coming down pecks at once, and while any is held the
// hen keeps pecking at the sim's own rate — holding is what a greasy thumb does, so it is safe
// rather than punished. Each finger is tracked by id, captured so a slide off the zone still lifts.
export const PeckZone = ({ isArmed, isGlyphFaded, peck, onTouch }: PeckZoneProps): JSX.Element => {
  const heldRef = useRef(new Set<number>());
  const timerRef = useRef(0);
  const peckRef = useRef(peck);

  peckRef.current = peck;

  const stopRepeat = (): void => {
    heldRef.current.clear();

    if (timerRef.current !== 0) {
      window.clearInterval(timerRef.current);
      timerRef.current = 0;
    }
  };

  // Disarmed (the block ended under a held thumb) or unmounted: stop, so a thumb still down
  // through the handoff does not start the next player's clock.
  useEffect(() => {
    if (!isArmed) {
      stopRepeat();
    }
  }, [isArmed]);

  useEffect(() => stopRepeat, []);

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser is not tracking (a synthetic one) has nothing to capture.
    }

    onTouch();
    peck();

    if (!isArmed) {
      return;
    }

    heldRef.current.add(event.pointerId);

    if (timerRef.current === 0) {
      timerRef.current = window.setInterval(() => {
        peckRef.current();
      }, PECK_REPEAT_MS);
    }
  };

  const onUp = (event: PointerEvent<HTMLDivElement>): void => {
    heldRef.current.delete(event.pointerId);

    if (heldRef.current.size === 0) {
      stopRepeat();
    }
  };

  return (
    <div
      className={styles.container}
      data-brawl-peck-zone
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
    >
      <span className={`${styles.glyph}${isGlyphFaded ? ` ${styles.faded}` : ""}`} data-brawl-peck-glyph>
        <span className={styles.glyphRing}>{peckZoneCopy.peck}</span>
        <span className={styles.glyphCaption}>{peckZoneCopy.caption}</span>
      </span>
    </div>
  );
};
