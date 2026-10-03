import { forwardRef, useImperativeHandle, useRef } from "react";
import type { BrawlFrame, BrawlHazardKind } from "@wingnight/shared";
import { BRAWL_WORLD } from "@wingnight/shared";

import { brawlNight } from "../palette.js";

/** How long a dunk's ring spreads on the street, in ticks: half a second, inside the KO's fall. */
export const DUNK_SPLASH_TICKS = 30;

export type DunkSplashState = { x: number; age: number; kind: BrawlHazardKind };

/**
 * The newest dunk still spreading (`BrawlFrame.dunks`), where the dunked goon lies, and how many
 * ticks ago; null when there is none. The goon is still on the street through its fall, which
 * outlasts the ring, so it is always there to stand the ring under. Pure.
 */
export const resolveDunkSplash = (
  frame: Pick<BrawlFrame, "dunks" | "goons" | "tick">,
  kind: BrawlHazardKind | null
): DunkSplashState | null => {
  const dunk = frame.dunks[frame.dunks.length - 1];

  if (kind === null || dunk === undefined || frame.tick < dunk.tick || frame.tick - dunk.tick >= DUNK_SPLASH_TICKS) {
    return null;
  }

  const goon = frame.goons.find((candidate) => candidate.spawnIndex === dunk.spawnIndex);

  return goon === undefined ? null : { x: goon.x, age: frame.tick - dunk.tick, kind };
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

/**
 * Writes the splash for this frame onto the group the scene rendered: shown under the dunked goon
 * while it spreads, two rings growing and fading over `DUNK_SPLASH_TICKS`, and hidden otherwise.
 * Written straight onto the DOM from the paint loop, so a dunk costs no React work.
 */
export const paintDunkSplash = (element: SVGGElement | null, splash: DunkSplashState | null): void => {
  if (element === null) {
    return;
  }

  const display = splash === null ? "none" : "inline";

  if (element.getAttribute("display") !== display) {
    element.setAttribute("display", display);
  }

  if (splash === null) {
    return;
  }

  const share = splash.age / DUNK_SPLASH_TICKS;

  element.setAttribute("transform", `translate(${round2(splash.x)} ${BRAWL_WORLD.groundY}) scale(${round2(0.5 + share * 1.2)})`);
  element.setAttribute("opacity", `${round2(1 - share)}`);
  element.setAttribute("data-brawl-dunk", splash.kind);
};

/**
 * A goon dunked into the block's hazard, marked on the street: a ring of water spreading on the
 * bay, a ring of dust where one went over the railing or off the plinth. The goon's own KO fall is
 * the rest of the beat. A bare `<g>` in world units for the scene's world group.
 */
export const DunkSplash = forwardRef<SVGGElement, { kind: BrawlHazardKind | null }>(({ kind }, ref): JSX.Element => {
  const inner = useRef<SVGGElement>(null);
  const ring = kind === "bay" ? brawlNight.chalk : brawlNight.kerb;

  useImperativeHandle(ref, () => inner.current as SVGGElement);

  return (
    <g ref={inner} display="none" data-brawl-dunk="" aria-hidden="true">
      <ellipse cx={0} cy={0} rx={7} ry={1.6} fill="none" stroke={ring} strokeWidth={0.6} />
      <ellipse cx={0} cy={0} rx={4} ry={0.9} fill="none" stroke={ring} strokeWidth={0.45} opacity={0.7} />
      {kind === "bay" && (
        <path d="M -3 -0.5 Q -4 -5 -6 -4 M 3 -0.5 Q 4 -5 6 -4 M 0 -0.8 Q 0 -6 -1 -6.5" fill="none" stroke={ring} strokeWidth={0.45} strokeLinecap="round" />
      )}
    </g>
  );
});

DunkSplash.displayName = "DunkSplash";
