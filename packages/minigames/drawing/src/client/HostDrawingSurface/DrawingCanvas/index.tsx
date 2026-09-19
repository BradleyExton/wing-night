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
// Backstop for ended strokes the server will never settle — rejected at the
// stroke cap, or dispatched into a dropped socket. They drop out of the local
// overlay after this long. A stroke the server does settle hands over the
// moment the snapshot carrying that settlement lands, not on this timer.
const LOCAL_STROKE_RETENTION_MS = 4000;
// Wood frame padding + border around the chalkboard canvas, subtracted from
// the fit area before letterboxing so the frame hugs the board.
const EASEL_FRAME_INSET_PX = 28;

export type LocalStrokeRecord = {
  stroke: DrawingStroke;
  endedAtMs: number | null;
};

// Whether the server is done with a stroke. `activeStrokeId` is the server's
// own word for "still under the artist's finger", so a stroke it carries and
// no longer calls active is final: every point the tablet sent has landed
// (the canvas flushes its buffer before it dispatches endStroke, and the
// socket delivers in order), and nothing will be added to it again.
//
// Point count cannot stand in for this. The runtime trims a stroke at
// MAX_POINTS_PER_STROKE and then never grows it, so a long scribble's
// canonical copy is permanently SHORTER than the tablet's own capture —
// "the server has as many points as I do" would never come true for it, and
// that stroke would limp out on the retention timeout with the two surfaces
// disagreeing for the whole four seconds until it did.
export const isStrokeSettledOnServer = ({
  serverStroke,
  serverActiveStrokeId
}: {
  serverStroke: DrawingStroke | undefined;
  serverActiveStrokeId: string | null;
}): boolean => {
  return (
    serverStroke !== undefined && serverStroke.strokeId !== serverActiveStrokeId
  );
};

// Whether an ended stroke may stop covering for the server's copy. Settling
// cannot be the only exit: a stroke the server never took at all — rejected
// at the stroke cap, or dispatched while the tablet was disconnected — is
// never going to settle, and would sit on the easel forever showing the
// artist ink the TV never received. The window is the backstop for that, not
// the ordinary path.
export const shouldDropLocalStroke = ({
  localRecord,
  serverStroke,
  serverActiveStrokeId,
  nowMs
}: {
  localRecord: LocalStrokeRecord;
  serverStroke: DrawingStroke | undefined;
  serverActiveStrokeId: string | null;
  nowMs: number;
}): boolean => {
  if (localRecord.endedAtMs === null) {
    return false;
  }

  if (isStrokeSettledOnServer({ serverStroke, serverActiveStrokeId })) {
    return true;
  }

  return nowMs - localRecord.endedAtMs > LOCAL_STROKE_RETENTION_MS;
};

// The easel draws the local prediction only while the server is still
// extending that stroke; once it settles, the canonical copy wins even when it
// holds fewer points — a scribble past the point cap is trimmed, and that tail
// is ink the TV is not drawing. Strokes the snapshot has not acknowledged
// yet are drawn from the overlay alone, after the canonical ones, so a stroke
// in flight still appears on top.
export const mergeLocalAndServerStrokes = ({
  serverStrokes,
  localStrokes,
  serverActiveStrokeId
}: {
  serverStrokes: DrawingStroke[];
  localStrokes: ReadonlyMap<string, LocalStrokeRecord>;
  serverActiveStrokeId: string | null;
}): DrawingStroke[] => {
  const mergedStrokes: DrawingStroke[] = [];
  const mergedStrokeIds = new Set<string>();

  for (const serverStroke of serverStrokes) {
    const localRecord = localStrokes.get(serverStroke.strokeId);
    const hasSettled = isStrokeSettledOnServer({
      serverStroke,
      serverActiveStrokeId
    });

    mergedStrokes.push(
      localRecord !== undefined && !hasSettled ? localRecord.stroke : serverStroke
    );
    mergedStrokeIds.add(serverStroke.strokeId);
  }

  for (const [strokeId, localRecord] of localStrokes) {
    if (!mergedStrokeIds.has(strokeId)) {
      mergedStrokes.push(localRecord.stroke);
    }
  }

  return mergedStrokes;
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

export type ActiveStrokeCapture = {
  pointerId: number;
  strokeId: string;
  pendingPoints: DrawingPoint[];
};

// One finger owns the easel for the length of a stroke. A tablet reports a
// resting palm, a second finger or a neighbour reaching in as ordinary
// pointer events, and without this every one of them would steer the stroke
// already in flight — or end it early on its own lift.
export const ownsActiveStroke = (
  activeStroke: ActiveStrokeCapture | null,
  pointerId: number
): activeStroke is ActiveStrokeCapture => {
  return activeStroke !== null && activeStroke.pointerId === pointerId;
};

type DrawingCanvasProps = {
  strokes: DrawingStroke[];
  // The server's own active-stroke cursor, straight off the host view. It is
  // how the overlay knows the canonical copy of a stroke is final.
  activeStrokeId: string | null;
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
      activeStrokeId,
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
    const activeStrokeRef = useRef<ActiveStrokeCapture | null>(null);
    const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const retentionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const renderFrameRef = useRef<number | null>(null);
    const serverStrokesRef = useRef<DrawingStroke[]>(strokes);
    const serverActiveStrokeIdRef = useRef<string | null>(activeStrokeId);

    serverStrokesRef.current = strokes;
    serverActiveStrokeIdRef.current = activeStrokeId;

    const renderScene = useCallback((): void => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d") ?? null;

      if (canvas === null || context === null) {
        return;
      }

      const mergedStrokes = mergeLocalAndServerStrokes({
        serverStrokes: serverStrokesRef.current,
        localStrokes: localStrokesRef.current,
        serverActiveStrokeId: serverActiveStrokeIdRef.current
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
      const serverActiveStrokeId = serverActiveStrokeIdRef.current;

      for (const [strokeId, localRecord] of localStrokesRef.current) {
        if (
          shouldDropLocalStroke({
            localRecord,
            serverStroke: serverStrokeById.get(strokeId),
            serverActiveStrokeId,
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

    // Re-prune whenever a fresh canonical snapshot arrives. The active-stroke
    // cursor is a dependency in its own right: the snapshot that settles the
    // last stroke of a drawing changes nothing but that id, and it is the
    // one that hands the easel back to the server.
    useEffect(() => {
      pruneLocalStrokes();
    }, [strokes, activeStrokeId, pruneLocalStrokes]);

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

    const toNormalizedPoint = (
      pointerEvent: ReactPointerEvent<HTMLCanvasElement>
    ): DrawingPoint => {
      const bounds = pointerEvent.currentTarget.getBoundingClientRect();
      const clamp = (value: number): number => Math.min(1, Math.max(0, value));

      return {
        x: clamp((pointerEvent.clientX - bounds.left) / Math.max(1, bounds.width)),
        y: clamp((pointerEvent.clientY - bounds.top) / Math.max(1, bounds.height))
      };
    };

    const handlePointerDown = (
      pointerEvent: ReactPointerEvent<HTMLCanvasElement>
    ): void => {
      if (!canDraw || activeStrokeRef.current !== null) {
        return;
      }

      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);

      const strokeId = createStrokeId();
      const startPoint = toNormalizedPoint(pointerEvent);

      activeStrokeRef.current = {
        pointerId: pointerEvent.pointerId,
        strokeId,
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

      const nextPoint = toNormalizedPoint(pointerEvent);
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
