import type { TeamTheme } from "@wingnight/shared";

import { EmblemDrawing } from "./EmblemDrawing";
import * as styles from "./styles";

type TeamEmblemProps = {
  theme: TeamTheme;
  /** The caller's size: a watermark, a crest or a glyph is the same drawing at a different height. */
  sizeClassName: string;
};

// One inline SVG per emblem id, in the cast's flat style: the team colour
// arrives as currentColor off the colour variant's `text-*` class, the rest is
// `text`, `bg` and `primary` with a 2-unit `bg` stroke so it sits on the flame
// the way the hens do. Decoration only — `aria-hidden`, the name carries the
// meaning. A genre without an emblem (and `none`) renders nothing.
export const TeamEmblem = ({ theme, sizeClassName }: TeamEmblemProps): JSX.Element | null => {
  if (theme.emblem === null) {
    return null;
  }

  return (
    <svg
      className={`${styles.svg} ${theme.colorVariant.characterFillClassName} ${sizeClassName}`}
      viewBox="0 0 64 64"
      aria-hidden
      data-team-emblem={theme.emblem}
    >
      <EmblemDrawing emblem={theme.emblem} />
    </svg>
  );
};
