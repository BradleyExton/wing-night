import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { Character } from "@wingnight/cast";
import type { FappyFrame, FappyGate } from "@wingnight/shared";
import { FAPPY_WORLD, createFappyLegStart } from "@wingnight/shared";

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

// One champ, standing up from the floor or hanging from the ceiling, its
// head at the gap's edge. JOUST's opponent, drawn in JOUST's cyan.
const Champ = ({ gate, hanging }: { gate: FappyGate; hanging: boolean }): JSX.Element => {
  const { gateWidth, floorY } = FAPPY_WORLD;
  const centreX = gate.x + gateWidth / 2;
  const headRadius = 3.5;
  const headY = hanging ? gate.gapTop - headRadius : gate.gapBottom + headRadius;
  const shaftTop = hanging ? -4 : headY;
  const shaftBottom = hanging ? headY : floorY + 4;
  const ballY = hanging ? 2.5 : floorY - 2.5;
  const stroke = { stroke: fappyPalette.champDark, strokeWidth: 0.6 };

  return (
    <g data-fappy-champ={hanging ? "hanging" : "standing"}>
      <circle cx={gate.x + 1.5} cy={ballY} r={3} fill={fappyPalette.champ} {...stroke} />
      <circle cx={gate.x + gateWidth - 1.5} cy={ballY} r={3} fill={fappyPalette.champ} {...stroke} />
      <rect
        x={gate.x + 2}
        y={shaftTop}
        width={gateWidth - 4}
        height={shaftBottom - shaftTop}
        rx={3}
        fill={fappyPalette.champ}
        {...stroke}
      />
      <line
        x1={gate.x + 3.6}
        y1={hanging ? 0 : headY + headRadius}
        x2={gate.x + 3.6}
        y2={hanging ? headY - headRadius : floorY}
        stroke={fappyPalette.champLight}
        strokeWidth={0.5}
        opacity={0.6}
      />
      <circle cx={centreX} cy={headY} r={headRadius} fill={fappyPalette.champ} {...stroke} />
      <Eyes cx={centreX - 0.6} cy={headY} />
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

    const paint = (frame: FappyFrame): void => {
      const gateLayer = gateLayerRef.current;
      const birdBox = birdRef.current;

      if (gateLayer !== null) {
        gateLayer.setAttribute("transform", `translate(${-frame.scrollX} 0)`);
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
                  <Champ gate={gate} hanging />
                  <Champ gate={gate} hanging={false} />
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
