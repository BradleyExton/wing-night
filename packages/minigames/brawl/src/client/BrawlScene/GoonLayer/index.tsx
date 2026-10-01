import { forwardRef, memo, useCallback, useImperativeHandle, useReducer, useRef } from "react";
import type { BrawlFrame, BrawlGoon, BrawlGoonKind, BrawlGoonState } from "@wingnight/shared";

import { Goon, brawlGoonPalette } from "../Goons/index.js";
import { resolveGoonDrawTick, resolveGoonTransform, resolveGoonsSignature } from "./drawTick/index.js";

export type GoonLayerHandle = {
  /** Moves every goon on the street to this frame, and redraws only the ones whose picture changed. */
  paint: (frame: BrawlFrame) => void;
};

type Register = (spawnIndex: number, element: SVGGElement | null) => void;

/** One goon's group: where it is, written by the paint; what it looks like, drawn by React. */
const GoonSlot = memo(
  ({
    spawnIndex,
    kind,
    state,
    drawTick,
    register
  }: {
    spawnIndex: number;
    kind: BrawlGoonKind;
    state: BrawlGoonState;
    drawTick: number;
    register: Register;
  }): JSX.Element => {
    const attach = useCallback(
      (element: SVGGElement | null): void => {
        register(spawnIndex, element);
      },
      [register, spawnIndex]
    );

    return (
      <g ref={attach} data-brawl-goon={spawnIndex}>
        <Goon kind={kind} x={0} y={0} facing={1} state={state} tick={drawTick} palette={brawlGoonPalette} />
      </g>
    );
  }
);

GoonSlot.displayName = "GoonSlot";

const placeGoon = (element: SVGGElement, goon: BrawlGoon): void => {
  element.setAttribute("transform", resolveGoonTransform(goon));
  element.setAttribute("data-brawl-goon-x", `${Math.round(goon.x * 10) / 10}`);
};

/**
 * The street's goons. Their drawings are React components with a `state`, so a goon is rendered
 * by React — but only when the layer's signature changes (a goon arrives, leaves, changes state,
 * or its walk frame turns over), a handful of times a second; on every other frame the paint just
 * moves the groups. `data-brawl-goon-renders` counts the layer's renders, so a harness can prove
 * a frame with nothing new costs no React work.
 */
export const GoonLayer = forwardRef<GoonLayerHandle>((_props, ref): JSX.Element => {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const frameRef = useRef<BrawlFrame | null>(null);
  const signatureRef = useRef("");
  const nodes = useRef(new Map<number, SVGGElement>());
  const renders = useRef(0);

  const register = useCallback<Register>((spawnIndex, element) => {
    if (element === null) {
      nodes.current.delete(spawnIndex);
      return;
    }

    nodes.current.set(spawnIndex, element);

    const goon = frameRef.current?.goons.find((candidate) => candidate.spawnIndex === spawnIndex);

    if (goon !== undefined) {
      placeGoon(element, goon);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      paint: (frame: BrawlFrame): void => {
        frameRef.current = frame;

        for (const goon of frame.goons) {
          const element = nodes.current.get(goon.spawnIndex);

          if (element !== undefined) {
            placeGoon(element, goon);
          }
        }

        const signature = resolveGoonsSignature(frame);

        if (signature !== signatureRef.current) {
          signatureRef.current = signature;
          forceRender();
        }
      }
    }),
    []
  );

  renders.current += 1;

  const frame = frameRef.current;

  return (
    <g data-brawl-goon-layer data-brawl-goon-renders={renders.current}>
      {(frame?.goons ?? []).map((goon) => (
        <GoonSlot
          key={goon.spawnIndex}
          spawnIndex={goon.spawnIndex}
          kind={goon.kind}
          state={goon.state}
          drawTick={resolveGoonDrawTick(goon.state, frame?.tick ?? 0)}
          register={register}
        />
      ))}
    </g>
  );
});

GoonLayer.displayName = "GoonLayer";
