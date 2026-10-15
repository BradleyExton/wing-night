// disco · show: the Prop and Stage items of the disco rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Where a disco prop can live. The preener holds a prop at its wing grip
// (23,54), 30.6 units from the wing pivot (47,35). Swung on flap (−62°) and
// bounce (−26°) about that pivot, anything much past ~37.5 units from it drops
// through the floor, and anything above y ≈ 48 swings into the photo on hurt
// (+95°). What is left is a pocket about 15 units across under the wing tip,
// between the tail and the near leg (x 18..36, y 48..66). Every prop here is
// sized to fill that pocket and no more. Anything that sticks out of a prop
// (a glint, a record leaving its sleeve) goes back-low or forward, never up.
//
// Stages animate with CSS only (no filters, no SMIL): a <style> block rides
// inside each stage, keyed on the team colour so pages never share a wrong
// palette, and it stands still under prefers-reduced-motion.

import { COLORS, clip } from "../outfit-harness.js";

export const GENRES = ["disco"];

// ------------------------------------------------------------ geometry --

const r2 = (n) => Math.round(n * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;

/** Rotate (x,y) about (cx,cy) by deg (screen space, y down: + is clockwise). */
const turn = (x, y, cx, cy, deg) => {
  const a = rad(deg);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
};

const poly = (pts) => `M ${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(" L ")} Z`;
const line = (pts) => `M ${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(" L ")}`;

/** An egg: wider at the bottom, tilted by rot degrees about its centre. */
const eggPoints = (cx, cy, rx, ry, rot, n = 48) => {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const t = (2 * Math.PI * i) / n;
    const x = cx + rx * Math.cos(t) * (1 + 0.13 * Math.sin(t));
    const y = cy + ry * Math.sin(t);
    pts.push(turn(x, y, cx, cy, rot));
  }
  return pts;
};

/** A four-point sparkle, the mirror ball's glint. */
const sparkle = (cx, cy, r, rot = 0, inner = 0.36) => {
  const pts = [];
  for (let i = 0; i < 8; i += 1) {
    const radius = i % 2 === 0 ? r : r * inner;
    const a = rad(rot - 90 + i * 45);
    pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
  }
  return poly(pts);
};

/** A rotated rectangle's corners (no transform, so it can sit under a clip). */
const boxPts = (cx, cy, w, h, rot) =>
  [
    [cx - w / 2, cy - h / 2],
    [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2],
    [cx - w / 2, cy + h / 2]
  ].map(([x, y]) => turn(x, y, cx, cy, rot));

/** Point at angle deg (90 = straight down) and radius r from (cx,cy). */
const at = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

const circle = (cx, cy, r) =>
  `M ${r2(cx - r)} ${r2(cy)} A ${r} ${r} 0 1 0 ${r2(cx + r)} ${r2(cy)} A ${r} ${r} 0 1 0 ${r2(cx - r)} ${r2(cy)} Z`;

/** Points of an ellipse (rx, ry) at (cx,cy) turned by rot, from angle t0 to t1 (degrees). */
const ellipseArc = (cx, cy, rx, ry, rot, t0 = 0, t1 = 360, n = 40) => {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const t = rad(t0 + ((t1 - t0) * i) / n);
    pts.push(turn(cx + rx * Math.cos(t), cy + ry * Math.sin(t), cx, cy, rot));
  }
  return pts;
};

const outlined = `stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round"`;

// ------------------------------------------------------- mirror-ball egg --

// The pocket under the wing is against the backdrop, not the bird, and the
// backdrop is dark (hearth, TV), so an ink egg there vanishes: the light
// styles lead. The egg sits forward in the pocket, its top tucked under the
// wing's lower edge and its front over the belly and the near thigh.
// 11.6 × 14.8 units, its front edge stopping near x 31.5, clear of the near
// leg (x 32), so the leg never seems to start from the egg. Its glints sit fully OFF the egg, so no ink outline ever
// bites a notch into the silhouette: one back-low against the dark pocket
// (above it would swing into the photo on hurt), one forward over the thigh.
const EGG = { cx: 26.5, cy: 57.4, rx: 5.8, ry: 7.4, rot: -12 };
const eggD = () => poly(eggPoints(EGG.cx, EGG.cy, EGG.rx, EGG.ry, EGG.rot));
const eggLocal = (pts) => pts.map(([x, y]) => turn(EGG.cx + x, EGG.cy + y, EGG.cx, EGG.cy, EGG.rot));
const eggAt = (x, y) => eggLocal([[x, y]])[0];
// The back glint, in bird units: low enough that its top stays out of the photo
// on hurt (+95°), and far enough forward that its back tip stays above the floor
// on flap (−62°). That window is about a unit wide.
const BACK_GLINT = { x: 18, y: 53.4, r: 3.1 };

