import { memo, useCallback, useRef } from "react";
import { CharacterFigure } from "@wingnight/cast";
import { BRAWL_CREW_WORLD } from "@wingnight/shared";

import type { HenFigure } from "../../resolveHenFigure/index.js";
import { HEN_FIGURE_TRANSFORM, HEN_POSES, resolveHenBodyTransform, type HenPose } from "../henPose/index.js";
import { brawlNight } from "../palette.js";
import * as styles from "./styles.js";

/** Everything of one hen the paint loop writes to: where she stands, and each thing drawn there. */
export type HenRefs = {
  /** Her group, with its origin at her foot on the street. Carries the test seams. */
  root: SVGGElement | null;
  /** The bird: turned, lifted, tilted and faded here. */
  body: SVGGElement | null;
  shadow: SVGEllipseElement | null;
  ring: SVGEllipseElement | null;
  revive: SVGCircleElement | null;
  tag: SVGTextElement | null;
  poses: Partial<Record<HenPose, SVGGElement | null>>;
};

export type HenPaint = {
  x: number;
  /** Screen y of her foot: the band's back plus her depth. */
  groundY: number;
  z: number;
  facing: -1 | 1;
  pose: HenPose;
  opacity: number;
  state: "up" | "down" | "away";
  /** Nought to one: how far round her the revive ring has closed. */
  revive: number;
  /** Where her name is drawn, along the street: over her, but kept inside the window. */
  tagX: number;
  tag: string;
  /** World units up off the street, and degrees about her foot: the endings' moves. */
  lift?: number;
  tilt?: number;
};

const round2 = (value: number): string => `${Math.round(value * 100) / 100}`;

const setIfChanged = (element: Element | null | undefined, name: string, value: string): void => {
  if (element !== null && element !== undefined && element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
};

/** The revive ring's radius and where its centre sits over a downed hen. */
const REVIVE_RADIUS = 10;
const REVIVE_LIFT = 6;
const REVIVE_LENGTH = 2 * Math.PI * REVIVE_RADIUS;
/** How far over her head her name sits. */
const TAG_LIFT = BRAWL_CREW_WORLD.henHeight + 9;

/**
 * One frame of one hen, written straight onto the DOM. Every pose is mounted once and the paint
 * shows one of them; where she stands, which way she faces and how solid she is are attributes
 * on groups React never touches again. She also writes the sim's own numbers onto her group
 * (`data-brawl-x`, `data-brawl-z`, her state and pose), so a harness reads the fight off her.
 */
export const paintHen = (refs: HenRefs | null | undefined, paint: HenPaint): void => {
  if (refs === null || refs === undefined) {
    return;
  }

  const { x, groundY, z, facing, pose, opacity, state, revive, tagX, tag, lift = 0, tilt = 0 } = paint;

  refs.root?.setAttribute("transform", `translate(${round2(x)} ${round2(groundY)})`);
  setIfChanged(refs.root, "data-brawl-x", round2(x));
  setIfChanged(refs.root, "data-brawl-z", round2(z));
  setIfChanged(refs.root, "data-brawl-hen-state", state);
  setIfChanged(refs.root, "data-brawl-pose", pose);
  setIfChanged(refs.body, "transform", resolveHenBodyTransform({ facing, lift, tilt }));
  setIfChanged(refs.body, "opacity", `${opacity}`);
  // Off the street she casts no shadow and stands in no ring: the geese have her.
  setIfChanged(refs.shadow, "opacity", lift > 4 ? "0" : "0.45");
  setIfChanged(refs.ring, "opacity", lift > 4 ? "0" : state === "away" ? "0.4" : "1");
  setIfChanged(refs.revive, "display", revive > 0 ? "inline" : "none");

  if (revive > 0) {
    setIfChanged(refs.revive, "stroke-dasharray", `${round2(revive * REVIVE_LENGTH)} ${round2(REVIVE_LENGTH)}`);
  }

  setIfChanged(refs.tag, "x", round2(tagX - x));
  setIfChanged(refs.tag, "opacity", lift > 4 ? "0" : "1");

  if (refs.tag !== null && refs.tag.textContent !== tag) {
    refs.tag.textContent = tag;
  }

  for (const candidate of HEN_POSES) {
    setIfChanged(refs.poses[candidate], "display", candidate === pose ? "inline" : "none");
  }
};

type HenSlotProps = {
  slot: number;
  figure: HenFigure;
  /** Her slot's colour: the ring she stands in and her name's ink, the same as her player's pad. */
  colour: string;
  register: (slot: number, refs: HenRefs | null) => void;
};

/**
 * One player's own cast hen on the street (DESIGN.md §2.8): her costume head, her team's colour,
 * her genre's shape, in every pose a block can show her in — stood in a ring of her slot's colour
 * on a shadow at her own foot, with her name over her head and the revive ring that closes round
 * her when she is down. Mounted once a block and placed every frame through its refs by
 * `paintHen`; nothing here is React-driven per frame, and a re-render changes nothing.
 */
export const HenSlot = memo(({ slot, figure, colour, register }: HenSlotProps): JSX.Element => {
  const refs = useRef<HenRefs>({ root: null, body: null, shadow: null, ring: null, revive: null, tag: null, poses: {} });
  const attach = useCallback(
    (element: SVGGElement | null): void => {
      refs.current.root = element;
      register(slot, element === null ? null : refs.current);
    },
    [register, slot]
  );

  return (
    <g ref={attach} data-brawl-hen={slot} data-brawl-hen-state="up" data-brawl-x="0" data-brawl-z="0" data-brawl-pose="idle">
      <ellipse
        ref={(element): void => {
          refs.current.shadow = element;
        }}
        cx={0}
        cy={0.4}
        rx={6.5}
        ry={1.5}
        fill={brawlNight.shadow}
        opacity={0.45}
      />
      <ellipse
        ref={(element): void => {
          refs.current.ring = element;
        }}
        cx={0}
        cy={0.4}
        rx={7.8}
        ry={2.1}
        fill="none"
        stroke={colour}
        strokeWidth={0.8}
      />
      <g
        ref={(element): void => {
          refs.current.body = element;
        }}
        className={figure.fillClassName}
        transform={resolveHenBodyTransform({ facing: 1 })}
      >
        {HEN_POSES.map((pose) => (
          <g
            key={pose}
            ref={(element): void => {
              refs.current.poses[pose] = element;
            }}
            transform={HEN_FIGURE_TRANSFORM}
            display={pose === "idle" ? "inline" : "none"}
            data-brawl-hen-pose={pose}
          >
            <CharacterFigure appearance={figure.appearance} apparel={figure.apparel} silhouette={figure.silhouette} pose={pose} />
          </g>
        ))}
      </g>
      <circle
        ref={(element): void => {
          refs.current.revive = element;
        }}
        cx={0}
        cy={-REVIVE_LIFT}
        r={REVIVE_RADIUS}
        fill="none"
        stroke={brawlNight.chalk}
        strokeWidth={1.4}
        strokeLinecap="round"
        transform={`rotate(-90 0 ${-REVIVE_LIFT})`}
        display="none"
        data-brawl-revive=""
      />
      <text
        ref={(element): void => {
          refs.current.tag = element;
        }}
        className={styles.tag}
        x={0}
        y={-TAG_LIFT}
        textAnchor="middle"
        fill={colour}
        data-brawl-hen-tag=""
      />
    </g>
  );
});

HenSlot.displayName = "HenSlot";
