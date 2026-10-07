import { forwardRef, useImperativeHandle, useRef } from "react";
import { MOUNT_WORLD, type MountHighLine } from "@wingnight/shared";

import { formatHens } from "../../lineHeight/index.js";
import { mountSceneCopy } from "../copy.js";
import * as styles from "./styles.js";

export type HighLineHandle = {
  /** The tag's size against the camera, so it reads the same on a close-up and on the whole pile. */
  scaleLabel: (scale: number) => void;
  /**
   * The mount beat: the line rides up to the climber's crown and the climber's name lands on it,
   * `share` 0 → 1 of the way. The view's own holder takes over when the beat hands the pile back.
   */
  jump: (to: { height: number; x: number; name: string }, share: number) => void;
  /** Back to the line the pile carries. */
  reset: () => void;
};

const REACH = 6000;
// The tag sits to the right of the crown that set the line, clear of the holder's own face.
const TAG_X = 16;

const lineTransform = (height: number): string => `translate(0 ${MOUNT_WORLD.floorY - height})`;

/**
 * The high line, dashed across the world at the pile's line, with the holder's name and how high
 * it is hung at the crown that set it — the goose's head until somebody beats it. The holder's own
 * hen sits right under the tag, so the head on the line is the real one.
 */
export const HighLine = forwardRef<HighLineHandle, { line: MountHighLine; holderName: string }>(
  ({ line, holderName }, ref): JSX.Element => {
    const groupRef = useRef<SVGGElement>(null);
    const tagRef = useRef<SVGGElement>(null);
    const currentRef = useRef<SVGGElement>(null);
    const incomingRef = useRef<SVGGElement>(null);
    const incomingNameRef = useRef<SVGTextElement>(null);
    const incomingHeightRef = useRef<SVGTextElement>(null);
    const scaleRef = useRef(1);
    const lineRef = useRef(line);

    lineRef.current = line;

    const placeTag = (x: number): void => {
      tagRef.current?.setAttribute("transform", `translate(${x} 0) scale(${scaleRef.current})`);
    };

    useImperativeHandle(ref, () => ({
      scaleLabel: (scale): void => {
        if (Math.abs(scale - scaleRef.current) < 0.01) {
          return;
        }

        scaleRef.current = scale;
        placeTag(Number(tagRef.current?.getAttribute("data-mount-line-x") ?? lineRef.current.x));
      },
      jump: (to, share): void => {
        const from = lineRef.current.height;

        groupRef.current?.setAttribute("transform", lineTransform(from + (to.height - from) * share));
        tagRef.current?.setAttribute("data-mount-line-x", `${to.x}`);
        placeTag(to.x);
        currentRef.current?.setAttribute("display", "none");
        incomingRef.current?.setAttribute("display", "inline");

        if (incomingNameRef.current !== null && incomingNameRef.current.textContent !== to.name) {
          incomingNameRef.current.textContent = to.name;
        }

        const heightText = mountSceneCopy.lineHeight(formatHens(to.height));

        if (incomingHeightRef.current !== null && incomingHeightRef.current.textContent !== heightText) {
          incomingHeightRef.current.textContent = heightText;
        }
      },
      reset: (): void => {
        groupRef.current?.setAttribute("transform", lineTransform(lineRef.current.height));
        tagRef.current?.setAttribute("data-mount-line-x", `${lineRef.current.x}`);
        placeTag(lineRef.current.x);
        currentRef.current?.setAttribute("display", "inline");
        incomingRef.current?.setAttribute("display", "none");
      }
    }));

    return (
      <g ref={groupRef} transform={lineTransform(line.height)} data-mount-line aria-hidden="true">
        <line className={styles.line} x1={-REACH} y1={0} x2={REACH} y2={0} />
        <g ref={tagRef} transform={`translate(${line.x} 0) scale(${scaleRef.current})`} data-mount-line-x={line.x}>
          <circle className={styles.marker} cx={0} cy={0} r={2.4} />
          <g ref={currentRef} display="inline">
            <text className={styles.name} x={TAG_X} y={-4}>
              {holderName}
            </text>
            <text className={styles.height} x={TAG_X} y={5}>
              {mountSceneCopy.lineHeight(formatHens(line.height))}
            </text>
          </g>
          <g ref={incomingRef} display="none">
            <text ref={incomingNameRef} className={styles.name} x={TAG_X} y={-4} />
            <text ref={incomingHeightRef} className={styles.height} x={TAG_X} y={5} />
          </g>
        </g>
      </g>
    );
  }
);

HighLine.displayName = "HighLine";
