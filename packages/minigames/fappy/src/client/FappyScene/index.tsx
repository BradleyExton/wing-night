import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Character } from "@wingnight/cast";
import type { FappyFrame, FappyGate } from "@wingnight/shared";
import {
  FAPPY_WORLD,
  createFappyLegStart,
  resolveFappyChampTop,
  resolveFappyWave
} from "@wingnight/shared";

import type { LegBird } from "../resolveLegBird/index.js";
import { fappyPalette } from "./palette.js";
import * as styles from "./styles.js";

export type FappySceneHandle = {
  paint: (frame: FappyFrame) => void;
};

export type FappySceneProps = {
  gates: readonly FappyGate[];
  bird: LegBird;
  sceneId: string;
  label: string;
};

// The hen's box in world units: the 80×72 drawing at a fifth.
const BIRD_BOX_HEIGHT = 14.4;
// Nose up on a flap, nose down as it falls; capped so a crash reads as a
// dive, not a cartwheel.
const TILT_PER_VELOCITY = 14;
const TILT_MIN = -28;
const TILT_MAX = 70;
const CHAMP_HEAD_RADIUS = 3.5;
// The head's sideways wiggle: a slow wave, a unit and a bit each way.
const SWAY_PERIOD_TICKS = 53;
const SWAY_UNITS = 1.2;
// The eagle's wingbeat, as a small rise and fall of the wings.
const WINGBEAT_PERIOD_TICKS = 28;
const WINGBEAT_UNITS = 1.4;

const resolveTilt = (vy: number): number => {
  return Math.min(TILT_MAX, Math.max(TILT_MIN, vy * TILT_PER_VELOCITY));
};

const Eyes = ({ cx, cy }: { cx: number; cy: number }): JSX.Element => (
  <g>
    <circle cx={cx - 1.4} cy={cy - 0.8} r={0.8} fill={fappyPalette.eye} />
    <circle cx={cx + 1.4} cy={cy - 0.8} r={0.8} fill={fappyPalette.eye} />
    <circle cx={cx - 1.7} cy={cy - 0.8} r={0.4} fill={fappyPalette.pupil} />
    <circle cx={cx + 1.1} cy={cy - 0.8} r={0.4} fill={fappyPalette.pupil} />
  </g>
);

type GateRefs = {
  shaft: SVGRectElement | null;
  head: SVGGElement | null;
  wings: SVGGElement | null;
};

// One champ standing up from the floor, its head at the top of its reach.
// The loop grows and shrinks the shaft and moves the head on every frame;
// the balls stay on the sand.
const Champ = ({
  gate,
  registerRefs
}: {
  gate: FappyGate;
  registerRefs: (part: keyof GateRefs, element: SVGRectElement | SVGGElement | null) => void;
}): JSX.Element => {
  const { gateWidth, floorY } = FAPPY_WORLD;
  const centreX = gate.x + gateWidth / 2;
  const headY = gate.champTop + CHAMP_HEAD_RADIUS;
  const stroke = { stroke: fappyPalette.champDark, strokeWidth: 0.6 };

  return (
    <g data-fappy-champ>
      <circle cx={gate.x + 1.5} cy={floorY - 2.5} r={3} fill={fappyPalette.champ} {...stroke} />
      <circle cx={gate.x + gateWidth - 1.5} cy={floorY - 2.5} r={3} fill={fappyPalette.champ} {...stroke} />
      <rect
        ref={(element): void => registerRefs("shaft", element)}
        x={gate.x + 2}
        y={headY}
        width={gateWidth - 4}
        height={floorY + 4 - headY}
        rx={3}
        fill={fappyPalette.champ}
        {...stroke}
      />
      <g ref={(element): void => registerRefs("head", element)}>
        <circle cx={centreX} cy={headY} r={CHAMP_HEAD_RADIUS} fill={fappyPalette.champ} {...stroke} />
        <Eyes cx={centreX - 0.6} cy={headY} />
      </g>
    </g>
  );
};

// A bald eagle hanging in the sky over a gate, wings out, talons down,
// looking at the bird coming.
const Eagle = ({
  gate,
  eagleBottom,
  registerRefs
}: {
  gate: FappyGate;
  eagleBottom: number;
  registerRefs: (part: keyof GateRefs, element: SVGRectElement | SVGGElement | null) => void;
}): JSX.Element => {
  const { gateWidth, eagleHeight } = FAPPY_WORLD;
  const centreX = gate.x + gateWidth / 2;
  const top = eagleBottom - eagleHeight;
  const bodyY = eagleBottom - 4;

  return (
    <g data-fappy-eagle>
      <g ref={(element): void => registerRefs("wings", element)}>
        <path
          d={`M ${centreX - 2} ${bodyY} L ${centreX - 9} ${top + 1} L ${centreX - 7} ${top} L ${centreX - 1} ${bodyY - 2.5} Z`}
          fill={fappyPalette.eagle}
          stroke={fappyPalette.eagleDark}
          strokeWidth={0.4}
        />
        <path
          d={`M ${centreX + 2} ${bodyY} L ${centreX + 9} ${top + 1} L ${centreX + 7} ${top} L ${centreX + 1} ${bodyY - 2.5} Z`}
          fill={fappyPalette.eagle}
          stroke={fappyPalette.eagleDark}
          strokeWidth={0.4}
        />
      </g>
      <ellipse cx={centreX} cy={bodyY} rx={3.4} ry={2.2} fill={fappyPalette.eagle} stroke={fappyPalette.eagleDark} strokeWidth={0.4} />
      <path
        d={`M ${centreX - 1.5} ${eagleBottom - 2} L ${centreX - 2} ${eagleBottom} M ${centreX + 1.5} ${eagleBottom - 2} L ${centreX + 2} ${eagleBottom}`}
        stroke={fappyPalette.eagleBeak}
        strokeWidth={0.6}
        strokeLinecap="round"
      />
      <circle cx={centreX - 3.6} cy={bodyY - 1.4} r={1.6} fill={fappyPalette.eagleHead} stroke={fappyPalette.eagleDark} strokeWidth={0.3} />
      <path
        d={`M ${centreX - 5} ${bodyY - 1.6} L ${centreX - 6.6} ${bodyY - 1} L ${centreX - 5} ${bodyY - 0.6} Z`}
        fill={fappyPalette.eagleBeak}
      />
      <circle cx={centreX - 4.1} cy={bodyY - 1.8} r={0.35} fill={fappyPalette.pupil} />
    </g>
  );
};

