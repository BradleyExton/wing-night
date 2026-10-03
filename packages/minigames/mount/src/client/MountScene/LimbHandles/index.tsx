import { forwardRef, useImperativeHandle, useRef } from "react";
import { MOUNT_LIMBS, type MountLimb, type MountLimbState, type MountPose } from "@wingnight/shared";

import * as styles from "./styles.js";

export type LimbHandlesHandle = {
  paint: (pose: MountPose, limbs: Record<MountLimb, MountLimbState>) => void;
  hide: () => void;
};

type Refs = { group: SVGGElement | null; ring: SVGCircleElement | null; dot: SVGCircleElement | null; state: string };

// World units. On the tablet a ring of 7 is about 75 CSS px across at the close-up's scale: a
// thumb's width, and inside the 14-unit reach the touch is actually taken within.
const RADIUS = { host: { ring: 7, dot: 1.6 }, display: { ring: 2.6, dot: 0 } } as const;

/**
 * A handle at each limb's tip, carrying the limb's name and what it is doing
 * (`data-mount-limb`, `data-mount-limb-state`) for a harness on both scenes, and drawn for the
 * surface: big rings on the tablet, grip marks on the wall. Painted every frame by the loop.
 */
export const LimbHandles = forwardRef<LimbHandlesHandle, { variant: "host" | "display" }>(({ variant }, ref): JSX.Element => {
  const refs = useRef<Partial<Record<MountLimb, Refs>>>({});
  const rings = variant === "host" ? styles.hostRing : styles.displayRing;
  const dots = variant === "host" ? styles.hostDot : styles.displayDot;
  const groupRef = useRef<SVGGElement>(null);

  useImperativeHandle(ref, () => ({
    paint: (pose, limbs): void => {
      groupRef.current?.setAttribute("display", "inline");

      for (const limb of MOUNT_LIMBS) {
        const entry = refs.current[limb];

        if (entry === undefined || entry.group === null) {
          continue;
        }

        const tip = pose[limb];
        const kind = limbs[limb].kind;

        entry.group.setAttribute("transform", `translate(${Math.round(tip.x * 100) / 100} ${Math.round(tip.y * 100) / 100})`);

        if (entry.state !== kind) {
          entry.state = kind;
          entry.group.setAttribute("data-mount-limb-state", kind);
          entry.ring?.setAttribute("class", rings[kind]);
          entry.dot?.setAttribute("class", dots[kind]);
        }
      }
    },
    hide: (): void => {
      groupRef.current?.setAttribute("display", "none");
    }
  }));

  return (
    <g ref={groupRef} display="none" data-mount-limb-handles={variant}>
      {MOUNT_LIMBS.map((limb) => (
        <g
          key={limb}
          ref={(element): void => {
            const entry = refs.current[limb] ?? { group: null, ring: null, dot: null, state: "limp" };

            entry.group = element;
            refs.current[limb] = entry;
          }}
          data-mount-limb={limb}
          data-mount-limb-state="limp"
        >
          <circle
            ref={(element): void => {
              const entry = refs.current[limb] ?? { group: null, ring: null, dot: null, state: "limp" };

              entry.ring = element;
              refs.current[limb] = entry;
            }}
            className={rings.limp}
            r={RADIUS[variant].ring}
          />
          {RADIUS[variant].dot > 0 && (
            <circle
              ref={(element): void => {
                const entry = refs.current[limb] ?? { group: null, ring: null, dot: null, state: "limp" };

                entry.dot = element;
                refs.current[limb] = entry;
              }}
              className={dots.limp}
              r={RADIUS[variant].dot}
            />
          )}
        </g>
      ))}
    </g>
  );
});

LimbHandles.displayName = "LimbHandles";
