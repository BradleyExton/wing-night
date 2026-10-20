// country · kit: the Top, Sleeve, Tail items of the country rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Country is the broody bird in orange (teamE): the biggest chest of the
// four (555 u²), a 21-unit wing tuck and two low tail plumes, and NO Boots
// slot. So the flavour goes on the chest, and every Top here is a big flat
// value shape on it. Ink reads (6.1:1 on the orange); white only lives on
// its 2-unit ink outline (2.91:1); the leg orange is never a fill. Gold is
// 1.30:1 on the orange, so no country item offers it.
//
// Round 2 (after critic round 1): no continuous row of pointed tongues (it
// reads as teeth or a beard), fringe is square-ended strands with gaps; tail
// items are one merged cloth or bands that stay on the plume.
// Round 3 (after critic round 2): never white strands in a row (equal white
// bars read as teeth), so wing fringe is ink on the team wing and the ink
// wing is the default; never a white band split by an ink shape (two white
// wedges round a dark centre read as angry eyes); buckles carry a motif
// (star, longhorn), never a plain plate.
// Run 1b (after the final critic): the yoke gets piping, the longhorn thin
// open horns, the vest-b fringe moves to the wing-side hem, the gauntlet
// becomes a tan cuff at the wing's tip; the cut fringe-sleeve a, tail-bandana
// a and rope-coil a are redrawn. Rope never wraps a plume as bands (stripes):
// it hangs or trails as one rope, ink on a mutedWarm casing so it shows on the
// orange AND on the dark hearth.
//
// Broody geometry these drawings are fitted to (bird units):
//   body    front edge x≈66–68 at y 40–50, underside y≈64 at x 50; back
//           edge x 14 at y 49..57
//   neck    painted OVER every Top: its lower edge runs (45,33)→(60,40),
//           so on a drawn head the top 3–5 units of a chest item tuck under it
//   wing    x 27–48, y 34–51; front edge (47,37)→(44,47)→(39,50). A Top is
//           painted over the wing, so the chest items hug that edge instead
//           of covering the Sleeve
//   tail    two thin hooked plumes. Upper: tip (2,31), y 39..43 at x 10.
//           Lower: tip (0,42), hangs to y 53.4 at x 8. The body hides x > ~15

export const GENRES = ["country"];

const INK = "#121212";
const WHITE = "#ffffff";

const f1 = (n) => Math.round(n * 100) / 100;

/** The colour of an item's inner detail: ink on a light base, the team colour on ink. */
const detailOn = (ctx) => (ctx.style === "ink" ? ctx.fill : INK);

/** A square-ended strand: a parallelogram from a root, `len` along (dx,dy), `w` wide. */
const bar = (x, y, dx, dy, len, w) => {
  const n = Math.hypot(dx, dy);
  const ux = dx / n;
  const uy = dy / n;
  const px = -uy * (w / 2);
  const py = ux * (w / 2);
  const tx = x + ux * len;
  const ty = y + uy * len;
  return (
    `M ${f1(x - px)} ${f1(y - py)} L ${f1(tx - px)} ${f1(ty - py)}` +
    ` L ${f1(tx + px)} ${f1(ty + py)} L ${f1(x + px)} ${f1(y + py)} Z`
  );
};

/** An axis-aligned rectangle as a path. */
const rect = (x0, y0, x1, y1) => `M ${f1(x0)} ${f1(y0)} H ${f1(x1)} V ${f1(y1)} H ${f1(x0)} Z`;

/**
 * One merged shape with a single outer outline: an ink underlay a touch wider
 * than the house stroke, then the fill over it, so the subpaths' seams vanish.
 */
const merged = (d, fill, w = 2.6) =>
  `<path fill="${INK}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" d="${d}"/>
    <path fill="${fill}" d="${d}"/>`;

