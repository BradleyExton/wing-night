import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";

import { schlonicPalette } from "../palette.js";

export type GullHandle = {
  /** Where it is, which way its nose points, and where its wings are in the beat (-1 → 1). */
  place: (placement: { visible: boolean; x: number; y: number; angle: number; flap: number }) => void;
};

const OUTLINE = 0.3;

/** Drawn at about the hen's own size, so the couch sees the theft before it reads the card. */
export const GULL_SCALE = 1.7;
/** Where the haul hangs under the body, in world units: the feet, at the gull's scale. */
const HAUL_Y = 3.6;
export const GULL_HAUL_DROP = HAUL_Y * GULL_SCALE;

// The near wing hinges at the shoulder; the beat flips it through the body line.
const SHOULDER = { x: 0.4, y: -0.7 };
const WING_PATH = "M 0 0 Q -1.2 -3.6 -5.6 -5.1 Q -3.6 -2.3 -2.4 0.5 Z";
const WING_TIP_PATH = "M -3.9 -4.3 Q -4.9 -4.9 -5.6 -5.1 Q -4.7 -3.9 -4.4 -3.4 Z";

/**
 * The thief: a Kempenfelt ring-billed gull, side on and facing down the zone, centred on its
 * body so a caller places it with a transform. There are already gulls in the backdrop's sky
 * (§2.11) — this is one of them come down to see what the hen dropped. Whatever it carries
 * hangs from its feet as `children`, and goes where it goes.
 */
export const Gull = forwardRef<GullHandle, { children?: ReactNode }>(({ children }, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const wing = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    place: ({ visible, x, y, angle, flap }): void => {
      group.current?.setAttribute("opacity", visible ? "1" : "0");
      group.current?.setAttribute("transform", `translate(${x} ${y}) rotate(${angle}) scale(${GULL_SCALE})`);
      wing.current?.setAttribute(
        "transform",
        `translate(${SHOULDER.x} ${SHOULDER.y}) scale(1 ${Math.max(-1, Math.min(1, flap)) * 0.9 + 0.1})`
      );
    }
  }));

  return (
    <g ref={group} opacity={0} data-schlonic-gull>
      {/* The haul hangs under the feet, so it is drawn first and the bird sits on top of it. */}
      <g transform={`translate(0 ${HAUL_Y}) scale(${1 / GULL_SCALE})`}>{children}</g>
      {[-0.4, 0.8].map((legX) => (
        <line
          key={legX}
          x1={legX}
          y1={0.9}
          x2={legX - 0.3}
          y2={2.9}
          stroke={schlonicPalette.gullLeg}
          strokeWidth={0.45}
          strokeLinecap="round"
        />
      ))}
      {/* The far wing, a shade behind the body, so a beat reads as two wings and not one. */}
      <g transform={`translate(${SHOULDER.x} ${SHOULDER.y}) scale(-0.8 -0.7)`} opacity={0.75}>
        <path d={WING_PATH} fill={schlonicPalette.gullBack} stroke={schlonicPalette.gullEdge} strokeWidth={OUTLINE} />
      </g>
      <path d="M -3.2 -0.3 L -5.2 -1.3 L -5 0.5 Z" fill={schlonicPalette.gullTip} />
      <ellipse cx={0} cy={0} rx={3.4} ry={1.6} fill={schlonicPalette.gull} stroke={schlonicPalette.gullEdge} strokeWidth={OUTLINE} />
      <circle cx={3.2} cy={-1} r={1.35} fill={schlonicPalette.gull} stroke={schlonicPalette.gullEdge} strokeWidth={OUTLINE} />
      <path d="M 4.3 -1.25 L 6.4 -0.75 L 4.3 -0.35 Z" fill={schlonicPalette.gullBeak} />
      <circle cx={5.4} cy={-0.8} r={0.22} fill={schlonicPalette.gullBeakSpot} />
      <circle cx={3.6} cy={-1.35} r={0.26} fill={schlonicPalette.pupil} />
      <g ref={wing}>
        <path d={WING_PATH} fill={schlonicPalette.gullBack} stroke={schlonicPalette.gullEdge} strokeWidth={OUTLINE} />
        <path d={WING_TIP_PATH} fill={schlonicPalette.gullTip} />
      </g>
    </g>
  );
});

Gull.displayName = "Gull";
