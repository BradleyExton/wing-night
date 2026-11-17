import { forwardRef, useImperativeHandle, useReducer, useRef } from "react";
import type { BrawlCrewFrame, BrawlCrewPickup } from "@wingnight/shared";

import { brawlGoonPalette } from "../Goons/index.js";
import { Wing } from "../Pickups/index.js";

export type PickupLayerHandle = {
  /** Lays the frame's wing on the street, redrawing it only when its picture changes. */
  paint: (frame: Pick<BrawlCrewFrame, "pickups" | "tick">) => void;
};

/** The wing's bob is redrawn every this many ticks: a slow float, not sixty renders a second. */
export const WING_DRAW_STEP_TICKS = 4;

/** What the layer last drew, as one string: where each wing lies and the bob's drawn tick. Pure. */
export const resolvePickupsSignature = (frame: Pick<BrawlCrewFrame, "pickups" | "tick">): string => {
  if (frame.pickups.length === 0) {
    return "";
  }

  const drawTick = Math.floor(frame.tick / WING_DRAW_STEP_TICKS) * WING_DRAW_STEP_TICKS;

  return `${drawTick}|${frame.pickups.map((pickup) => `${pickup.x}:${pickup.z}`).join(",")}`;
};

/**
 * The wing a goon worth two leaves where it went down (`BrawlCrewFrame.pickups`), lying on the
 * street on the line it fell on, under the figures, and bobbing on the sim's tick so every
 * screen draws the same float. It is React-drawn, but only on the ticks its picture changes and
 * only while a wing is on the street; a frame with none costs nothing.
 */
export const PickupLayer = forwardRef<PickupLayerHandle>((_props, ref): JSX.Element => {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const signatureRef = useRef("");
  const pickupsRef = useRef<{ pickups: BrawlCrewPickup[]; tick: number }>({ pickups: [], tick: 0 });

  useImperativeHandle(
    ref,
    () => ({
      paint: (frame): void => {
        const signature = resolvePickupsSignature(frame);

        if (signature !== signatureRef.current) {
          signatureRef.current = signature;
          pickupsRef.current = { pickups: frame.pickups, tick: Math.floor(frame.tick / WING_DRAW_STEP_TICKS) * WING_DRAW_STEP_TICKS };
          forceRender();
        }
      }
    }),
    []
  );

  const { pickups, tick } = pickupsRef.current;

  return (
    <g data-brawl-pickups={pickups.length}>
      {pickups.map((pickup) => (
        // The wing stands itself on the band's back line; its depth is this move down the band.
        <g key={`${pickup.x}:${pickup.z}`} transform={`translate(0 ${pickup.z})`} data-brawl-wing="">
          <Wing x={pickup.x} y={0} tick={tick} palette={brawlGoonPalette} />
        </g>
      ))}
    </g>
  );
});

PickupLayer.displayName = "PickupLayer";
