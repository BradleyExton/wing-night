// country · kit: the Top, Sleeve, Tail items of the country rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Country is the broody bird in orange (teamE): the biggest chest of the
// four (555 u²), a 21-unit wing tuck and two low tail plumes, and NO Boots
// slot. So the flavour goes on the chest, and every Top here is a big flat
// value shape on it. Ink reads (6.1:1 on the orange); white only lives on
// its 2-unit ink outline (2.91:1); the leg orange is never a fill.
//
// Round 2 (after critic round 1): no continuous row of pointed tongues (it
// reads as teeth or a beard), fringe is square-ended strands with gaps; tail
// items are one merged cloth or bands that stay on the plume.
// Round 3 (after critic round 2): never white strands in a row (equal white
// bars read as teeth), so wing fringe is ink on the team wing and the ink
// wing is the default; never a white band split by an ink shape (two white
// wedges round a dark centre read as angry eyes); buckles carry a motif
// (star, longhorn), never a plain plate. Rope on the tail was judged
// unworkable at this size (bands read as stripes); only one variant is kept.
//
// Broody geometry these drawings are fitted to (bird units):
//   body    front edge x≈66–68 at y 40–50, underside y≈64 at x 50
//   neck    painted OVER every Top: its lower edge runs (45,33)→(60,40),
//           so on a drawn head the top 3–5 units of a chest item tuck under it
//   wing    x 27–48, y 34–51; front edge (47,37)→(44,47)→(39,50). A Top is
//           painted over the wing, so the chest items hug that edge instead
//           of covering the Sleeve
//   tail    two plumes, tips (0,42) and (2,31); the body hides x > ~16

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
// The harness's trailing-edge line: from the pivot (47,35) to the wing's back tip.
const BACK_TIP = WING_LOW.reduce((a, b) => (b[0] < a[0] ? b : a));
const trailLineY = (x) => 35 + ((BACK_TIP[1] - 35) * (x - 47)) / (BACK_TIP[0] - 47);

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

const yokeDip = (ctx) => {
  const y0 = yokeTop(ctx);
  // One solid band, no piping: a straight lower edge at y 43 and one deep dip
  // to a point at (57,50). It starts clear of the wing's front edge, so an
  // ink Sleeve keeps an orange gap; the white style is for an ink-sleeve Look.
  const band = `M 50.6 ${y0} ${frontEdge(y0, 43)} L 63 43 L 57 50 L 51 43 L 50.6 43 Z`;
  return `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${band}"/>`;
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
  // A longhorn steer buckle: a horn bar sweeping up to two sharp tips, and a
  // steer's face tapering down from it. One merged white shape with one ink
  // outline on the belt stub; no eyes, no marks inside it.
  const horns =
    "M 43.2 45.6 Q 44.2 52.4 50.4 52.6 L 59.6 52.6 Q 65.8 52.4 66.8 45.6" +
    " Q 66.6 55.4 60 55.6 L 50 55.6 Q 43.4 55.4 43.2 45.6 Z";
  const face = "M 51.4 53 L 58.6 53 L 56.8 62 Q 55 62.8 53.2 62 Z";
  return `${beltStub()}${merged(`${horns} ${face}`, ctx.styleFill, 3)}`;
};

// -------------------------------------------------------- fringed vest --
// Fringe strands are square-ended, 1.4 wide with 1.2 gaps: a pointed tongue in
// a row reads as teeth at 76px.

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

const vestSide = (ctx) => {
  const s = ctx.head.shoulders;
  const hem = 47;
  // Two fronts to y 47 with a straight orange gap at x 53.6..56; the fringe
  // hangs only off the right front's hem, five strands staggered 6/5/4/5/6
  // long, so it reads as a side fringe and never as a's flat hem comb.
  const left = `M 48.5 ${s} L 53.6 ${s} L 53.6 ${hem} L 43.6 ${hem} C 46.4 44.4 47.8 41 48.5 ${s} Z`;
  const right = `M 56 ${s} ${frontEdge(s, hem, 0.6)} L 56 ${hem} Z`;
  const lens = [6, 5, 4, 5, 6];
  const strands = [56.2, 59, 61.8, 64.6, 67.1]
    .map((x, i) => rect(x, hem - 0.4, x + 1.5, hem + lens[i]))
    .join(" ");
  const c = ctx.clip(ctx.bodyPath);
  return `${c.def}<path fill="${ctx.styleFill}" d="${left} ${right}"/>
    <path clip-path="${c.url}" fill="${ctx.styleFill}" d="${strands}"/>`;
};

// ============================================================== SLEEVE ===
// The broody wing's trailing edge, back tip to the front point:
//   (27,43) (26.8,46.3) (28.6,49.6) (31,51) ·(35,48.8)· (39,50) (42.3,47.9) (45,45.2)
// Fringe contrasts with the wing it hangs from: INK on the team wing (white
// strands in a row read as teeth), team colour with an ink edge on the ink
// wing. The strand fringe leaves the near-leg column, x 31..35, bare.