// The broody body's front edge, sampled off its path: [y, x].
const FRONT = [
  [29, 52], [30.2, 56.4], [32.1, 60.1], [34.5, 63], [37.3, 65.2], [40.5, 66.8], [43.9, 67.6],
  [47.5, 67.9], [51, 67.5], [54.6, 66.5], [58, 65], [60.5, 61.9], [62.5, 57.6]
];
/** x of the body's front edge at height y, pulled in by `inset`. */
const frontX = (y, inset = 0.6) => {
  for (let i = 1; i < FRONT.length; i += 1) {
    const [y0, x0] = FRONT[i - 1];
    const [y1, x1] = FRONT[i];
    if (y <= y1) return f1(x0 + ((x1 - x0) * Math.max(0, y - y0)) / (y1 - y0) - inset);
  }
  return f1(FRONT[FRONT.length - 1][1] - inset);
};
/** " L x y" points down the front edge from y0 to y1 (y0 < y1). */
const frontEdge = (y0, y1, inset = 0.6) => {
  const out = [];
  for (let y = y0; y < y1; y += 1.5) out.push(`L ${frontX(y, inset)} ${f1(y)}`);
  out.push(`L ${frontX(y1, inset)} ${f1(y1)}`);
  return out.join(" ");
};

// The broody wing's lower outline, sampled off its path, back tip to front point:
//   C (27,43)(26,47)(28,50)(31,51) · Q (35,47)(39,50) · C (45,47)(49,41)(47,36)
const cubic = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  ];
};
const quad = (p0, p1, p2, t) => {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
};
const WING_LOW = [];
for (let i = 0; i <= 40; i += 1) WING_LOW.push(cubic([27, 43], [26, 47], [28, 50], [31, 51], i / 40));
for (let i = 1; i <= 40; i += 1) WING_LOW.push(quad([31, 51], [35, 47], [39, 50], i / 40));
for (let i = 1; i <= 40; i += 1) WING_LOW.push(cubic([39, 50], [45, 47], [49, 41], [47, 36], i / 40));
/** The wing's lowest y at x (its trailing edge), or null off the wing. */
const wingBottom = (x) => {
  const near = WING_LOW.filter(([px]) => Math.abs(px - x) < 0.35);
  return near.length ? Math.max(...near.map(([, py]) => py)) : null;
};

// ================================================================= TOP ===

// ------------------------------------------------------------- bandana --
const bandanaKite = (ctx) => {
  const s = ctx.head.shoulders;
  const x = 54;
  const cloth =
    `M ${x - 10} ${s} Q ${x} ${s + 7} ${Math.min(x + 9, frontX(s + 1, 1))} ${s + 1}` +
    ` Q ${x + 7} ${s + 11} ${x - 0.5} ${s + 19}` +
    ` Q ${x - 6} ${s + 11} ${x - 10} ${s} Z`;
  const k = s + 3.5;
  const knot =
    `M ${x - 4.2} ${k} Q ${x} ${k + 3.6} ${x + 4} ${k + 0.4}` +
    ` Q ${x + 3} ${k + 4} ${x} ${k + 5.2} Q ${x - 3} ${k + 4} ${x - 4.2} ${k} Z`;
  return `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${cloth}"/>
    <path fill="${detailOn(ctx)}" d="${knot}"/>`;
};

const bandanaBib = (ctx) => {
  const s = ctx.head.shoulders;
  // A big outlaw bib: the rolled band round the neck is ink, the cloth below
  // it is one big triangle down to the belly, its point swung back a touch
  // as if it caught the wind.
  const r1 = frontX(s + 2, 1.2);
  const cloth =
    `M 45 ${s + 1.5} Q 56 ${s + 6} ${r1} ${s + 2}` +
    ` Q ${frontX(s + 9, 1.5)} ${s + 9} 60 ${s + 15} Q 56 ${s + 19} 52 ${s + 23}` +
    ` Q 49 ${s + 14} 45 ${s + 1.5} Z`;
  const band =
    `M 44.5 ${s} Q 56 ${s + 5} ${frontX(s, 0.8)} ${s}` +
    ` L ${frontX(s + 4, 0.8)} ${s + 4} Q 56 ${s + 9} 44.5 ${s + 4} Z`;
  return `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${cloth}"/>
    <path fill="${detailOn(ctx)}" ${ctx.inkStroke(1.2)} d="${band}"/>`;
};

// -------------------------------------------------------- western yoke --
// The yoke starts at y = max(shoulders, 36): the drawn neck's lower edge runs
// (45,33)→(60,40), and a band any higher hides under it.
const yokeTop = (ctx) => Math.max(ctx.head.shoulders, 36);

