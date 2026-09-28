import { forwardRef, useImperativeHandle, useRef } from "react";
import type { SchlonicFrame, SchlonicZone } from "@wingnight/shared";

import {
  WIPEOUT_DROPPED_WINGS,
  resolveDroppedWing,
  resolveEaterSquash,
  resolveStandInPlace,
  type Eater
} from "../punchlineTimeline/index.js";
import { Wing } from "../Wing/index.js";
import { Badnik } from "../ZoneProps/Badnik/index.js";

export type WipeoutPunchlineHandle = {
  paint: (input: { elapsedMs: number; frame: SchlonicFrame; zone: SchlonicZone; eater: Eater }) => void;
  hide: () => void;
};

/** Dropped wings are the burst's size, a size down from the ones on the shore. */
const DROPPED_SCALE = 0.8;

/** Squash and stretch about a point on the ground, as one transform. */
export const resolveSquashTransform = (x: number, y: number, sx: number, sy: number): string => {
  return `translate(${x} ${y}) scale(${sx} ${sy}) translate(${-x} ${-y})`;
};

// Drawn at the origin and placed by transform. Its index only deals its skin, and 2 deals the
// pink (`resolveBadnikSkin`): the one the room already reads as the enemy.
const STAND_IN = { index: 2, kind: "badnik", x: 0, y: 0 } as const;

/**
 * The wipeout's punchline, in the zone's own coordinates (it scrolls with the shore): the wings
 * the hit knocked loose, rolling down the turf to the eater, and — when no badnik is in the
 * picture to do it — a stand-in that hops on from the edge. A badnik already standing in the
 * zone is the scene's own drawing, and the scene squashes it.
 */
export const WipeoutPunchline = forwardRef<WipeoutPunchlineHandle>((_props, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const wings = useRef<SVGGElement>(null);
  const standIn = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    paint: ({ elapsedMs, frame, zone, eater }): void => {
      group.current?.setAttribute("opacity", "1");

      for (let index = 0; index < WIPEOUT_DROPPED_WINGS; index += 1) {
        const wing = resolveDroppedWing(index, elapsedMs, frame, zone, eater);
        const element = wings.current?.children[index];

        element?.setAttribute("opacity", wing.visible ? "1" : "0");
        element?.setAttribute("transform", `translate(${wing.x} ${wing.y}) rotate(${wing.spin})`);
      }

      if (eater.kind !== "standIn") {
        standIn.current?.setAttribute("opacity", "0");
        return;
      }

      const place = resolveStandInPlace(eater, zone, elapsedMs);
      const squash = resolveEaterSquash(elapsedMs);

      standIn.current?.setAttribute("opacity", "1");
      standIn.current?.setAttribute(
        "transform",
        `translate(${place.x} ${place.y}) ${resolveSquashTransform(0, 0, squash.sx, squash.sy)}`
      );
    },
    hide: (): void => {
      group.current?.setAttribute("opacity", "0");
    }
  }));

  return (
    <g ref={group} opacity={0} data-schlonic-wipeout-punchline>
      <g ref={standIn} opacity={0} data-schlonic-eater="stand-in">
        <Badnik prop={STAND_IN} isZoneKit={false} />
      </g>
      <g ref={wings}>
        {Array.from({ length: WIPEOUT_DROPPED_WINGS }, (_unused, index) => (
          <g key={index} opacity={0}>
            <Wing scale={DROPPED_SCALE} />
          </g>
        ))}
      </g>
    </g>
  );
});

WipeoutPunchline.displayName = "WipeoutPunchline";
