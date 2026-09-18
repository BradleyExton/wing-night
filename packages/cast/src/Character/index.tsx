import type { CharacterAppearance } from "../resolvePlayerAppearance/index.js";
import type { CharacterApparel } from "../resolveTeamApparel/index.js";
import { CHARACTER_WING_PATH, CharacterFigure } from "./CharacterFigure/index.js";
import * as styles from "./styles.js";

// A hen, drawn facing RIGHT in an 80×72 box; surfaces that need it to face
// left flip it with scaleX(-1). Tail, legs, body, neck, wing, head, eyes,
// beak, wattle and comb — one colour plus `primary`, 2-unit stroke — so it
// still reads as a bird when it is 3% of a TV's height. Fill comes from the
// parent as a `text-*` class; apparel comes from the team's genre.
export type CharacterProps = {
  appearance: CharacterAppearance;
  apparel?: CharacterApparel;
  fillClassName?: string;
  wing?: "drawn" | "none";
};

export const Character = ({ appearance, apparel, fillClassName, wing }: CharacterProps): JSX.Element => {
  return (
    <svg
      className={`${styles.svg} ${fillClassName ?? styles.defaultFill}`}
      viewBox="0 0 80 72"
    >
      <CharacterFigure appearance={appearance} apparel={apparel} wing={wing} />
    </svg>
  );
};

// The wing alone, in the same box as the bird, for a surface that draws the
// bird with `wing="none"` and beats this one over it: rotate the element
// holding it about `CHARACTER_WING_ROOT` (in the box's own percentages,
// see `wingOrigin`) and the hen flaps without the rest of it repainting.
export const CharacterWing = ({ fillClassName }: Pick<CharacterProps, "fillClassName">): JSX.Element => {
  return (
    <svg
      className={`${styles.svg} ${styles.wingOrigin} ${fillClassName ?? styles.defaultFill}`}
      viewBox="0 0 80 72"
      data-character-wing
    >
      <path className={styles.silhouette} d={CHARACTER_WING_PATH} />
    </svg>
  );
};