// The piped yoke's lower edge: level at y 44, one shallow dip to (57,48.5)
// across a wide base (50.2..63.6), so it is a shirt yoke and not a bandana point.
const YOKE_LOW = 44;
const YOKE_DIP = [57, 48.5];
const YOKE_BASE = [50.2, 63.6];

const yokeDip = (ctx) => {
  const y0 = yokeTop(ctx);
  const [dx, dy] = YOKE_DIP;
  const [b0, b1] = YOKE_BASE;
  const band = `M ${b0} ${y0} ${frontEdge(y0, YOKE_LOW)} L ${b1} ${YOKE_LOW} L ${dx} ${dy} L ${b0} ${YOKE_LOW} Z`;
  // The western cue is the piping: ONE continuous contrasting line inset
  // along the lower edge and down into the dip, white on the ink yoke and ink
  // on the white one.
  const up = 2.5;
  const py = YOKE_LOW - up;
  const piping =
    `M ${frontX(py, 1.6)} ${f1(py)} L ${b1 - 0.6} ${f1(py)} L ${dx} ${f1(dy - up - 0.6)}` +
    ` L ${b0 + 1.4} ${f1(py)}`;
  const line = ctx.style === "ink" ? WHITE : INK;
  return `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${band}"/>
    <path fill="none" stroke="${line}" stroke-width="2" stroke-linejoin="round" stroke-linecap="butt" d="${piping}"/>`;
};

const yokeBolo = (ctx) => {
  const y0 = yokeTop(ctx);
  // A square yoke and a bolo tie: the band's lower edge is straight, and the
  // western shirt is told by the tie instead of the dip: a diamond slide at
  // the yoke's edge and two cords down the chest.
  const band = `M 50.6 ${y0} ${frontEdge(y0, 42)} L 50.6 42 Z`;
  const cords = `${bar(56.2, 46, -0.05, 1, 9, 1.4)} ${bar(57.8, 46, 0.05, 1, 9, 1.4)}`;
  const tips = `${rect(55.2, 54, 56.9, 56.4)} ${rect(57.1, 54, 58.8, 56.4)}`;
  const slide = "M 57 39.8 L 60.8 44.4 L 57 49 L 53.2 44.4 Z";
  const slideFill = ctx.style === "ink" ? WHITE : INK;
  return `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${band}"/>
    <path fill="${INK}" d="${cords} ${tips}"/>
    <path fill="${slideFill}" ${ctx.inkStroke(1.4)} d="${slide}"/>`;
};

// ------------------------------------------------------- trophy buckle --
// The belt stub sits under the wing, x 40–67, y 52–57: it starts clear of
// the wing grip (31,51), where the lasso hangs.
const BELT = "M 40 52 L 67.3 51.5 C 67 53.5 66.4 55.5 65.6 57 L 40 57.5 Z";
const beltStub = () => `<path fill="${INK}" d="${BELT}"/>`;

const buckleStar = (ctx) => {
  // A sheriff's star buckle: five points, so it is a star at 76px and never
  // an egg or an eye; one white mark, no centre.
  const star = ctx.starPath(55, 54.5, 8.2);
  return `${beltStub()}<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${star}"/>`;
};

const buckleLonghorn = (ctx) => {
  // A longhorn steer buckle, about 22 wide and 12 tall: a short bar on the
  // belt, two THIN horns sweeping out and up off its ends to sharp tips at
  // (44,46.5) and (66.4,46.5), open hooks with orange inside their curve (a
  // thick white U read as underpants), and a short wedge of face under the
  // bar. One merged white shape with one ink outline; no eyes, no marks.
  const c = 55.2;
  const horn = (s) => {
    const X = (x) => f1(c + s * (x - c));
    return (
      `M ${X(50.4)} 55.2 C ${X(46)} 55.2 ${X(44.2)} 51.8 ${X(44)} 46.5` +
      ` C ${X(45.4)} 50.4 ${X(47.2)} 52.6 ${X(50.4)} 52.6 Z`
    );
  };
  const hornBar = rect(49.6, 52.6, 60.8, 55.2);
  const face = "M 51.9 54.6 L 58.5 54.6 L 56.6 58.5 L 53.8 58.5 Z";
  return `${beltStub()}${merged(`${horn(1)} ${horn(-1)} ${hornBar} ${face}`, ctx.styleFill, 2.8)}`;
};

