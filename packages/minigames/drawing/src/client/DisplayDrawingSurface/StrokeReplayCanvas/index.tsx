import { useEffect, useRef } from "react";
import type { DrawingStroke } from "@wingnight/shared";

import {
  fitDrawingCanvasSize,
  renderStrokesToCanvas
} from "../../strokeRendering/index.js";
import * as styles from "./styles.js";

// Wood frame padding + border around the chalkboard, subtracted from the
// fit area before letterboxing so the frame hugs the board.
const EASEL_FRAME_INSET_PX = 28;

type StrokeReplayCanvasProps = {
  strokes: DrawingStroke[];
  // Dims the held sketch under the reveal plaque.
  isDimmed: boolean;
};

// Read-only projection of server strokes; the display never predicts.
export const StrokeReplayCanvas = ({
  strokes,
  isDimmed
}: StrokeReplayCanvasProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fitAreaRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<DrawingStroke[]>(strokes);

  strokesRef.current = strokes;

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d") ?? null;

    if (canvas !== null && context !== null) {
      renderStrokesToCanvas(context, strokes, canvas.width, canvas.height);
    }
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fitArea = fitAreaRef.current;
    const context = canvas?.getContext("2d") ?? null;

    if (canvas === null || fitArea === null || context === null) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(() => {
      const fittedSize = fitDrawingCanvasSize(
        fitArea.clientWidth - EASEL_FRAME_INSET_PX,
        fitArea.clientHeight - EASEL_FRAME_INSET_PX
      );
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.style.width = `${fittedSize.width}px`;
      canvas.style.height = `${fittedSize.height}px`;
      canvas.width = Math.max(1, Math.round(fittedSize.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(fittedSize.height * pixelRatio));
      renderStrokesToCanvas(
        context,
        strokesRef.current,
        canvas.width,
        canvas.height
      );
    });

    resizeObserver.observe(fitArea);

    return (): void => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={styles.fitArea} ref={fitAreaRef}>
      <div className={styles.easelFrame}>
        <div className={styles.board}>
          <canvas
            className={`${styles.canvas}${isDimmed ? ` ${styles.canvasDimmed}` : ""}`}
            ref={canvasRef}
          />
        </div>
      </div>
    </div>
  );
};
