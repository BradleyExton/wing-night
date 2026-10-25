// The country Props' corn cobs, ported from the harness's country-show.js
// (`cobFrame`, `cob`, `hugLeaf`). A cob's outline is a few hundred sampled
// points, too long to write out, so the builders come across instead and
// produce the harness's strings to the character: the same 0.25 and 0.05 steps
// and the same two-decimal rounding.

type Point = { x: number; y: number };

export type CobDims = { w0: number; wMax: number; wTip: number };

const f = (n: number): string => (Math.round(n * 100) / 100).toString();

const pt = (p: Point): string => `${f(p.x)} ${f(p.y)}`;

const add = (p: Point, v: Point, k = 1): Point => ({ x: p.x + v.x * k, y: p.y + v.y * k });

const unit = (a: Point, b: Point): Point => {
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
};

const normal = (u: Point): Point => ({ x: -u.y, y: u.x });

type CobFrame = {
  u: Point;
  n: Point;
  len: number;
  r1: number;
  ts: number;
  width: (t: number) => number;
  at: (t: number, o: number) => Point;
};

// A tapered cob from the base p0 to the very end of its tip p1: w0 wide at the
// base, swelling to wMax at t = 0.3, then narrowing to a rounded tip wTip
// across.
const cobFrame = (p0: Point, p1: Point, { w0, wMax, wTip }: CobDims): CobFrame => {
  const u = unit(p0, p1);
  const n = normal(u);
  const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const r1 = wTip / 2;
  const ts = (len - r1) / len;
  const width = (t: number): number => {
    if (t <= 0.3) return w0 + (wMax - w0) * Math.sin(((t / 0.3) * Math.PI) / 2);
    const k = (t - 0.3) / (ts - 0.3);
    return wMax - (wMax - wTip) * Math.pow(k, 1.25);
  };
  const at = (t: number, o: number): Point => add(add(p0, u, t * len), n, o);
  return { u, n, len, r1, ts, width, at };
};

// The cob: two long edges a gentle lumpy wave (bumps 0.9 high every 3.4,
// easing to about half at the tip) ending in a blunt bullet, and the two
// lengthwise kernel rows at ±width/5 from t 0.2 to 0.85, as one `d`.
export const cobPaths = (p0: Point, p1: Point, dims: CobDims): { outline: string; rows: string } => {
  const { u, n, len, r1, ts, width, at } = cobFrame(p0, p1, dims);
  const knob = (t: number): number => Math.min(1, Math.max(0.55, width(t) / (0.75 * dims.wMax)));
  const bump = (d: number): number => 0.9 * knob(d / len) * Math.abs(Math.sin((Math.PI * d) / 3.4));
  const side = (s: number): Point[] => {
    const pts: Point[] = [];
    for (let d = 0; d <= ts * len + 1e-6; d += 0.25) {
      const t = d / len;
      pts.push(at(t, s * (width(t) / 2 - 0.8 + bump(d))));
    }
    return pts;
  };
  const left = side(1);
  const right = side(-1).reverse();
  const first = left[0] as Point;
  const last = right[right.length - 1] as Point;
  const shoulder = add(p0, u, ts * len);
  const capR = r1 - 0.8 + bump(ts * len);
  const outline =
    `M ${left.map(pt).join(" L ")} A ${f(capR)} ${f(capR)} 0 0 0 ${pt(add(shoulder, n, -capR))} ` +
    `L ${right.map(pt).join(" L ")} C ${pt(add(last, u, -1.6))} ${pt(add(first, u, -1.6))} ${pt(first)} Z`;
  const row = (s: number): string => {
    const pts: Point[] = [];
    for (let t = 0.2; t <= 0.85 + 1e-6; t += 0.05) pts.push(at(t, (s * width(t)) / 5));
    return `M ${pts.map(pt).join(" L ")}`;
  };
  return { outline, rows: `${row(1)} ${row(-1)}` };
};

// A husk sheath (run 5's corn-cob a): two white leaves that wrap the whole
// width of the cob from its base to `reach`, meeting on a seam down its middle
// that splits at `split` so the cob's top shows in the V between their tips,
// and each tip peeling `flare` out past the cob's edge — the corn emoji's
// husk, a solid white cup rather than two slivers along a yellow cob (which
// read as white puffs at 76px once the cob sank into an orange team).
export const huskSheathPaths = (
  p0: Point,
  p1: Point,
  dims: CobDims,
  { reach, split, flare }: { reach: number; split: number; flare: number }
): [string, string] => {
  const { at, width } = cobFrame(p0, p1, dims);
  const half = (t: number): number => width(t) / 2;
  const leaf = (s: number): string => {
    const seamBase = at(0, -s * 0.6);
    const outerBase = at(0, s * (half(0) + 0.6));
    const outer = at(reach * 0.5, s * (half(reach * 0.5) + flare * 0.9));
    const tip = at(reach, s * (half(reach) + flare));
    const inner = at((split + reach) / 2, s * half((split + reach) / 2) * 0.35);
    const seamTop = at(split, -s * 0.6);
    return `M ${pt(seamBase)} L ${pt(outerBase)} Q ${pt(outer)} ${pt(tip)} Q ${pt(inner)} ${pt(seamTop)} Z`;
  };
  return [leaf(1), leaf(-1)];
};

// The two white husk leaves hugging a cob's sides (left of the axis first),
// each from the base to `reach` along it, its outer edge flaring `flare` out.
export const huskLeafPaths = (
  p0: Point,
  p1: Point,
  dims: CobDims,
  reach: number,
  flare: number,
  overlap: number
): [string, string] => {
  const { at, width } = cobFrame(p0, p1, dims);
  const half = (t: number): number => width(t) / 2;
  const leaf = (s: number): string => {
    const b0 = at(0.02, s * half(0.02) * 0.2);
    const tip = at(reach, s * (half(reach) + flare * 0.9));
    const outer = at(reach * 0.45, s * (half(reach * 0.45) + flare * 1.3));
    const inner = at(reach * 0.55, s * (half(reach * 0.55) - overlap));
    return `M ${pt(b0)} Q ${pt(outer)} ${pt(tip)} Q ${pt(inner)} ${pt(b0)} Z`;
  };
  return [leaf(1), leaf(-1)];
};