// -------------------------------------------------------- fringed vest --
// Fringe strands are square-ended with gaps: a pointed tongue in a row reads
// as teeth at 76px.

const vestHem = (ctx) => {
  const s = ctx.head.shoulders;
  const hem = 49;
  // Two fronts with an orange gap between them, open all the way from the
  // neck (x 56.2..57.8) and widening to x 54.5..59.5 at the hem; fringe on
  // each front's hem, never across the gap.
  const left = `M 48.5 ${s} L 56.2 ${s} L 54.5 ${hem} L 42 ${hem} C 45.5 46 47.8 42 48.5 ${s} Z`;
  const right = `M 57.8 ${s} ${frontEdge(s, hem)} L 59.5 ${hem} Z`;
  const strands = [41.9, 44.5, 47.1, 49.7, 52.3, 60.1, 62.7, 65.3]
    .map((x) => rect(x, hem - 0.4, x + 1.4, hem + 5))
    .join(" ");
  return `<path fill="${ctx.styleFill}" d="${left} ${right} ${strands}"/>`;
};

const vestVee = (ctx) => {
  const s = ctx.head.shoulders;
  const hem = 47;
  // Two fronts to y 47 with a straight orange gap at x 53.6..56. The fringe
  // hangs only off the LEFT front's hem, next to the wing, where it shows on
  // the orange: four strands 1.8 wide with 1.2 gaps, long at the ends and
  // short in the middle (7/4/4/7), so the fringe dips in a V — never a's
  // flat comb. The right front is bare.
  const left = `M 48.5 ${s} L 53.6 ${s} L 53.6 ${hem} L 43.6 ${hem} C 46.4 44.4 47.8 41 48.5 ${s} Z`;
  const right = `M 56 ${s} ${frontEdge(s, hem, 0.6)} L 56 ${hem} Z`;
  const lens = [7, 4, 4, 7];
  const strands = [43.8, 46.8, 49, 51.8]
    .map((x, i) => rect(x, hem - 0.4, x + 1.8, hem + lens[i]))
    .join(" ");
  return `<path fill="${ctx.styleFill}" d="${left} ${right} ${strands}"/>`;
};

// ============================================================== SLEEVE ===
// The broody wing's trailing edge, back tip to the front point:
//   (27,43) (26.8,46.3) (28.6,49.6) (31,51) ·(35,48.8)· (39,50) (42.3,47.9) (45,45.2)

const sleeveFringeTrim = (ctx) => {
  // The plain team wing trimmed in ink: a solid ink cuff band 3 units deep
  // along the whole trailing edge, and five bold ink strands, 2.2 wide with
  // 1.6 gaps, hanging off it swept a little back as if the bird is moving.
  // Ink on orange is the one contrast that holds at 76px (a's old hollow
  // strands read as tar drips; thin ink ticks vanished).
  const c = ctx.clip(ctx.wingPath);
  const edge = WING_LOW.filter(([x, y]) => y >= 35 + ((45 - 35) * (x - 47)) / (26.9 - 47) - 0.5);
  const top = edge.map(([x, y]) => `${f1(x)} ${f1(y - 3.2)}`).reverse();
  const band = `M ${edge.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(" L ")} L ${top.join(" L ")} Z`;
  const strands = [
    [28.2, 6.6], [31.8, 5.6], [36.6, 6.6], [40.2, 5.8], [43.6, 5.2]
  ]
    .map(([x, len]) => {
      const root = (wingBottom(x) ?? 50) - 1.6;
      return bar(x, root, -0.28, 1, len + 1.6, 2.2);
    })
    .join(" ");
  return `${c.def}<path fill="${INK}" d="${strands}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>
    <path clip-path="${c.url}" fill="${INK}" d="${band}"/>`;
};

