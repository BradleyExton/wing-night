import type { CharacterSilhouette } from "../../../../resolveTeamSilhouette/index.js";

// The shapes the harness's shared.js builds for the any-team rail, ported. A
// shared item is worn on all four bodies, so it reads its placement off the
// silhouette (the harness's `keyOf(ctx)`, stock for undefined) from one table
// per item, and every builder produces the harness's string exactly: the same
// `f` rounding, the same operations in the same order.

export type Point = [number, number];

type SilhouetteKey = CharacterSilhouette | "stock";

type PerBody<T> = Record<SilhouetteKey, T>;

const keyOf = (silhouette: CharacterSilhouette | undefined): SilhouetteKey => silhouette ?? "stock";

const f = (n: number): number => Math.round(n * 100) / 100;

const rad = (deg: number): number => (deg * Math.PI) / 180;

const poly = (pts: Point[]): string => `M ${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")} Z`;

// A smooth closed path through points (Catmull-Rom as cubic beziers).
const smooth = (pts: Point[]): string => {
  const n = pts.length;
  const P = (i: number): Point => pts[(i + n) % n];
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
};

// The same through an open run of points, closed by a straight line.
const smoothOpen = (pts: Point[]): string => {
  const n = pts.length;
  const P = (i: number): Point => pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
};

const circlePath = (cx: number, cy: number, r: number): string =>
  `M ${f(cx - r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;

// A local frame: u along `deg` from `o`, v a quarter turn clockwise of it.
const frame =
  (o: Point, deg: number) =>
  ([u, v]: Point): Point => {
    const c = Math.cos(rad(deg));
    const s = Math.sin(rad(deg));
    return [o[0] + u * c - v * s, o[1] + u * s + v * c];
  };

// The egg outline in its own frame: t = 0 front, pi/2 bottom, 3pi/2 top.
const eggPoint = (w: number, h: number, t: number, inset = 0): Point => {
  const y = (h / 2 - inset) * Math.sin(t);
  const x = (w / 2 - inset) * Math.cos(t) * (1 + 0.16 * (y / (h / 2)));
  return [x, y];
};

// An egg centred on (cx, cy), w wide and h tall, narrow end up, tilted by
// `tilt` degrees (positive leans the top forward).
export const eggPath = (cx: number, cy: number, w: number, h: number, tilt = 0): string => {
  const at = frame([cx, cy], tilt);
  const pts: Point[] = [];
  for (let i = 0; i < 28; i += 1) pts.push(at(eggPoint(w, h, (i / 28) * Math.PI * 2)));
  return smooth(pts);
};

// [cx, cy, w, h, tilt]
export type Egg = [number, number, number, number, number];

// `goldShine`'s geometry: the egg it is clipped to, the shade (the egg's box
// minus the egg nudged up and back, even-odd) and the glint, an arc 2u inside
// the outline from about 9 o'clock round to 11.
export const goldShine = ([cx, cy, w, h, tilt]: Egg): { egg: string; shade: string; glint: string } => {
  const at = frame([cx, cy], tilt);
  const lit = eggPath(...at([-1.6, -2.6]), w, h, tilt);
  const box = `M ${f(cx - w)} ${f(cy - h)} L ${f(cx + w)} ${f(cy - h)} L ${f(cx + w)} ${f(cy + h)} L ${f(cx - w)} ${f(cy + h)} Z`;
  const arc: Point[] = [];
  for (let i = 0; i <= 10; i += 1) arc.push(at(eggPoint(w, h, rad(186 + i * 7), 2)));
  return {
    egg: eggPath(cx, cy, w, h, tilt),
    shade: `${box} ${lit}`,
    glint: `M ${arc.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")}`
  };
};

// ------------------------------------------------------------------- bib --

type Chest = { back: number; hem: number; front?: Point; splat: [number, number, number]; drip: number };

