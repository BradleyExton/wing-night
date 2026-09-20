import { forwardRef, useImperativeHandle, useRef } from "react";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { schlonicPalette } from "../palette.js";

// Two banks of hills and a row of clouds, each scrolling at its own share of the zone, so the
// room reads speed off the distance as well as off the ground. Nothing here is a surface the
// runner can touch.
export const FAR_HILL_PARALLAX = 0.12;
export const NEAR_HILL_PARALLAX = 0.34;
export const CLOUD_PARALLAX = 0.06;

export type BackdropRefs = {
  farHills: SVGGElement | null;
  nearHills: SVGGElement | null;
  clouds: SVGGElement | null;
};

// Wide enough that a layer scrolled by its share never runs out before the zone does.
const BAND_WIDTH = SCHLONIC_WORLD.width * 3;

const hillBand = (offset: number, width: number, height: number, baseY: number): string => {
  const humps = Array.from({ length: Math.ceil(BAND_WIDTH / width) + 1 }, (_unused, index) => {
    const left = offset + index * width;

    return `M ${left} ${baseY} Q ${left + width / 2} ${baseY - height} ${left + width} ${baseY}`;
  });

  return `${humps.join(" ")} L ${BAND_WIDTH} ${SCHLONIC_WORLD.height} L ${offset} ${SCHLONIC_WORLD.height} Z`;
};

export const Backdrop = forwardRef<BackdropRefs>((_props, ref): JSX.Element => {
  const farHills = useRef<SVGGElement>(null);
  const nearHills = useRef<SVGGElement>(null);
  const clouds = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    farHills: farHills.current,
    nearHills: nearHills.current,
    clouds: clouds.current
  }));

  return (
    <g data-schlonic-backdrop>
      <circle cx={132} cy={17} r={9} fill={schlonicPalette.sun} opacity={0.9} />
      <g ref={clouds}>
        {[14, 62, 108, 158, 206].map((x, index) => (
          <g key={x} opacity={0.85}>
            <ellipse cx={x} cy={12 + (index % 3) * 5} rx={9} ry={3.4} fill={schlonicPalette.cloud} />
            <ellipse cx={x + 6} cy={10 + (index % 3) * 5} rx={6} ry={3} fill={schlonicPalette.cloud} />
          </g>
        ))}
      </g>
      <g ref={farHills}>
        <path d={hillBand(-40, 70, 26, 62)} fill={schlonicPalette.hillFar} opacity={0.75} />
      </g>
      <g ref={nearHills}>
        <path d={hillBand(-20, 48, 18, 70)} fill={schlonicPalette.hillNear} opacity={0.85} />
      </g>
    </g>
  );
});

Backdrop.displayName = "Backdrop";
