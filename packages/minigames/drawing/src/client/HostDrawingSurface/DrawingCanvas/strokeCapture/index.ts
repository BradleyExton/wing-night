import type { DrawingPoint } from "@wingnight/shared";

export type ActiveStrokeCapture = {
  pointerId: number;
  strokeId: string;
  startedAtMs: number;
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

let strokeIdCounter = 0;

export const createStrokeId = (): string => {
  strokeIdCounter += 1;
  return `stroke-${Date.now()}-${strokeIdCounter}`;
};

export type CanvasBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

// Where the finger is on the board, 0..1 on each axis, and how long into the
// stroke it got there. Normalized because the TV replays the same stroke at a
// different size than the tablet drew it at.
export const toNormalizedPoint = ({
  clientX,
  clientY,
  bounds,
  startedAtMs,
  nowMs
}: {
  clientX: number;
  clientY: number;
  bounds: CanvasBounds;
  startedAtMs: number;
  nowMs: number;
}): DrawingPoint => {
  const clamp = (value: number): number => Math.min(1, Math.max(0, value));

  return {
    x: clamp((clientX - bounds.left) / Math.max(1, bounds.width)),
    y: clamp((clientY - bounds.top) / Math.max(1, bounds.height)),
    t: Math.max(0, nowMs - startedAtMs)
  };
};
