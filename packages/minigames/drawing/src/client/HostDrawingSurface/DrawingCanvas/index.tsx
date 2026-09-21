import { forwardRef, useImperativeHandle } from "react";
import type { DrawingPoint, DrawingStroke } from "@wingnight/shared";

import { useEaselStrokes, type BeginStrokeDispatch } from "./useEaselStrokes/index.js";
import * as styles from "./styles.js";

export type { BeginStrokeDispatch };

export type DrawingCanvasHandle = {
  // Flushes buffered points, ends the active stroke, and drops the local
  // overlay so the canvas re-renders from canonical server strokes only.
  // Call before dispatching undo/clear/result actions.
  finalizeStrokes: () => void;
};

type DrawingCanvasProps = {
  strokes: DrawingStroke[];
  canDraw: boolean;
  brushColor: string;
  brushSize: number;
  onBeginStroke: (payload: BeginStrokeDispatch) => void;
  onAppendStrokePoints: (strokeId: string, points: DrawingPoint[]) => void;
  onEndStroke: (strokeId: string) => void;
};

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  (
    {
      strokes,
      canDraw,
      brushColor,
      brushSize,
      onBeginStroke,
      onAppendStrokePoints,
      onEndStroke
    },
    ref
  ): JSX.Element => {
    const {
      canvasRef,
      fitAreaRef,
      finalizeStrokes,
      handlePointerDown,
      handlePointerMove,
      handlePointerEnd
    } = useEaselStrokes({
      strokes,
      canDraw,
      brushColor,
      brushSize,
      onBeginStroke,
      onAppendStrokePoints,
      onEndStroke
    });

    useImperativeHandle(ref, () => ({ finalizeStrokes }), [finalizeStrokes]);

    return (
      <div className={styles.fitArea} ref={fitAreaRef}>
        <div className={styles.easelFrame}>
          <canvas
            className={styles.canvas}
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          />
        </div>
      </div>
    );
  }
);

DrawingCanvas.displayName = "DrawingCanvas";
