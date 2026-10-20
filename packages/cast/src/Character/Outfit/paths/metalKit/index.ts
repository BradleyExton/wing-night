// The shapes the harness's metal-kit.js builds for more than one item, ported:
// the chest panel a Top starts at the shoulders, the cut that turns a jacket's
// body ink from the shoulders down, and the combat boot's leg. Each produces
// the harness's string exactly (its `f1` rounding included).

type Point = { x: number; y: number };

const f1 = (n: number): string => (Math.round(n * 100) / 100).toString();

const pt = (p: Point): string => `${f1(p.x)} ${f1(p.y)}`;

const bez = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y
  };
};

// The spiky wing's front edge (C 51 40 49 46 45 51 from the pivot) at tenths,
// pushed 0.8 forward so a panel clears the wing's ink line.
const WING_FRONT: Point[] = Array.from({ length: 11 }, (_, i) =>
  bez({ x: 47, y: 35 }, { x: 51, y: 40 }, { x: 49, y: 46 }, { x: 45, y: 51 }, i / 10)
).map((p) => ({ x: p.x + 0.8, y: p.y }));

// The left edge of a chest panel from y `top` down to the wing's foot.
const frontEdgeFrom = (top: number): Point[] => {
  const pts = WING_FRONT.filter((p) => p.y > top);
  const first = WING_FRONT.findIndex((p) => p.y > top);
  const a = WING_FRONT[first - 1];
  const b = WING_FRONT[first];
  if (first > 0 && a !== undefined && b !== undefined) {
    const t = (top - a.y) / (b.y - a.y);
    return [{ x: a.x + t * (b.x - a.x), y: top }, ...pts];
  }
  return [{ x: pts[0]?.x ?? 0, y: top }, ...pts];
};

// `chestPanel(top)`: the whole chest that shows right of the wing's front
// edge, from `top` (the head's shoulders) down past the belly.
export const chestPanel = (top: number): string => {
  const edge = frontEdgeFrom(top);
  const reversed = edge
    .slice()
    .reverse()
    .map((p) => `L ${pt(p)}`)
    .join(" ");
  return `M ${pt(edge[0] ?? { x: 0, y: top })} L 72 ${f1(top)} L 72 66 L 43.6 66 L 44.4 56 ${reversed} Z`;
};

// `jacketBody`'s clip: everything from the shoulders down.
export const belowShoulders = (shoulders: number): string =>
  `M 0 ${shoulders} L 80 ${shoulders} L 80 80 L 0 80 Z`;

// The boots' sole stops at 72.2, above the 72.75 floor.
export const SOLE_Y = 72.2;

// `combatBoot(ax, 56)`: the plain boot round the leg, its shaft up to the
// thigh, about the leg's ankle `ax`.
export const combatBoot = (ax: number): string =>
  `M ${ax - 5} 56 L ${ax + 3.4} 56 L ${ax + 3.4} 64.6 C ${ax + 7} 64.6 ${ax + 9.6} 66.4 ${ax + 9.6} 69.4 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} L ${ax - 7.8} 68.8 L ${ax - 5} 67.6 Z`;
