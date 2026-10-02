import { forwardRef, memo, useCallback, useImperativeHandle, useReducer, useRef } from "react";
import type { BrawlFrame, BrawlGoon, BrawlGoonKind, BrawlGoonState } from "@wingnight/shared";

import { Goon, brawlGoonPalette } from "../Goons/index.js";
import { resolveDepthOrder, resolveGoonDepth } from "../goonDepth/index.js";
import { resolveClankAge, resolveGoonDrawTick, resolveGoonTransform, resolveGoonsSignature } from "./drawTick/index.js";

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
    clank,
    register
  }: {
    spawnIndex: number;
    kind: BrawlGoonKind;
    state: BrawlGoonState;
    drawTick: number;
    clank: number | null;
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
        <Goon kind={kind} x={0} y={0} facing={1} state={state} tick={drawTick} palette={brawlGoonPalette} clank={clank} />
      </g>
    );
  }
);

GoonSlot.displayName = "GoonSlot";

const placeGoon = (element: SVGGElement, goon: BrawlGoon, depth: number): void => {
  element.setAttribute("transform", resolveGoonTransform(goon, depth));
  element.setAttribute("data-brawl-goon-x", `${Math.round(goon.x * 10) / 10}`);

  const depthText = `${Math.round(depth * 100) / 100}`;

  if (element.getAttribute("data-brawl-goon-depth") !== depthText) {
    element.setAttribute("data-brawl-goon-depth", depthText);
  }
};

const byDrawOrder = (frame: BrawlFrame | null, order: number[]): BrawlGoon[] => {
  const goons = frame?.goons ?? [];
  const rank = new Map(order.map((spawnIndex, index) => [spawnIndex, index]));

  return [...goons].sort((left, right) => (rank.get(left.spawnIndex) ?? 0) - (rank.get(right.spawnIndex) ?? 0));
};

/**
 * The street's goons. Their drawings are React components with a `state`, so a goon is rendered
 * by React — but only when the layer's signature changes (a goon arrives, leaves, changes state,
 * its walk frame turns over, or a clank bursts off a helmet goose's cage), a handful of times a
 * second; on every other frame the paint just
 * moves the groups. `data-brawl-goon-renders` counts the layer's renders, so a harness can prove
 * a frame with nothing new costs no React work.
 *
 * Each goon also stands on a depth line while it is far from the hen (`../goonDepth`), and the
 * goons are drawn far line first, so a nearer one is over a further one. The depth slides every
 * frame through the transform; the draw order is React's, and changes only when two goons cross.
 */
export const GoonLayer = forwardRef<GoonLayerHandle>((_props, ref): JSX.Element => {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const frameRef = useRef<BrawlFrame | null>(null);
  const signatureRef = useRef("");
  // The depth each goon was last drawn at — a goon reeling or down keeps it — and the order
  // they were last drawn in, far line first.
  const depthsRef = useRef(new Map<number, number>());
  const orderRef = useRef<number[]>([]);
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
      placeGoon(element, goon, depthsRef.current.get(spawnIndex) ?? 0);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      paint: (frame: BrawlFrame): void => {
        frameRef.current = frame;

        const depths = new Map<number, number>();

        for (const goon of frame.goons) {
          const depth = resolveGoonDepth(goon, frame.x, depthsRef.current.get(goon.spawnIndex));
          const element = nodes.current.get(goon.spawnIndex);

          depths.set(goon.spawnIndex, depth);

          if (element !== undefined) {
            placeGoon(element, goon, depth);
          }
        }

        depthsRef.current = depths;
        orderRef.current = resolveDepthOrder(depths);

        const signature = `${resolveGoonsSignature(frame)}|${orderRef.current.join(",")}`;

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
      {byDrawOrder(frame, orderRef.current).map((goon) => (
        <GoonSlot
          key={goon.spawnIndex}
          spawnIndex={goon.spawnIndex}
          kind={goon.kind}
          state={goon.state}
          drawTick={resolveGoonDrawTick(goon.state, frame?.tick ?? 0)}
          clank={frame === null ? null : resolveClankAge(frame, goon.spawnIndex)}
          register={register}
        />
      ))}
    </g>
  );
});

GoonLayer.displayName = "GoonLayer";
