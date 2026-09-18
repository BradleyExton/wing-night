import type { CharacterApparel } from "../../resolveTeamApparel/index.js";
import { perchTransform, type HeadAnchors } from "../geometry/index.js";
import * as styles from "./styles.js";

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
// the head, the shades on the eye line, the collar and lapels at the chin.
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
    const { cx, chin } = head;
    return (
      <g data-character-apparel="collar">
        <path
          className={styles.dark}
          d={`M ${cx - 12} ${chin - 2} Q ${cx} ${chin + 8} ${cx + 12} ${chin - 2} L ${cx + 12} ${chin + 3} Q ${cx} ${chin + 13} ${cx - 12} ${chin + 3} Z`}
        />
        <path
          className={styles.light}
          d={`M ${cx - 9} ${chin + 1} L ${cx - 7} ${chin - 5} L ${cx - 5} ${chin + 2} Z M ${cx - 2} ${chin + 3} L ${cx} ${chin - 3} L ${cx + 2} ${chin + 4} Z M ${cx + 5} ${chin + 2} L ${cx + 7} ${chin - 4} L ${cx + 9} ${chin + 1} Z`}
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

  const { cx, chin } = head;
  return (
    <g data-character-apparel="lapels">
      <path
        className={styles.light}
        d={`M ${cx - 2} ${chin} L ${cx - 16} ${chin + 5} L ${cx - 5} ${chin + 15} Z M ${cx + 2} ${chin} L ${cx + 16} ${chin + 5} L ${cx + 5} ${chin + 15} Z`}
      />
    </g>
  );
};
