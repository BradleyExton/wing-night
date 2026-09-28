import { forwardRef } from "react";
import type { SchlonicFrame } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import { Wing } from "../Wing/index.js";

/** A wing bursts out of the bird for this long after a hit. */
const BURST_TICKS = 34;
const BURST_WINGS = 6;
/** Thrown wings are a size down from the ones on the shore, and they tumble on the way out. */
const BURST_SCALE = 0.8;
const BURST_SPIN_DEGREES = 40;

/**
 * The handful that leaves you when you take a hit: wings thrown up out of the bird and gone.
 * Decoration — the sim already took them, and none of these can be caught.
 */
export const paintBurst = (burst: SVGGElement | null, frame: SchlonicFrame): void => {
  if (burst === null) {
    return;
  }

  const lastHit = frame.hits[frame.hits.length - 1] ?? -BURST_TICKS * 2;
  const since = frame.tick - lastHit;

  if (since < 0 || since > BURST_TICKS) {
    burst.setAttribute("opacity", "0");
    return;
  }

  const along = since / BURST_TICKS;

  burst.setAttribute("opacity", `${1 - along}`);
  burst.setAttribute("transform", `translate(${SCHLONIC_WORLD.runnerX} ${frame.y})`);

  for (let index = 0; index < BURST_WINGS; index += 1) {
    const radians = (index / BURST_WINGS) * Math.PI * 2;
    const spread = along * 16;
    const x = Math.cos(radians) * spread;
    const y = Math.sin(radians) * spread - along * 6;

    // A wing is a whole drawing rather than one circle, so it is placed by transform — and
    // tumbling as it goes is free once it is a group.
    burst.children[index]?.setAttribute(
      "transform",
      `translate(${x} ${y}) rotate(${radians * BURST_SPIN_DEGREES})`
    );
  }
};

/** The six wings a hit throws, built once and moved by `paintBurst`. */
export const Burst = forwardRef<SVGGElement>((_props, ref): JSX.Element => (
  <g ref={ref} data-schlonic-burst opacity={0}>
    {Array.from({ length: BURST_WINGS }, (_unused, index) => (
      <g key={index}>
        <Wing scale={BURST_SCALE} />
      </g>
    ))}
  </g>
));

Burst.displayName = "Burst";
