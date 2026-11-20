import { forwardRef, memo, useCallback, useImperativeHandle, useReducer, useRef } from "react";
import type { BrawlCrewFrame, BrawlCrewGoon, BrawlCrewHen, BrawlGoonKind, BrawlGoonState } from "@wingnight/shared";

import type { HenFigure } from "../../resolveHenFigure/index.js";
import { resolveGroundY } from "../Backdrop/layout/index.js";
import { resolveDrawOrder } from "../drawOrder/index.js";
import {
  resolveClankAge,
  resolveGoonBodyTransform,
  resolveGoonDrawTick,
  resolveGoonSlotTransform,
  resolveGoonsSignature
} from "../drawTick/index.js";
import { Goon, brawlGoonPalette } from "../Goons/index.js";
import { HenSlot, paintHen, type HenPaint, type HenRefs } from "../HenSlot/index.js";
import { brawlNight, resolveCrewSlotColour } from "../palette.js";

export type FigureLayerHandle = {
  /**
   * Moves every hen and goon to this frame, and re-renders only when a goon's picture changed or
   * two figures crossed in depth. `resolveHen` says how each hen is drawn — live, or as an
   * ending's beat has her.
   */
  paint: (frame: BrawlCrewFrame, resolveHen: (hen: BrawlCrewHen) => HenPaint) => void;
};

type GoonRefs = { slot: SVGGElement; body: SVGGElement | null };

type RegisterGoon = (spawnIndex: number, refs: GoonRefs | null) => void;

/** One goon: where it is, written by the paint; what it looks like, drawn by React. */
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
    register: RegisterGoon;
  }): JSX.Element => {
    const body = useRef<SVGGElement | null>(null);
    const attach = useCallback(
      (element: SVGGElement | null): void => {
        register(spawnIndex, element === null ? null : { slot: element, body: body.current });
      },
      [register, spawnIndex]
    );

    return (
      <g ref={attach} data-brawl-goon={spawnIndex}>
        {/* A flier's shadow is on its line whatever height it is at: a gull nobody can place in
            depth is unfair (research 3.4). Everything that walks draws its own, at its feet. */}
        {kind === "gull" && <ellipse cx={0} cy={resolveGroundY(0) + 0.4} rx={5.2} ry={1.2} fill={brawlNight.shadow} opacity={0.5} data-brawl-goon-shadow="" />}
        <g ref={body}>
          <Goon kind={kind} x={0} y={0} facing={1} state={state} tick={drawTick} palette={brawlGoonPalette} clank={clank} />
        </g>
      </g>
    );
  }
);

GoonSlot.displayName = "GoonSlot";

const placeGoon = (refs: GoonRefs, goon: BrawlCrewGoon): void => {
  refs.slot.setAttribute("transform", resolveGoonSlotTransform(goon));
  refs.body?.setAttribute("transform", resolveGoonBodyTransform(goon));
  refs.slot.setAttribute("data-brawl-goon-x", `${Math.round(goon.x * 10) / 10}`);
};

const henKey = (slot: number): string => `h${slot}`;
const goonKey = (spawnIndex: number): string => `g${spawnIndex}`;

type FigureLayerProps = {
  /** Each crew slot's hen as the cast draws her, by slot. Stable between frames (`useCrewFigures`). */
  figures: readonly HenFigure[];
};

/**
 * Everyone on the street, hens and goons in ONE layer drawn back of the band first, so a figure
 * nearer the camera is over one further away (`../drawOrder`). Each figure's group is placed by
 * the paint through its refs on every frame; React renders the layer only when its signature
 * changes — a goon arrives, leaves, changes state or turns a walk frame over, or two figures
 * cross in depth — a handful of times a second. `data-brawl-figure-renders` counts those, so a
 * harness can prove a frame with nothing new costs no React work.
 */
const FigureLayerInner = forwardRef<FigureLayerHandle, FigureLayerProps>(({ figures }, ref): JSX.Element => {
  const [, forceRender] = useReducer((count: number) => count + 1, 0);
  const frameRef = useRef<BrawlCrewFrame | null>(null);
  const resolveHenRef = useRef<((hen: BrawlCrewHen) => HenPaint) | null>(null);
  const signatureRef = useRef("");
  const orderRef = useRef<string[]>([]);
  const hens = useRef(new Map<number, HenRefs>());
  const goons = useRef(new Map<number, GoonRefs>());
  const renders = useRef(0);

  // A figure React has only just mounted is put where the frame has it at once, rather than
  // drawn at the origin until the next paint.
  const registerHen = useCallback((slot: number, refs: HenRefs | null): void => {
    if (refs === null) {
      hens.current.delete(slot);

      return;
    }

    hens.current.set(slot, refs);

    const hen = frameRef.current?.hens.find((candidate) => candidate.slot === slot);

    if (hen !== undefined && resolveHenRef.current !== null) {
      paintHen(refs, resolveHenRef.current(hen));
    }
  }, []);

  const registerGoon = useCallback<RegisterGoon>((spawnIndex, refs) => {
    if (refs === null) {
      goons.current.delete(spawnIndex);

      return;
    }

    goons.current.set(spawnIndex, refs);

    const goon = frameRef.current?.goons.find((candidate) => candidate.spawnIndex === spawnIndex);

    if (goon !== undefined) {
      placeGoon(refs, goon);
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      paint: (frame, resolveHen): void => {
        frameRef.current = frame;
        resolveHenRef.current = resolveHen;

        const depths = new Map<string, number>();

        for (const hen of frame.hens) {
          depths.set(henKey(hen.slot), hen.z);
          paintHen(hens.current.get(hen.slot), resolveHen(hen));
        }

        for (const goon of frame.goons) {
          const refs = goons.current.get(goon.spawnIndex);

          depths.set(goonKey(goon.spawnIndex), goon.z);

          if (refs !== undefined) {
            placeGoon(refs, goon);
          }
        }

        orderRef.current = resolveDrawOrder(orderRef.current, depths);

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
  const goonBySpawn = new Map((frame?.goons ?? []).map((goon) => [goonKey(goon.spawnIndex), goon]));
  const henBySlot = new Map((frame?.hens ?? []).map((hen) => [henKey(hen.slot), hen]));

  return (
    <g data-brawl-figures data-brawl-figure-renders={renders.current}>
      {orderRef.current.map((key) => {
        const hen = henBySlot.get(key);
        const figure = hen === undefined ? undefined : figures[hen.slot];

        if (hen !== undefined && figure !== undefined) {
          return <HenSlot key={key} slot={hen.slot} figure={figure} colour={resolveCrewSlotColour(hen.slot)} register={registerHen} />;
        }

        const goon = goonBySpawn.get(key);

        return goon === undefined || frame === null ? null : (
          <GoonSlot
            key={key}
            spawnIndex={goon.spawnIndex}
            kind={goon.kind}
            state={goon.state}
            drawTick={resolveGoonDrawTick(goon.state, frame.tick)}
            clank={resolveClankAge(frame, goon.spawnIndex)}
            register={registerGoon}
          />
        );
      })}
    </g>
  );
});

FigureLayerInner.displayName = "FigureLayer";

// Memoised: the scene re-renders with every snapshot the server sends, and none of them is this
// layer's business — it renders itself, when its own signature changes.
export const FigureLayer = memo(FigureLayerInner);
