import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";

import { schlonicPalette } from "../palette.js";

export type RaccoonHandle = {
  /**
   * Where its feet are, where its legs are in a stride (-1 → 1), how far into a chitter it is
   * (0 → 1), and whether it is still climbing the trench wall.
   */
  place: (placement: {
    visible: boolean;
    x: number;
    y: number;
    stride: number;
    chitter: number;
    isClimbing: boolean;
  }) => void;
};

/** Drawn at about the hen's own size, so the couch sees the theft before it reads the card. */
export const RACCOON_SCALE = 1.1;

const INK = 0.32;
/** Where the haul sits in its arms, hugged to its chest. */
const HAUL = { x: 1.9, y: -5.3 };
const HIP_NEAR = { x: 0.5, y: -2.6 };
const HIP_FAR = { x: -1.1, y: -2.6 };
const TAIL_ROOT = { x: -2.3, y: -2.7 };
/** Up the wall the tail hangs straight down behind it, into the dig, out of the hen's face. */
const CLIMBING_TAIL_ANGLE = -110;

// The ringed tail, root to tip, curling up behind it: every other ring is the mask's black.
const TAIL_RINGS = [
  { x: -3, y: -2.6, angle: -10 },
  { x: -4.3, y: -3, angle: -25 },
  { x: -5.5, y: -3.8, angle: -40 },
  { x: -6.4, y: -5, angle: -60 },
  { x: -6.9, y: -6.3, angle: -75 },
  { x: -7.1, y: -7.5, angle: -85 }
] as const;

const Leg = ({ hip }: { hip: { x: number; y: number } }): JSX.Element => (
  <>
    <path d={`M ${hip.x} ${hip.y} L ${hip.x + 0.2} ${-0.4}`} stroke={schlonicPalette.raccoonFurDark} strokeWidth={1.5} strokeLinecap="round" />
    <ellipse cx={hip.x + 0.6} cy={-0.3} rx={0.95} ry={0.45} fill={schlonicPalette.raccoonMask} />
  </>
);

/**
 * The thief: a Barrie raccoon in an orange hard hat, stood up on its back legs, side on and facing
 * down the street, feet at the origin so a caller places it with a transform. It lives in the dig
 * — of course it does — and it comes up out of the trench hugging whatever the hen dropped down
 * there. Grey fur, the black mask with a bright eye in it, and the ringed tail are what make it a
 * raccoon at the size of a thumbnail; the hard hat is what makes it the roadworks' own. Whatever
 * it carries is `children`, hugged to its chest.
 */