// `CHEST`: the lobster bib's back edge, hem, hem front end, sauce splat
// (centre and radius) and the y its drip's bulb ends on, per body.
const CHEST: PerBody<Required<Chest>> = {
  stock: { back: 44, hem: 57, front: [66, 50], splat: [56, 47.5, 5.4], drip: 55.5 },
  spiky: { back: 44, hem: 54.5, front: [65, 48], splat: [55.3, 46, 4.9], drip: 53 },
  broody: { back: 45, hem: 60, front: [70, 53], splat: [58, 50, 6], drip: 58.5 },
  preener: { back: 42, hem: 54, front: [66, 47], splat: [53.5, 44.6, 4.3], drip: 51.2 }
};

// `PAPER`: the same for the paper bib, which has a square hem.
const PAPER: PerBody<Chest> = {
  stock: { back: 43, hem: 58, splat: [54.5, 47.5, 5], drip: 55.6 },
  spiky: { back: 43, hem: 55.5, splat: [54, 46.4, 4.6], drip: 53.2 },
  broody: { back: 44, hem: 61, splat: [57, 50, 5.6], drip: 58.6 },
  preener: { back: 41.5, hem: 54.5, splat: [52.5, 45.4, 4.1], drip: 52 }
};

const RAYS: Point[] = [
  [-0.9, 1.15],
  [0.35, 1.5],
  [2.25, 0.8],
  [2.95, 1.1],
  [4.3, 0.75]
];

const splatPath = (cx: number, cy: number, r: number): string => {
  const pts: Point[] = [];
  const N = 90;
  const core = r * 0.55;
  for (let i = 0; i < N; i += 1) {
    const t = (i / N) * Math.PI * 2;
    let rr = core;
    RAYS.forEach(([a, len]) => {
      let d = Math.abs(t - a);
      d = Math.min(d, Math.PI * 2 - d);
      const w = len > 1 ? 0.22 : 0.3;
      rr = Math.max(rr, core + (r * len - core) * Math.exp(-((d / w) ** 2)));
    });
    pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
  }
  return smooth(pts);
};

const dropletPath = (cx: number, cy: number, r: number): string => {
  const dx = cx - 1.3 * r;
  const dy = cy + 0.9 * r;
  const toward = Math.atan2(cy - dy, cx - dx);
  const pts: Point[] = [];
  for (let i = 0; i < 36; i += 1) {
    const t = (i / 36) * Math.PI * 2;
    let d = Math.abs(t - ((toward + Math.PI * 2) % (Math.PI * 2)));
    d = Math.min(d, Math.PI * 2 - d);
    const rr = 1.4 + 1.3 * Math.exp(-((d / 0.4) ** 2));
    pts.push([dx + rr * Math.cos(t), dy + rr * Math.sin(t)]);
  }
  return smooth(pts);
};

const dripPath = (x: number, y0: number, y1: number, w: number, bulb: number): string => {
  const b = bulb / 2;
  const cy = y1 - b;
  return (
    `M ${f(x - w * 1.5)} ${f(y0)} C ${f(x - w)} ${f(y0 + 1.2)} ${f(x - w * 0.8)} ${f(cy - b * 1.6)} ${f(x - b)} ${f(cy)} ` +
    `A ${f(b)} ${f(b)} 0 1 0 ${f(x + b)} ${f(cy)} C ${f(x + w * 0.8)} ${f(cy - b * 1.6)} ${f(x + w)} ${f(y0 + 1.2)} ${f(x + w * 1.5)} ${f(y0)} Z`
  );
};

// `sauceParts`: the splat, its one droplet and its drip.
const sauceParts = (c: Chest, dripW: number, bulb: number): string[] => {
  const [sx, sy, sr] = c.splat;
  return [splatPath(sx, sy, sr), dropletPath(sx, sy, sr), dripPath(sx - 0.4, sy + sr * 0.35, c.drip, dripW, bulb)];
};

