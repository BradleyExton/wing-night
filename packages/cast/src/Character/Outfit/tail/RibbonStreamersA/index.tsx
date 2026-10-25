import type { OutfitItemProps } from "../../context/index.js";
import { isOnPlume, PLUME_MIDDLE_TIP_SHIFT } from "../../paths/popKit/index.js";
import * as styles from "./styles.js";

// ribbon-streamers a (pop Tail), ported from the harness's pop-kit.js: two
// wide ribbons tied at one knot on the fan's middle tip, splayed 35 degrees
// apart, the front one hanging down over the fan and the back one swinging
// out behind it, each ending in a swallowtail fork (the mark that says
// ribbon). A 6u knot ball with one short bow loop out of it, back and up.
//
// The ribbons are the harness's `ribbonBand(hang(…))` written out, tied at
// the stock fan's middle tip (2, 20), or the plume's lower tip for a bird
// whose tail is the plume. Inked only round the outside (the
// harness's `silhouettes`). In white it is one group; in ink the back ribbon
// and loop stay white on the room, where ink would vanish, and the ink ribbon
// and ball are a second group over the fan.
const BACK_RIBBON =
  "M 0.04 18.44 L -1.05 19.89 L -1.91 21.62 L -2.42 23.38 L -2.65 25.10 L -2.70 26.76 L -2.62 28.35 L -2.50 29.88 L -2.37 31.32 L -2.30 32.68 L -2.32 33.94 L -2.46 35.10 L -2.75 36.15 L -3.22 37.14 L -4.06 38.24 L 0.62 35.58 L -0.93 40.73 L 0.19 39.36 L 1.08 37.73 L 1.64 36.05 L 1.94 34.37 L 2.05 32.73 L 2.05 31.14 L 2.00 29.61 L 1.95 28.16 L 1.95 26.81 L 2.04 25.56 L 2.24 24.45 L 2.58 23.47 L 3.08 22.59 L 3.96 21.56 Z";

const FRONT_RIBBON =
  "M -0.50 19.85 L -0.56 21.66 L -0.27 23.57 L 0.32 25.30 L 1.11 26.85 L 2.03 28.23 L 3.01 29.49 L 3.98 30.67 L 4.91 31.78 L 5.75 32.86 L 6.46 33.90 L 7.00 34.93 L 7.37 35.95 L 7.55 37.03 L 7.50 38.42 L 9.80 33.55 L 11.49 38.67 L 11.62 36.90 L 11.42 35.05 L 10.91 33.35 L 10.19 31.80 L 9.34 30.39 L 8.43 29.09 L 7.51 27.87 L 6.64 26.72 L 5.86 25.61 L 5.22 24.54 L 4.75 23.51 L 4.47 22.51 L 4.37 21.50 L 4.50 20.15 Z";

const KNOT_LOOP = "M 1 18 C -2 13.5 -6 15 -5 17.8 C -4.4 19.4 -2 20 0.5 20.5 Z";

const KNOT_BALL = "M 5 20 A 3 3 0 1 1 -1 20 A 3 3 0 1 1 5 20 Z";

type Piece = { d: string; fill: string };

const Pieces = ({ pieces }: { pieces: Piece[] }): JSX.Element => (
  <>
    {pieces.map(({ d }) => (
      <path key={`edge-${d}`} className={styles.ribbonEdge} d={d} />
    ))}
    {pieces.map(({ d, fill }) => (
      <path key={`fill-${d}`} className={fill} d={d} />
    ))}
  </>
);

export const RibbonStreamersA = ({ context }: OutfitItemProps): JSX.Element => {
  const style = context.style ?? "white";
  const behind = [
    { d: BACK_RIBBON, fill: styles.whiteFill },
    { d: KNOT_LOOP, fill: styles.whiteFill }
  ];
  const over = [
    { d: FRONT_RIBBON, fill: styles.styleFill[style] },
    { d: KNOT_BALL, fill: styles.styleFill[style] }
  ];

  return (
    <g transform={isOnPlume(context.shapes.tail) ? PLUME_MIDDLE_TIP_SHIFT : undefined}>
      {style === "white" ? (
        <Pieces pieces={[...behind, ...over]} />
      ) : (
        <>
          <Pieces pieces={behind} />
          <Pieces pieces={over} />
        </>
      )}
    </g>
  );
};