const sleeveFringeTabs = (ctx) => {
  // The trailing edge cut into five square tabs, 2.1 wide with 1.3 gaps,
  // hanging straight down to ONE common baseline (55 at the back, 54 at the
  // front), so their ends line up as a cut hem rather than drips. In the
  // wing's own ink, so the fringe is part of the wing's silhouette. Ink only:
  // the team version is a's trim.
  const w = 2.1;
  const base = (x) => 55 - (x - 28) / 14;
  const tabs = [28.2, 31.6, 35, 38.4, 41.8]
    .map((x) => {
      const top = Math.min(wingBottom(x - w / 2) ?? 99, wingBottom(x + w / 2) ?? 99) - 1.5;
      return rect(x - w / 2, top, x + w / 2, base(x));
    })
    .join(" ");
  return `<path fill="${ctx.styleFill}" d="${tabs}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>`;
};

const sleeveSuede = (ctx) => `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>`;

const sleeveSuedeCuff = (ctx) => {
  // A suede gauntlet: the black sleeve ends in a tan (mutedWarm) cuff at the
  // wing's tip, the back 5 units of the wing, behind one ink seam; and the
  // cuff's flared point breaks the silhouette below the back corner, down to
  // (24,53.5).
  const c = ctx.clip(ctx.wingPath);
  const tan = ctx.colors.mutedWarm;
  const flare = "M 28.4 46 C 27 49.6 25.6 52 24 53.5 C 27.4 53.6 30.4 52.8 33 51 Z";
  const cuff = "M 20 30 L 32.6 30 L 31.4 56 L 20 56 Z";
  const seam = "M 32.4 34 L 31.2 53";
  return `${c.def}<path fill="${tan}" ${ctx.inkStroke(2)} d="${flare}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>
    <g clip-path="${c.url}"><path fill="${tan}" d="${cuff}"/>
    <path fill="none" stroke="${INK}" stroke-width="2" d="${seam}"/></g>
    <path fill="none" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>`;
};

// ================================================================ TAIL ===
// Broody plumes: lower one tip (0,42), hanging to y 53.4 at x 8; upper one
// tip (2,31), y 39..43 at x 10. Painted under the body, which hides x > ~15.

const tailBandanaHanky = (ctx) => {
  // A kerchief tied along the upper plume: its top edge runs along the
  // plume's underside from (3,37) to (13.5,41.5), so it hangs off the plume
  // instead of off the tip, and its point drops to (6,48.5) over the lower
  // plume: a 10-unit triangle. The knot is a solid block, half tucked under
  // the body's edge, with no loose ears (ears made it a mouse cursor).
  const cloth = "M 2.6 36.6 L 14 41.2 L 6 48.6 Z";
  const knot = rect(13.2, 38.2, 17, 42.2);
  return `<path fill="${detailOn(ctx)}" ${ctx.inkStroke(1.2)} d="${knot}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${cloth}"/>`;
};

const tailBandanaSling = (ctx) => {
  // A kerchief tied round the lower plume's bend and hanging under it: the
  // cloth wraps the plume from (2.2,45) to the body edge, so the plume runs
  // into it and its tip pokes out behind, and drops to one point at
  // (6.8,62.4), 9 under the plume (Gate 1: the old point at (2.2,63.2) was
  // 10.9 out, past the Tail region's 10). It is knotted at the back with a
  // square knot and ONE broad tie end flying back to (-6.8,52): point down
  // and tied on, never the lone up-left arrowhead that read as a cursor.
  const cloth = "M 2.2 45.2 Q 8.6 48.8 15 46 L 15 52 Q 11.8 57.8 6.8 62.4 Q 3.4 55.2 2.2 45.2 Z";
  const knot = "M -0.4 42.8 L 4 42.6 L 4.6 47.6 L 0 47.8 Z";
  const end = "M 1 45.8 Q -3.6 46.6 -6.8 51.8 Q -1.8 53.2 2.2 49.2 Z";
  return `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${end}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${cloth}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${knot}"/>`;
};