// The facet grid, in egg-local units: three columns, four rows of ~3.9u.
const GRID_X = [-10, -2.1, 2.1, 10];
const GRID_Y = [-10, -3.9, 0, 3.9, 10];
const cell = (c, r) => poly(eggLocal([[GRID_X[c], GRID_Y[r]], [GRID_X[c + 1], GRID_Y[r]], [GRID_X[c + 1], GRID_Y[r + 1]], [GRID_X[c], GRID_Y[r + 1]]]));

const mirrorBallEgg = {
  id: "mirror-ball-egg",
  slot: "prop",
  name: "Mirror-ball egg",
  note: "An egg-shaped mirror ball tucked under the wing tip, held low. Faceted by a grid, mostly light, and never a light disc with a dark centre: the dark facets go to the lower back, the middle stays light.",
  variants: [
    {
      key: "a",
      note: "Value facets: a light egg ruled into a 3 × 4 grid of square facets in fine ink lines, with the back facets in shadow (two dark, two mid-tone) and the front left lit; the ink style flips it, a dark ball ruled in mutedWarm with three white and two mutedWarm facets on its upper front and the lower back left black so the tiling shows. One white glint stands off the egg's back. The tiled grid plus a patch of shade is what makes a ball a mirror ball.",
      styles: ["white", "ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const d = eggD();
        const c = clip(d);
        // A light ball is shaded down its back; a dark (ink) ball is lit on
        // its upper front instead, because white facets along its bottom
        // would read as a grin.
        const inkBall = styleFill === COLORS.ink;
        const shade = inkBall ? COLORS.white : COLORS.ink;
        const dark = inkBall
          ? [
              [1, 0],
              [2, 0],
              [2, 1]
            ]
          : [
              [0, 2],
              [0, 3]
            ];
        const mid = inkBall
          ? [
              [1, 1],
              [0, 0]
            ]
          : [
              [0, 1],
              [1, 3]
            ];
        const cells = [
          ...dark.map(([cc, rr]) => `<path fill="${shade}" d="${cell(cc, rr)}"/>`),
          ...mid.map(([cc, rr]) => `<path fill="${COLORS.mutedWarm}" d="${cell(cc, rr)}"/>`)
        ].join("");
        const grid = [
          ...[GRID_X[1], GRID_X[2]].map((x) => line(eggLocal([[x, -10], [x, 10]]))),
          ...[GRID_Y[1], GRID_Y[2], GRID_Y[3]].map((y) => line(eggLocal([[-10, y], [10, y]])))
        ].join(" ");
        // Ink on an ink ball is invisible, so a dark ball is ruled in mutedWarm.
        const gridInk = inkBall ? COLORS.mutedWarm : COLORS.ink;
        const gridW = inkBall ? 0.8 : 0.75;
        const { x: gx, y: gy, r: gr } = BACK_GLINT;
        return `${c.def}
          <path fill="${styleFill}" d="${d}"/>
          <g clip-path="${c.url}">${cells}<path fill="none" stroke="${gridInk}" stroke-width="${gridW}" d="${grid}"/></g>
          <path fill="none" ${outlined} d="${d}"/>
          <path fill="${COLORS.white}" stroke="${COLORS.ink}" stroke-width="0.9" stroke-linejoin="round" d="${sparkle(gx, gy, gr, 0, 0.48)}"/>`;
      }
    },
    {
      key: "b",
      note: "Cut glass: a light egg ruled into a 45-degree diamond lattice (fine ink lines at +45 and -45 degrees, four of each), with the two lower-back diamonds in ink and one upper-front diamond in mutedWarm, so the ball is lit and shaded like a mirror ball. Diamond facets where a has square tiles, and no horizontal bands. Two white glints stand clear of it, one off the back and one forward over the thigh.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const d = eggD();
        const c = clip(d);
        // Egg-local lattice: lines at perpendicular offsets -6, -2, 2, 6 from the
        // centre, at +45 and -45 degrees. In u = x + y and v = x - y that is
        // u, v = offset × √2, so a facet is a diamond about 4 units on a side.
        const K = Math.SQRT2;
        const offs = [-6, -2, 2, 6].map((o) => o * K);
        const L = 12;
        const wires = [
          ...offs.map((o) => line(eggLocal([[o / 2 - L, o / 2 + L], [o / 2 + L, o / 2 - L]]))),
          ...offs.map((o) => line(eggLocal([[o / 2 - L, -o / 2 - L], [o / 2 + L, -o / 2 + L]])))
        ].join(" ");
        // A diamond facet between lattice offsets a..a+4 (u) and b..b+4 (v).
        const diamond = (a, b) => {
          const uv = [[a, b], [a + 4, b], [a + 4, b + 4], [a, b + 4]].map(([u, v]) => [u * K, v * K]);
          return poly(eggLocal(uv.map(([u, v]) => [(u + v) / 2, (u - v) / 2])));
        };
        // Lower back (x < 0, y > 0) in ink; upper front (x > 0, y < 0) in mutedWarm.
        const facets = [
          `<path fill="${COLORS.ink}" d="${diamond(-2, -6)}"/>`,
          `<path fill="${COLORS.ink}" d="${diamond(-6, -6)}"/>`,
          `<path fill="${COLORS.mutedWarm}" d="${diamond(-2, 2)}"/>`
        ].join("");
        const { x: g1x, y: g1y, r: g1r } = BACK_GLINT;
        const [g2x, g2y] = eggAt(9.8, 1.5);
        const glint = (x, y, r) =>
          `<path fill="${COLORS.white}" stroke="${COLORS.ink}" stroke-width="0.9" stroke-linejoin="round" d="${sparkle(x, y, r, 0, 0.48)}"/>`;
        return `${c.def}
          <path fill="${styleFill}" d="${d}"/>
          <g clip-path="${c.url}">${facets}<path fill="none" stroke="${COLORS.ink}" stroke-width="0.9" d="${wires}"/></g>
          <path fill="none" ${outlined} d="${d}"/>
          ${glint(g1x, g1y, g1r)}${glint(g2x, g2y, 2.4)}`;
      }
    }
  ]
};

