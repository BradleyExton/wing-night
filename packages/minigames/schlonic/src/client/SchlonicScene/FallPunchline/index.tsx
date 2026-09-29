import { forwardRef, useImperativeHandle, useRef } from "react";

import type { SchlonicCamera } from "../camera/index.js";
import { Dust, type DustHandle } from "../Dust/index.js";
import {
  resolveBundleSize,
  resolveDustShare,
  resolveRaccoon,
  type Trench
} from "../punchlineTimeline/index.js";
import { Raccoon, type RaccoonHandle } from "../Raccoon/index.js";
import { Wing } from "../Wing/index.js";

export type FallPunchlineHandle = {
  paint: (input: {
    elapsedMs: number;
    trench: Trench;
    wingsLost: number;
    camera: SchlonicCamera;
    /** The street's height at a screen x, for the raccoon to run along. */
    groundAt: (screenX: number) => number;
  }) => void;
  hide: () => void;
};

// The handful as a drawing: up to three wings in a heap, the first on top.
const BUNDLE_WINGS = [
  { x: 0, y: 0, angle: 0 },
  { x: -2.3, y: 0.7, angle: -35 },
  { x: 2.2, y: 0.9, angle: 40 }
] as const;
const BUNDLE_SCALE = 0.85;

const Bundle = (): JSX.Element => (
  <g>
    {BUNDLE_WINGS.slice()
      .reverse()
      .map((wing) => (
        <g key={wing.x} transform={`translate(${wing.x} ${wing.y}) rotate(${wing.angle})`}>
          <Wing scale={BUNDLE_SCALE} />
        </g>
      ))}
  </g>
);

/** Where the trench's lip cuts the picture: everything the hen and the raccoon have under it is the dig's. */
const LIP_CLIP_SLACK = 0.5;

/**
 * The fall's punchline, in the picture's own coordinates: the dust the thud throws up out of the
 * trench, and the raccoon that climbs out of it with the handful. The hen itself is the scene's
 * runner, moved into the trench by the scene and clipped at the lip (`clipId`, which this layer
 * owns and moves to the trench on every paint); this layer is drawn over it.
 */
type FallPunchlineProps = {
  /** The id the scene clips the hen with while it is down the trench. */
  clipId: string;
  camera: SchlonicCamera;
};

export const FallPunchline = forwardRef<FallPunchlineHandle, FallPunchlineProps>(
  ({ clipId, camera }, ref): JSX.Element => {
    const group = useRef<SVGGElement>(null);
    const clipRect = useRef<SVGRectElement>(null);
    const dust = useRef<DustHandle>(null);
    const raccoonClip = useRef<SVGGElement>(null);
    const raccoon = useRef<RaccoonHandle>(null);
    const haul = useRef<SVGGElement>(null);

    const showBundle = (size: number): void => {
      Array.from(haul.current?.children[0]?.children ?? []).forEach((wing, index, wings) => {
        // The heap is drawn back to front, so the wing that goes first is the last child.
        wing.setAttribute("opacity", wings.length - 1 - index < size ? "1" : "0");
      });
    };

    useImperativeHandle(ref, () => ({
      paint: ({ elapsedMs, trench, wingsLost, camera: paintCamera, groundAt }): void => {
        const size = resolveBundleSize(wingsLost);
        const placement = resolveRaccoon(elapsedMs, trench, paintCamera, groundAt);

        group.current?.setAttribute("opacity", "1");
        clipRect.current?.setAttribute("x", `${paintCamera.x - 20}`);
        clipRect.current?.setAttribute("y", `${paintCamera.y - 60}`);
        clipRect.current?.setAttribute("width", `${paintCamera.width + 40}`);
        clipRect.current?.setAttribute("height", `${trench.lipY + LIP_CLIP_SLACK - paintCamera.y + 60}`);
        dust.current?.paint((trench.fromX + trench.toX) / 2, trench.lipY, trench.toX - trench.fromX, resolveDustShare(elapsedMs));
        showBundle(size);
        // Down in the dig it is the lip that hides it; up on the street, nothing does.
        if (placement.isClimbing) {
          raccoonClip.current?.setAttribute("clip-path", `url(#${clipId})`);
        } else {
          raccoonClip.current?.removeAttribute("clip-path");
        }

        raccoon.current?.place({ ...placement, visible: placement.visible && size > 0 });
      },
      hide: (): void => {
        group.current?.setAttribute("opacity", "0");
        raccoon.current?.place({ visible: false, x: 0, y: 0, stride: 0, chitter: 0, isClimbing: false });
      }
    }));

    return (
      <g ref={group} opacity={0} data-schlonic-fall-punchline>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect ref={clipRect} x={camera.x - 20} y={camera.y - 60} width={camera.width + 40} height={camera.height + 60} />
        </clipPath>
        {/* The dust over the hen as it comes up through it, and under the raccoon climbing out. */}
        <Dust ref={dust} />
        <g ref={raccoonClip}>
          <Raccoon ref={raccoon}>
            <g ref={haul}>
              <Bundle />
            </g>
          </Raccoon>
        </g>
      </g>
    );
  }
);

FallPunchline.displayName = "FallPunchline";
