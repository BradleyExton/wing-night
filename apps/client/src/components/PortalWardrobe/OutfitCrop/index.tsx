import { CharacterFigure, type CharacterAppearance, type CharacterMovePlay } from "@wingnight/cast";
import type { TeamTheme } from "@wingnight/shared";

import * as styles from "./styles";

type OutfitCropProps = {
  // The guest's own bird, head and all, wearing the outfit the tile would put on.
  appearance: CharacterAppearance;
  theme: TeamTheme;
  // A window on the bird's 80×72 box (OUTFIT_SLOT_CROPS): the slot's own region, zoomed.
  viewBox: string;
  // Whether to draw the Prop and the Stage: a showpiece slot's tiles do; a kit slot's tiles show
  // the bird as a game would, so a Prop held across the chest never hides the Top being tried.
  showpieces: boolean;
  move?: CharacterMovePlay;
};

// A tile's picture: not a drawing of the item but your own bird wearing it, cropped to where the
// item sits, because at a tile's size a whole bird shows nothing (research §2.5).
export const OutfitCrop = ({ appearance, theme, viewBox, showpieces, move }: OutfitCropProps): JSX.Element => {
  return (
    <svg
      className={`${styles.crop} ${theme.colorVariant.characterFillClassName}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <CharacterFigure
        appearance={appearance}
        apparel={theme.apparel}
        silhouette={theme.silhouette}
        dance={theme.dance}
        showpieces={showpieces}
        move={move}
      />
    </svg>
  );
};