// -------------------------------------------------------------- hand fan --

// The rivet tucks under the wing's lower edge and the fan opens back-down from
// it into the pocket under the wing tip, its forward edge ending near x 31, so
// the near leg (x 32) never seems to come out of it like a skirt.
// Angles: 90 is straight down, 180 straight back.
const FAN = { x: 25.5, y: 50.5, r: 10, from: 60, to: 170, tip: 1.2 };

/**
 * The pleat alternate. At this size ink pleats merge with the ink outline and
 * leave white sticks, so a white or ink fan folds into mutedWarm shade and a
 * gold one into white. Cyan would vanish into the cyan body.
 */
const secondOn = (styleFill) => (styleFill === COLORS.gold ? COLORS.white : COLORS.mutedWarm);

/** The fan's outline: thinner than the bird's, and mitered so the pleat points stay points. */
const fanOutline = `stroke="${COLORS.ink}" stroke-width="1.6" stroke-linejoin="miter" stroke-miterlimit="6"`;

/**
 * The fan's pointed edge at radius rad0, n pleats: corner, a point `tip` out
 * on the pleat's mid angle, next corner, so the edge zigzags like an accordion
 * fan instead of scalloping like a shell. Returns one path fragment per pleat.
 */
const fanEdge = (rad0, n, tip = FAN.tip) => {
  const { x, y, from, to } = FAN;
  const step = (to - from) / n;
  const segs = [];
  for (let i = 0; i < n; i += 1) {
    const a0 = from + i * step;
    const a1 = a0 + step;
    const [sx, sy] = at(x, y, rad0, a0);
    const [px, py] = at(x, y, rad0 + tip, (a0 + a1) / 2);
    const [ex, ey] = at(x, y, rad0, a1);
    segs.push({ start: [sx, sy], d: `L ${r2(px)} ${r2(py)} L ${r2(ex)} ${r2(ey)}` });
  }
  return segs;
};

