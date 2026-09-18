import type { CharacterAppearance } from "../resolvePlayerAppearance/index.js";
import type { CharacterApparel } from "../resolveTeamApparel/index.js";
import { CharacterFigure } from "./CharacterFigure/index.js";
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
};

export const Character = ({ appearance, apparel, fillClassName }: CharacterProps): JSX.Element => {
  return (
    <svg
      className={`${styles.svg} ${fillClassName ?? styles.defaultFill}`}
      viewBox="0 0 80 72"
    >
      <CharacterFigure appearance={appearance} apparel={apparel} />
    </svg>
  );
};
