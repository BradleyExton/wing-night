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
import { Goose } from "../ZoneProps/Crowd/index.js";

export type WipeoutPunchlineHandle = {
  paint: (input: { elapsedMs: number; frame: SchlonicFrame; zone: SchlonicZone; eater: Eater }) => void;
  hide: () => void;
};

/** Dropped wings are the burst's size, a size down from the ones along the street. */
const DROPPED_SCALE = 0.8;

/** Squash and stretch about a point on the ground, as one transform. */
export const resolveSquashTransform = (x: number, y: number, sx: number, sy: number): string => {
  return `translate(${x} ${y}) scale(${sx} ${sy}) translate(${-x} ${-y})`;
};

/**
 * The wipeout's punchline, in the zone's own coordinates (it scrolls with the street): the wings
 * the hit knocked loose, rolling down the sidewalk to a goose that waddles in from the edge of
 * the picture and eats them, one gulp each. The goose is drawn at the origin and placed by
 * transform, squashed about its feet as it gulps.
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
      <g ref={standIn} opacity={0} data-schlonic-eater="goose">
        <Goose />
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
