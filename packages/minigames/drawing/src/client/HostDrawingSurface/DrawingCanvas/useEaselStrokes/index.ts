import { useCallback, useEffect, useRef } from "react";
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import type { DrawingPoint, DrawingStroke } from "@wingnight/shared";

import { fitDrawingCanvasSize, renderStrokesToCanvas } from "../../../strokeRendering/index.js";
import {
  createStrokeId,
  ownsActiveStroke,
  toNormalizedPoint,
  type ActiveStrokeCapture
} from "../strokeCapture/index.js";
import {
  LOCAL_STROKE_RETENTION_MS,
  mergeStrokesForRender,
  shouldDropLocalStroke,
  type LocalStrokeRecord
} from "../strokeOverlay/index.js";

// ~14 sends/sec keeps the canonical server state fresh while staying under
// the spec's ~15/sec dispatch budget.
const FLUSH_INTERVAL_MS = 70;
const MAX_POINTS_PER_DISPATCH = 64;
// Frame padding + border around the chalkboard canvas, subtracted from the
// fit area before letterboxing so the frame hugs the board.
const EASEL_FRAME_INSET_PX = 18;

export type BeginStrokeDispatch = {
  strokeId: string;
  color: string;
  size: number;
  start: DrawingPoint;
};

type EaselStrokesInput = {
  strokes: DrawingStroke[];
  canDraw: boolean;
  brushColor: string;
  brushSize: number;
  onBeginStroke: (payload: BeginStrokeDispatch) => void;
  onAppendStrokePoints: (strokeId: string, points: DrawingPoint[]) => void;
  onEndStroke: (strokeId: string) => void;
};

type EaselStrokes = {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  fitAreaRef: MutableRefObject<HTMLDivElement | null>;
  // Flushes buffered points, ends the active stroke, and drops the local
  // overlay so the canvas re-renders from canonical server strokes only.
  finalizeStrokes: () => void;
  handlePointerDown: (pointerEvent: ReactPointerEvent<HTMLCanvasElement>) => void;
  handlePointerMove: (pointerEvent: ReactPointerEvent<HTMLCanvasElement>) => void;
  handlePointerEnd: (pointerEvent: ReactPointerEvent<HTMLCanvasElement>) => void;
};

// The live half of the easel: the artist's own ink while it is still in
// flight, the dispatch budget it is sent under, and the canvas it is painted
// on. Everything here is refs and rAF rather than state — a stroke arrives at
// pointer rate and re-rendering React on each sample would drop frames.
export const useEaselStrokes = ({
  strokes,
  canDraw,
  brushColor,
  brushSize,
  onBeginStroke,
  onAppendStrokePoints,
  onEndStroke
}: EaselStrokesInput): EaselStrokes => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fitAreaRef = useRef<HTMLDivElement | null>(null);
  const localStrokesRef = useRef<Map<string, LocalStrokeRecord>>(new Map());
  const activeStrokeRef = useRef<ActiveStrokeCapture | null>(null);
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retentionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderFrameRef = useRef<number | null>(null);
  const serverStrokesRef = useRef<DrawingStroke[]>(strokes);

  serverStrokesRef.current = strokes;

  const renderScene = useCallback((): void => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d") ?? null;

    if (canvas === null || context === null) {
      return;
    }

    const mergedStrokes = mergeStrokesForRender({
      serverStrokes: serverStrokesRef.current,
      localStrokes: localStrokesRef.current
    });

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

  // Drops overlay strokes the canonical snapshot has caught up on, or has
  // conclusively not taken whole.
  const pruneLocalStrokes = useCallback((): void => {
    const serverStrokeById = new Map(
      serverStrokesRef.current.map((stroke) => [stroke.strokeId, stroke])
    );
    const nowMs = Date.now();

    for (const [strokeId, localRecord] of localStrokesRef.current) {
      if (
        shouldDropLocalStroke({
          localRecord,
          serverStroke: serverStrokeById.get(strokeId),
          nowMs
        })
      ) {
        localStrokesRef.current.delete(strokeId);
      }
    }

    scheduleRender();
  }, [scheduleRender]);

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

    // Nothing redraws the easel on its own once the artist lifts, so a
    // stroke the server trimmed needs its own wake-up to fall away.
    if (retentionTimerRef.current !== null) {
      clearTimeout(retentionTimerRef.current);
    }

    retentionTimerRef.current = setTimeout(
      pruneLocalStrokes,
      LOCAL_STROKE_RETENTION_MS + 1
    );
  }, [flushPendingPoints, onEndStroke, pruneLocalStrokes, stopFlushInterval]);

  const finalizeStrokes = useCallback((): void => {
    endActiveStroke();
    localStrokesRef.current.clear();
    scheduleRender();
  }, [endActiveStroke, scheduleRender]);

  // Re-prune whenever a fresh canonical snapshot arrives.
  useEffect(() => {
    pruneLocalStrokes();
  }, [strokes, pruneLocalStrokes]);

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

      if (retentionTimerRef.current !== null) {
        clearTimeout(retentionTimerRef.current);
      }

      if (renderFrameRef.current !== null) {
        window.cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, [renderScene, stopFlushInterval]);

  const samplePoint = (
    pointerEvent: ReactPointerEvent<HTMLCanvasElement>,
    startedAtMs: number
  ): DrawingPoint => {
    return toNormalizedPoint({
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY,
      bounds: pointerEvent.currentTarget.getBoundingClientRect(),
      startedAtMs,
      nowMs: Date.now()
    });
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
    const startPoint = samplePoint(pointerEvent, startedAtMs);

    activeStrokeRef.current = {
      pointerId: pointerEvent.pointerId,
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

    if (!ownsActiveStroke(activeStroke, pointerEvent.pointerId)) {
      return;
    }

    const nextPoint = samplePoint(pointerEvent, activeStroke.startedAtMs);
    const localRecord = localStrokesRef.current.get(activeStroke.strokeId);

    localRecord?.stroke.points.push(nextPoint);
    activeStroke.pendingPoints.push(nextPoint);
    scheduleRender();
  };

  const handlePointerEnd = (
    pointerEvent: ReactPointerEvent<HTMLCanvasElement>
  ): void => {
    if (!ownsActiveStroke(activeStrokeRef.current, pointerEvent.pointerId)) {
      return;
    }

    endActiveStroke();
    scheduleRender();
  };

  return {
    canvasRef,
    fitAreaRef,
    finalizeStrokes,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd
  };
};
