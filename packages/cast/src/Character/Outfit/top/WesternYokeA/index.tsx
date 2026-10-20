import type { OutfitItemProps } from "../../context/index.js";
import { frontEdge } from "../../paths/countryKit/index.js";
import * as styles from "./styles.js";

// western-yoke a (country Top), ported from the harness's country-kit.js:
// the piped yoke. A band across the shoulders with a level lower edge at
// y 44 and one shallow dip to (57,48.5) across a wide base, so it is a shirt
// yoke and not a bandana point; the western cue is the piping inset along
// that edge and down into the dip.
//
// The band starts at y 36 at the highest (the drawn neck's lower edge hides
// anything above it) and runs down the body's front edge, so it is built here.
// The piping never moves: it is the harness's sums written out.
const PIPING = "M 65.44 41.5 L 63 41.5 L 57 45.4 L 51.6 41.5";

export const WesternYokeA = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "ink";
  const y0 = Math.max(context.head.shoulders, 36);
  const band = `M 50.2 ${y0} ${frontEdge(y0, 44)} L 63.6 44 L 57 48.5 L 50.2 44 Z`;

  return (
    <g>
      <path className={`${styles.styleFill[style]} ${styles.inkEdge}`} d={band} />
      <path className={style === "ink" ? styles.piping.ink : styles.piping.white} d={PIPING} />
    </g>
  );
};
