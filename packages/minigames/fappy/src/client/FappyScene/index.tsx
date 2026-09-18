import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { FappyFrame, FappyGate } from "@wingnight/shared";
import {
  FAPPY_WORLD,
  createFappyLegStart,
  resolveFappyChampTop,
  resolveFappyLandingX,
  resolveFappyWaitingX,
  resolveFappyWave
} from "@wingnight/shared";

import type { LegBird } from "../resolveLegBird/index.js";
import { Backdrop, FAR_DUNE_PARALLAX, NEAR_DUNE_PARALLAX, type BackdropRefs } from "./Backdrop/index.js";
import { BirdSprite, type BirdSpriteRefs } from "./BirdSprite/index.js";
import { CHAMP_HEAD_RADIUS, Champ, ChampDefs, type ChampRefs } from "./Champ/index.js";
import { Cliffs, FinishFlag } from "./Cliffs/index.js";
import { EAGLE_WINGBEAT_DEGREES, Eagle, resolveEagleShoulders, type EagleRefs } from "./Eagle/index.js";
import { fappyPalette } from "./palette.js";
import { resolveCrashPose, resolveHandoffPose, resolveTilt, resolveWingAngle } from "./pose/index.js";
import * as styles from "./styles.js";

export type FappySceneHandle = {
  paint: (frame: FappyFrame) => void;
  // The two beats the surfaces play over a settled frame, `progress` 0 → 1:
  // the landing that hands the tablet on, and a crash before the respawn.
  paintHandoff: (frame: FappyFrame, progress: number) => void;
  paintCrash: (frame: FappyFrame, progress: number) => void;
};

export type FappySceneProps = {
  gates: readonly FappyGate[];
  gatesPerLeg: number;
  bird: LegBird;
  // Who stands on the landing cliff waiting to take over; null on the last
  // leg, where a flag marks the finish instead.
  waitingBird: LegBird | null;
  sceneId: string;
  label: string;
};

// The hen's box in world units: the 80×72 drawing at a fifth.
const BIRD_BOX_WIDTH = 16;
const BIRD_BOX_HEIGHT = 14.4;
// The puff's box, in world units, centred on the bird's feet.
const PUFF_SIZE = 16;
// The champ head's sideways wiggle: a slow wave, a unit and a bit each way.
const SWAY_PERIOD_TICKS = 53;
const SWAY_UNITS = 1.2;
// The eagle's wingbeat.
const WINGBEAT_PERIOD_TICKS = 26;
// A knocked eagle tumbles up and away for this long, then is gone.
const EAGLE_EXIT_TICKS = 40;
// Two birds on the plateau want their centres at least this far apart, or
// one is drawn over the other; the waiter steps aside to make it so.
const BIRD_GAP_UNITS = 15;

type GateRefs = ChampRefs & EagleRefs;

const EMPTY_GATE_REFS: GateRefs = { shaft: null, head: null, eagle: null, leftWing: null, rightWing: null };

const unit = (value: number): string => `calc(${value} * var(--fappy-unit))`;

