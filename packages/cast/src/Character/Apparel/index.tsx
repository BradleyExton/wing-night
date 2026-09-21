import type { CharacterApparel } from "../../resolveTeamApparel/index.js";
import { perchTransform, type HeadAnchors } from "../geometry/index.js";
import * as styles from "./styles.js";

// Which props are ON the head and which hang below it. A costume head wears
// only the second kind — a player's own face is not a place to put a hat
// (`CharacterFigure`).
const APPAREL_CROSSES_THE_FACE: Record<CharacterApparel, boolean> = {
  hat: true,
  shades: true,
  medallion: false
};

export const apparelCrossesTheFace = (apparel: CharacterApparel): boolean =>
  APPAREL_CROSSES_THE_FACE[apparel];

type ApparelProps = {
  apparel: CharacterApparel;
  head: HeadAnchors;
};

// A five-point star, `r` tall, centred on (cx, cy).
const starPath = (cx: number, cy: number, r: number): string => {
  const points: string[] = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `M ${points.join(" L ")} Z`;
};

// One prop per genre, placed off the head's anchors so it lands the same on a
// drawn head and on a costume head: the hat's base sits 4 under the top of
// the head, the shades on the eye line and the medallion on the
// shoulders — which are the chin itself on a drawn head and a little under
// it on a photographed one, so nothing ever climbs into a beard.
export const Apparel = ({ apparel, head }: ApparelProps): JSX.Element => {
  if (apparel === "hat") {
    return (
      <g data-character-apparel="hat">
        <path
          className={styles.light}
          transform={perchTransform(head.cx, head.top + 4)}
          d="M 38 12 Q 56 18 74 12 Q 70 9 66 9 L 64 1 Q 56 -2 48 1 L 46 9 Q 42 9 38 12 Z"
        />
        <rect className={styles.band} x={head.cx - 9} y={head.top - 2} width={18} height={3} />
      </g>
    );
  }

  if (apparel === "shades") {
    return (
      <g data-character-apparel="shades">
        <path className={styles.light} d={starPath(head.cx - 5, head.eyeY, 5.5)} />
        <path className={styles.light} d={starPath(head.cx + 5, head.eyeY, 5.5)} />
      </g>
    );
  }

  // The medallion: a chain and a disc, and deliberately NOTHING else. It
  // replaced a pair of white lapel wedges that were the worst-reading prop in
  // the set — with no jacket behind them they floated, and at ±16 they were
  // wider than the chest they hung on, so on a costume head (shoulders five
  // lower, where the body has already started to taper) the outer one hung off
  // the bird's edge into the background. A disc on a chain is the same joke,
  // sits inside the silhouette at every anchor, and degrades to one bright
  // dot on the chest rather than to two stray triangles.
  const { cx, shoulders } = head;
  return (
    <g data-character-apparel="medallion">
      <path
        className={styles.chain}
        d={`M ${cx - 9} ${shoulders - 1} Q ${cx} ${shoulders + 12} ${cx + 9} ${shoulders - 1}`}
      />
      <circle className={styles.light} cx={cx} cy={shoulders + 9} r={4.6} />
    </g>
  );
};
