import type { JoustVec2 } from "@wingnight/shared";

import { joustPalette } from "../palette.js";
import * as styles from "./styles.js";

export const ImpactBurst = ({ at }: { at: JoustVec2 }): JSX.Element => {
  const points: string[] = [];
  const spikes = 8;

  // Alternating outer/inner radii around the struck body. Screen-side only, so
  // the trig here never touches the deterministic track.
  for (let index = 0; index < spikes * 2; index += 1) {
    const angle = (Math.PI * index) / spikes;
    const radius = index % 2 === 0 ? 7 : 3.2;
    points.push(`${at.x + Math.cos(angle) * radius},${at.y + Math.sin(angle) * radius}`);
  }

  return (
    <g className={styles.burst} data-joust-impact>
      <polygon
        points={points.join(" ")}
        fill={joustPalette.burst}
        stroke={joustPalette.burstCore}
        strokeWidth={0.8}
        strokeLinejoin="round"
        opacity={0.92}
      />
    </g>
  );
};

/** The dust a folding tower throws up: a row of puffs along the plank as it goes. */
export const CollapseDust = ({ from, to }: { from: JoustVec2; to: JoustVec2 }): JSX.Element => {
  const puffs = 5;

  return (
    <g className={styles.burst} data-joust-collapse>
      {Array.from({ length: puffs }, (_unused, index) => {
        const mix = index / (puffs - 1);
        const bob = index % 2 === 0 ? -2.4 : 0.8;

        return (
          <circle
            key={index}
            cx={from.x + (to.x - from.x) * mix}
            cy={from.y + (to.y - from.y) * mix + bob}
            r={2.6 + (index % 3) * 0.8}
            fill={joustPalette.sand}
            stroke={joustPalette.sandDark}
            strokeWidth={0.5}
            opacity={0.85}
          />
        );
      })}
    </g>
  );
};

/**
 * The flight so far, as fading ghosts of the head: brightest and biggest where it was a frame
 * ago, gone eight frames back. It is what lets the room read the arc of a shot that crossed the
 * lane in under a second, and it collapses to nothing once the shooter has stopped moving.
 */
export const ShotTrail = ({ trail }: { trail: JoustVec2[] }): JSX.Element | null => {
  if (trail.length === 0) {
    return null;
  }

  return (
    <g data-joust-trail>
      {trail.map((at, index) => {
        const recency = (index + 1) / trail.length;

        return (
          <circle
            key={index}
            cx={at.x}
            cy={at.y}
            r={0.9 + recency * 1.9}
            fill={joustPalette.shooterLight}
            opacity={0.1 + recency * 0.32}
          />
        );
      })}
    </g>
  );
};