const handFan = {
  id: "hand-fan",
  slot: "prop",
  name: "Hand fan",
  note: "An open fan hung from the wing tip, opening back and down into the pocket under the wing: from under the belly round to under the tail, its forward edge clear of the near leg. Its pointed, zigzag edge is the read; it never points forward of the belly or up.",
  variants: [
    {
      key: "a",
      note: "A pleated folding fan opened to 110 degrees: eight narrow pleats alternating the style colour and a folded shade (mutedWarm on white or ink, white on gold; ink pleats merged into the outline at this size), each pleat ending in a point so the edge zigzags like an accordion. The stripes radiate from one rivet, which is the whole idea of a fan, and every pleat reads against both the cyan body and the dark pocket. The edge is mitered so the points stay sharp. (Do not pair the white or ink style with an ink/white Top: the fan merges into it; use b or gold there.)",
      styles: ["white", "ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const { x, y } = FAN;
        const alt = secondOn(styleFill);
        const segs = fanEdge(FAN.r, 8);
        const pleats = segs
          .map((sg, i) => `<path fill="${i % 2 ? alt : styleFill}" d="M ${x} ${y} L ${r2(sg.start[0])} ${r2(sg.start[1])} ${sg.d} Z"/>`)
          .join("");
        const edge = `M ${x} ${y} L ${r2(segs[0].start[0])} ${r2(segs[0].start[1])} ${segs.map((sg) => sg.d).join(" ")} Z`;
        return `${pleats}
          <path fill="none" ${fanOutline} d="${edge}"/>
          <path fill="${COLORS.ink}" d="${circle(x, y, 1.7)}"/>`;
      }
    },
    {
      key: "b",
      note: "A painted fan: one solid leaf in the style colour with the same pointed accordion edge, seven ink ribs radiating from the rivet, and a 1.8-unit team-colour rim band with a fine ink inner edge, so the rim reads as paint on the leaf. No alternating fills, so it reads as one painted leaf where a reads as stripes; the ribs carry the fan read.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const { x, y, r, from, to } = FAN;
        const n = 8;
        const step = (to - from) / n;
        // 1.8 units of rim show between the outline (0.8 of it inside the
        // leaf) and the inner leaf's ink edge.
        const band = 1.8 + 0.8 + 0.4;
        const path = (rad0) => {
          const segs = fanEdge(rad0, n);
          return `M ${x} ${y} L ${r2(segs[0].start[0])} ${r2(segs[0].start[1])} ${segs.map((sg) => sg.d).join(" ")} Z`;
        };
        const leaf = path(r);
        const inner = path(r - band);
        const c = clip(leaf);
        let ribs = "";
        for (let i = 1; i < n; i += 1) {
          // Ribs start well out from the rivet so they never crowd it into a black hub.
          const [ix, iy] = at(x, y, 4, from + i * step);
          const [ox, oy] = at(x, y, r - band, from + i * step);
          ribs += `M ${r2(ix)} ${r2(iy)} L ${r2(ox)} ${r2(oy)} `;
        }
        return `${c.def}
          <path fill="${fill}" d="${leaf}"/>
          <path fill="${styleFill}" stroke="${COLORS.ink}" stroke-width="0.8" stroke-linejoin="miter" clip-path="${c.url}" d="${inner}"/>
          <path fill="none" clip-path="${c.url}" stroke="${COLORS.ink}" stroke-width="0.55" stroke-linecap="round" d="${ribs}"/>
          <path fill="none" ${fanOutline} d="${leaf}"/>
          <path fill="${COLORS.ink}" d="${circle(x, y, 1.7)}"/>`;
      }
    }
  ]
};

// ----------------------------------------------------------------- vinyl --

