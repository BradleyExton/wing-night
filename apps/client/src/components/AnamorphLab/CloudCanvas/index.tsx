import { useEffect, useRef } from "react";

import {
  projectCloud,
  type AnamorphCloud,
  type LegibilityCurve,
  type ProjectionModel
} from "../anamorphCloud";
import * as styles from "../styles";

type CloudCanvasProps = {
  cloud: AnamorphCloud;
  yaw: number;
  pitch: number;
  jitter: number;
  curve: LegibilityCurve;
  projection: ProjectionModel;
  // Present iff this canvas is the drag-to-orbit control surface.
  onOrbit?: (deltaYaw: number, deltaPitch: number) => void;
};

const BACKGROUND_FILL = "#04050a";

const POINT_FILL = "rgba(255, 244, 214, 0.92)";

// Half-extent of the projected cloud that must stay on screen.
const VIEW_HALF_EXTENT = 1.35;

const ORBIT_RADIANS_PER_PIXEL = 0.006;

export const CloudCanvas = ({
  cloud,
  yaw,
  pitch,
  jitter,
  curve,
  projection,
  onOrbit
}: CloudCanvasProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    const context = canvas.getContext("2d");

    if (context === null) {
      return;
    }

    const draw = (): void => {
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

      const scale = Math.min(width, height) / (VIEW_HALF_EXTENT * 2);
      const centerX = width / 2;
      const centerY = height / 2;
      const pointSize = Math.max(1, 1.6 * Math.min(1, pixelRatio));

      context.fillStyle = POINT_FILL;

      for (const point of projectCloud({
        cloud,
        viewAngle: { yaw, pitch },
        settings: { jitter, curve, projection }
      })) {
        context.fillRect(
          centerX + point.x * scale,
          centerY - point.y * scale,
          pointSize,
          pointSize
        );
      }
    };

    draw();

    const observer = new ResizeObserver(draw);

    observer.observe(canvas);

    return (): void => {
      observer.disconnect();
    };
  }, [cloud, yaw, pitch, jitter, curve, projection]);

  if (onOrbit === undefined) {
    return <canvas ref={canvasRef} className={styles.canvas} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvasGrabbable}
      onPointerDown={(event): void => {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragOriginRef.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMove={(event): void => {
        const origin = dragOriginRef.current;

        if (origin === null) {
          return;
        }

        dragOriginRef.current = { x: event.clientX, y: event.clientY };
        onOrbit(
          (event.clientX - origin.x) * ORBIT_RADIANS_PER_PIXEL,
          (event.clientY - origin.y) * ORBIT_RADIANS_PER_PIXEL
        );
      }}
      onPointerUp={(event): void => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        dragOriginRef.current = null;
      }}
      onPointerCancel={(): void => {
        dragOriginRef.current = null;
      }}
    />
  );
};