// `lobsterBibD` and its sauce.
export const lobsterBib = (silhouette: CharacterSilhouette | undefined, shoulders: number): { bib: string; sauce: string[] } => {
  const c = CHEST[keyOf(silhouette)];
  const s = shoulders;
  const { back, hem, front } = c;
  const mid = back + (front[0] - back) * 0.42;
  return {
    bib: `M ${back} ${s} L ${front[0] + 6} ${s} L ${front[0] + 6} ${front[1] - 2} L ${front[0]} ${front[1]} C ${front[0] - 4} ${hem} ${mid + 5} ${hem} ${mid} ${hem} C ${back + 3} ${hem} ${back} ${hem - 3} ${back} ${hem - 7} Z`,
    sauce: sauceParts(c, 1.0, 2.2)
  };
};

// `paperBib`'s square, its sauce and its tie string.
export const paperBib = (
  silhouette: CharacterSilhouette | undefined,
  shoulders: number
): { paper: string; sauce: string[]; tie: string } => {
  const c = PAPER[keyOf(silhouette)];
  const top = Math.max(37, shoulders);
  const { back, hem } = c;
  return {
    paper: `M ${back} ${top} L 80 ${top} L 80 ${hem} L ${back + 6} ${hem} Q ${back} ${hem} ${back} ${hem - 6} Z`,
    sauce: sauceParts(c, 0.9, 2.0),
    tie: `M ${back} ${top} L ${back - 4} ${top + 1.5}`
  };
};

// ------------------------------------------------------------------ sash --

const bandPts = (a: Point, b: Point, hw: number): Point[] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * hw;
  const ny = (dx / len) * hw;
  return [
    [a[0] + nx, a[1] + ny],
    [b[0] + nx, b[1] + ny],
    [b[0] - nx, b[1] - ny],
    [a[0] - nx, a[1] - ny]
  ];
};

// A polygon cut to y >= y0 (Sutherland-Hodgman against one half-plane).
const belowY = (pts: Point[], y0: number): Point[] => {
  const out: Point[] = [];
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const pin = p[1] >= y0;
    const qin = q[1] >= y0;
    if (pin) out.push(p);
    if (pin !== qin) {
      const t = (y0 - p[1]) / (q[1] - p[1]);
      out.push([p[0] + t * (q[0] - p[0]), y0]);
    }
  });
  return out;
};

// `SASH`: near shoulder to back hip, per body.
const SASH: PerBody<{ shoulder: Point; hip: Point }> = {
  stock: { shoulder: [64, 0], hip: [12, 56] },
  spiky: { shoulder: [63, 0], hip: [13, 55.5] },
  broody: { shoulder: [68, 0], hip: [12, 55.5] },
  preener: { shoulder: [60, 0], hip: [26, 55] }
};

// The 8.4u band, cut flat at y 36.5 (or the shoulders, if lower).
export const sashBand = (silhouette: CharacterSilhouette | undefined, shoulders: number): string => {
  const c = SASH[keyOf(silhouette)];
  return poly(belowY(bandPts([c.shoulder[0], shoulders - 4], c.hip, 4.2), Math.max(36.5, shoulders)));
};

// `KNOT`: where the knot sits along the band, and its tails as
// [u, v, direction in degrees, length] in the knot's frame.
const KNOT: PerBody<{ t: number; tails: [number, number, number, number][] }> = {
  stock: { t: 0.64, tails: [[4.5, -0.6, 125, 7.5]] },
  spiky: { t: 0.62, tails: [[4.5, -0.6, 125, 6]] },
  broody: {
    t: 0.68,
    tails: [
      [4, -3.5, 138, 10],
      [0.5, -3.5, 115, 12]
    ]
  },
  preener: { t: 0.6, tails: [] }
};

