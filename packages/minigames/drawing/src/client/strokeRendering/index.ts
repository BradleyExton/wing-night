import { getStroke } from "perfect-freehand";
import type { DrawingStroke } from "@wingnight/shared";

// Both the tablet capture canvas and the TV replay canvas keep this aspect
// ratio so normalized 0–1 coordinates draw identically on each surface.
export const DRAWING_CANVAS_ASPECT_RATIO = 16 / 10;

// Letterbox-fits the fixed-ratio canvas into its container. CSS aspect-ratio
// silently abandons the ratio when both axes are constrained, which would
// distort normalized strokes between tablet and TV.
export const fitDrawingCanvasSize = (
  containerWidth: number,
  containerHeight: number
): { width: number; height: number } => {
  const width = Math.max(
    1,
    Math.min(containerWidth, containerHeight * DRAWING_CANVAS_ASPECT_RATIO)
  );

  return {
    width,
    height: width / DRAWING_CANVAS_ASPECT_RATIO
  };
};

const toSvgPathFromOutline = (outline: number[][]): string => {
  if (outline.length === 0) {
    return "";
  }

  const [firstPoint] = outline;

  if (firstPoint === undefined) {
    return "";
  }

  const pathParts: string[] = [`M ${firstPoint[0]} ${firstPoint[1]}`];

  for (let index = 0; index < outline.length; index += 1) {
    const current = outline[index];
    const next = outline[(index + 1) % outline.length];

    if (current === undefined || next === undefined) {
      continue;
    }

    const midX = ((current[0] ?? 0) + (next[0] ?? 0)) / 2;
    const midY = ((current[1] ?? 0) + (next[1] ?? 0)) / 2;
    pathParts.push(`Q ${current[0]} ${current[1]} ${midX} ${midY}`);
  }

  pathParts.push("Z");
  return pathParts.join(" ");
};

export const renderStrokesToCanvas = (
  context: CanvasRenderingContext2D,
  strokes: DrawingStroke[],
  width: number,
  height: number
): void => {
  context.clearRect(0, 0, width, height);

  for (const stroke of strokes) {
    if (stroke.points.length === 0) {
      continue;
    }

    const outline = getStroke(
      stroke.points.map((point) => [point.x * width, point.y * height]),
      {
        size: Math.max(1, stroke.size * height),
        thinning: 0.55,
        smoothing: 0.6,
        streamline: 0.45,
        simulatePressure: true
      }
    );
    const pathData = toSvgPathFromOutline(outline);

    if (pathData === "") {
      continue;
    }

    // Soft chalk-glow halo around each stroke, matching the easel mockups.
    context.shadowColor = stroke.color;
    context.shadowBlur = Math.max(2, height * 0.005);
    context.fillStyle = stroke.color;
    context.fill(new Path2D(pathData));
  }

  context.shadowColor = "transparent";
  context.shadowBlur = 0;
};
