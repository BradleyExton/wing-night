import { useEffect, useRef } from 'react';
import type { DrawingPoint, DrawingStroke } from './types';

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  onStrokesChange?: (strokes: DrawingStroke[]) => void;
  readonly?: boolean;
  className?: string;
  strokeColor?: string;
  strokeWidth?: number;
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function DrawingCanvas({
  strokes,
  onStrokesChange,
  readonly = false,
  className,
  strokeColor = '#f8f8f8',
  strokeWidth = 5,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const strokesRef = useRef<DrawingStroke[]>(strokes);
  const isDrawingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const emitRef = useRef<number | null>(null);

  useEffect(() => {
    strokesRef.current = strokes;
    scheduleDraw();
  }, [strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      scheduleDraw();
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const scheduleDraw = () => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      drawStrokes();
    });
  };

  const drawStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokesRef.current.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        const x = point.x * width;
        const y = point.y * height;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });
  };

  const emitChanges = () => {
    if (!onStrokesChange) return;
    if (emitRef.current) return;
    emitRef.current = window.requestAnimationFrame(() => {
      emitRef.current = null;
      onStrokesChange([...strokesRef.current]);
    });
  };

  const toPoint = (event: PointerEvent, rect: DOMRect): DrawingPoint => {
    return {
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height),
      t: event.timeStamp,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly || event.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);

    const rect = canvas.getBoundingClientRect();
    const newStroke: DrawingStroke = {
      id: createId(),
      points: [],
      color: strokeColor,
      width: strokeWidth,
    };

    const events = event.nativeEvent.getCoalescedEvents
      ? event.nativeEvent.getCoalescedEvents()
      : [event.nativeEvent];

    events.forEach(ev => {
      newStroke.points.push(toPoint(ev, rect));
    });

    const nextStrokes = [...strokesRef.current, newStroke];
    strokesRef.current = nextStrokes;
    isDrawingRef.current = true;
    scheduleDraw();
    emitChanges();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const events = event.nativeEvent.getCoalescedEvents
      ? event.nativeEvent.getCoalescedEvents()
      : [event.nativeEvent];

    const currentStrokes = strokesRef.current;
    if (currentStrokes.length === 0) return;

    const activeStroke = currentStrokes[currentStrokes.length - 1];
    const updatedPoints = [...activeStroke.points];
    events.forEach(ev => {
      updatedPoints.push(toPoint(ev, rect));
    });

    const updatedStroke: DrawingStroke = {
      ...activeStroke,
      points: updatedPoints,
    };

    const nextStrokes = [...currentStrokes];
    nextStrokes[nextStrokes.length - 1] = updatedStroke;
    strokesRef.current = nextStrokes;
    scheduleDraw();
    emitChanges();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    if (!isDrawingRef.current) return;
    event.preventDefault();
    isDrawingRef.current = false;
    emitChanges();
  };

  return (
    <div ref={containerRef} className={className}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg bg-bg-secondary"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
