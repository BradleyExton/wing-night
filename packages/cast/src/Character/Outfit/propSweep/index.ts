// The Prop sweep's measuring tape: every point that SHOWS along an item's
// rendered markup, in bird units, the way the harness measured each drawing
// for Gate 1 (outfit-harness.js `samplePoints`). A shape is walked along its
// outline (curves and arcs sampled, not their control points), through every
// transform above it; a clipped shape counts only where it lies inside its
// clip, plus the clip's own outline where that lies inside a filled shape.
// Nothing inside a clipPath is drawn, so nothing there is measured on its own.
//
// Straight edges are sampled along their length too, so a line that crosses
// the head box with both ends outside it is still caught.
//
// It reads plain markup (renderToStaticMarkup's), so a test can sweep a Prop
// without a DOM. It knows the subset the wardrobe draws: path, circle,
// ellipse and rect; translate, rotate and scale; absolute and relative path
// commands; the nonzero fill rule.
export type SweepPoint = [number, number];

type Matrix = [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

// Samples per curve segment, and twice that per arc.
const STEPS = 12;

const multiply = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5]
];

const apply = (m: Matrix, [x, y]: SweepPoint): SweepPoint => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

const parseTransform = (attribute: string | undefined): Matrix =>
  [...(attribute ?? "").matchAll(/(translate|rotate|scale)\(([^)]*)\)/g)].reduce<Matrix>((matrix, [, kind, raw]) => {
    const [a = 0, b, c = 0] = (raw ?? "").split(/[\s,]+/).filter(Boolean).map(Number);
    const radians = (a * Math.PI) / 180;
    const turn: Matrix = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0];

    if (kind === "translate") {
      return multiply(matrix, [1, 0, 0, 1, a, b ?? 0]);
    }

    if (kind === "scale") {
      return multiply(matrix, [a, 0, 0, b ?? a, 0, 0]);
    }

    return b === undefined ? multiply(matrix, turn) : multiply(multiply(multiply(matrix, [1, 0, 0, 1, b, c]), turn), [1, 0, 0, 1, -b, -c]);
  }, IDENTITY);

const cubic = (p0: SweepPoint, p1: SweepPoint, p2: SweepPoint, p3: SweepPoint): SweepPoint[] =>
  Array.from({ length: STEPS }, (_, i) => {
    const t = (i + 1) / STEPS;
    const u = 1 - t;

    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    ];
  });

const straight = (from: SweepPoint, to: SweepPoint): SweepPoint[] =>
  Array.from({ length: STEPS }, (_, i) => {
    const t = (i + 1) / STEPS;

    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t];
  });

const quadratic = (p0: SweepPoint, c: SweepPoint, p2: SweepPoint): SweepPoint[] =>
  cubic(
    p0,
    [p0[0] + (2 / 3) * (c[0] - p0[0]), p0[1] + (2 / 3) * (c[1] - p0[1])],
    [p2[0] + (2 / 3) * (c[0] - p2[0]), p2[1] + (2 / 3) * (c[1] - p2[1])],
    p2
  );

const vectorAngle = (ux: number, uy: number, vx: number, vy: number): number => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);

// An SVG arc from its endpoint form (SVG 1.1, F.6.5), sampled.
const arc = (from: SweepPoint, [rxIn, ryIn, rotation, large, sweep]: number[], to: SweepPoint): SweepPoint[] => {
  const phi = ((rotation ?? 0) * Math.PI) / 180;
  const [cos, sin] = [Math.cos(phi), Math.sin(phi)];
  const dx = (from[0] - to[0]) / 2;
  const dy = (from[1] - to[1]) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const grow = Math.max(1, Math.sqrt((x1 * x1) / ((rxIn ?? 0) ** 2) + (y1 * y1) / ((ryIn ?? 0) ** 2)));
  const rx = Math.abs(rxIn ?? 0) * grow;
  const ry = Math.abs(ryIn ?? 0) * grow;
  const sign = large === sweep ? -1 : 1;
  const root = Math.sqrt(Math.max(0, (rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1) / (rx * rx * y1 * y1 + ry * ry * x1 * x1)));
  const cx = (sign * root * rx * y1) / ry;
  const cy = (-sign * root * ry * x1) / rx;
  const start = vectorAngle(1, 0, (x1 - cx) / rx, (y1 - cy) / ry);
  const turn = vectorAngle((x1 - cx) / rx, (y1 - cy) / ry, (-x1 - cx) / rx, (-y1 - cy) / ry);
  const delta = sweep === 0 && turn > 0 ? turn - 2 * Math.PI : sweep === 1 && turn < 0 ? turn + 2 * Math.PI : turn;
  const [mx, my] = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];

  return Array.from({ length: STEPS * 2 }, (_, i) => {
    const theta = start + (delta * (i + 1)) / (STEPS * 2);
    const [ex, ey] = [rx * Math.cos(theta) + cx, ry * Math.sin(theta) + cy];

    return [cos * ex - sin * ey + mx, sin * ex + cos * ey + my];
  });
};

const ARITY: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