const vinyl = {
  id: "vinyl",
  slot: "prop",
  name: "Vinyl",
  note: "A twelve-inch held by its rim under the wing. The label is the team colour (a white label is an eye) or gold, and it has no spindle hole: a light dot with a dark centre is exactly the eye the rules ban.",
  variants: [
    {
      key: "a",
      note: "The record alone, lying flat in perspective: a thin, tilted black disc with an ink thickness band under its near rim, so it reads as a flat disc and never as a wheel or a lens; a small team (or gold) label set off-centre up the tilt; two short straight mutedWarm sheen streaks across the vinyl. No groove ring, so nothing makes an iris. (Do not pair it with an ink Top such as the satin jacket: the disc merges into it.)",
      styles: ["team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const cx = 30;
        const cy = 57.5;
        const rot = -18;
        const rx = 8.4;
        const ry = 3.8;
        const ring = (x, y, a, b) => poly(ellipseArc(x, y, a, b, rot, 0, 360, 48).slice(0, -1));
        const disc = ring(cx, cy, rx, ry);
        const thick = ring(cx, cy + 1.6, rx, ry);
        // The label sits 0.8u up the tilt (the disc's local -y), off-centre in perspective.
        const [lx, ly] = turn(cx, cy - 0.8, cx, cy, rot);
        const label = ring(lx, ly, 2.8, 1.25);
        const local = (x, y) => turn(cx + x, cy + y, cx, cy, rot);
        const streak = (x0, y0, x1, y1) => line([local(x0, y0), local(x1, y1)]);
        const streaks = [streak(-6.4, -0.6, -3.8, -2.4), streak(3.6, 1.2, 6.2, -0.4)].join(" ");
        return `<path fill="${COLORS.ink}" ${outlined} d="${thick}"/>
          <path fill="${COLORS.ink}" ${outlined} d="${disc}"/>
          <path fill="none" stroke="${COLORS.mutedWarm}" stroke-width="1" stroke-linecap="round" d="${streaks}"/>
          <path fill="${styleFill}" d="${label}"/>`;
      }
    },
    {
      key: "b",
      note: "The LP leaving its sleeve: a white 12.5-unit square jacket at a tilt with a team-colour diagonal band as its cover art, and the black record sliding out of its front edge as a solid half-disc as tall as the sleeve's side, with one white sheen. The team (or gold) colour is the cover art; the record carries no label, because a team label on the team body reads as a hole and the half-disc becomes a mug handle. Only half-circles show, so nothing reads as a ring or an eye. The record slides out forward, over the belly, because a record out of the top edge would swing into the photo on hurt.",
      styles: ["team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const sx = 26.5;
        const sy = 56;
        const rot = -12;
        const s = 12.5;
        const sleeve = poly(boxPts(sx, sy, s, s, rot));
        const c = clip(sleeve);
        // The cover art: a band across the face from the top-front corner down to the bottom-back.
        const band = poly(
          [
            [-12, 12 - 2.5],
            [12, -12 - 2.5],
            [12, -12 + 2.5],
            [-12, 12 + 2.5]
          ].map(([x, y]) => turn(sx + x, sy + y, sx, sy, rot))
        );
        // The record: behind the sleeve, slid half out of its front edge and
        // as tall as that side. It is solid black with one white sheen (a groove ring as well made it a speaker's sound waves) and
        // NO label: a team label on a team body reads as a hole straight
        // through, which turns the half-disc into a mug handle. The team
        // colour lives on the cover art instead.
        const rr = 6.4;
        const [rcx, rcy] = turn(sx + s / 2 + 0.8, sy + 1, sx, sy, rot);
        const [hx0, hy0] = at(rcx, rcy, rr - 1.6, -60);
        const [hx1, hy1] = at(rcx, rcy, rr - 1.6, 10);
        return `${c.def}
          <path fill="${COLORS.ink}" ${outlined} d="${circle(rcx, rcy, rr)}"/>
          <path fill="none" stroke="${COLORS.white}" stroke-width="1.4" stroke-linecap="round" d="M ${r2(hx0)} ${r2(hy0)} A ${rr - 1.6} ${rr - 1.6} 0 0 1 ${r2(hx1)} ${r2(hy1)}"/>
          <path fill="${COLORS.white}" d="${sleeve}"/>
          <path fill="${styleFill}" clip-path="${c.url}" d="${band}"/>
          <path fill="none" ${outlined} d="${sleeve}"/>`;
      }
    }
  ]
};

// ------------------------------------------------------------- lit floor --

const BEAT_S = 0.5; // 120 bpm, the lobby's tempo
const hex = (c) => c.replace("#", "");

