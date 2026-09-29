import { forwardRef, useImperativeHandle, useRef } from "react";

import { schlonicPalette } from "../palette.js";

export type DustHandle = {
  /** `share` 0 → 1 across the cloud, or null for none. `width` is the trench's, so the cloud fills its mouth. */
  paint: (x: number, y: number, width: number, share: number | null) => void;
};

// The cloud's puffs, fixed so both screens boil alike: where across the trench's mouth each one
// starts (a share of its width), how high it climbs, how big it grows, and how far it leans out.
const PUFFS = [
  { across: -0.42, rise: 5, size: 3, lean: -5 },
  { across: -0.2, rise: 10, size: 3.8, lean: -2 },
  { across: 0.05, rise: 13, size: 4.4, lean: 0.5 },
  { across: 0.28, rise: 9, size: 3.6, lean: 3 },
  { across: 0.45, rise: 4.5, size: 2.9, lean: 6 },
  { across: -0.05, rise: 6, size: 3.2, lean: -1 },
  { across: 0.14, rise: 16, size: 3, lean: 1.5 },
  { across: -0.32, rise: 14, size: 2.5, lean: -3.5 }
] as const;
const PEBBLES = 6;
/** The dark under each puff sits this far down and back, so the cloud has a shaded side. */
const SHADE_OFFSET = { x: -0.7, y: 0.9 };

/**
 * The thud at the bottom of the dig, seen from the street: a cloud of dust boiling up out of the
 * trench's mouth and rolling out over both lips, and a spit of gravel thrown up with it.
 * Decoration, painted from a share of the cloud by whoever owns the clock.
 */
export const Dust = forwardRef<DustHandle>((_props, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const shades = useRef<SVGGElement>(null);
  const puffs = useRef<SVGGElement>(null);
  const pebbles = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    paint: (x, y, width, share): void => {
      if (share === null) {
        group.current?.setAttribute("opacity", "0");
        return;
      }

      // Thick for a beat, then thinning out as it climbs.
      group.current?.setAttribute("opacity", `${share < 0.25 ? 1 : Math.max(0, 1 - (share - 0.25) / 0.75) ** 1.4}`);

      const grow = 1 - (1 - share) ** 3;

      PUFFS.forEach((puff, index) => {
        const cx = x + puff.across * width + puff.lean * grow;
        const cy = y - 0.5 - puff.rise * grow;
        const r = 0.8 + puff.size * (0.35 + grow * 0.65);

        for (const layer of [puffs.current, shades.current]) {
          const circle = layer?.children[index];
          const isShade = layer === shades.current;

          circle?.setAttribute("cx", `${cx + (isShade ? SHADE_OFFSET.x : 0)}`);
          circle?.setAttribute("cy", `${cy + (isShade ? SHADE_OFFSET.y : 0)}`);
          circle?.setAttribute("r", `${r}`);
        }
      });

      for (let index = 0; index < PEBBLES; index += 1) {
        const side = index % 2 === 0 ? -1 : 1;
        const speed = 7 + (index % 3) * 3;
        const pebble = pebbles.current?.children[index];

        pebble?.setAttribute("cx", `${x + side * speed * share * (0.5 + index * 0.12)}`);
        pebble?.setAttribute("cy", `${y - speed * 1.6 * share + 26 * share * share}`);
        pebble?.setAttribute("opacity", share < 0.6 ? "1" : "0");
      }
    }
  }));

  return (
    <g ref={group} opacity={0} data-schlonic-dust>
      <g ref={shades} fill={schlonicPalette.dustShade}>
        {PUFFS.map((puff) => (
          <circle key={puff.across} />
        ))}
      </g>
      <g ref={puffs} fill={schlonicPalette.dust}>
        {PUFFS.map((puff) => (
          <circle key={puff.across} />
        ))}
      </g>
      <g ref={pebbles} fill={schlonicPalette.pebble}>
        {Array.from({ length: PEBBLES }, (_unused, index) => (
          <circle key={index} r={0.45 + (index % 3) * 0.15} />
        ))}
      </g>
    </g>
  );
});

Dust.displayName = "Dust";
