import type { ContraptionLayout, ContraptionRun, ContraptionVec2 } from "@wingnight/shared";
import { useEffect, useMemo, useRef } from "react";

import * as styles from "../styles";

export type ReadabilityAids = "bare" | "trail" | "annotated";

type RunCanvasProps = {
  layout: ContraptionLayout;
  run: ContraptionRun;
  aids: ReadabilityAids;
  playbackRate: number;
  /** Bump to restart playback from the first keyframe. */
  replayKey: number;
};

/** Every lab layout is authored on a 100×100 field. */
const FIELD_UNITS = 100;

const FIELD_MARGIN_UNITS = 3;

/** Held on the last keyframe before looping, so a run reads as finished rather than as cut off. */
const LOOP_HOLD_SECONDS = 0.9;

const WING_BODY_ID = "wing";

const RAMP_ID_PREFIX = "ramp-";

const BUCKET_ID_PREFIX = "bucket-";

/**
 * Deliberately looser than the integrator's own contact test. Markers are placed from the 30Hz
 * display track, and a fast wing clears a ramp between two samples — a hair-tight test would drop
 * the very contacts the room most needs pointed out.
 */
const MARKER_SLACK_UNITS = 0.6;

const BACKGROUND_FILL = "#05070d";
const FRAME_STROKE = "rgba(226, 232, 240, 0.28)";
const RAMP_STROKE = "rgba(125, 211, 252, 0.95)";
const BUCKET_STROKE = "rgba(52, 211, 153, 0.95)";
const TRAIL_STROKE = "rgba(255, 213, 128, 0.55)";
const WING_FILL = "rgba(255, 224, 138, 0.98)";
const BODY_FILL = "rgba(148, 163, 184, 0.75)";
const MARKER_STROKE = "rgba(248, 113, 113, 0.95)";

const distanceToSegment = (
  point: ContraptionVec2,
  from: ContraptionVec2,
  to: ContraptionVec2
): number => {
  const alongX = to.x - from.x;
  const alongY = to.y - from.y;
  const lengthSquared = alongX * alongX + alongY * alongY;
  const offsetX = point.x - from.x;
  const offsetY = point.y - from.y;
  const travel =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, (offsetX * alongX + offsetY * alongY) / lengthSquared));
  const gapX = point.x - (from.x + alongX * travel);
  const gapY = point.y - (from.y + alongY * travel);

  return Math.sqrt(gapX * gapX + gapY * gapY);
};

type ContactMarker = {
  readonly keyframeIndex: number;
  readonly position: ContraptionVec2;
};

/** First moment the wing meets each placed ramp — the beats a failure explanation is made of. */
const resolveContactMarkers = (
  layout: ContraptionLayout,
  run: ContraptionRun,
  wingIndex: number
): readonly ContactMarker[] => {
  if (wingIndex === -1) {
    return [];
  }

  const wingRadius = layout.bodies[wingIndex].radius;

  return layout.segments
    .filter((segment) => segment.id.startsWith(RAMP_ID_PREFIX))
    .flatMap((segment): ContactMarker[] => {
      const hitIndex = run.keyframes.findIndex((keyframe) => {
        const position = keyframe[wingIndex];

        return (
          position !== undefined &&
          distanceToSegment(position, segment.from, segment.to) <=
            wingRadius + MARKER_SLACK_UNITS
        );
      });

      if (hitIndex === -1) {
        return [];
      }

      return [{ keyframeIndex: hitIndex, position: run.keyframes[hitIndex][wingIndex] }];
    });
};

export const RunCanvas = ({
  layout,
  run,
  aids,
  playbackRate,
  replayKey
}: RunCanvasProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wingIndex = useMemo(() => {
    return layout.bodies.findIndex((body) => body.id === WING_BODY_ID);
  }, [layout]);
  const markers = useMemo(() => {
    return resolveContactMarkers(layout, run, wingIndex);
  }, [layout, run, wingIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    const keyframeCount = run.keyframes.length;

    if (keyframeCount === 0) {
      return;
    }

    const holdFrames = Math.round(LOOP_HOLD_SECONDS * run.keyframeHz);
    const cycleFrames = keyframeCount + holdFrames;
    let startedAt: number | null = null;
    let frameHandle = 0;

    const draw = (frameIndex: number): void => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (width === 0 || height === 0) {
        return;
      }

      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.fillStyle = BACKGROUND_FILL;
      context.fillRect(0, 0, width, height);

      const span = FIELD_UNITS + FIELD_MARGIN_UNITS * 2;
      const scale = Math.min(width / span, height / span);
      const originX = (width - FIELD_UNITS * scale) / 2;
      const originY = (height - FIELD_UNITS * scale) / 2;
      const toX = (value: number): number => originX + value * scale;
      const toY = (value: number): number => originY + value * scale;

      context.lineCap = "round";

      for (const segment of layout.segments) {
        const isRamp = segment.id.startsWith(RAMP_ID_PREFIX);
        const isBucket = segment.id.startsWith(BUCKET_ID_PREFIX);

        context.strokeStyle = isBucket ? BUCKET_STROKE : isRamp ? RAMP_STROKE : FRAME_STROKE;
        context.lineWidth = isRamp || isBucket ? 2.4 : 1.4;
        context.beginPath();
        context.moveTo(toX(segment.from.x), toY(segment.from.y));
        context.lineTo(toX(segment.to.x), toY(segment.to.y));
        context.stroke();
      }

      if (aids !== "bare" && wingIndex !== -1) {
        context.strokeStyle = TRAIL_STROKE;
        context.lineWidth = 1.6;
        context.beginPath();
        for (let index = 0; index <= frameIndex; index += 1) {
          const position = run.keyframes[index][wingIndex];

          if (index === 0) {
            context.moveTo(toX(position.x), toY(position.y));
          } else {
            context.lineTo(toX(position.x), toY(position.y));
          }
        }
        context.stroke();
      }

      if (aids === "annotated") {
        context.strokeStyle = MARKER_STROKE;
        context.lineWidth = 1.8;
        for (const marker of markers) {
          if (marker.keyframeIndex > frameIndex) {
            continue;
          }

          context.beginPath();
          context.arc(
            toX(marker.position.x),
            toY(marker.position.y),
            Math.max(3, 1.6 * scale),
            0,
            Math.PI * 2
          );
          context.stroke();
        }
      }

      run.keyframes[frameIndex].forEach((position, bodyIndex) => {
        const body = layout.bodies[bodyIndex];

        if (body === undefined) {
          return;
        }

        context.fillStyle = bodyIndex === wingIndex ? WING_FILL : BODY_FILL;
        context.beginPath();
        context.arc(toX(position.x), toY(position.y), body.radius * scale, 0, Math.PI * 2);
        context.fill();
      });
    };

    const tick = (timestamp: number): void => {
      if (startedAt === null) {
        startedAt = timestamp;
      }

      const elapsedSeconds = ((timestamp - startedAt) / 1000) * playbackRate;
      const cycleIndex = Math.floor(elapsedSeconds * run.keyframeHz) % cycleFrames;

      draw(Math.min(cycleIndex, keyframeCount - 1));
      frameHandle = window.requestAnimationFrame(tick);
    };

    frameHandle = window.requestAnimationFrame(tick);

    const observer = new ResizeObserver(() => {
      draw(0);
    });

    observer.observe(canvas);

    return (): void => {
      window.cancelAnimationFrame(frameHandle);
      observer.disconnect();
    };
  }, [layout, run, aids, playbackRate, replayKey, wingIndex, markers]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};
