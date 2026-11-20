import { forwardRef, useImperativeHandle, useRef } from "react";
import { BRAWL_CREW_WORLD } from "@wingnight/shared";

import { resolveGroundY } from "../Backdrop/layout/index.js";
import { resolveGoonBodyTransform } from "../drawTick/index.js";
import { Goose, brawlGoonPalette } from "../Goons/index.js";
import type { BayBeat } from "../beatTimeline/index.js";
import * as styles from "./styles.js";

/** One hen's share of the bay beat's cast, by her slot: her two geese, and her splash. */
export type BayLiftRefs = {
  geese: (SVGGElement | null)[][];
  splashes: (SVGGElement | null)[];
};

const GEESE = [0, 1] as const;
/** The splash's arcs about its centre, in its own units: thrown up and out either side. */
const SPLASH_ARCS = [
  "M -2 0 Q -6 -9 -12 -4",
  "M 2 0 Q 6 -9 12 -4",
  "M -1 0 Q -2 -13 -5 -12",
  "M 1 0 Q 2 -13 5 -12",
  "M -16 0 Q -11 -4 -8 0",
  "M 16 0 Q 11 -4 8 0"
];

const setDisplay = (element: Element | null | undefined, shown: boolean): void => {
  const value = shown ? "inline" : "none";

  if (element !== null && element !== undefined && element.getAttribute("display") !== value) {
    element.setAttribute("display", value);
  }
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Puts one hen's geese and her splash where the bay beat has them, or takes them away with a
 * null beat. `x` and `z` are where she lies; the splash lands at the bottom of the window under
 * her, where Kempenfelt Bay is as far as the room is concerned.
 */
export const paintBayLift = (refs: BayLiftRefs | null, slot: number, at: { x: number; z: number }, beat: BayBeat | null): void => {
  if (refs === null) {
    return;
  }

  GEESE.forEach((index) => {
    const element = refs.geese[slot]?.[index] ?? null;
    const hold = beat?.geese[index];

    setDisplay(element, hold !== undefined);

    if (element !== null && hold !== undefined) {
      // The goose drawing stands itself on the band's back line: move it to her line and her x,
      // then lift and turn it as a goon's body is.
      element.setAttribute("transform", `translate(${round2(at.x + hold.x)} ${round2(at.z)}) ${resolveGoonBodyTransform(hold)}`);
    }
  });

  const splash = refs.splashes[slot] ?? null;
  const share = beat?.splash ?? null;

  setDisplay(splash, share !== null);

  if (splash !== null && share !== null) {
    splash.setAttribute("transform", `translate(${round2(at.x)} ${BRAWL_CREW_WORLD.height}) scale(${round2(0.5 + share * 1.1)})`);
    // Thrown up at full strength, then gone by the end of the beat: nothing is left hanging over the street.
    splash.setAttribute("opacity", `${round2(Math.min(1, 2 - 2 * share))}`);
  }
};

/**
 * The bay beat's cast, for a crew of `crew`: two geese a hen that swoop in and carry her off the
 * top of the frame, and the splash Kempenfelt Bay throws up at the bottom of it when she lands
 * (`data-brawl-bay`). The geese are the street's own goose drawing, mid-lunge, so the room knows
 * exactly who did it. Mounted only while the beat plays: a fight pays nothing for it.
 */
export const BayLift = forwardRef<BayLiftRefs, { crew: number }>(({ crew }, ref): JSX.Element => {
  const geese = useRef<(SVGGElement | null)[][]>([]);
  const splashes = useRef<(SVGGElement | null)[]>([]);

  useImperativeHandle(ref, () => ({ geese: geese.current, splashes: splashes.current }));

  return (
    <g data-brawl-bay-lift aria-hidden="true">
      {Array.from({ length: crew }, (_unused, slot) => (
        <g key={slot}>
          {GEESE.map((index) => (
            <g
              key={index}
              ref={(element): void => {
                (geese.current[slot] ??= [])[index] = element;
              }}
              display="none"
              data-brawl-bay-goose={`${slot}:${index}`}
            >
              <Goose x={0} y={0} facing={1} state="attack" tick={(slot * 2 + index) * 8} palette={brawlGoonPalette} />
            </g>
          ))}
          <g
            ref={(element): void => {
              splashes.current[slot] = element;
            }}
            data-brawl-bay={slot}
            display="none"
            transform={`translate(0 ${resolveGroundY(BRAWL_CREW_WORLD.depth)})`}
          >
            {SPLASH_ARCS.map((d) => (
              <path key={d} className={styles.splash} d={d} />
            ))}
          </g>
        </g>
      ))}
    </g>
  );
});

BayLift.displayName = "BayLift";
