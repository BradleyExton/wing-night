import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import {
  CharacterRagdollFigure,
  resolveCharacterRagdollRest,
  type CharacterRagdollPart,
  type CharacterRagdollTransforms
} from "@wingnight/cast";

import type { HenFigure } from "../../resolveHenFigure/index.js";
import { formatRagdollTransform } from "../ragdollTransforms/index.js";

export type ClimberHandle = {
  /** Places every part, and how solid the bird is (a blink through a fall's recovery). */
  paint: (transforms: CharacterRagdollTransforms, opacity: number) => void;
  hide: () => void;
};

// Drawn at rest once, then placed every frame through the parts' own transforms. A module
// constant, so a re-render never hands the figure new transforms and React never writes over the
// ones the paint loop set.
const REST = resolveCharacterRagdollRest();

// The figure draws the tail on the body's transform under a layer name of its own.
const PART_OF_LAYER: Record<string, CharacterRagdollPart> = {
  wingFar: "wingFar",
  tail: "body",
  legFar: "legFar",
  body: "body",
  legNear: "legNear",
  wingNear: "wingNear",
  head: "head"
};

/**
 * The live climber: the player's own cast hen as a ragdoll (`CharacterRagdollFigure`), placed by
 * the paint loop sixty times a second without a React render — the costume head's halo stays
 * rasterised once and only the parts' transforms move (SCHLONIC's rule, BRAWL's `paintHen`).
 */
export const Climber = forwardRef<ClimberHandle, { figure: HenFigure }>(({ figure }, ref): JSX.Element => {
  const rootRef = useRef<SVGGElement>(null);
  const partsRef = useRef<{ element: Element; part: CharacterRagdollPart }[]>([]);

  // The parts' elements, found again whenever the figure changes what is drawn.
  useLayoutEffect(() => {
    const root = rootRef.current;

    partsRef.current =
      root === null
        ? []
        : Array.from(root.querySelectorAll("[data-character-ragdoll-part]")).flatMap((element) => {
            const part = PART_OF_LAYER[element.getAttribute("data-character-ragdoll-part") ?? ""];

            return part === undefined ? [] : [{ element, part }];
          });
  }, [figure]);

  useImperativeHandle(ref, () => ({
    paint: (transforms, opacity): void => {
      const root = rootRef.current;

      if (root === null) {
        return;
      }

      root.setAttribute("display", "inline");
      root.setAttribute("opacity", `${opacity}`);

      for (const { element, part } of partsRef.current) {
        element.setAttribute("transform", formatRagdollTransform(transforms[part]));
      }
    },
    hide: (): void => {
      rootRef.current?.setAttribute("display", "none");
    }
  }));

  return (
    <g ref={rootRef} className={figure.fillClassName} display="none" data-mount-climber>
      <CharacterRagdollFigure
        appearance={figure.appearance}
        apparel={figure.apparel}
        silhouette={figure.silhouette}
        transforms={REST}
      />
    </g>
  );
});

Climber.displayName = "Climber";
