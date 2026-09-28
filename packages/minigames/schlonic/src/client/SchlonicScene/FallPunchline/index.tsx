import { forwardRef, useImperativeHandle, useRef } from "react";

import type { SchlonicCamera } from "../camera/index.js";
import { Gull, type GullHandle } from "../Gull/index.js";
import { schlonicPalette } from "../palette.js";
import {
  BAY_SURFACE_Y,
  FALL_SPLASH_AT_MS,
  FALL_SPLASH_MS,
  GULL_GRAB_AT_MS,
  resolveBayHen,
  resolveBundleRest,
  resolveBundleSize,
  resolveGullFlight,
} from "../punchlineTimeline/index.js";
import { Splash, type SplashHandle } from "../Splash/index.js";
import { Wing } from "../Wing/index.js";

export type FallPunchlineHandle = {
  paint: (input: {
    elapsedMs: number;
    bayX: number;
    wingsLost: number;
    camera: SchlonicCamera;
  }) => void;
  hide: () => void;
};

// The handful as a drawing: up to three wings in a heap, the first on top.
const BUNDLE_WINGS = [
  { x: 0, y: 0, angle: 0 },
  { x: -2.3, y: 0.7, angle: -35 },
  { x: 2.2, y: 0.9, angle: 40 },
] as const;
const BUNDLE_SCALE = 0.95;

const Bundle = ({ size }: { size: number }): JSX.Element => (
  <g>
    {BUNDLE_WINGS.slice(0, size)
      .reverse()
      .map((wing) => (
        <g
          key={wing.x}
          transform={`translate(${wing.x} ${wing.y}) rotate(${wing.angle})`}
        >
          <Wing scale={BUNDLE_SCALE} />
        </g>
      ))}
  </g>
);

/**
 * The fall's punchline, in the picture's own coordinates (the bay never scrolls): the splash
 * the hen comes up out of, the ring of water it bobs in, the handful floating beside it, and the
 * gull that has it. The hen itself is the scene's runner, moved into the bay and clipped at the
 * water line by the scene; this layer is drawn over it.
 */
type FallPunchlineProps = {
  /** The id the scene clips the hen with while it is in the water. */
  clipId: string;
  camera: SchlonicCamera;
};

export const FallPunchline = forwardRef<
  FallPunchlineHandle,
  FallPunchlineProps
>(({ clipId, camera }, ref): JSX.Element => {
  const group = useRef<SVGGElement>(null);
  const splash = useRef<SplashHandle>(null);
  const waterline = useRef<SVGEllipseElement>(null);
  const floating = useRef<SVGGElement>(null);
  const carried = useRef<SVGGElement>(null);
  const gull = useRef<GullHandle>(null);

  const showBundle = (element: SVGGElement | null, size: number): void => {
    Array.from(element?.children[0]?.children ?? []).forEach(
      (wing, index, wings) => {
        // The heap is drawn back to front, so the wing that goes first is the last child.
        wing.setAttribute(
          "opacity",
          wings.length - 1 - index < size ? "1" : "0",
        );
      },
    );
  };

  useImperativeHandle(ref, () => ({
    paint: ({ elapsedMs, bayX, wingsLost, camera }): void => {
      const size = resolveBundleSize(wingsLost);
      const hen = resolveBayHen(elapsedMs, bayX);
      const rest = resolveBundleRest(elapsedMs, bayX);
      const flight = resolveGullFlight(elapsedMs, rest, camera);
      const isFloating = hen.visible && size > 0 && elapsedMs < GULL_GRAB_AT_MS;

      group.current?.setAttribute("opacity", "1");
      splash.current?.paint(
        bayX,
        BAY_SURFACE_Y,
        (elapsedMs - FALL_SPLASH_AT_MS) / FALL_SPLASH_MS,
      );
      waterline.current?.setAttribute("opacity", hen.visible ? "0.9" : "0");
      waterline.current?.setAttribute("cx", `${hen.x}`);
      showBundle(floating.current, size);
      showBundle(carried.current, size);
      floating.current?.setAttribute("opacity", isFloating ? "1" : "0");
      floating.current?.setAttribute(
        "transform",
        `translate(${rest.x} ${rest.y})`,
      );
      carried.current?.setAttribute("opacity", flight.carrying ? "1" : "0");
      gull.current?.place({ ...flight, visible: flight.visible && size > 0 });
    },
    hide: (): void => {
      group.current?.setAttribute("opacity", "0");
      gull.current?.place({ visible: false, x: 0, y: 0, angle: 0, flap: 0 });
    },
  }));

  return (
    <g ref={group} opacity={0} data-schlonic-fall-punchline>
      {/* The water line the hen surfaces through: everything under it is the bay's. */}
      <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
        <rect
          x={camera.x - 20}
          y={camera.y - 60}
          width={camera.width + 40}
          height={BAY_SURFACE_Y - camera.y + 60}
        />
      </clipPath>
      <ellipse
        ref={waterline}
        cy={BAY_SURFACE_Y}
        rx={6.5}
        ry={1.2}
        fill="none"
        stroke={schlonicPalette.spray}
        strokeWidth={0.7}
        opacity={0}
      />
      <g ref={floating} opacity={0}>
        <Bundle size={BUNDLE_WINGS.length} />
      </g>
      <Splash ref={splash} />
      <Gull ref={gull}>
        <g ref={carried}>
          <Bundle size={BUNDLE_WINGS.length} />
        </g>
      </Gull>
    </g>
  );
});

FallPunchline.displayName = "FallPunchline";
