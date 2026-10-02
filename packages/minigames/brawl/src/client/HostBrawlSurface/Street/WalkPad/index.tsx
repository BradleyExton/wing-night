import { useEffect, useRef, type PointerEvent } from "react";

import { THUMB_WALK_IDLE, TURN_PX, resolveThumbWalk, type ThumbWalkEvent, type ThumbWalkState } from "../../../thumbWalk/index.js";
import type { BrawlWalkDir } from "../../../useBrawlRunner/index.js";
import { walkPadCopy } from "./copy.js";
import * as styles from "./styles.js";

type WalkPadProps = {
  /** Whether a thumb here walks: false through a beat, a handoff, or a team that is through. */
  isArmed: boolean;
  isGlyphFaded: boolean;
  walk: (dir: BrawlWalkDir) => void;
  /** The way the hen faces now: where a plain held thumb walks her. */
  getFacing: () => -1 | 1;
  onTouch: () => void;
};

const DIR_NAMES: Record<BrawlWalkDir, string> = { [-1]: "left", 0: "none", 1: "right" };

type StickRefs = { stick: HTMLSpanElement | null; dot: HTMLSpanElement | null };

/** The stick under the thumb, written straight onto the DOM like the paint loop: no React per move. */
const paintStick = (refs: StickRefs, pad: HTMLElement, thumb: ThumbWalkState, clientX: number, clientY: number | null): void => {
  const { stick, dot } = refs;

  if (stick === null) {
    return;
  }

  stick.setAttribute("data-brawl-thumb-held", thumb.pointerId === null ? "false" : "true");
  stick.setAttribute("data-brawl-thumb-dir", DIR_NAMES[thumb.dir]);

  // Lifted: it fades where it was.
  if (thumb.pointerId === null) {
    return;
  }

  // Client pixels to the pad's own: one on the tablet, less in a scaled preview frame.
  const rect = pad.getBoundingClientRect();
  const scale = pad.offsetWidth > 0 ? rect.width / pad.offsetWidth : 1;
  const pull = Math.max(-TURN_PX, Math.min(TURN_PX, clientX - thumb.centreX));

  stick.style.left = `${Math.round((thumb.centreX - rect.left) / scale)}px`;

  if (clientY !== null) {
    stick.style.top = `${Math.round((clientY - rect.top) / scale)}px`;
  }

  if (dot !== null) {
    dot.style.transform = `translateX(${Math.round(pull / scale)}px)`;
  }
};

// The left half of the arena. Wherever the thumb lands is the centre, and holding walks the hen
// the way she faces; a pull back past `TURN_PX` turns her (`thumbWalk/`). One pointer owns the
// pad, captured so a thumb that wanders off the edge keeps walking until it lifts.
export const WalkPad = ({ isArmed, isGlyphFaded, walk, getFacing, onTouch }: WalkPadProps): JSX.Element => {
  const thumbRef = useRef<ThumbWalkState>(THUMB_WALK_IDLE);
  const stickRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  const apply = (event: PointerEvent<HTMLDivElement>, thumbEvent: ThumbWalkEvent): boolean => {
    const previous = thumbRef.current;
    const next = resolveThumbWalk(previous, thumbEvent);

    if (next === previous) {
      return false;
    }

    thumbRef.current = next;

    if (next.dir !== previous.dir) {
      walk(next.dir);
    }

    const clientY = thumbEvent.kind === "down" ? event.clientY : null;

    paintStick({ stick: stickRef.current, dot: dotRef.current }, event.currentTarget, next, event.clientX, clientY);
    return true;
  };

  // A pad that stops being armed lets go of its thumb, so one held across a handoff is not still
  // walking the next player's hen.
  useEffect(() => {
    if (!isArmed && thumbRef.current.pointerId !== null) {
      thumbRef.current = THUMB_WALK_IDLE;
      stickRef.current?.setAttribute("data-brawl-thumb-held", "false");
    }
  }, [isArmed]);

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();

    if (!apply(event, { kind: "down", pointerId: event.pointerId, x: event.clientX, facing: getFacing() })) {
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer the browser is not tracking (a synthetic one) has nothing to capture.
    }

    onTouch();
  };

  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    apply(event, { kind: "move", pointerId: event.pointerId, x: event.clientX });
  };

  const onUp = (event: PointerEvent<HTMLDivElement>): void => {
    apply(event, { kind: "up", pointerId: event.pointerId });
  };

  return (
    <div
      className={styles.container}
      data-brawl-walk-pad
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      onLostPointerCapture={onUp}
    >
      <span className={`${styles.glyph}${isGlyphFaded ? ` ${styles.faded}` : ""}`} data-brawl-walk-glyph>
        <span className={styles.glyphRow}>
          <span className={styles.glyphArrow}>{walkPadCopy.walkLeft}</span>
          <span className={styles.glyphRing} />
          <span className={styles.glyphArrow}>{walkPadCopy.walkRight}</span>
        </span>
        <span className={styles.glyphCaption}>{walkPadCopy.caption}</span>
      </span>
      <span ref={stickRef} className={styles.stick} data-brawl-thumb data-brawl-thumb-held="false" data-brawl-thumb-dir="none">
        <span className={styles.stickArrowLeft}>{walkPadCopy.walkLeft}</span>
        <span className={styles.stickRing}>
          <span ref={dotRef} className={styles.stickDot} />
        </span>
        <span className={styles.stickArrowRight}>{walkPadCopy.walkRight}</span>
      </span>
    </div>
  );
};
