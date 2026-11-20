import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { runGunLabCopy } from "../copy";
import { padInk } from "../palette";
import { STICK_RADIUS_PX, resolveStickCentre, resolveStickDir } from "../Pad/resolveStick";
import type { StickDir } from "../yardSim";
import * as styles from "./styles";

const copy = runGunLabCopy.pad;

type StickView = { cx: number; cy: number; kx: number; ky: number };

type StickTouch = { pointerId: number; x: number; y: number };

type PadControlsProps = {
  /** The player's slot colour: the knob, and the flash of the jump half. */
  colour: string;
  /** Whether the two halves are labelled: on a bare pad they are, over the yard only faintly. */
  isLabelled: boolean;
  /** The stick changed direction (0 is the thumb lifted or at rest). */
  onStick: (dir: StickDir) => void;
  /** A thumb came down on the jump half. */
  onJump: () => void;
};

/**
 * PROTOTYPE — throwaway. The jump lab's two thumbs, for whatever they are laid over: the LAN
 * lab's bare phone pad, or the online lab's yard. The left half is the crew pad's floating
 * eight-way stick (run, pull down to duck); the right half is JUMP, on touch. It says only that a
 * thumb changed.
 */
export const PadControls = ({ colour, isLabelled, onStick, onJump }: PadControlsProps): JSX.Element => {
  const [stickView, setStickView] = useState<StickView | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const stick = useRef<StickTouch | null>(null);
  const dir = useRef<StickDir>(0);
  const jumpPointers = useRef(new Set<number>());

  const moveStick = (touch: StickTouch, x: number, y: number): void => {
    const centre = resolveStickCentre(touch, x, y);
    const next = resolveStickDir(x - centre.x, y - centre.y);

    touch.x = centre.x;
    touch.y = centre.y;

    if (next !== dir.current) {
      dir.current = next;
      onStick(next);
    }

    setStickView({ cx: centre.x, cy: centre.y, kx: x, ky: y });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Uncaptured: it works while it stays over the pad.
    }

    if (event.clientX < window.innerWidth / 2 && stick.current === null) {
      stick.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      moveStick(stick.current, event.clientX, event.clientY);

      return;
    }

    jumpPointers.current.add(event.pointerId);
    onJump();
    setIsJumping(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (stick.current !== null && stick.current.pointerId === event.pointerId) {
      moveStick(stick.current, event.clientX, event.clientY);
    }
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (stick.current !== null && stick.current.pointerId === event.pointerId) {
      stick.current = null;
      setStickView(null);

      if (dir.current !== 0) {
        dir.current = 0;
        onStick(0);
      }

      return;
    }

    if (jumpPointers.current.delete(event.pointerId)) {
      setIsJumping(jumpPointers.current.size > 0);
    }
  };

  const labelFill = isLabelled ? padInk.dim : padInk.faint;

  return (
    <div
      className={styles.controls}
      data-proto-rungun-pad=""
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={(event): void => {
        event.preventDefault();
      }}
    >
      <svg className={styles.overlay} width="100%" height="100%" aria-hidden>
        {isJumping && <rect x="50%" y={0} width="50%" height="100%" fill={colour} opacity={isLabelled ? 0.3 : 0.12} />}
        {isLabelled && <rect x="50%" y={0} width={1} height="100%" fill={padInk.dim} opacity={0.5} />}
        <text className={styles.zoneLabel} x="25%" y="50%" textAnchor="middle" fill={labelFill}>
          {copy.run}
        </text>
        <text className={styles.zoneLabel} x="75%" y="50%" textAnchor="middle" fill={isJumping ? padInk.text : labelFill}>
          {copy.jump}
        </text>
        {isLabelled && (
          <>
            <text className={styles.zoneHint} x="25%" y="50%" dy={26} textAnchor="middle" fill={padInk.dim}>
              {copy.runHint}
            </text>
            <text className={styles.zoneHint} x="75%" y="50%" dy={26} textAnchor="middle" fill={padInk.dim}>
              {copy.jumpHint}
            </text>
          </>
        )}
        {stickView !== null && (
          <g>
            <circle cx={stickView.cx} cy={stickView.cy} r={STICK_RADIUS_PX} fill="none" stroke={padInk.ring} strokeWidth={2} opacity={0.5} />
            <circle cx={stickView.kx} cy={stickView.ky} r={24} fill={colour} opacity={0.85} />
          </g>
        )}
      </svg>
    </div>
  );
};