const ribbon = (a: Point, b: Point, hw: number, notch: number): string => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const [ux, uy] = [dx / len, dy / len];
  const [nx, ny] = [-uy, ux];
  return poly([
    [a[0] + nx * hw, a[1] + ny * hw],
    [b[0] + nx * hw, b[1] + ny * hw],
    [b[0] - ux * notch, b[1] - uy * notch],
    [b[0] - nx * hw, b[1] - ny * hw],
    [a[0] - nx * hw, a[1] - ny * hw]
  ]);
};

const roundRect = (c: Point, deg: number, len: number, wid: number, rx: number): string => {
  const at = frame(c, deg);
  const [u, v] = [len / 2, wid / 2];
  const P = (a: number, b: number): string => at([a, b]).map(f).join(" ");
  return (
    `M ${P(-u + rx, -v)} L ${P(u - rx, -v)} Q ${P(u, -v)} ${P(u, -v + rx)} L ${P(u, v - rx)} Q ${P(u, v)} ${P(u - rx, v)} ` +
    `L ${P(-u + rx, v)} Q ${P(-u, v)} ${P(-u, v - rx)} L ${P(-u, -v + rx)} Q ${P(-u, -v)} ${P(-u + rx, -v)} Z`
  );
};

// `knottedSash`'s parts: the band, the tails, the 9 x 13 knot, all three as
// the one region the body's outline is restroked over, and the ink style's two
// cinch lines across the knot's ends.
export const knottedSash = (
  silhouette: CharacterSilhouette | undefined,
  shoulders: number
): { band: string; tails: string[]; knot: string; all: string; cinch: string } => {
  const key = keyOf(silhouette);
  const line = SASH[key];
  const c = KNOT[key];
  const band = poly(belowY(bandPts([line.shoulder[0], shoulders - 4], line.hip, 4.2), Math.max(36.5, shoulders)));
  // The knot is placed on the costume head's line (shoulder end at y 33).
  const a: Point = [line.shoulder[0], 33];
  const b = line.hip;
  const kc: Point = [a[0] + (b[0] - a[0]) * c.t, a[1] + (b[1] - a[1]) * c.t];
  const deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const along = frame(kc, deg);
  const [kl, kw] = [9, 13];
  const knot = roundRect(kc, deg, kl, kw, 1.8);
  const tails = c.tails.map(([u, v, dir, len]) => {
    const p0 = along([u, v]);
    return ribbon(p0, [p0[0] + len * Math.cos(rad(dir)), p0[1] + len * Math.sin(rad(dir))], 4, 3.5);
  });
  const cinch = [-kl / 2, kl / 2]
    .map((u) => {
      const [p, q] = [along([u, -kw / 2]), along([u, kw / 2])];
      return `M ${f(p[0])} ${f(p[1])} L ${f(q[0])} ${f(q[1])}`;
    })
    .join(" ");
  return { band, tails, knot, all: [band, ...tails, knot].join(" "), cinch };
};

// ------------------------------------------------------------ golden egg --

// `CLUTCH`: the clutched egg's centre and lean, per body. Run 5's face-crossing
// sweep (every frame of every Move) moved two: the spiky egg up half a unit,
// which the chicken dance's drop sank 0.05 through the soft floor, and the
// preener's up and back to [28, 60], which Night Fever's down point swung out
// in front of the pitched face.
const CLUTCH: PerBody<{ c: Point; tilt: number }> = {
  stock: { c: [36, 63.5], tilt: -18 },
  spiky: { c: [34, 63.5], tilt: -18 },
  broody: { c: [37, 63], tilt: -14 },
  preener: { c: [28, 60], tilt: -20 }
};

export const clutchedEgg = (silhouette: CharacterSilhouette | undefined): Egg => {
  const { c, tilt } = CLUTCH[keyOf(silhouette)];
  return [c[0], c[1], 10.5, 13.5, tilt];
};

