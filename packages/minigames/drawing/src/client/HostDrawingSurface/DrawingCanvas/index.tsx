import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DrawingPoint, DrawingStroke } from "@wingnight/shared";

import {
  fitDrawingCanvasSize,
  renderStrokesToCanvas
} from "../../strokeRendering/index.js";
import * as styles from "./styles.js";

// ~14 sends/sec keeps the canonical server state fresh while staying under
// the spec's ~15/sec dispatch budget.
const FLUSH_INTERVAL_MS = 70;
const MAX_POINTS_PER_DISPATCH = 64;
// Ended strokes the server never echoed back (e.g. rejected at the stroke
// cap) drop out of the local overlay after this long.
const LOCAL_STROKE_RETENTION_MS = 4000;
// Wood frame padding + border around the chalkboard canvas, subtracted from
// the fit area before letterboxing so the frame hugs the board.
const EASEL_FRAME_INSET_PX = 28;

type LocalStrokeRecord = {
  stroke: DrawingStroke;
  endedAtMs: number | null;
};

export type BeginStrokeDispatch = {
  strokeId: string;
  color: string;
  size: number;
  start: DrawingPoint;
};

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

let strokeIdCounter = 0;

const createStrokeId = (): string => {
  strokeIdCounter += 1;
  return `stroke-${Date.now()}-${strokeIdCounter}`;
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
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fitAreaRef = useRef<HTMLDivElement | null>(null);
    const localStrokesRef = useRef<Map<string, LocalStrokeRecord>>(new Map());
    const activeStrokeRef = useRef<{
      strokeId: string;
      startedAtMs: number;
      pendingPoints: DrawingPoint[];
    } | null>(null);
    const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const renderFrameRef = useRef<number | null>(null);
    const serverStrokesRef = useRef<DrawingStroke[]>(strokes);

    serverStrokesRef.current = strokes;

    const renderScene = useCallback((): void => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d") ?? null;

      if (canvas === null || context === null) {
        return;
      }

      const serverStrokes = serverStrokesRef.current;
      const localStrokes = localStrokesRef.current;
      const mergedStrokes: DrawingStroke[] = [];
      const mergedStrokeIds = new Set<string>();

      for (const serverStroke of serverStrokes) {
        const localRecord = localStrokes.get(serverStroke.strokeId);
        mergedStrokes.push(
          localRecord !== undefined &&
            localRecord.stroke.points.length > serverStroke.points.length
            ? localRecord.stroke
            : serverStroke
        );
        mergedStrokeIds.add(serverStroke.strokeId);
      }

      for (const [strokeId, localRecord] of localStrokes) {
        if (!mergedStrokeIds.has(strokeId)) {
          mergedStrokes.push(localRecord.stroke);
        }
      }

      renderStrokesToCanvas(context, mergedStrokes, canvas.width, canvas.height);
    }, []);

    const scheduleRender = useCallback((): void => {
      if (renderFrameRef.current !== null) {
        return;
      }

      renderFrameRef.current = window.requestAnimationFrame(() => {
        renderFrameRef.current = null;
        renderScene();
      });
    }, [renderScene]);

    const flushPendingPoints = useCallback((): void => {
      const activeStroke = activeStrokeRef.current;

      if (activeStroke === null || activeStroke.pendingPoints.length === 0) {
        return;
      }

      const batch = activeStroke.pendingPoints.splice(0, MAX_POINTS_PER_DISPATCH);
      onAppendStrokePoints(activeStroke.strokeId, batch);
    }, [onAppendStrokePoints]);

    const stopFlushInterval = useCallback((): void => {
      if (flushIntervalRef.current !== null) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
    }, []);

    const endActiveStroke = useCallback((): void => {
      const activeStroke = activeStrokeRef.current;

      if (activeStroke === null) {
        return;
      }

      while (activeStroke.pendingPoints.length > 0) {
        flushPendingPoints();
      }

      stopFlushInterval();
      onEndStroke(activeStroke.strokeId);

      const localRecord = localStrokesRef.current.get(activeStroke.strokeId);

      if (localRecord !== undefined) {
        localRecord.endedAtMs = Date.now();
      }

      activeStrokeRef.current = null;
    }, [flushPendingPoints, onEndStroke, stopFlushInterval]);

    useImperativeHandle(
      ref,
      () => ({
        finalizeStrokes: (): void => {
          endActiveStroke();
          localStrokesRef.current.clear();
          scheduleRender();
        }
      }),
      [endActiveStroke, scheduleRender]
    );

    // Prune local overlay strokes the server has caught up on (or silently
    // rejected) whenever a fresh canonical snapshot arrives.
    useEffect(() => {
      const serverStrokeById = new Map(
        strokes.map((stroke) => [stroke.strokeId, stroke])
      );

      for (const [strokeId, localRecord] of localStrokesRef.current) {
        if (localRecord.endedAtMs === null) {
          continue;
        }

        const serverStroke = serverStrokeById.get(strokeId);

        if (
          serverStroke !== undefined &&
          serverStroke.points.length >= localRecord.stroke.points.length
        ) {
          localStrokesRef.current.delete(strokeId);
          continue;
        }

        if (
          serverStroke === undefined &&
          Date.now() - localRecord.endedAtMs > LOCAL_STROKE_RETENTION_MS
        ) {
          localStrokesRef.current.delete(strokeId);
        }
      }

      scheduleRender();
    }, [strokes, scheduleRender]);

    useEffect(() => {
      const canvas = canvasRef.current;
      const fitArea = fitAreaRef.current;

      if (canvas === null || fitArea === null) {
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
        renderScene();
      });

      resizeObserver.observe(fitArea);

      return (): void => {
        resizeObserver.disconnect();
        stopFlushInterval();

        if (renderFrameRef.current !== null) {
          window.cancelAnimationFrame(renderFrameRef.current);
        }
      };
    }, [renderScene, stopFlushInterval]);

    const toNormalizedPoint = (
      pointerEvent: ReactPointerEvent<HTMLCanvasElement>,
      startedAtMs: number
    ): DrawingPoint => {
      const bounds = pointerEvent.currentTarget.getBoundingClientRect();
      const clamp = (value: number): number => Math.min(1, Math.max(0, value));

      return {
        x: clamp((pointerEvent.clientX - bounds.left) / Math.max(1, bounds.width)),
        y: clamp((pointerEvent.clientY - bounds.top) / Math.max(1, bounds.height)),
        t: Math.max(0, Date.now() - startedAtMs)
      };
    };

    const handlePointerDown = (
      pointerEvent: ReactPointerEvent<HTMLCanvasElement>
    ): void => {
      if (!canDraw || activeStrokeRef.current !== null) {
        return;
      }

      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);

      const startedAtMs = Date.now();
      const strokeId = createStrokeId();
      const startPoint = toNormalizedPoint(pointerEvent, startedAtMs);

      activeStrokeRef.current = {
        strokeId,
        startedAtMs,
        pendingPoints: []
      };
      localStrokesRef.current.set(strokeId, {
        stroke: {
          strokeId,
          points: [startPoint],
          color: brushColor,
          size: brushSize
        },
        endedAtMs: null
      });

      onBeginStroke({
        strokeId,
        color: brushColor,
        size: brushSize,
        start: startPoint
      });

      flushIntervalRef.current = setInterval(flushPendingPoints, FLUSH_INTERVAL_MS);
      scheduleRender();
    };

    const handlePointerMove = (
      pointerEvent: ReactPointerEvent<HTMLCanvasElement>
    ): void => {
      const activeStroke = activeStrokeRef.current;

      if (activeStroke === null) {
        return;
      }

      const nextPoint = toNormalizedPoint(pointerEvent, activeStroke.startedAtMs);
      const localRecord = localStrokesRef.current.get(activeStroke.strokeId);

      localRecord?.stroke.points.push(nextPoint);
      activeStroke.pendingPoints.push(nextPoint);
      scheduleRender();
    };

    const handlePointerEnd = (): void => {
      endActiveStroke();
      scheduleRender();
    };

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
