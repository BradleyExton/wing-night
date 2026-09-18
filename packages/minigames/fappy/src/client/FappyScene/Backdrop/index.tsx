import { forwardRef } from "react";
import { FAPPY_WORLD } from "@wingnight/shared";

import { fappyPalette } from "../palette.js";

// What is behind the corridor: a starfield, a low sun on the horizon and two
// bands of dunes that the loop slides at a fraction of the scroll, so the
// world has depth without the sim knowing the sky exists. Nothing here is a
// hazard. The dunes repeat over `DUNE_SPAN`, wide enough that the longest leg
// never runs off their end at their slower speeds.
export const FAR_DUNE_PARALLAX = 0.2;
export const NEAR_DUNE_PARALLAX = 0.45;
const DUNE_SPAN = 1200;
const STAR_COUNT = 34;

// Stars want to look scattered, not gridded; a tiny LCG spreads them the same
// way every mount. Decoration only, so determinism across machines is moot.
const resolveStars = (): { cx: number; cy: number; r: number }[] => {
  let state = 7;
  const next = (): number => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };

  return Array.from({ length: STAR_COUNT }, () => ({
    cx: Math.round(next() * FAPPY_WORLD.width * 10) / 10,
    cy: Math.round(next() * 44 * 10) / 10,
    r: 0.12 + Math.round(next() * 0.22 * 100) / 100
  }));
};

const STARS = resolveStars();

const resolveDunePath = (baseY: number, amplitude: number, period: number, phase: number): string => {
  const segments: string[] = [`M ${-period} ${FAPPY_WORLD.floorY + 4}`, `L ${-period} ${baseY}`];

  for (let x = -period; x <= DUNE_SPAN; x += period) {
    const crest = baseY - amplitude;
    const dip = baseY + amplitude * 0.35;

    segments.push(
      `Q ${x + period * 0.25 + phase} ${crest} ${x + period * 0.5} ${baseY - amplitude * 0.3}`,
      `Q ${x + period * 0.75 - phase} ${dip} ${x + period} ${baseY}`
    );
  }

  segments.push(`L ${DUNE_SPAN} ${FAPPY_WORLD.floorY + 4} Z`);

  return segments.join(" ");
};

const FAR_DUNES = resolveDunePath(76, 7, 90, 6);
const NEAR_DUNES = resolveDunePath(80, 4, 58, 3);

export type BackdropRefs = {
  far: SVGGElement | null;
  near: SVGGElement | null;
};

export const Backdrop = forwardRef<BackdropRefs, { sunId: string }>(({ sunId }, ref): JSX.Element => {
  const refs: BackdropRefs = { far: null, near: null };
  const assign = (): void => {
    if (typeof ref === "function") {
      ref(refs);
    } else if (ref !== null) {
      ref.current = refs;
    }
  };

  return (
    <g data-fappy-backdrop>
      <defs>
        <radialGradient id={sunId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={fappyPalette.sun} />
          <stop offset="70%" stopColor={fappyPalette.sun} />
          <stop offset="100%" stopColor={fappyPalette.sunGlow} />
        </radialGradient>
      </defs>
      <g data-fappy-stars>
        {STARS.map((star, index) => (
          <circle key={index} cx={star.cx} cy={star.cy} r={star.r} fill={fappyPalette.star} opacity={0.4 + star.r} />
        ))}
      </g>
      <circle cx={118} cy={74} r={13} fill={`url(#${sunId})`} opacity={0.9} data-fappy-sun />
      <g
        ref={(element): void => {
          refs.far = element;
          assign();
        }}
        data-fappy-dunes="far"
      >
        <path d={FAR_DUNES} fill={fappyPalette.duneFar} />
      </g>
      <g
        ref={(element): void => {
          refs.near = element;
          assign();
        }}
        data-fappy-dunes="near"
      >
        <path d={NEAR_DUNES} fill={fappyPalette.duneNear} />
      </g>
    </g>
  );
});

Backdrop.displayName = "Backdrop";