// One 16:9 world both surfaces draw. The backdrop and gate layers are SVG in
// world units and the birds HTML boxes over it; none is React-driven per
// frame — the owner paints frames through the handle from its own animation
// loop, so the scene re-renders only when the course or the birds change.
export const FappyScene = forwardRef<FappySceneHandle, FappySceneProps>(
  ({ gates, gatesPerLeg, bird, waitingBird, sceneId, label }, ref): JSX.Element => {
    const sceneElementRef = useRef<HTMLDivElement>(null);
    const gateLayerRef = useRef<SVGGElement>(null);
    const backdropRef = useRef<BackdropRefs | null>(null);
    const birdRef = useRef<BirdSpriteRefs | null>(null);
    const waitingBirdRef = useRef<BirdSpriteRefs | null>(null);
    const puffRef = useRef<HTMLDivElement>(null);
    const gateRefs = useRef(new Map<number, GateRefs>());
    const gatesRef = useRef(gates);
    const gatesPerLegRef = useRef(gatesPerLeg);
    const ids = {
      label: `${sceneId}-label`,
      sun: `${sceneId}-sun`,
      shaft: `${sceneId}-champ-shaft`,
      head: `${sceneId}-champ-head`
    };

    gatesRef.current = gates;
    gatesPerLegRef.current = gatesPerLeg;

    const registerGateRefs =
      (gateIndex: number) =>
      (part: keyof GateRefs, element: SVGRectElement | SVGGElement | null): void => {
        const entry = gateRefs.current.get(gateIndex) ?? EMPTY_GATE_REFS;

        gateRefs.current.set(gateIndex, { ...entry, [part]: element });
      };

    const paintGates = (frame: FappyFrame): void => {
      gateLayerRef.current?.setAttribute("transform", `translate(${-frame.scrollX} 0)`);
      backdropRef.current?.far?.setAttribute("transform", `translate(${-frame.scrollX * FAR_DUNE_PARALLAX} 0)`);
      backdropRef.current?.near?.setAttribute("transform", `translate(${-frame.scrollX * NEAR_DUNE_PARALLAX} 0)`);

      const wingbeat = (resolveFappyWave(frame.tick, WINGBEAT_PERIOD_TICKS, 0) - 0.5) * EAGLE_WINGBEAT_DEGREES;

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

        if (refs.eagle === null || gate.eagleBottom === null) {
          continue;
        }

        const shoulders = resolveEagleShoulders(gate, gate.eagleBottom);

        // A point left of its pivot rises on a clockwise turn, one right of
        // it on an anticlockwise turn: opposite signs lift both tips together.
        refs.leftWing?.setAttribute("transform", `rotate(${wingbeat} ${shoulders.leftX} ${shoulders.y})`);
        refs.rightWing?.setAttribute("transform", `rotate(${-wingbeat} ${shoulders.rightX} ${shoulders.y})`);

        // A bumped eagle tumbles up and off; one bumped on an earlier attempt
        // (tick -1) is simply not there.
        const knocked = frame.knockedEagles.find((entry) => entry.gate === gate.index);

        if (knocked === undefined) {
          refs.eagle.setAttribute("transform", "");
          refs.eagle.setAttribute("opacity", "1");
        } else if (knocked.tick < 0 || frame.tick - knocked.tick > EAGLE_EXIT_TICKS) {
          refs.eagle.setAttribute("opacity", "0");
        } else {
          const gone = frame.tick - knocked.tick;
          const centreX = gate.x + FAPPY_WORLD.gateWidth / 2;
          const centreY = gate.eagleBottom - 4;

          refs.eagle.setAttribute(
            "transform",
            `translate(${gone * 1.6} ${-gone * 1.9}) rotate(${gone * 9} ${centreX} ${centreY})`
          );
          refs.eagle.setAttribute("opacity", `${Math.max(0, 1 - gone / EAGLE_EXIT_TICKS)}`);
        }
      }
    };

    const paintBird = (frame: FappyFrame, extra: { tilt: number; sink: number; scaleY: number }): void => {
      const box = birdRef.current?.box ?? null;
      const wing = birdRef.current?.wing ?? null;

      if (box !== null) {
        const top = frame.bird.y - BIRD_BOX_HEIGHT / 2 + extra.sink;

        box.style.transform = `translate3d(0, ${unit(top)}, 0) rotate(${resolveTilt(frame.bird.vy) + extra.tilt}deg) scaleY(${extra.scaleY})`;
      }

      if (wing !== null) {
        wing.style.transform = `rotate(${resolveWingAngle(frame.bird)}deg)`;
      }
    };

    // The waiter stands on the landing plateau, facing the bird coming in,
    // and scrolls with the course like everything else on it.
    const paintWaiter = (frame: FappyFrame, hop: number, wingAngle: number, shift = 0): void => {
      const box = waitingBirdRef.current?.box ?? null;
      const wing = waitingBirdRef.current?.wing ?? null;

      if (box !== null) {
        const left = resolveFappyWaitingX(gatesPerLegRef.current) + shift - BIRD_BOX_WIDTH / 2 - frame.scrollX;
        const top = FAPPY_WORLD.cliffTop - BIRD_BOX_HEIGHT + 1 - hop;

        box.style.transform = `translate3d(${unit(left)}, ${unit(top)}, 0) scaleX(-1)`;
      }

      if (wing !== null) {
        wing.style.transform = `rotate(${wingAngle}deg)`;
      }
    };

    const paintPuff = (frame: FappyFrame, opacity: number, scale: number): void => {
      const puff = puffRef.current;

      if (puff === null) {
        return;
      }

      const top = frame.bird.y + BIRD_BOX_HEIGHT / 2 - PUFF_SIZE / 2 - 2;

      puff.style.opacity = `${opacity}`;
      puff.style.transform = `translate3d(0, ${unit(top)}, 0) scale(${scale})`;
    };

    const paintShake = (shake: number): void => {
      const scene = sceneElementRef.current;

      if (scene !== null) {
        scene.style.transform = shake === 0 ? "" : `translate3d(${unit(shake)}, 0, 0)`;
      }
    };

    const paint = (frame: FappyFrame): void => {
      paintGates(frame);
      paintBird(frame, { tilt: 0, sink: 0, scaleY: 1 });
      paintWaiter(frame, 0, 0);
      paintPuff(frame, 0, 1);
      paintShake(0);
    };

    // How far the waiter has to step towards the wall so the bird that just
    // landed is beside it and not on it; as far as the wall allows.
    const resolveWaiterShift = (frame: FappyFrame): number => {
      const gatesPerLegNow = gatesPerLegRef.current;
      const waitingX = resolveFappyWaitingX(gatesPerLegNow);
      const wallX = resolveFappyLandingX(gatesPerLegNow) + FAPPY_WORLD.landingZoneWidth;
      const landedX = FAPPY_WORLD.birdX + frame.scrollX;
      const needed = Math.max(0, BIRD_GAP_UNITS - (waitingX - landedX));

      return Math.max(0, Math.min(needed, wallX - BIRD_BOX_WIDTH / 2 - waitingX));
    };

    const paintHandoff = (frame: FappyFrame, progress: number): void => {
      const pose = resolveHandoffPose(progress);

      paintGates(frame);
      paintBird(frame, { tilt: 0, sink: 0, scaleY: pose.landedScaleY });
      paintWaiter(frame, pose.waiterHop, pose.waiterWingAngle, resolveWaiterShift(frame) * pose.waiterShift);
      paintPuff(frame, pose.puffOpacity, pose.puffScale);
      paintShake(0);
    };

    const paintCrash = (frame: FappyFrame, progress: number): void => {
      const pose = resolveCrashPose(progress);

      paintGates(frame);
      paintBird(frame, { tilt: pose.extraTilt, sink: pose.sink, scaleY: 1 });
      paintWaiter(frame, 0, 0);
      paintPuff(frame, pose.puffOpacity, pose.puffScale);
      paintShake(pose.shake);
    };

    useImperativeHandle(ref, () => ({ paint, paintHandoff, paintCrash }));

    // The rest pose, before any loop has run: a bird standing on the start
    // cliff. Without this the boxes sit at the top-left until the first frame.
    useLayoutEffect(() => {
      paint(createFappyLegStart(gatesRef.current, 0));
    }, [sceneId, waitingBird === null]);

    return (
      <div className={styles.frame} data-fappy-scene={sceneId}>
        <div ref={sceneElementRef} className={styles.scene} role="img" aria-labelledby={ids.label}>
          <span id={ids.label} className={styles.label}>
            {label}
          </span>
          <svg
            className={styles.gateLayer}
            viewBox={`0 0 ${FAPPY_WORLD.width} ${FAPPY_WORLD.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <ChampDefs shaftGradientId={ids.shaft} headGradientId={ids.head} />
            <Backdrop ref={backdropRef} sunId={ids.sun} />
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
                  <Champ
                    gate={gate}
                    shaftGradientId={ids.shaft}
                    headGradientId={ids.head}
                    registerRefs={registerGateRefs(gate.index)}
                  />
                </g>
              ))}
              <Cliffs gatesPerLeg={gatesPerLeg} />
              {waitingBird === null && <FinishFlag gatesPerLeg={gatesPerLeg} />}
            </g>
          </svg>
          <div ref={puffRef} className={styles.puff} data-fappy-puff />
          {waitingBird !== null && (
            <BirdSprite ref={waitingBirdRef} bird={waitingBird} className={styles.waitingBird} dataAttribute="data-fappy-waiting-bird" />
          )}
          <BirdSprite ref={birdRef} bird={bird} className={styles.bird} dataAttribute="data-fappy-bird" />
        </div>
      </div>
    );
  }
);

FappyScene.displayName = "FappyScene";