export const Raccoon = forwardRef<RaccoonHandle, { children?: ReactNode }>(({ children }, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const body = useRef<SVGGElement>(null);
  const legNear = useRef<SVGGElement>(null);
  const legFar = useRef<SVGGElement>(null);
  const tail = useRef<SVGGElement>(null);
  const mouth = useRef<SVGPathElement>(null);

  useImperativeHandle(ref, () => ({
    place: ({ visible, x, y, stride, chitter, isClimbing }): void => {
      const wiggle = chitter > 0 ? Math.sin(chitter * Math.PI * 10) : 0;

      group.current?.setAttribute("opacity", visible ? "1" : "0");
      group.current?.setAttribute("transform", `translate(${x} ${y}) scale(${RACCOON_SCALE})`);
      body.current?.setAttribute("transform", `rotate(${wiggle * 5} 0 -2)`);
      legNear.current?.setAttribute("transform", `rotate(${stride * 32} ${HIP_NEAR.x} ${HIP_NEAR.y})`);
      legFar.current?.setAttribute("transform", `rotate(${-stride * 32} ${HIP_FAR.x} ${HIP_FAR.y})`);
      tail.current?.setAttribute(
        "transform",
        `rotate(${isClimbing ? CLIMBING_TAIL_ANGLE : wiggle * 14 + stride * 6} ${TAIL_ROOT.x} ${TAIL_ROOT.y})`
      );
      mouth.current?.setAttribute("opacity", wiggle > 0 ? "1" : "0");
    }
  }));

  return (
    <g ref={group} opacity={0} data-schlonic-raccoon>
      <g ref={legFar} opacity={0.8}>
        <Leg hip={HIP_FAR} />
      </g>
      <g ref={tail}>
        {TAIL_RINGS.map((ring, index) => (
          <ellipse
            key={ring.x}
            cx={ring.x}
            cy={ring.y}
            rx={1.4}
            ry={1.15}
            transform={`rotate(${ring.angle} ${ring.x} ${ring.y})`}
            fill={index % 2 === 0 ? schlonicPalette.raccoonFur : schlonicPalette.raccoonMask}
            stroke={schlonicPalette.raccoonInk}
            strokeWidth={INK}
          />
        ))}
      </g>
      <g ref={body}>
        {/* The far arm, behind the haul. */}
        <path d="M -0.4 -6.6 Q 1 -7.4 2.9 -6.4" fill="none" stroke={schlonicPalette.raccoonFurDark} strokeWidth={1.1} strokeLinecap="round" />
        <ellipse cx={0} cy={-4.6} rx={2.7} ry={3.2} fill={schlonicPalette.raccoonFur} stroke={schlonicPalette.raccoonInk} strokeWidth={INK} />
        <ellipse cx={0.9} cy={-4.2} rx={1.5} ry={2.3} fill={schlonicPalette.raccoonPale} />
        <g transform={`translate(${HAUL.x} ${HAUL.y})`}>{children}</g>
        {/* The near arm, round the front of it. */}
        <path d="M 0.6 -6.8 Q -0.2 -4.4 2.6 -3.9" fill="none" stroke={schlonicPalette.raccoonFurDark} strokeWidth={1.2} strokeLinecap="round" />
        <circle cx={2.9} cy={-4} r={0.6} fill={schlonicPalette.raccoonMask} />
        {/* The head: grey, a pale cheek and snout, the black mask, and a bright eye inside it. */}
        <path d="M -1.3 -10.6 L -0.6 -12 L 0.3 -10.8 Z" fill={schlonicPalette.raccoonFurDark} stroke={schlonicPalette.raccoonInk} strokeWidth={INK} />
        <ellipse cx={0.8} cy={-9} rx={2.5} ry={2.1} fill={schlonicPalette.raccoonFur} stroke={schlonicPalette.raccoonInk} strokeWidth={INK} />
        <ellipse cx={1.6} cy={-8.1} rx={1.6} ry={1} fill={schlonicPalette.raccoonPale} />
        <path d="M 2.1 -9.7 Q 3.9 -9.2 4.7 -8.7 Q 3.6 -7.8 2.2 -7.9 Z" fill={schlonicPalette.raccoonPale} stroke={schlonicPalette.raccoonInk} strokeWidth={INK} strokeLinejoin="round" />
        <circle cx={4.6} cy={-8.75} r={0.52} fill={schlonicPalette.raccoonMask} />
        <path ref={mouth} d="M 3.2 -7.95 Q 3.7 -7.2 4.3 -8" fill={schlonicPalette.raccoonMask} opacity={0} />
        <path d="M -0.5 -9.8 Q 1.4 -10.9 3.6 -9.7 Q 3.4 -8.6 2.4 -8.7 Q 1.4 -9.2 0.5 -8.6 Q -0.4 -8.8 -0.5 -9.8 Z" fill={schlonicPalette.raccoonPale} />
        <path d="M -0.5 -9.4 Q 1.4 -10.2 3.5 -9.3 Q 3.3 -8.3 2.4 -8.4 Q 1.4 -8.8 0.5 -8.3 Q -0.4 -8.5 -0.5 -9.4 Z" fill={schlonicPalette.raccoonMask} />
        <circle cx={2.35} cy={-9.1} r={0.46} fill={schlonicPalette.raccoonEye} />
        <circle cx={2.5} cy={-9.05} r={0.2} fill={schlonicPalette.raccoonMask} />
        {/* The hard hat: an orange dome with a ridge down it and a peak out over the snout. */}
        <path d="M -1.9 -10.3 Q -1.8 -13.4 0.9 -13.5 Q 3.6 -13.4 3.6 -10.3 Z" fill={schlonicPalette.hardHat} stroke={schlonicPalette.hardHatDark} strokeWidth={INK} strokeLinejoin="round" />
        <path d="M 0.9 -13.5 L 0.9 -10.4" stroke={schlonicPalette.hardHatDark} strokeWidth={0.45} />
        <path d="M -1.2 -11 Q -1 -12.7 0.3 -13.1" fill="none" stroke={schlonicPalette.hardHatShine} strokeWidth={0.45} strokeLinecap="round" />
        <path d="M -2.4 -10.1 L 4.9 -10.1 Q 4.9 -9.5 4.2 -9.5 L -2.2 -9.6 Z" fill={schlonicPalette.hardHat} stroke={schlonicPalette.hardHatDark} strokeWidth={INK} strokeLinejoin="round" />
      </g>
      <g ref={legNear}>
        <Leg hip={HIP_NEAR} />
      </g>
    </g>
  );
});

Raccoon.displayName = "Raccoon";
