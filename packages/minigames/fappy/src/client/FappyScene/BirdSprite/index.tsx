import { forwardRef } from "react";
import { CHARACTER_WING_ORIGIN_CLASS_NAME, Character, CharacterWing, type CharacterPose } from "@wingnight/cast";

import type { LegBird } from "../../resolveLegBird/index.js";
import * as styles from "./styles.js";

export type BirdSpriteRefs = {
  box: HTMLDivElement | null;
  wing: HTMLDivElement | null;
};

// A cast hen in an HTML box the scene moves with a transform, drawn without
// its wing, and the wing on a box of its own over it. The loop turns the
// wing box about the shoulder to beat it; the hen underneath never repaints,
// so a costume head's halo filter is rasterised once and composited. `pose`
// is the cast's: the flyer tucks its legs (`fly`), the waiter stands (`idle`).
export const BirdSprite = forwardRef<
  BirdSpriteRefs,
  {
    bird: LegBird;
    className: string;
    dataAttribute: "data-fappy-bird" | "data-fappy-waiting-bird";
    pose: CharacterPose;
  }
>(({ bird, className, dataAttribute, pose }, ref): JSX.Element => {
  const refs: BirdSpriteRefs = { box: null, wing: null };
  const assign = (): void => {
    if (typeof ref === "function") {
      ref(refs);
    } else if (ref !== null) {
      ref.current = refs;
    }
  };
  const attributes = { [dataAttribute]: true };

  return (
    <div
      ref={(element): void => {
        refs.box = element;
        assign();
      }}
      className={className}
      {...attributes}
    >
      <Character
        appearance={bird.appearance}
        apparel={bird.apparel}
        silhouette={bird.silhouette}
        fillClassName={bird.fillClassName}
        wing="none"
        pose={pose}
      />
      <div
        ref={(element): void => {
          refs.wing = element;
          assign();
        }}
        className={`${styles.wingBox} ${CHARACTER_WING_ORIGIN_CLASS_NAME}`}
      >
        <CharacterWing fillClassName={bird.fillClassName} />
      </div>
    </div>
  );
});

BirdSprite.displayName = "BirdSprite";
