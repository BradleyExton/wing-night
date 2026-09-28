import { forwardRef, useImperativeHandle, useRef } from "react";

import { schlonicPalette } from "../palette.js";

export type SplashHandle = {
  /** `share` 0 → 1 across the splash; outside that it is not drawn. */
  paint: (x: number, y: number, share: number) => void;
};

const DROPLETS = 9;
const RINGS = 2;

/**
 * The bay taking the hen back: a column of water, a crown of spray thrown up and out, and two
 * rings running out across the surface. Decoration, painted from a share of the splash by
 * whoever owns the clock.
 */
export const Splash = forwardRef<SplashHandle>((_props, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const column = useRef<SVGEllipseElement>(null);
  const droplets = useRef<SVGGElement>(null);
  const rings = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    paint: (x, y, share): void => {
      if (share < 0 || share > 1) {
        group.current?.setAttribute("opacity", "0");
        return;
      }

      group.current?.setAttribute("opacity", "1");

      const height = Math.sin(share * Math.PI) * 20;

      column.current?.setAttribute("cx", `${x}`);
      column.current?.setAttribute("cy", `${y - height / 2}`);
      column.current?.setAttribute("rx", `${3.6 * (1 - share * 0.5)}`);
      column.current?.setAttribute("ry", `${Math.max(0, height / 2)}`);
      column.current?.setAttribute("opacity", `${1 - share * 0.6}`);

      for (let index = 0; index < DROPLETS; index += 1) {
        // Fanned across the upper half, a little faster at the edges than straight up.
        const angle = Math.PI * (1.12 + (index / (DROPLETS - 1)) * 0.76);
        const speed = 15 + (index % 3) * 4.5;
        const droplet = droplets.current?.children[index];

        droplet?.setAttribute("cx", `${x + Math.cos(angle) * speed * share * 1.25}`);
        droplet?.setAttribute("cy", `${y + Math.sin(angle) * speed * share + 22 * share * share}`);
        droplet?.setAttribute("r", `${1.5 - share * 0.7}`);
        droplet?.setAttribute("opacity", `${1 - share}`);
      }

      for (let index = 0; index < RINGS; index += 1) {
        const radius = 4 + share * (16 + index * 9);
        const ring = rings.current?.children[index];

        ring?.setAttribute("cx", `${x}`);
        ring?.setAttribute("cy", `${y}`);
        ring?.setAttribute("rx", `${radius}`);
        ring?.setAttribute("ry", `${radius * 0.22}`);
        ring?.setAttribute("opacity", `${(1 - share) * 0.85}`);
      }
    }
  }));

  return (
    <g ref={group} opacity={0} data-schlonic-splash>
      <g ref={rings} fill="none" stroke={schlonicPalette.spray} strokeWidth={0.6}>
        {Array.from({ length: RINGS }, (_unused, index) => (
          <ellipse key={index} />
        ))}
      </g>
      <ellipse ref={column} fill={schlonicPalette.spray} />
      <g ref={droplets} fill={schlonicPalette.spray} stroke={schlonicPalette.bayNear} strokeWidth={0.2}>
        {Array.from({ length: DROPLETS }, (_unused, index) => (
          <circle key={index} />
        ))}
      </g>
    </g>
  );
});

Splash.displayName = "Splash";
