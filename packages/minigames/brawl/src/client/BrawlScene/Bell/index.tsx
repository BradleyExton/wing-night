import { forwardRef } from "react";

import type { BrawlCamera } from "../camera/index.js";
import * as styles from "./styles.js";

/** Where the bell hangs: the top middle of the window, under the chrome row. */
const BELL_Y = 16;
const RINGS = [-1, 1] as const;

/** The bell's swing at a share of the timeout beat: hard at first, dying away by the end. */
export const resolveBellAngle = (progress: number): number => {
  const clamped = Math.min(1, Math.max(0, progress));

  return Math.round(24 * Math.sin(clamped * Math.PI * 7) * (1 - clamped) * 10) / 10;
};

/** Hangs the bell at `progress` through the timeout beat, or takes it down with null. */
export const paintBell = (element: SVGGElement | null, camera: BrawlCamera, progress: number | null): void => {
  if (element === null) {
    return;
  }

  if (progress === null) {
    if (element.getAttribute("display") !== "none") {
      element.setAttribute("display", "none");
    }

    return;
  }

  const x = camera.x + camera.width / 2;

  element.setAttribute("display", "inline");
  element.setAttribute("transform", `translate(${x} ${BELL_Y}) rotate(${resolveBellAngle(progress)})`);
};

/**
 * The bell: the block's own clock ran out. A boxing bell swings in at the top of the window and
 * rings out while the hen slumps (docs/minigames/brawl-spec.md §0.7). Drawn about its own hang
 * point, so the paint only turns it.
 */
export const Bell = forwardRef<SVGGElement>((_props, ref): JSX.Element => (
  <g ref={ref} data-brawl-bell display="none" aria-hidden="true">
    <rect className={styles.mount} x={-1} y={-5} width={2} height={4} />
    <path className={styles.dome} d="M -6 6 Q -6 -1.5 0 -1.5 Q 6 -1.5 6 6 Z" />
    <rect className={styles.dome} x={-7} y={5.6} width={14} height={1.4} rx={0.5} />
    <circle className={styles.dome} cx={0} cy={8.4} r={1.2} />
    {RINGS.map((side) => (
      <path key={side} className={styles.ring} d={`M ${side * 8} 0 q ${side * 2} 3 0 6 M ${side * 10.5} -1 q ${side * 2.6} 4 0 8`} />
    ))}
  </g>
));

Bell.displayName = "Bell";
