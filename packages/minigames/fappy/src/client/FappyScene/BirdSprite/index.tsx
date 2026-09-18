import { forwardRef } from "react";
import { Character, CharacterWing } from "@wingnight/cast";

import type { LegBird } from "../../resolveLegBird/index.js";
import * as styles from "./styles.js";

export type BirdSpriteRefs = {
  box: HTMLDivElement | null;
  wing: HTMLDivElement | null;
};

// A cast hen in an HTML box the scene moves with a transform, drawn without
// its wing, and the wing on a box of its own over it. The loop turns the
// wing box about the shoulder to beat it; the hen underneath never repaints,
// so a costume head's halo filter is rasterised once and composited.
export const BirdSprite = forwardRef<
  BirdSpriteRefs,
  { bird: LegBird; className: string; dataAttribute: "data-fappy-bird" | "data-fappy-waiting-bird" }
>(({ bird, className, dataAttribute }, ref): JSX.Element => {
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
        fillClassName={bird.fillClassName}
        wing="none"
      />
      <div
        ref={(element): void => {
          refs.wing = element;
          assign();
        }}
        className={styles.wingBox}
      >
        <CharacterWing fillClassName={bird.fillClassName} />
      </div>
    </div>
  );
});

BirdSprite.displayName = "BirdSprite";