const litFloor = {
  id: "lit-floor",
  slot: "stage",
  name: "Lit floor",
  note: "The Saturday Night Fever floor under the feet, lit on the beat with a CSS animation (no filters). Tiles are always lit, white and team; ink is only the grout, never a tile, and never ember: the feet are leg-orange and would vanish on it.",
  variants: [
    {
      key: "a",
      note: "A perspective floor, two rows of six tiles in ink grout, every tile always lit. It flips like a chequerboard on every beat, white tiles going team and team going white, so the whole floor pulses. Reduced motion holds a lit white and team chequer.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ fill }) => {
        const k = `dsh-lfa-${hex(fill)}`;
        const vx = 40;
        const vy = 28;
        const rows = [66, 71.4, 77.4];
        const cols = [0, 13, 26, 39, 52, 65, 78];
        const xAt = (xf, y) => vx + ((xf - vx) * (y - vy)) / (rows[2] - vy);
        let tiles = "";
        for (let r = 0; r < 2; r += 1) {
          for (let c = 0; c < 6; c += 1) {
            const [y0, y1] = [rows[r], rows[r + 1]];
            const d = poly([
              [xAt(cols[c], y0), y0],
              [xAt(cols[c + 1], y0), y0],
              [xAt(cols[c + 1], y1), y1],
              [xAt(cols[c], y1), y1]
            ]);
            const odd = (r + c) % 2;
            tiles += `<path class="${k}" style="animation-delay:-${odd * BEAT_S}s" fill="${odd ? fill : COLORS.white}" stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round" d="${d}"/>`;
          }
        }
        return `<style>.${k}{animation:${k} ${2 * BEAT_S}s step-end infinite}@keyframes ${k}{0%{fill:${COLORS.white}}50%{fill:${fill}}}@media (prefers-reduced-motion:reduce){.${k}{animation:none}}</style>
          <g>${tiles}</g>`;
      }
    },
    {
      key: "b",
      note: "One big lit tile, the bird's own: a thin slab seen from above with a 2u ink front edge, split into three columns by two rows of panels, the splits clear of the legs. Two opposite panels burn white at once and the pair chases round all six on the beat, so any still frame shows two of six lit. Reduced motion holds panels 0 and 3 white.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ fill }) => {
        const k = `dsh-lfb-${hex(fill)}`;
        const back = 62;
        const mid = 69;
        const front = 76;
        const bx = [13, 27, 53, 67];
        const fx = [5, 22, 58, 75];
        const lerp = (a, b, t) => a + (b - a) * t;
        const t = (mid - back) / (front - back);
        const mx = bx.map((b, i) => lerp(b, fx[i], t));
        const quad = (top, ty, bot, by, i) => poly([[top[i], ty], [top[i + 1], ty], [bot[i + 1], by], [bot[i], by]]);
        // Chase order: back row left to right, then front row right to left.
        const panels = [
          quad(bx, back, mx, mid, 0),
          quad(bx, back, mx, mid, 1),
          quad(bx, back, mx, mid, 2),
          quad(mx, mid, fx, front, 2),
          quad(mx, mid, fx, front, 1),
          quad(mx, mid, fx, front, 0)
        ];
        const n = panels.length;
        const slabFront = poly([
          [fx[0], front],
          [fx[3], front],
          [fx[3] - 0.6, front + 2],
          [fx[0] + 0.6, front + 2]
        ]);
        const cells = panels
          .map((d, i) => `<path class="${k}" style="animation-delay:-${((n - i) % n) * BEAT_S}s" fill="${i % 3 === 0 ? COLORS.white : fill}" stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round" d="${d}"/>`)
          .join("");
        // Six beats, lit on beats 0 and 3: panel i shares its phase with i + 3.
        const lit = r2(100 / n);
        const half = r2(50 + 100 / n);
        return `<style>.${k}{animation:${k} ${n * BEAT_S}s step-end infinite}@keyframes ${k}{0%{fill:${COLORS.white}}${lit}%{fill:${fill}}50%{fill:${COLORS.white}}${half}%{fill:${fill}}100%{fill:${fill}}}@media (prefers-reduced-motion:reduce){.${k}{animation:none}}</style>
          <path fill="${COLORS.ink}" stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round" d="${slabFront}"/>
          ${cells}`;
      }
    }
  ]
};

// ----------------------------------------------------------- neon flames --

/**
 * One flame standing on (x, y), h tall and w wide: a narrow base, one tall
 * S-leaning centre tongue whose tip sits `lean` units off centre, and a small
 * flick out each side (a low one on the lean side, a higher one away from
 * it), so the tongue dominates. All one closed outline so a neon tube can trace it. The
 * sides run nearly straight up (control points at ±0.36w): a tongue, never a
 * cup, a tulip or a crown.
 */
