import type { CharacterAppearance } from "../resolvePlayerAppearance/index.js";
import type { CharacterApparel } from "../resolveTeamApparel/index.js";
import type { CharacterSilhouette } from "../resolveTeamSilhouette/index.js";
import type { CharacterDance } from "../resolvePlayerAppearance/index.js";
import type { CharacterPose } from "./geometry/index.js";
import {
  CharacterFigure,
  CharacterStageFigure,
  CharacterWingFigure,
  type CharacterFigureProps
} from "./CharacterFigure/index.js";
import { isOutfitSlotDrawn } from "./Outfit/index.js";
import * as styles from "./styles.js";

// A hen, drawn facing RIGHT in an 80×72 box; surfaces that need it to face
// left flip it with scaleX(-1). Tail, legs, body, neck, wing, head, eyes,
// beak, wattle and comb — one colour plus `primary`, 2-unit stroke — so it
// still reads as a bird when it is 3% of a TV's height. Fill comes from the
// parent as a `text-*` class; apparel comes from the team's genre; `pose`
// names what the rigged parts are doing (`still` unless asked).
export type CharacterProps = {
  appearance: CharacterAppearance;
  apparel?: CharacterApparel;
  fillClassName?: string;
  wing?: "drawn" | "none";
  // One slice of the bird, for a surface that beats `CharacterWing` between
  // an `underWing` box and an `overWing` box (`CharacterFigure`'s `layer`).
  layer?: CharacterFigureProps["layer"];
  pose?: CharacterPose;
  silhouette?: CharacterSilhouette;
  dance?: CharacterDance;
  // Draw the outfit's Prop and Stage too: only where the bird is on show
  // (`CharacterFigure`'s `showpieces`), and the Stage left to a surface's own
  // ground with `stage="none"` (`CharacterStage`).
  showpieces?: boolean;
  stage?: "drawn" | "none";
  // A Move to play once, in place of the pose (`CharacterFigure`'s `move`).
  move?: CharacterFigureProps["move"];
};

export const Character = ({
  appearance,
  apparel,
  fillClassName,
  wing,
  layer,
  pose,
  silhouette,
  dance,
  showpieces,
  stage,
  move
}: CharacterProps): JSX.Element => {
  return (
    <svg
      className={`${styles.svg} ${fillClassName ?? styles.defaultFill}`}
      viewBox="0 0 80 72"
    >
      <CharacterFigure
        appearance={appearance}
        apparel={apparel}
        wing={wing}
        layer={layer}
        pose={pose}
        silhouette={silhouette}
        dance={dance}
        showpieces={showpieces}
        stage={stage}
        move={move}
      />
    </svg>
  );
};

// The outfit's Stage alone, in an `<svg>` the same box as the bird's, for a
// surface that hops the bird off its ground (`stage="none"` on the bird): lay
// the two boxes over each other and the stage stays on the floor. Nothing at
// all when the bird has no Stage on.
// Pass the bird's own `fillClassName` and `silhouette`: a team-coloured stage
// is the wearer's colour, and a stage may follow the body it stands under.
export const CharacterStage = ({
  appearance,
  fillClassName,
  silhouette
}: Pick<CharacterProps, "appearance" | "fillClassName" | "silhouette">): JSX.Element | null => {
  if (!isOutfitSlotDrawn(appearance.outfit, "stage")) {
    return null;
  }

  return (
    <svg className={`${styles.svg} ${fillClassName ?? styles.defaultFill}`} viewBox="0 0 80 72" data-character-stage>
      <CharacterStageFigure appearance={appearance} silhouette={silhouette} />
    </svg>
  );
};

// The class that puts an element's transform origin on the wing's shoulder,
// in the bird box's own percentages, for a surface that beats the wing on a
// box of its own the size of the bird.
export const CHARACTER_WING_ORIGIN_CLASS_NAME = styles.wingOrigin;

// The wing alone, in the same box as the bird, for a surface that draws the
// bird in two slices (`layer="underWing"` under it, `layer="overWing"` over
// it, so the Top and head still cover it) and beats this one between them:
// rotate the element holding it about the shoulder
// (`CHARACTER_WING_ORIGIN_CLASS_NAME` on a box the bird's size does it) and the
// hen flaps without the rest of it repainting.
// Pass the bird's `silhouette` too, or a spiky bird flaps the stock wing, and
// its `appearance`, or a dressed bird flaps a bare one (the Sleeve is on it).
export const CharacterWing = ({
  appearance,
  fillClassName,
  silhouette
}: Pick<CharacterProps, "fillClassName" | "silhouette"> & {
  appearance?: CharacterAppearance;
}): JSX.Element => {
  return (
    <svg
      className={`${styles.svg} ${styles.wingOrigin} ${fillClassName ?? styles.defaultFill}`}
      viewBox="0 0 80 72"
      data-character-wing
    >
      <CharacterWingFigure appearance={appearance} silhouette={silhouette} />
    </svg>
  );
};