/** A path's subpaths, each as the points along it from its start. */
export const pathSubpaths = (d: string): SweepPoint[][] => {
  const subpaths: SweepPoint[][] = [];
  let at: SweepPoint = [0, 0];
  let start: SweepPoint = [0, 0];
  let control: SweepPoint = [0, 0];

  for (const [, letter = "", raw = ""] of d.matchAll(/([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g)) {
    const numbers = (raw.match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(Number);
    const kind = letter.toUpperCase();
    const arity = ARITY[kind] ?? 0;
    const relative = letter !== kind;

    for (let i = 0; i === 0 || i + arity <= numbers.length; i += Math.max(arity, 1)) {
      const n = numbers.slice(i, i + arity);
      const abs = (x = 0, y = 0): SweepPoint => (relative ? [at[0] + x, at[1] + y] : [x, y]);
      const current = subpaths[subpaths.length - 1];
      let next: SweepPoint = at;

      if (kind === "M" && i === 0) {
        next = abs(n[0], n[1]);
        start = next;
        subpaths.push([next]);
      } else if (kind === "Z") {
        next = start;
        current?.push(...straight(at, next));
      } else if (kind === "C" || kind === "S" || kind === "Q") {
        const c1: SweepPoint = kind === "S" ? [2 * at[0] - control[0], 2 * at[1] - control[1]] : abs(n[0], n[1]);
        const c2 = kind === "C" ? abs(n[2], n[3]) : kind === "S" ? abs(n[0], n[1]) : c1;

        next = kind === "C" ? abs(n[4], n[5]) : abs(n[2], n[3]);
        current?.push(...(kind === "Q" ? quadratic(at, c1, next) : cubic(at, c1, c2, next)));
        control = c2;
      } else if (kind === "A") {
        next = abs(n[5], n[6]);
        current?.push(...arc(at, n, next));
      } else {
        next =
          kind === "H"
            ? [relative ? at[0] + (n[0] ?? 0) : (n[0] ?? 0), at[1]]
            : kind === "V"
              ? [at[0], relative ? at[1] + (n[0] ?? 0) : (n[0] ?? 0)]
              : abs(n[0], n[1]);
        current?.push(...straight(at, next));
      }

      at = next;

      if (kind === "Z") {
        break;
      }
    }
  }

  return subpaths;
};

const ellipse = (cx: number, cy: number, rx: number, ry: number): SweepPoint[] =>
  Array.from({ length: STEPS * 4 }, (_, i) => [cx + rx * Math.cos((i * Math.PI) / (STEPS * 2)), cy + ry * Math.sin((i * Math.PI) / (STEPS * 2))]);

const shapeOutlines = (tag: string, attributes: Record<string, string>): SweepPoint[][] => {
  const n = (key: string): number => Number(attributes[key] ?? 0);

  switch (tag) {
    case "path":
      return pathSubpaths(attributes.d ?? "");
    case "circle":
      return [ellipse(n("cx"), n("cy"), n("r"), n("r"))];
    case "ellipse":
      return [ellipse(n("cx"), n("cy"), n("rx"), n("ry"))];
    case "rect":
      return pathSubpaths(`M ${n("x")} ${n("y")} h ${n("width")} v ${n("height")} h ${-n("width")} Z`);
    default:
      return [];
  }
};

// Nonzero winding over the sampled outlines, the SVG default fill rule.
const isInside = (outlines: SweepPoint[][], [x, y]: SweepPoint): boolean => {
  let winding = 0;

  for (const outline of outlines) {
    for (let i = 0; i < outline.length; i += 1) {
      const [x1, y1] = outline[i] ?? [0, 0];
      const [x2, y2] = outline[(i + 1) % outline.length] ?? [0, 0];
      const side = (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1);

      if (y1 <= y && y2 > y && side > 0) {
        winding += 1;
      } else if (y1 > y && y2 <= y && side < 0) {
        winding -= 1;
      }
    }
  }

  return winding !== 0;
};

type Frame = { matrix: Matrix; inClipPath: string | undefined; clipRef: string | undefined; unfilled: boolean };

/** Every point that shows along the shapes in `markup`, in its root units. */
export const resolveSweepPoints = (markup: string): SweepPoint[] => {
  const shapes: { outlines: SweepPoint[][]; matrix: Matrix; clipRef: string | undefined; unfilled: boolean }[] = [];
  const clips = new Map<string, SweepPoint[][]>();
  const stack: Frame[] = [{ matrix: IDENTITY, inClipPath: undefined, clipRef: undefined, unfilled: false }];

  for (const [, close, tag = "", raw = "", selfClosing] of markup.matchAll(/<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"]*")*)\s*(\/?)>/g)) {
    if (close === "/") {
      stack.pop();
      continue;
    }

    const attributes = Object.fromEntries([...raw.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]));
    const parent = stack[stack.length - 1] ?? stack[0]!;
    const fillClass = (attributes.class ?? "").split(/\s+/).find((name) => name.startsWith("fill-"));
    const fill = attributes.fill ?? fillClass;
    const frame: Frame = {
      matrix: multiply(parent.matrix, parseTransform(attributes.transform)),
      inClipPath: tag === "clipPath" ? attributes.id : parent.inClipPath,
      clipRef: attributes["clip-path"]?.match(/url\(#([^)]+)\)/)?.[1] ?? parent.clipRef,
      unfilled: fill === undefined ? parent.unfilled : fill === "none" || fill === "fill-none"
    };
    const outlines = shapeOutlines(tag, attributes);

    if (outlines.length > 0 && frame.inClipPath !== undefined) {
      clips.set(frame.inClipPath, [...(clips.get(frame.inClipPath) ?? []), ...outlines]);
    } else if (outlines.length > 0) {
      shapes.push({ outlines, matrix: frame.matrix, clipRef: frame.clipRef, unfilled: frame.unfilled });
    }

    if (selfClosing !== "/") {
      stack.push(frame);
    }
  }

  return shapes.flatMap(({ outlines, matrix, clipRef, unfilled }) => {
    const clip = clipRef === undefined ? undefined : clips.get(clipRef);
    const own = outlines.flat();

    // A clip is drawn in the clipped element's own units (the wardrobe puts
    // no transform between a clip and what it clips).
    const shown =
      clip === undefined
        ? own
        : [...own.filter((point) => isInside(clip, point)), ...(unfilled ? [] : clip.flat().filter((point) => isInside(outlines, point)))];

    return shown.map((point) => apply(matrix, point));
  });
};