// `TROPHY`: the foot's centre, the axis up toward the egg, and the stem.
const TROPHY: PerBody<{ base: Point; deg: number; stem?: number }> = {
  stock: { base: [24.5, 55], deg: -105 },
  spiky: { base: [24.5, 54.5], deg: -105 },
  broody: { base: [29, 54], deg: -108, stem: 9.5 },
  preener: { base: [23.5, 54], deg: -103 }
};

// `trophyParts`: the foot, stem, U bowl and lip, and the egg seated behind
// the lip.
export const trophy = (
  silhouette: CharacterSilhouette | undefined
): { foot: string; stem: string; bowl: string; lip: string; egg: Egg } => {
  const { base, deg, stem: stemLen = 12 } = TROPHY[keyOf(silhouette)];
  const at = frame(base, deg);
  const P = (u: number, v: number): Point => at([u, v]);
  const b0 = 1.75 + stemLen;
  const c = P(b0 + 9.5 + 6.25 - 4.2, 0);
  return {
    foot: poly([P(-1.75, -5.5), P(-1.75, 5.5), P(1.75, 5.5), P(1.75, -5.5)]),
    stem: poly([P(1.75, -1.9), P(1.75, 1.9), P(b0 + 1, 1.9), P(b0 + 1, -1.9)]),
    bowl: smoothOpen([P(b0 + 8, -8), P(b0 + 4, -7.8), P(b0 + 1, -5.6), P(b0, 0), P(b0 + 1, 5.6), P(b0 + 4, 7.8), P(b0 + 8, 8)]),
    lip: poly([P(b0 + 7, -9), P(b0 + 7, 9), P(b0 + 9.5, 9), P(b0 + 9.5, -9)]),
    egg: [c[0], c[1], 10, 12.5, deg + 90]
  };
};

// ------------------------------------------------------------- drumstick --

type Drumstick = {
  at: (p: Point) => Point;
  L: number;
  m0: number;
  r: number;
  meat: string;
  bone: string;
  lobes: string[];
};

// `drumstickParts`: knuckle k to meat tip t, a white bone with a two-lobed
// knuckle and a teardrop of meat over the far end.
const drumstickParts = ({ k, t, r = 5, meat = 0.6, bone = 1.5 }: { k: Point; t: Point; r?: number; meat?: number; bone?: number }): Drumstick => {
  const deg = (Math.atan2(t[1] - k[1], t[0] - k[0]) * 180) / Math.PI;
  const L = Math.hypot(t[0] - k[0], t[1] - k[1]);
  const at = frame(k, deg);
  const m0 = L * (1 - meat);
  const P = (u: number, v: number): string => at([u, v]).map(f).join(" ");
  const meatD = `M ${P(m0, -bone)} C ${P(m0 + L * meat * 0.3, -r * 1.2)} ${P(L - r * 0.1, -r * 1.05)} ${P(L, 0)} C ${P(L - r * 0.1, r * 1.05)} ${P(m0 + L * meat * 0.3, r * 1.2)} ${P(m0, bone)} Z`;
  const boneD = poly(
    (
      [
        [1, -bone],
        [m0 + 1.5, -bone],
        [m0 + 1.5, bone],
        [1, bone]
      ] as Point[]
    ).map(at)
  );
  const lobes = [at([0.4, -2]), at([0.4, 2])].map((c) => circlePath(c[0], c[1], 2.3));
  return { at, L, m0, r, meat: meatD, bone: boneD, lobes };
};

const ellipsePath = (cx: number, cy: number, rx: number, ry: number, deg: number): string => {
  const at = frame([cx, cy], deg);
  const pts: Point[] = [];
  for (let i = 0; i < 16; i += 1) {
    const t = (i / 16) * Math.PI * 2;
    pts.push(at([rx * Math.cos(t), ry * Math.sin(t)]));
  }
  return smooth(pts);
};

// `sauceOnMeat`'s ink style: two char blotches on the meat's rim.
const charBlotches = ({ at, L, r }: Drumstick): string[] => {
  const [c1, c2] = [at([L - r * 1.55, -r * 0.8]), at([L - r * 0.3, r * 0.6])];
  return [ellipsePath(c1[0], c1[1], 1.6, 1.1, 25), ellipsePath(c2[0], c2[1], 1.2, 0.9, 25)];
};