const flamePath = (x, y, h, w, lean = 0, flicks = true) => {
  // Drawn for a flame leaning right (+px is the lean side, with the low
  // flick); mirrored for a left lean, so the high flick is always on the side
  // away from the lean, where the tongue does not swallow it.
  const m = lean < 0 ? -1 : 1;
  const P = (px, py) => `${r2(x + m * px * w)} ${r2(y - py * h)}`;
  // Points on the tongue drift with the lean the higher they sit.
  const T = (px, py) => `${r2(x + m * px * w + lean * py * py)} ${r2(y - py * h)}`;
  const right = flicks
    ? [
        `C ${P(0.3, 0)} ${P(0.36, 0.12)} ${P(0.34, 0.26)}`,
        // the lean-side flick licks up and out, then drops back into the waist
        `C ${P(0.48, 0.32)} ${P(0.62, 0.42)} ${P(0.7, 0.6)}`,
        `C ${P(0.5, 0.5)} ${P(0.32, 0.44)} ${T(0.22, 0.5)}`
      ]
    : [`C ${P(0.36, 0)} ${P(0.4, 0.2)} ${T(0.3, 0.46)}`];
  const left = flicks
    ? [
        `C ${T(-0.16, 0.86)} ${T(-0.24, 0.74)} ${T(-0.22, 0.64)}`,
        // the far flick licks up and out, higher than the lean-side one
        `C ${P(-0.38, 0.62)} ${P(-0.56, 0.68)} ${P(-0.64, 0.82)}`,
        `C ${P(-0.56, 0.6)} ${P(-0.38, 0.46)} ${P(-0.36, 0.3)}`,
        `C ${P(-0.36, 0.2)} ${P(-0.34, 0.12)} ${P(-0.3, 0.08)}`
      ]
    : [`C ${T(-0.2, 0.84)} ${T(-0.4, 0.5)} ${P(-0.3, 0.08)}`];
  return [
    `M ${P(0, 0)}`,
    ...right,
    // up the tongue to its tip
    `C ${T(0.24, 0.7)} ${T(0.08, 0.88)} ${r2(x + lean)} ${r2(y - h)}`,
    ...left,
    `C ${P(-0.22, 0)} ${P(-0.1, 0)} ${P(0, 0)} Z`
  ].join(" ");
};

/**
 * One flame tongue standing on a floor line: a bulb pinched in at the base,
 * a short lick flicking out on the side away from the lean, then a tall
 * S-curved tongue to a tip h tall that leans by `lean`. Open at the base,
 * where it meets the floor line, so a row of them on one line reads as one
 * continuous tube. The pinched base keeps it from reading as an arch, and the
 * lick keeps it from reading as a droplet.
 */
const tonguePath = (x, y, h, w, lean = 0) => {
  const s = lean < 0 ? -1 : 1; // the lick goes on the side away from the lean
  const P = (px, py) => `${r2(x - s * px * w)} ${r2(y - py * h)}`;
  const T = (dx, py) => `${r2(x + lean * py - s * dx)} ${r2(y - py * h)}`;
  return [
    `M ${P(-0.2, 0)}`,
    // the leaning side: a long bulb straight up into the tongue
    `C ${P(-0.56, 0.04)} ${P(-0.62, 0.28)} ${P(-0.46, 0.44)}`,
    `C ${T(-1.4, 0.66)} ${T(-0.5, 0.86)} ${r2(x + lean)} ${r2(y - h)}`,
    // down the inside of the tongue, deep into a low waist
    `C ${T(0.6, 0.8)} ${T(0.8, 0.56)} ${P(0.14, 0.34)}`,
    // out to a small low lick and down the far bulb home
    `C ${P(0.32, 0.36)} ${P(0.48, 0.4)} ${P(0.62, 0.48)}`,
    `C ${P(0.64, 0.28)} ${P(0.56, 0.08)} ${P(0.2, 0)}`
  ].join(" ");
};

/**
 * A neon tube: a team stroke with a white-hot core (team), or one plain white
 * tube with no halo (white). `w` is the outer width: 3.2 by default, thinner
 * for the closed flame outlines, whose insides must stay open.
 */
