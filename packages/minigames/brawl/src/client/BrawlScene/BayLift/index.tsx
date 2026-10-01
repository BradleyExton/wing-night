import { forwardRef, useImperativeHandle, useRef } from "react";
import { BRAWL_WORLD } from "@wingnight/shared";

import { resolveGoonTransform } from "../GoonLayer/drawTick/index.js";
import { Goose, brawlGoonPalette } from "../Goons/index.js";
import type { KoBeat } from "../beatTimeline/index.js";
import * as styles from "./styles.js";

export type BayLiftRefs = {
  geese: (SVGGElement | null)[];
  splash: SVGGElement | null;
};

const GEESE = [0, 1, 2] as const;
/** The splash's arcs about its centre, in its own units: thrown up and out either side. */
const SPLASH_ARCS = [
  "M -2 0 Q -6 -9 -12 -4",
  "M 2 0 Q 6 -9 12 -4",
  "M -1 0 Q -2 -13 -5 -12",
  "M 1 0 Q 2 -13 5 -12",
  "M -16 0 Q -11 -4 -8 0",
  "M 16 0 Q 11 -4 8 0"
];

const setDisplay = (element: Element | null, shown: boolean): void => {
  const value = shown ? "inline" : "none";

  if (element !== null && element.getAttribute("display") !== value) {
    element.setAttribute("display", value);
  }
};

/** Puts the geese and the splash where the bay beat has them, or takes them all away with null. */
export const paintBayLift = (refs: BayLiftRefs | null, henX: number, beat: KoBeat | null, bottomY: number): void => {
  if (refs === null) {
    return;
  }

  GEESE.forEach((index) => {
    const element = refs.geese[index] ?? null;
    const hold = beat?.geese[index];

    setDisplay(element, hold !== undefined);

    if (element !== null && hold !== undefined) {
      element.setAttribute("transform", resolveGoonTransform(hold));
    }
  });

  setDisplay(refs.splash, beat !== null && beat.splash !== null);

  if (beat?.splash !== null && beat?.splash !== undefined) {
    const grow = 0.4 + beat.splash * 0.9;

    refs.splash?.setAttribute("transform", `translate(${henX} ${bottomY}) scale(${grow})`);
    refs.splash?.setAttribute("opacity", `${Math.round((1 - beat.splash * 0.7) * 100) / 100}`);
  }
};

/**
 * The bay beat's cast: three geese that swoop in and carry the hen off the top of the frame, and
 * the splash Kempenfelt Bay throws up at the bottom of it when she lands (data-brawl-bay). The
 * geese are the street's own goose drawing, mid-lunge, so the room knows exactly who did it.
 */
export const BayLift = forwardRef<BayLiftRefs>((_props, ref): JSX.Element => {
  const geese = useRef<(SVGGElement | null)[]>([]);
  const splash = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({ geese: geese.current, splash: splash.current }));

  return (
    <g data-brawl-bay-lift aria-hidden="true">
      {GEESE.map((index) => (
        <g
          key={index}
          ref={(element): void => {
            geese.current[index] = element;
          }}
          display="none"
          data-brawl-bay-goose={index}
        >
          <Goose x={0} y={0} facing={1} state="attack" tick={index * 8} palette={brawlGoonPalette} />
        </g>
      ))}
      <g ref={splash} data-brawl-bay display="none" transform={`translate(0 ${BRAWL_WORLD.height})`}>
        {SPLASH_ARCS.map((d) => (
          <path key={d} className={styles.splash} d={d} />
        ))}
      </g>
    </g>
  );
});

BayLift.displayName = "BayLift";