// `sauceOnMeat`'s glaze: a cap over the tip end of the meat, its top edge wavy.
const glazeCap = ({ at, L, m0, r }: Drumstick, cover: number): string => {
  const len = L - m0;
  const uc = L - len * cover;
  const edge: Point[] = [];
  const span = r * 1.4;
  for (let i = 0; i <= 24; i += 1) {
    const v = -span + (2 * span * i) / 24;
    edge.push([uc - 0.85 * Math.abs(Math.sin((3 * Math.PI * (v + span)) / (2 * span))), v]);
  }
  return poly([...edge, [L + 3, span] as Point, [L + 3, -span] as Point].map(at));
};

const glazeDrip = (t: Point, end: number): string => {
  const w = 0.7;
  return `M ${f(t[0] - 1.6)} ${f(t[1] - 1.2)} L ${f(t[0] + 1.4)} ${f(t[1] - 1.2)} L ${f(t[0] + w)} ${f(end - w * 1.4)} A ${f(w)} ${f(w)} 0 0 1 ${f(t[0] - w)} ${f(end - w * 1.4)} Z`;
};

// `DROP`: the mic drop's knuckle, meat tip and where its glaze drip ends.
const DROP: PerBody<{ k: Point; t: Point; glazeEnd: number }> = {
  stock: { k: [26, 46], t: [19, 59.5], glazeEnd: 63.1 },
  spiky: { k: [26, 46], t: [18.5, 59], glazeEnd: 62.6 },
  broody: { k: [25, 46], t: [20.5, 60.5], glazeEnd: 64.1 },
  preener: { k: [25, 46], t: [20.5, 60.5], glazeEnd: 64.1 }
};

export type DrumstickPaths = { bone: string; lobes: string[]; meat: string; drip: string; cap: string; char: string[] };

export const micDrop = (silhouette: CharacterSilhouette | undefined): DrumstickPaths => {
  const { k, t, glazeEnd } = DROP[keyOf(silhouette)];
  const p = drumstickParts({ k, t, r: 5.5, meat: 0.55 });
  return { bone: p.bone, lobes: p.lobes, meat: p.meat, drip: glazeDrip(t, glazeEnd), cap: glazeCap(p, 0.45), char: charBlotches(p) };
};

// `RAISED`: the raised drumstick's knuckle and axis.
const RAISED: PerBody<{ k: Point; deg: number }> = {
  stock: { k: [27, 58.5], deg: -124 },
  spiky: { k: [27, 58], deg: -124 },
  broody: { k: [32.5, 54.5], deg: -134 },
  preener: { k: [25, 57], deg: -112 }
};

// Sample a closed path of cubic segments (M x y C ... Z) into points.
const sampleCubics = (d: string): Point[] => {
  const n = (d.match(/-?[\d.]+/g) ?? []).map(Number);
  const pts: Point[] = [];
  let p0: Point = [n[0], n[1]];
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [c1, c2, p3]: Point[] = [
      [n[i], n[i + 1]],
      [n[i + 2], n[i + 3]],
      [n[i + 4], n[i + 5]]
    ];
    for (let j = 0; j < 60; j += 1) {
      const t = j / 60;
      const m = 1 - t;
      pts.push([0, 1].map((a) => m * m * m * p0[a] + 3 * m * m * t * c1[a] + 3 * m * t * t * c2[a] + t * t * t * p3[a]) as Point);
    }
    p0 = p3;
  }
  return pts;
};

// Points inside the circle (cx, cy, r) pushed out onto it: a round bite.
const bite = (pts: Point[], cx: number, cy: number, r: number): Point[] =>
  pts.map(([x, y]) => {
    const d = Math.hypot(x - cx, y - cy);
    return d >= r ? [x, y] : [cx + ((x - cx) / (d || 1)) * r, cy + ((y - cy) / (d || 1)) * r];
  });

