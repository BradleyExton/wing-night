import type { CharacterApparel } from "../../resolveTeamApparel/index.js";
import { perchTransform, type HeadAnchors } from "../geometry/index.js";
import * as styles from "./styles.js";

// Which props are ON the head and which hang below it. A costume head wears
// only the second kind — a player's own face is not a place to put a hat
// (`CharacterFigure`).
const APPAREL_CROSSES_THE_FACE: Record<CharacterApparel, boolean> = {
  hat: true,
  shades: true,
  collar: false,
  lapels: false
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
// the head, the shades on the eye line, the collar and lapels on the
// shoulders — which are the chin itself on a drawn head and a little under
// it on a photographed one, so no spike ever climbs into a beard.
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

  if (apparel === "collar") {
    const { cx, shoulders } = head;
    return (
      <g data-character-apparel="collar">
        <path
          className={styles.dark}
          d={`M ${cx - 12} ${shoulders - 2} Q ${cx} ${shoulders + 8} ${cx + 12} ${shoulders - 2} L ${cx + 12} ${shoulders + 3} Q ${cx} ${shoulders + 13} ${cx - 12} ${shoulders + 3} Z`}
        />
        <path
          className={styles.light}
          d={`M ${cx - 9} ${shoulders + 1} L ${cx - 7} ${shoulders - 5} L ${cx - 5} ${shoulders + 2} Z M ${cx - 2} ${shoulders + 3} L ${cx} ${shoulders - 3} L ${cx + 2} ${shoulders + 4} Z M ${cx + 5} ${shoulders + 2} L ${cx + 7} ${shoulders - 4} L ${cx + 9} ${shoulders + 1} Z`}
        />
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

  const { cx, shoulders } = head;
  return (
    <g data-character-apparel="lapels">
      <path
        className={styles.light}
        d={`M ${cx - 2} ${shoulders} L ${cx - 16} ${shoulders + 5} L ${cx - 5} ${shoulders + 15} Z M ${cx + 2} ${shoulders} L ${cx + 16} ${shoulders + 5} L ${cx + 5} ${shoulders + 15} Z`}
      />
    </g>
  );
};
