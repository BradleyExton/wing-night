import type { OutfitItemProps } from "../../context/index.js";
import { isOnPlume, PLUME_TOP_TIP_SHIFT } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// ribbon-streamers b (pop Tail), ported from the harness's pop-kit.js: the
// gymnast's ribbon. A 10u white baton angled up and back from the top
// feather's tip, and one long ribbon off its end, tied on narrow and
// cascading down the back of the fan in an S to below the lowest tip, ending
// in a swallowtail. The stick is what nothing else in the set has.
//
// The harness reads `tailTips[2]`; the stock fan's top tip is (11, 10), so
// the baton runs (11.4, 11) to (5.4, 3) and the ribbon is the harness's
// `ribbonBand` off that end, written out. On the plume it ties to the upper
// sickle's tip instead.
const RIBBON =
  "M 4.60 2.95 L 4.04 3.81 L 3.57 4.75 L 3.18 5.71 L 3.12 6.59 L 3.31 7.33 L 3.49 7.97 L 3.64 8.52 L 3.74 8.98 L 3.79 9.38 L 3.79 9.73 L 3.75 10.08 L 3.63 10.48 L 3.41 10.97 L 3.04 11.55 L 2.55 12.15 L 2.01 12.70 L 1.40 13.21 L 0.74 13.70 L 0.04 14.18 L -0.70 14.67 L -1.47 15.20 L -2.25 15.79 L -3.03 16.48 L -3.76 17.30 L -4.40 18.28 L -4.88 19.40 L -5.18 20.66 L -5.27 22.00 L -5.16 23.32 L -4.90 24.51 L -4.54 25.55 L -4.13 26.45 L -3.73 27.20 L -3.39 27.82 L -3.15 28.32 L -3.00 28.69 L -2.94 28.95 L -2.93 29.17 L -3.01 29.48 L -3.24 29.97 L -3.71 30.65 L -4.55 31.59 L -0.44 30.19 L -1.45 34.41 L -0.44 33.33 L 0.38 32.19 L 0.97 31.03 L 1.31 29.84 L 1.37 28.67 L 1.20 27.60 L 0.90 26.68 L 0.54 25.88 L 0.19 25.18 L -0.12 24.54 L -0.38 23.93 L -0.57 23.33 L -0.69 22.71 L -0.73 22.00 L -0.67 21.35 L -0.54 20.87 L -0.36 20.50 L -0.12 20.16 L 0.22 19.81 L 0.66 19.45 L 1.22 19.05 L 1.89 18.62 L 2.64 18.15 L 3.46 17.62 L 4.33 17.01 L 5.22 16.29 L 6.10 15.45 L 6.96 14.45 L 7.66 13.38 L 8.19 12.32 L 8.54 11.25 L 8.73 10.21 L 8.77 9.22 L 8.70 8.30 L 8.56 7.48 L 8.40 6.74 L 8.24 6.08 L 8.10 5.47 L 7.75 4.96 L 7.18 4.45 L 6.65 3.85 L 6.20 3.05 Z";

const BATON = "M 11.4 11 L 5.4 3";

export const RibbonStreamersB = ({ context }: OutfitItemProps): JSX.Element => {
  const fill = styles.styleFill[context.style ?? "white"];

  return (
    <g transform={isOnPlume(context.shapes.tail) ? PLUME_TOP_TIP_SHIFT : undefined}>
      <path className={`${fill} ${styles.ribbonEdge}`} d={RIBBON} />
      <path className={fill} d={RIBBON} />
      <path className={styles.batonEdge} d={BATON} />
      <path className={styles.baton} d={BATON} />
    </g>
  );
};