// The raised drumstick: 30 long, r 7.4, with one round bite (r 5) out of the
// meat's underside; its glaze covers the top third of the bitten meat.
export const raisedDrumstick = (silhouette: CharacterSilhouette | undefined): Omit<DrumstickPaths, "drip" | "char"> => {
  const { k, deg } = RAISED[keyOf(silhouette)];
  const L = 30;
  const t = frame(k, deg)([L, 0]);
  const p = drumstickParts({ k, t, r: 7.4, meat: 0.6, bone: 1.8 });
  const [bx, by] = p.at([L - 5.5, -8.4]);
  const meat = poly(
    bite(
      sampleCubics(p.meat).map((q) => q.map(f) as Point),
      bx,
      by,
      5
    )
  );
  return { bone: p.bone, lobes: p.lobes, meat, cap: glazeCap({ ...p, meat }, 0.34) };
};

// -------------------------------------------------------------- egg nest --

// The thin ink pad under the feet, a ground shadow the legs cross cleanly.
export const PAD = "M -2 70 C 8 67.5 72 67.5 82 70 C 80 74.5 0 74.5 -2 70 Z";

// The clutch's eggs, [cx, cy, w, h, tilt]: three at the back, two at the front.
export const CLUTCH_BACK: Egg[] = [
  [4, 64.5, 9, 11.5, -16],
  [14.5, 63, 10, 12.8, -4],
  [9, 68, 8.5, 9.5, 8]
];

export const CLUTCH_FRONT: Egg[] = [
  [67, 63.5, 10, 12.8, 6],
  [76, 66, 8.5, 10.5, 16]
];

// The straw nest's eggs, back to front: middle, small, then the big one.
export const NEST_EGGS: Egg[] = [
  [-1.6, 64.4, 11, 13.5, -24],
  [14.2, 64.6, 10, 12.5, 14],
  [5.6, 64, 14, 17, -8]
];

// `NEST_WALL` written out: a lumpy woven wall from x -7.5 to 22, three round
// bumps on the rim (`bumps(-7.5, 22, 67, 2.5, 3)`) and three under it.
export const NEST_WALL =
  "M -7.5 67 C -7.5 63.67 2.33 63.67 2.33 67 C 2.33 63.67 12.17 63.67 12.17 67 C 12.17 63.67 22 63.67 22 67 C 23.6 68.2 23.6 71.2 21 72.5 C 21 75.17 11.83 75.17 11.83 72.5 C 11.83 75.17 2.67 75.17 2.67 72.5 C 2.67 75.17 -6.5 75.17 -6.5 72.5 C -8 71.6 -8 68.4 -7.5 67 Z";

// `NEST_CURL` written out: `strand([-2, 67], [-6.5, 64.5], [-7.8, 56], 4)`, the
// one straw curl tapering up and back.
export const NEST_CURL =
  "M -0.03 63.52 L -0.61 63.55 L -1.21 63.5 L -1.85 63.34 L -2.52 63.05 L -3.22 62.63 L -3.93 62.07 L -4.63 61.37 L -5.32 60.54 L -5.99 59.59 L -6.63 58.51 L -7.23 57.31 L -7.8 56 L -7.8 56 L -7.89 57.44 L -7.93 58.82 L -7.91 60.16 L -7.83 61.46 L -7.69 62.71 L -7.47 63.93 L -7.17 65.12 L -6.76 66.28 L -6.25 67.41 L -5.62 68.5 L -4.85 69.53 L -3.97 70.48 Z";

// The big one: the giant egg leaning back on the pad, and one small egg.
export const GIANT_EGG: Egg = [7.5, 64.9, 16.5, 27, -60];

export const SMALL_EGG: Egg = [71, 65.3, 9, 11.5, 12];