// Strands are ink on the team wing (white bars in a row read as teeth), and
// team colour with an ink edge on the ink wing.
const fringeLook = (ctx) =>
  ctx.style === "ink" ? `fill="${ctx.fill}" ${ctx.inkStroke(0.9)}` : `fill="${INK}"`;

const fringeOver = (ctx, fringe) =>
  `<path ${fringeLook(ctx)} d="${fringe}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>`;

const sleeveFringeDrop = (ctx) => {
  // Six straight strands hanging straight down, three off the back corner and
  // three off the front edge, with the leg column between them left bare.
  // Ragged lengths, so no two neighbours make an even comb.
  const w = 1.5;
  const strands = [
    [25, 7], [27.4, 6.5], [29.8, 5.5], [37, 5], [40, 6], [43, 4.5]
  ]
    .map(([x, len]) => {
      const edge = wingBottom(x);
      // Off the wing, the strand must start below the harness's trailing line.
      const top = Math.max(edge === null ? -Infinity : edge - 1.5, trailLineY(x - w / 2) + 0.3);
      const bottom = (edge ?? top) + len;
      return rect(x - w / 2, top, x + w / 2, bottom);
    })
    .join(" ");
  return fringeOver(ctx, strands);
};

const sleeveFringeTabs = (ctx) => {
  // The trailing edge cut into five square tabs, 2.1 wide with 1.3 gaps,
  // hanging straight down to ONE common baseline (55 at the back, 54 at the
  // front), so their ends line up as a cut hem rather than drips. In the
  // wing's own colour, so the fringe is part of the wing's silhouette.
  const w = 2.1;
  const base = (x) => 55 - (x - 28) / 14;
  const tabs = [28.2, 31.6, 35, 38.4, 41.8]
    .map((x) => {
      const top = Math.min(wingBottom(x - w / 2) ?? 99, wingBottom(x + w / 2) ?? 99) - 1.5;
      return rect(x - w / 2, top, x + w / 2, base(x));
    })
    .join(" ");
  const edge = ctx.style === "ink" ? "" : ctx.inkStroke(1.2);
  return `<path fill="${ctx.styleFill}" ${edge} d="${tabs}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>`;
};

const sleeveSuede = (ctx) => `<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>`;

const sleeveSuedeGauntlet = (ctx) => {
  // A suede gauntlet: a tan suede cuff band across the ink wing, and a small
  // flared cuff point hugging its back-bottom corner.
  const cuff = "M 27.2 45 C 26.3 48 25.7 50.4 25 52.5 C 27.6 52.2 30.4 51.6 33 50.4 Z";
  const seam = "M 27.6 44 C 26.8 47 26.3 49.4 26 51.2 C 28 51 30 50.6 31.6 50.2 L 30 48 Z";
  // The band: 4.5 wide (3.5 of tan inside its ink edges), crossing the wing square to its long axis (pivot to
  // back tip) about 4 units in from the back, ink edges both sides, clipped
  // to the wing, so it reads as the cuff's top edge across the whole sleeve.
  const [ax, ay, bx, by] = [29.4, 36, 34.6, 50.6];
  const len = Math.hypot(bx - ax, by - ay);
  const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
  const band = bar(ax - ux * 4, ay - uy * 4, ux, uy, len + 8, 4.5);
  const c = ctx.clip(ctx.wingPath);
  return `${c.def}<path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${cuff}"/>
    <path fill="${ctx.styleFill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>
    <path fill="${ctx.styleFill}" d="${seam}"/>
    <path clip-path="${c.url}" fill="${ctx.colors.mutedWarm}" ${ctx.inkStroke(1)} d="${band}"/>`;
};

// ================================================================ TAIL ===
// Broody plumes: lower one tip (0,42), y 42..54 at x 10; upper one tip
// (2,31), y 38..44 at x 10. Painted under the body, which hides x > ~16.
const UPPER_PLUME = "M 24 41 C 12 47 2 43 2 31 C 7 41 16 42 25 38 Z";

const tailBandanaDrape = (ctx) => {
  // A kerchief knotted round the upper plume's root: a short wrap whose right
  // half tucks under the body, so only a 4-unit strip shows and the plume tips
  // stay visible beyond it; two knot tails trailing straight back off it,
  // parallel (fanned ears made a Z with the cloth and read as a lightning
  // bolt); and one big cloth triangle swung wide and back below (an upright
  // point read as a fang, a band over a centred point as a down arrow).
  // One cloth, one outline.
  const band = "M 10 38.6 L 14.6 38.6 L 14.6 45.4 L 10 45.4 Z";
  const tails =
    "M 10.6 39 L 4.6 38.4 L 5.2 40.4 L 10.6 40.6 Z M 10.6 41.2 L 5.6 42.2 L 6.6 43.8 L 10.6 42.8 Z";
  const cloth = "M 6 44.6 L 14.6 44.6 L 5.4 53.4 Z";
  return merged(`${tails} ${band} ${cloth}`, ctx.styleFill);
};

