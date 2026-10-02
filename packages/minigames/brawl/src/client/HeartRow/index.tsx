import type { RefObject } from "react";

import { heartRowCopy } from "./copy.js";
import * as styles from "./styles.js";

type HeartRowProps = {
  /** How many glyphs: the hearts the block starts with — three, or four when one was bought. */
  max: number;
  /** Where the paint loop writes the hearts left (`paintHearts`), sixty times a second. */
  rowRef: RefObject<HTMLSpanElement>;
  /** The tablet's counter chip or the TV's marquee. */
  tone: "chrome" | "marquee";
};

/**
 * The hearts row both chromes carry: one glyph per heart the block starts with, all lit, for the
 * paint loop to dim as she is hit. React draws the glyphs and nothing else — the count left is the
 * loop's to write, so a hit never costs a render.
 */
export const HeartRow = ({ max, rowRef, tone }: HeartRowProps): JSX.Element => (
  <span ref={rowRef} className={tone === "marquee" ? styles.marqueeRow : styles.chromeRow} data-brawl-hearts={max}>
    {Array.from({ length: max }, (_unused, slot) => (
      <span key={slot} className={styles.heart} data-lit="true">
        {heartRowCopy.heart}
      </span>
    ))}
  </span>
);