const tube = (d, styleFill, fill, cls = "", style = "", w = 3.2) => {
  const open = `<g${cls ? ` class="${cls}"` : ""}${style ? ` style="${style}"` : ""} fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  if (styleFill === COLORS.white) return `${open}<path stroke="${COLORS.white}" stroke-width="${r2(w * 0.9)}" d="${d}"/></g>`;
  return `${open}
    <path stroke="${styleFill}" stroke-width="${w}" d="${d}"/>
    <path stroke="${COLORS.white}" stroke-width="${r2(w * 0.42)}" d="${d}"/>
  </g>`;
};

const buzz = (k) =>
  `<style>.${k}{animation:${k} 3s linear infinite}@keyframes ${k}{0%,88%,92%,100%{opacity:1}90%{opacity:.3}95%{opacity:.6}}@media (prefers-reduced-motion:reduce){.${k}{animation:none}}</style>`;

const neonFlames = {
  id: "neon-flames",
  slot: "stage",
  name: "Neon flames",
  note: "Neon flame outlines along the floor edge: tubes, never fire. Outline only, cool team-coloured light with a white-hot core, because metal owns real flame and ember.",
  variants: [
    {
      key: "a",
      note: "Two flame clusters standing on a neon floor line, one behind the tail and one in front of the chest, where the bird never covers them. Each is one big flame (a narrow base, a tall S-leaning tongue and a flick out each side, low) bent in a single thin neon tube, with a small single tongue leaning beside it. Team is a cyan tube with a white-hot core; white is one plain white tube with no halo. The back cluster buzzes off and on like a tired sign.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const k = `dsh-nfa-${hex(fill)}`;
        const back = [flamePath(4.5, 72, 16.8, 6.5, -3), flamePath(13.5, 72, 11, 4, 3, false)].join(" ");
        const front = [flamePath(66.5, 72, 11, 4, -3, false), flamePath(75.5, 72, 16.8, 6.5, 3)].join(" ");
        const fw = 2.4;
        return `${buzz(k)}${tube("M -6 72.8 L 86 72.8", styleFill, fill, "", "", fw)}${tube(back, styleFill, fill, k, "", fw)}${tube(front, styleFill, fill, "", "", fw)}`;
      }
    },
    {
      key: "b",
      note: "A flame chase: one continuous neon tube running along the floor behind the feet, from x 2 to 78, with five single flame tongues (each a bulb pinched at the base, a side lick and a tall leaning tongue) standing on it, two behind the tail and three in front of the chest, none between x 22 and 50, so the feet stand on bare lit tube. The floor line stays lit; all five burn on the downbeat, then drop and relight one by one on the beat, left to right. Reduced motion holds all five lit.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const k = `dsh-nfb-${hex(fill)}`;
        const y = 72;
        const w = 7;
        // Every tongue stands outside x 22..50, so the feet stand on bare lit tube.
        const tongues = [
          { x: 5, h: 17, lean: -3 },
          { x: 15, h: 12, lean: 2.5 },
          { x: 56, h: 12.5, lean: -2.5 },
          { x: 66, h: 15, lean: 2.5 },
          { x: 76, h: 16, lean: 3 }
        ];
        const steps = tongues.length + 1;
        const floor = `M 2 ${y} L 78 ${y}`;
        // Six beats: on beat 0 all five burn, then they drop and relight one
        // by one, left to right (beat k lights tongues 0..k-1).
        const css = tongues
          .map((_, i) => {
            // Tongue i is dark on beats 1..i and lit from beat i+1 to the end.
            const off = r2((1 / steps) * 100);
            const on = r2(((i + 1) / steps) * 100);
            const dark = i > 0 ? `${off}%{opacity:.3}${on}%{opacity:1}` : "";
            return `.${k}-${i}{animation:${k}-${i} ${steps * BEAT_S}s step-end infinite}@keyframes ${k}-${i}{0%{opacity:1}${dark}100%{opacity:1}}`;
          })
          .join("");
        const flames = tongues.map((t, i) => tube(tonguePath(t.x, y, t.h, w, t.lean), styleFill, fill, `${k}-${i}`)).join("");
        return `<style>${css}@media (prefers-reduced-motion:reduce){${tongues.map((_, i) => `.${k}-${i}`).join(",")}{animation:none}}</style>
          ${tube(floor, styleFill, fill)}${flames}`;
      }
    }
  ]
};

export const ITEMS = [mirrorBallEgg, handFan, vinyl, litFloor, neonFlames];
