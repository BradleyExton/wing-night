import { forwardRef } from "react";
import { BRAWL_CREW_WORLD } from "@wingnight/shared";

import { goArrowCopy } from "./copy.js";
import * as styles from "./styles.js";

/**
 * How far in from the window's right edge the arrow's tip sits, and how far down the frame — low
 * enough that the wall's wide arena, which gives up sky from the top, still has it.
 */
const TIP_INSET = 5;
const ARROW_Y = 46;

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
 * The beat 'em up's GO ▶: a blinking arrow at the window's right edge while a wave is down and
 * the street is waiting to be walked. Drawn in screen space, not on the street, so it stays at
 * the edge while the street scrolls under it.
 */
export const GoArrow = forwardRef<SVGGElement>((_props, ref): JSX.Element => {
  const tipX = BRAWL_CREW_WORLD.width - TIP_INSET;

  return (
    <g ref={ref} data-brawl-go="false" display="none" aria-hidden="true">
      <g className={styles.arrow}>
        <text className={styles.word} x={tipX - 15} y={ARROW_Y + 3.8} textAnchor="end">
          {goArrowCopy.go}
        </text>
        <path className={styles.chevron} d={`M ${tipX - 13} ${ARROW_Y - 7} L ${tipX} ${ARROW_Y} L ${tipX - 13} ${ARROW_Y + 7} Z`} />
      </g>
    </g>
  );
});

GoArrow.displayName = "GoArrow";