const tailBandanaHanky = (ctx) => {
  // A kerchief tied along its top edge at the upper plume's tip and hanging
  // under it as a pennant: a level top edge and its point straight down under
  // the middle. The tie is a short wrap across the plume tip in the detail
  // colour (no loose ears: with them the triangle read as a mouse cursor).
  // White on the dark background, clear of the lower plume.
  const cloth = "M -5 33 L 3.6 33.4 L -1 41 Z";
  const tie = "M 1.2 31.6 L 4.4 31.6 L 4.4 34.6 L 1.2 34.6 Z";
  return `${merged(cloth, ctx.styleFill)}
    <path fill="${detailOn(ctx)}" ${ctx.inkStroke(1.2)} d="${tie}"/>`;
};

// Rope is bands, never rings: a 3.0 ink band under a 1.6 core, laid across
// the plume and clipped to it, with orange showing between the wraps.
const ropeBands = (ctx, centres, dir, clipD) => {
  const c = ctx.clip(clipD);
  const [dx, dy] = dir;
  const n = Math.hypot(dx, dy);
  const half = 9;
  const under = centres.map(([x, y]) => bar(x - (dx / n) * half, y - (dy / n) * half, dx, dy, half * 2, 3)).join(" ");
  const core = centres.map(([x, y]) => bar(x - (dx / n) * half, y - (dy / n) * half, dx, dy, half * 2, 1.6)).join(" ");
  return `${c.def}<g clip-path="${c.url}"><path fill="${INK}" d="${under}"/><path fill="${ctx.styleFill}" d="${core}"/></g>`;
};

const ropeWound = (ctx) =>
  // The upper plume wound root to tip like a rope-wrapped handle: four slanted
  // wraps marching out along it, the lower plume left bare.
  ropeBands(ctx, [[3.6, 33.6], [7, 37.2], [10.4, 39.8], [13.8, 41.6]], [0.55, -1], UPPER_PLUME);

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
        note: "One solid band, no piping: straight lower edge at y 43 and one deep dip to a point at (57,50). White style for Looks with an ink sleeve.",
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
    note: "One big buckle at the belly on an ink belt stub. A motif silhouette, never a plain oval (egg, eye).",
    variants: [
      {
        key: "a",
        note: "A sheriff's star, 16 units across, on the belt. Five points: a star, never an egg.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: buckleStar
      },
      {
        key: "b",
        note: "A longhorn steer buckle: a horn bar sweeping up to two sharp tips at (43.2,45.6) and (66.8,45.6), and a tapering steer face below it, one merged white shape on the belt. A motif, not a plate.",
        styles: ["white", "gold"],
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
        note: "Two fronts to y 47 with a straight gap; five strands hang only off the right front's hem, staggered 6/5/4/5/6 long, so the fringe is a side tassel, not a hem comb.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: vestSide
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
        note: "Six square strands hanging down at ragged lengths, three off the back corner and three off the front edge; the leg column stays bare. Ink wing with team strands by default; ink strands on the team wing.",
        styles: ["ink", "team"],
        whitePoints: 0,
        darkCentre: false,
        draw: sleeveFringeDrop
      },
      {
        key: "b",
        note: "The trailing edge itself cut into five square tabs in the wing's colour, ends lined up on one baseline: a cut hem that is part of the wing's silhouette, not strands hung under it.",
        styles: ["ink", "team"],
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
        note: "A suede gauntlet: a tan (mutedWarm) cuff band with ink edges across the ink wing, and a small cuff point hugging its back corner.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: sleeveSuedeGauntlet
      }
    ]
  },
  {
    id: "tail-bandana",
    slot: "tail",
    name: "Tail bandana",
    note: "A bandana knotted on the tail plume, drawn as one cloth with one outline.",
    variants: [
      {
        key: "a",
        note: "Knotted at the root: one cloth with one outline, a short wrap (4 units show; the plume tips stay visible beyond it), two knot tails trailing straight back, and one big cloth triangle swung wide and back below.",
        styles: ["white", "ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: tailBandanaDrape
      },
      {
        key: "b",
        note: "A kerchief tied along its top edge at the upper plume's tip, hanging under it as a pennant (level top, point straight down), tied with a short wrap across the plume tip, over the background.",
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
    note: "Rope on the tail, as bands, never rings. Critic round 2 judged the whole item unworkable (rope bands read as raccoon or zebra stripes at 76px; a coil is a light ring round a dark centre) and recommends dropping it: the lasso prop carries the rope. Only the best variant is kept.",
    variants: [
      {
        key: "a",
        note: "The upper plume wound root to tip like a rope-wrapped handle: four slanted wraps, the lower plume bare.",
        styles: ["white", "ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: ropeWound
      }
    ]
  }
];
