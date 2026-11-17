import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { BrawlCrewWalk } from "@wingnight/shared";

import { crewNight } from "../CrewScene/palette.js";
import { crewPadCopy } from "./copy.js";
import { STICK_RADIUS_PX, resolveStickCentre, resolveStickDir } from "./resolveStick/index.js";
import * as styles from "./styles.js";

type StickTouch = { pointerId: number; x: number; y: number };

/**
 * A pointer in the pad's OWN pixels, and the pad's width in them. The pad is often drawn scaled —
 * the phone's canvas, the sandbox's device frame — and the stick's ring is drawn in the pad's
 * pixels, so a thumb measured in the screen's would land the ring somewhere else.
 */
const resolveLocalPoint = (event: ReactPointerEvent<HTMLDivElement>): { x: number; y: number; width: number } => {
  const element = event.currentTarget;
  const box = element.getBoundingClientRect();
  const scaleX = box.width === 0 ? 1 : element.offsetWidth / box.width;
  const scaleY = box.height === 0 ? 1 : element.offsetHeight / box.height;

  return { x: (event.clientX - box.left) * scaleX, y: (event.clientY - box.top) * scaleY, width: element.offsetWidth };
};

type StickView = { cx: number; cy: number; kx: number; ky: number };

type CrewPadProps = {
  /** The player's slot colour: the knob, and the flash of the peck half. */
  colour: string;
  onWalk: (dir: BrawlCrewWalk) => void;
  onPeck: (held: boolean) => void;
  /** Whether the two halves are labelled: on a bare pad they are, over the street they are not. */
  isLabelled: boolean;
};

/**
 * The two thumbs (docs/minigames/brawl-crew-spec.md §0.2, §0.3), for whatever it is laid over: a
 * player's phone, where it is the whole screen, or the street itself on the tablet and the teaser.
 * The left half is a floating eight-way stick — wherever the thumb lands is its centre — and the
 * right half is PECK, down and up. It says a thumb has CHANGED and nothing else: no ticks, no
 * repeats; the server keeps the clock and the sim repeats a held peck.
 */
export const CrewPad = ({ colour, onWalk, onPeck, isLabelled }: CrewPadProps): JSX.Element => {
  const stick = useRef<StickTouch | null>(null);
  const dir = useRef<BrawlCrewWalk>(0);
  const peckPointers = useRef(new Set<number>());
  const [stickView, setStickView] = useState<StickView | null>(null);
  const [isPecking, setIsPecking] = useState(false);

  const walk = (next: BrawlCrewWalk): void => {
    if (next !== dir.current) {
      dir.current = next;
      onWalk(next);
    }
  };

  const moveStick = (touch: StickTouch, x: number, y: number): void => {
    const centre = resolveStickCentre(touch, x, y);

    touch.x = centre.x;
    touch.y = centre.y;
    walk(resolveStickDir(x - centre.x, y - centre.y));
    setStickView({ cx: centre.x, cy: centre.y, kx: x, ky: y });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const { x, y, width } = resolveLocalPoint(event);

    event.preventDefault();

    // Capture keeps a thumb that slides off the pad's edge; a pointer the browser will not let
    // us capture (it throws for one it does not know) is still a thumb, and still plays.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Uncaptured: it works while it stays over the pad.
    }

    if (x < width / 2 && stick.current === null) {
      stick.current = { pointerId: event.pointerId, x, y };
      moveStick(stick.current, x, y);

      return;
    }

    peckPointers.current.add(event.pointerId);

    if (peckPointers.current.size === 1) {
      onPeck(true);
      setIsPecking(true);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (stick.current === null || stick.current.pointerId !== event.pointerId) {
      return;
    }

    const { x, y } = resolveLocalPoint(event);

    moveStick(stick.current, x, y);
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (stick.current !== null && stick.current.pointerId === event.pointerId) {
      stick.current = null;
      walk(0);
      setStickView(null);

      return;
    }

    if (peckPointers.current.delete(event.pointerId) && peckPointers.current.size === 0) {
      onPeck(false);
      setIsPecking(false);
    }
  };

  return (
    <div
      className={styles.pad}
      data-brawl-pad=""
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={(event): void => {
        event.preventDefault();
      }}
    >
      <svg className={styles.overlay} width="100%" height="100%" aria-hidden>
        {isPecking && <rect x="50%" y={0} width="50%" height="100%" fill={colour} opacity={isLabelled ? 0.3 : 0.12} />}
        {isLabelled && (
          <>
            <rect x="50%" y={0} width={1} height="100%" fill={crewNight.dim} opacity={0.5} />
            <text className={styles.zoneLabel} x="25%" y="50%" textAnchor="middle" fill={crewNight.dim}>
              {crewPadCopy.walk}
            </text>
            <text className={styles.zoneHint} x="25%" y="50%" dy={26} textAnchor="middle" fill={crewNight.dim}>
              {crewPadCopy.walkHint}
            </text>
            <text className={styles.zoneLabel} x="75%" y="50%" textAnchor="middle" fill={isPecking ? crewNight.ink : crewNight.dim}>
              {crewPadCopy.peck}
            </text>
            <text className={styles.zoneHint} x="75%" y="50%" dy={26} textAnchor="middle" fill={crewNight.dim}>
              {crewPadCopy.peckHint}
            </text>
          </>
        )}
        {stickView !== null && (
          <g>
            <circle cx={stickView.cx} cy={stickView.cy} r={STICK_RADIUS_PX} fill="none" stroke={crewNight.ink} strokeWidth={2} opacity={0.5} />
            <circle cx={stickView.kx} cy={stickView.ky} r={24} fill={colour} opacity={0.85} />
          </g>
        )}
      </svg>
    </div>
  );
};