// One 16:9 world both surfaces draw. The gate layer is an SVG in world units
// and the bird an HTML box over it; neither is React-driven per frame — the
// owner paints frames through the handle from its own animation loop, so the
// scene re-renders only when the course or the bird changes.
export const FappyScene = forwardRef<FappySceneHandle, FappySceneProps>(
  ({ gates, bird, sceneId, label }, ref): JSX.Element => {
    const gateLayerRef = useRef<SVGGElement>(null);
    const birdRef = useRef<HTMLDivElement>(null);
    const gateRefs = useRef(new Map<number, GateRefs>());
    const gatesRef = useRef(gates);

    gatesRef.current = gates;

    const registerGateRefs =
      (gateIndex: number) =>
      (part: keyof GateRefs, element: SVGRectElement | SVGGElement | null): void => {
        const entry = gateRefs.current.get(gateIndex) ?? { shaft: null, head: null, wings: null };

        gateRefs.current.set(gateIndex, { ...entry, [part]: element });
      };

    const paint = (frame: FappyFrame): void => {
      const gateLayer = gateLayerRef.current;
      const birdBox = birdRef.current;

      if (gateLayer !== null) {
        gateLayer.setAttribute("transform", `translate(${-frame.scrollX} 0)`);
      }

      for (const gate of gatesRef.current) {
        const refs = gateRefs.current.get(gate.index);

        if (refs === undefined) {
          continue;
        }

        const champTop = resolveFappyChampTop(gate, frame.tick);
        const headY = champTop + CHAMP_HEAD_RADIUS;
        const sway = (resolveFappyWave(frame.tick, SWAY_PERIOD_TICKS, gate.champPhaseTicks) * 2 - 1) * SWAY_UNITS;

        refs.shaft?.setAttribute("y", `${headY}`);
        refs.shaft?.setAttribute("height", `${FAPPY_WORLD.floorY + 4 - headY}`);
        refs.head?.setAttribute("transform", `translate(${sway} ${champTop - gate.champTop})`);
        refs.wings?.setAttribute(
          "transform",
          `translate(0 ${(resolveFappyWave(frame.tick, WINGBEAT_PERIOD_TICKS, 0) - 0.5) * WINGBEAT_UNITS})`
        );
      }

      if (birdBox !== null) {
        const top = frame.bird.y - BIRD_BOX_HEIGHT / 2;

        birdBox.style.transform = `translate3d(0, calc(${top} * var(--fappy-unit)), 0) rotate(${resolveTilt(frame.bird.vy)}deg)`;
      }
    };

    useImperativeHandle(ref, () => ({ paint }));

    // The rest pose, before any loop has run: a bird hovering at the start
    // line. Without this the box sits at the ceiling until the first frame.
    useLayoutEffect(() => {
      paint(createFappyLegStart());
    }, [sceneId]);

    const labelId = `${sceneId}-label`;

    return (
      <div className={styles.frame} data-fappy-scene={sceneId}>
        <div className={styles.scene} role="img" aria-labelledby={labelId}>
          <span id={labelId} className={styles.label}>
            {label}
          </span>
          <svg
            className={styles.gateLayer}
            viewBox={`0 0 ${FAPPY_WORLD.width} ${FAPPY_WORLD.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              x1={0}
              y1={FAPPY_WORLD.floorY}
              x2={FAPPY_WORLD.width}
              y2={FAPPY_WORLD.floorY}
              stroke={fappyPalette.sandLine}
              strokeWidth={0.6}
            />
            <g ref={gateLayerRef} data-fappy-gates>
              {gates.map((gate) => (
                <g key={gate.index} data-fappy-gate={gate.index}>
                  {gate.eagleBottom !== null && (
                    <Eagle gate={gate} eagleBottom={gate.eagleBottom} registerRefs={registerGateRefs(gate.index)} />
                  )}
                  <Champ gate={gate} registerRefs={registerGateRefs(gate.index)} />
                </g>
              ))}
            </g>
          </svg>
          <div ref={birdRef} className={styles.bird} data-fappy-bird>
            <Character
              appearance={bird.appearance}
              apparel={bird.apparel}
              fillClassName={bird.fillClassName}
            />
          </div>
        </div>
      </div>
    );
  }
);

FappyScene.displayName = "FappyScene";