// Rope is ONE rope, never bands round a plume (stripes): an ink core on a
// wider mutedWarm casing, so it shows on the orange plume and on the dark
// hearth alike. The white style is a white rope on an ink casing.
const rope = (ctx, d, core = 2.8) => {
  const ink = ctx.style === "ink";
  const casing = ink ? ctx.colors.mutedWarm : INK;
  return `<path fill="none" stroke="${casing}" stroke-width="${core + 2}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>
    <path fill="none" stroke="${ctx.styleFill}" stroke-width="${core}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
};
/** A honda/knot block on the rope: a solid casing-edged square. */
const ropeKnot = (ctx, x, y, w = 4, h = 4) => {
  const casing = ctx.style === "ink" ? ctx.colors.mutedWarm : INK;
  return `<path fill="${ctx.styleFill}" stroke="${casing}" stroke-width="1.4" stroke-linejoin="round" d="${rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2)}"/>`;
};

const ropeHungLoop = (ctx) =>
  // A lariat hung on the tail like on a saddle horn: one big teardrop loop
  // (15 wide, 19 tall, so it is a loop and never an eye) hanging off the upper
  // plume, the lower plume passing through it, and a knot where it hangs.
  `${rope(ctx, "M 4.6 39 C -3.6 41.6 -4.6 55.4 3 57.2 C 10.8 59 12.4 46.4 4.6 39")}
    ${ropeKnot(ctx, 4.6, 39.2)}`;

const ropeTrailing = (ctx) =>
  // A rope tied at the tail root with its long end trailing back between the
  // plumes in a lazy S, past their tips, ending in a frayed tassel: a third
  // plume of rope. The knot sits half under the body's edge.
  `${rope(ctx, "M 15 46 C 10 44.6 7 48.4 2.6 47.4 C -1 46.6 -2.2 44.6 -5 45.2", 3)}
    ${rope(ctx, "M -5 45.2 L -8.4 43.2 M -5 45.2 L -8.8 46 M -5 45.2 L -7.6 48.4", 1.6)}
    ${ropeKnot(ctx, 14.6, 46, 4.4, 5)}`;

// =============================================================== ITEMS ===

export const ITEMS = [
  {
    id: "bandana",
    slot: "top",
    name: "Bandana",
    note: "Round one's best item: a neckerchief hung from the shoulders, one point down the chest.",
    variants: [
      {
        key: "a",
        note: "Round one's white kite, a size up, its ink knot dropped below the neck line so a drawn head still shows it.",
        styles: ["white", "ink"],
        whitePoints: 1,
        darkCentre: false,
        draw: bandanaKite
      },
      {
        key: "b",
        note: "The outlaw bib: a big cloth triangle down to the belly under an ink rolled band. More chest, one flat shape.",
        styles: ["white", "ink"],
        whitePoints: 1,
        darkCentre: false,
        draw: bandanaBib
      }
    ]
  },
  {
    id: "western-yoke",
    slot: "top",
    name: "Western yoke",
    note: "A yoke band across the shoulders, starting at y 36 so the drawn neck never hides it.",
    variants: [
      {
        key: "a",
        note: "The piped yoke: a band with a level lower edge at y 44 and one shallow dip to (57,48.5) across a wide base, and one continuous contrasting piping line inset along that edge. White style (ink piping) for Looks with an ink sleeve.",
        styles: ["ink", "white"],
        whitePoints: 1,
        darkCentre: false,
        draw: yokeDip
      },
      {
        key: "b",
        note: "A square yoke with a bolo tie: a white diamond slide at the yoke's edge and two cords down the chest. The tie says western, not the dip. Ink only: the white yoke split by the slide read as angry eyes.",
        styles: ["ink"],
        whitePoints: 1,
        darkCentre: false,
        draw: yokeBolo
      }
    ]
  },
  {
    id: "trophy-buckle",
    slot: "top",
    name: "Trophy buckle",
    note: "One big buckle at the belly on an ink belt stub. A motif silhouette, never a plain oval (egg, eye). White only: gold is 1.30:1 on the orange.",
    variants: [
      {
        key: "a",
        note: "A sheriff's star, 16 units across, on the belt. Five points: a star, never an egg.",
        styles: ["white"],
        whitePoints: 1,
        darkCentre: false,
        draw: buckleStar
      },
      {
        key: "b",
        note: "A longhorn steer buckle, 22 by 12: thin horns sweeping out and up off a short bar to sharp tips at (44,46.5) and (66.4,46.5), open hooks with orange inside, and a short face wedge under the bar. One merged white shape on the belt.",
        styles: ["white"],
        whitePoints: 1,
        darkCentre: false,
        draw: buckleLonghorn
      }
    ]
  },
  {
    id: "fringed-vest",
    slot: "top",
    name: "Fringed vest",
    note: "An ink vest with an open front and square-ended fringe, never below the belly.",
    variants: [
      {
        key: "a",
        note: "Two fronts with an orange V between them, hem at y 49, square strands only on each front's hem.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: vestHem
      },
      {
        key: "b",
        note: "Two fronts to y 47 with a straight gap; four strands hang only off the left (wing-side) front's hem, long-short-short-long (7/4/4/7), so the fringe dips in a V and never repeats a's flat comb.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: vestVee
      }
    ]
  },
  {
    id: "fringe-sleeve",
    slot: "sleeve",
    name: "Fringe sleeve",
    note: "Fringe along the wing's trailing edge: an outline change, country's strongest item on paper.",
    variants: [
      {
        key: "a",
        note: "The plain team wing trimmed in ink: a solid ink cuff band along the whole trailing edge and five bold ink strands (2.2 wide, 1.6 gaps) hanging off it, swept a little back. Team only: on the ink wing it is b.",
        styles: ["team"],
        whitePoints: 0,
        darkCentre: false,
        draw: sleeveFringeTrim
      },
      {
        key: "b",
        note: "The black wing's trailing edge itself cut into five square tabs, ends lined up on one baseline: a cut hem that is part of the wing's silhouette. Ink only (the team version is a).",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: sleeveFringeTabs
      }
    ]
  },
  {
    id: "suede-sleeve",
    slot: "sleeve",
    name: "Suede sleeve",
    note: "An ink wing. Ink only: the white wing read as an egg.",
    variants: [
      {
        key: "a",
        note: "The whole wing in ink: the strongest read in the render.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: sleeveSuede
      },
      {
        key: "b",
        note: "A suede gauntlet: the black sleeve ends in a tan (mutedWarm) cuff at the wing's tip behind one ink seam, and the cuff's flared point breaks the outline below the back corner.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: sleeveSuedeCuff
      }
    ]
  },
  {
    id: "tail-bandana",
    slot: "tail",
    name: "Tail bandana",
    note: "A bandana knotted on the tail, one cloth with one outline, the plume tips left in the silhouette.",
    variants: [
      {
        key: "a",
        note: "Slung under the tail: a kerchief wrapped round the lower plume's bend and hanging below it to one point 9 under the plume, knotted at the back with one broad tie end flying back. Gate 1 pulled it inside the Tail region (it reached 10.9) and wrapped it on the plume, so it is a cloth tied on, not a loose triangle; the upper plume and the lower tip stay in the silhouette.",
        styles: ["white", "ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: tailBandanaSling
      },
      {
        key: "b",
        note: "Tied along the upper plume: a 10-unit kerchief triangle whose top edge runs along the plume's underside, point down over the lower plume, and a solid knot block half tucked under the body.",
        styles: ["white", "ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: tailBandanaHanky
      }
    ]
  },
  {
    id: "rope-coil",
    slot: "tail",
    name: "Rope coil",
    note: "Rope on the tail as ONE rope, never bands round a plume (they read as raccoon or barber stripes): an ink rope on a mutedWarm casing, so it shows on the orange and on the dark hearth.",
    variants: [
      {
        key: "a",
        note: "A lariat hung on the tail like on a saddle horn: one big teardrop loop, 15 by 19 (a loop, never an eye), hanging off the upper plume with the lower plume through it.",
        styles: ["ink", "white"],
        whitePoints: 0,
        darkCentre: false,
        draw: ropeHungLoop
      },
      {
        key: "b",
        note: "Tied at the root, its long end trailing back between the plumes in a lazy S past their tips and ending in a frayed tassel: a third plume, of rope.",
        styles: ["ink", "white"],
        whitePoints: 0,
        darkCentre: false,
        draw: ropeTrailing
      }
    ]
  }
];
