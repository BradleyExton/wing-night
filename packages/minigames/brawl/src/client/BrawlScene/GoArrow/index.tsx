import { forwardRef } from "react";

import type { BrawlCamera } from "../camera/index.js";
import { goArrowCopy } from "./copy.js";
import * as styles from "./styles.js";

/** How far in from the camera's right edge the arrow's tip sits, and how far down the frame. */
const TIP_INSET = 4;
const ARROW_Y = 30;

/** Shows or hides the arrow, writing only when it changes. */
export const paintGo = (element: SVGGElement | null, shown: boolean): void => {
  const value = shown ? "true" : "false";

  if (element === null || element.getAttribute("data-brawl-go") === value) {
    return;
  }

  element.setAttribute("data-brawl-go", value);
  element.setAttribute("display", shown ? "inline" : "none");
};

/**
 * The beat 'em up's GO ▶: a blinking arrow at the camera's right edge while a wave is down and
 * the street is waiting to be walked. Drawn in screen space, not on the street, so it stays at the
 * edge of whatever window the surface shows.
 */
export const GoArrow = forwardRef<SVGGElement, { camera: BrawlCamera }>(({ camera }, ref): JSX.Element => {
  const tipX = camera.x + camera.width - TIP_INSET;

  return (
    <g ref={ref} data-brawl-go="false" display="none" aria-hidden="true">
      <g className={styles.arrow}>
        <text className={styles.word} x={tipX - 13} y={ARROW_Y + 3.2} textAnchor="end">
          {goArrowCopy.go}
        </text>
        <path className={styles.chevron} d={`M ${tipX - 11} ${ARROW_Y - 6} L ${tipX} ${ARROW_Y} L ${tipX - 11} ${ARROW_Y + 6} Z`} />
      </g>
    </g>
  );
});

GoArrow.displayName = "GoArrow";
