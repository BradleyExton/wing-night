import { forwardRef, useImperativeHandle, useRef } from "react";
import { CharacterFigure } from "@wingnight/cast";
import { BRAWL_WORLD } from "@wingnight/shared";

import type { HenFigure } from "../../resolveHenFigure/index.js";
import { brawlNight } from "../palette.js";
import { HEN_FIGURE_TRANSFORM, HEN_POSES, resolveHenTransform, type HenPose } from "../henPose/index.js";

export type HenRefs = {
  /** The bird's group: where she stands, which way she faces, how solid she is. Carries the test seam. */
  body: SVGGElement | null;
  shadow: SVGEllipseElement | null;
  poses: Partial<Record<HenPose, SVGGElement | null>>;
};

export type HenPaint = {
  x: number;
  facing: -1 | 1;
  pose: HenPose;
  opacity: number;
  pecking: boolean;
  /** World units up off the ground: the bay's lift. */
  lift?: number;
  /** Degrees about her foot: the bell's slump. */
  tilt?: number;
};

const round1 = (value: number): string => `${Math.round(value * 10) / 10}`;

const setIfChanged = (element: Element | null | undefined, name: string, value: string): void => {
  if (element !== null && element !== undefined && element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
};

/**
 * One frame of the hen. Every pose is mounted once and the paint shows one of them, so a peck
 * swaps a `display` rather than re-rendering the figure — which is what keeps a costume head's
 * halo filter rasterised once (SCHLONIC's rule). The hen writes where she is and what she is
 * doing every frame, so a harness reads the sim's own numbers off her (`data-brawl-x`).
 */
export const paintHen = (refs: HenRefs | null, paint: HenPaint): void => {
  if (refs === null) {
    return;
  }

  const { x, facing, pose, opacity, pecking, lift = 0, tilt = 0 } = paint;

  refs.body?.setAttribute("transform", resolveHenTransform({ x, facing, lift, tilt }));
  setIfChanged(refs.body, "opacity", `${opacity}`);
  setIfChanged(refs.body, "data-brawl-x", round1(x));
  setIfChanged(refs.body, "data-brawl-facing", `${facing}`);
  setIfChanged(refs.body, "data-brawl-pecking", pecking ? "true" : "false");
  setIfChanged(refs.body, "data-brawl-pose", pose);
  refs.shadow?.setAttribute("cx", round1(x));
  setIfChanged(refs.shadow, "opacity", lift > 4 ? "0" : "1");

  for (const candidate of HEN_POSES) {
    setIfChanged(refs.poses[candidate], "display", candidate === pose ? "inline" : "none");
  }
};

/**
 * The player's own cast hen on the street (DESIGN.md §2.8), in every pose a block can show her
 * in, stood on the ground line at the sim's x. Placed every frame through the refs by `paintHen`;
 * nothing here is React-driven per frame.
 */
export const Hen = forwardRef<HenRefs, { figure: HenFigure }>(({ figure }, ref): JSX.Element => {
  const body = useRef<SVGGElement>(null);
  const shadow = useRef<SVGEllipseElement>(null);
  const poses = useRef<Partial<Record<HenPose, SVGGElement | null>>>({});

  useImperativeHandle(ref, () => ({ body: body.current, shadow: shadow.current, poses: poses.current }));

  return (
    <g>
      <ellipse
        ref={shadow}
        cx={BRAWL_WORLD.henStartX}
        cy={BRAWL_WORLD.groundY + 0.4}
        rx={6.5}
        ry={1.3}
        fill={brawlNight.shadow}
      />
      <g
        ref={body}
        className={figure.fillClassName}
        transform={resolveHenTransform({ x: BRAWL_WORLD.henStartX, facing: 1 })}
        data-brawl-hen=""
        data-brawl-x={round1(BRAWL_WORLD.henStartX)}
        data-brawl-facing="1"
        data-brawl-pecking="false"
        data-brawl-pose="idle"
      >
        {HEN_POSES.map((pose) => (
          <g
            key={pose}
            ref={(element): void => {
              poses.current[pose] = element;
            }}
            transform={HEN_FIGURE_TRANSFORM}
            display={pose === "idle" ? "inline" : "none"}
            data-brawl-hen-pose={pose}
          >
            <CharacterFigure
              appearance={figure.appearance}
              apparel={figure.apparel}
              silhouette={figure.silhouette}
              pose={pose}
            />
          </g>
        ))}
      </g>
    </g>
  );
});

Hen.displayName = "Hen";
