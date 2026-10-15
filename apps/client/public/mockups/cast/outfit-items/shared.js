// shared: the any-team rail (docs/research/bird-wardrobe.md §2.2, "Shared
// rail"): wing-night bib, team sash, golden egg, drumstick, egg nest. Every
// item is drawn in ink, white, gold, ember or the WEARER's team colour
// (ctx.fill), so it repaints per team and never makes a bird read as another
// team. The contract is at the top of ../outfit-harness.js.
//
// Round 2 (after critic round 1). Variant keys were re-lettered where a kept
// variant had to become "a" so the shared Looks in looks.js (which name
// variant "a") wear the critic's picks without that file changing:
//   drumstick  a = the fixed mic drop (was b), b = new wing bucket
//   egg-nest   a = the clutch (was c), b = new straw nest, c = new hatched shells
// Every variant note says what it was in round 1.
//
// Round 3 (after critic round 2): the bib's sauce gets an ember rim (a) and
// the paper bib a heavier outline, a tie and an ink splat on chrome (b); sash
// a is steeper and cut at y 36.5; the egg basket loses its weave for a solid
// tub and an arched handle; the drumstick's broody meat hangs below the body
// and its ink char is two rim blotches; the straw nest is a smooth mound under
// whole eggs; the hatched shells (egg-nest c) were cut for "the big one".
//
// Run 1b (art polish, after critic round 3, under the relaxed prop sweep of
// §2.1): every cut got a different replacement and every fix was applied.
//   team-sash b   far-shoulder slash (a prohibition sign) -> the knotted sash
//   golden-egg b  egg basket (a padlock) -> the trophy, the egg held aloft
//   drumstick b   wing bucket (teeth) -> raised and bitten, held up like a toast
//   egg-nest b    straw nest (rocks) -> the twig nest, a dark bowl with a rim
//   egg-nest c    one small front egg, not two (the pair read as eyes)
//   drumstick a   the glaze drip ends 1u higher (it swung under the floor in
//                 the team and gold styles on the pop squash and broody tuck)
//
// Polish round 1 (after the run 1b critic):
//   team-sash b   knot higher, tails shorter and splayed so the forks stay on
//                 the body; flared 8u ribbons with 6.8u V notches; a bigger
//                 knot; ink tails get a team-colour rim so they read as two
//   golden-egg b  the handles (a dog bone) are gone: a wide shallow bowl, a
//                 long stem and a two-tier foot, the egg seated IN the bowl
//   egg-nest b    twig nest (a frying pan) -> the straw nest: a shallow bowl
//                 whose rim is broken by long straw strands, eggs in trios
//   egg-nest c    the giant egg leans back on the pad, 27 long (a stage may
//                 not rise above y 55, so it cannot stand taller); small egg
//                 9 wide
//
// Polish round 2 (after the polish critic's round 2):
//   team-sash b   a's WHOLE diagonal with the knot tied ON it: a 7 x 11
//                 rounded-rectangle cinch half way down (ink: two team-colour
//                 cinch lines, no ring), two constant-width 5.2u ribbon tails
//                 hanging almost straight down in a 20-degree inverted V, each
//                 with one 2.2u V notch (round 1's knot ellipse and 60-degree
//                 forks read as a white glove, or in ink a crow)
//   golden-egg b  hoisted: 15 degrees back of vertical, no ink plinth (a brick
//                 by the legs), one light 11 x 3.5 foot, a 12u stem, a deep U
//                 bowl 16 wide under an 18u flat lip, a 10 x 12.5 egg with its
//                 lower third behind the lip
//   egg-nest b    straw nest (a woodpile, crossbones) -> one nest at the tail
//                 end: a light straw wall, three eggs of three sizes, lopsided
//                 tapered straw ends
//
// Shared items have to work on all four bodies, so every placement is read off
// the silhouette (stock/pop, spiky/metal, broody/country, preener/disco):
//
// - Tops are drawn generously and clipped to ctx.bodyPath, so the item always
//   follows that genre's chest edge; the body's ink outline is then restroked
//   over the item (clipped to the item) so the clip never eats the edge.
//   The neck is painted after the Top, so a Top's upper edge tucks under it.
// - Props (run 1b sweep): at rest and the walk tuck, nothing in the head box
//   (x 36..80, y < 37) or under 72.75; at the dance and Move extremes only a
//   dip past 76.75 fails. So a prop may now be held up and back, at x < 36.
//   What still bites: the flap (-62) and the preener's Night Fever drop swing
//   anything far back at pivot height down under the floor, so a raised prop
//   stays steep (its far end high) and, on the preener, right of x ~9.
// - The stage sits behind the legs, so anything straw-coloured right under the
//   feet would swallow the orange legs (mutedWarm vs leg orange is ~1.2:1).
//   Under the feet a stage is ink; straw only goes out at the sides.

import { contrast } from "../outfit-harness.js";

export const GENRES = ["metal", "pop", "country", "disco"];

const INK = "#121212";
const WHITE = "#ffffff";
const EMBER = "#ffb35a";

// ------------------------------------------------------------- geometry --

const f = (n) => Math.round(n * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;
const keyOf = (ctx) => ctx.silhouette ?? "stock";

const poly = (pts) => `M ${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")} Z`;

/** A smooth closed path through points (Catmull-Rom as cubic beziers). */
const smooth = (pts) => {
  const n = pts.length;
  const P = (i) => pts[(i + n) % n];
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

const circlePath = (cx, cy, r) =>
  `M ${f(cx - r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx + r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;

/** A local frame: u along `deg` from `o`, v a quarter turn clockwise of it. */
const frame = (o, deg) => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return ([u, v]) => [o[0] + u * c - v * s, o[1] + u * s + v * c];
};

/** The egg outline in its own frame: t = 0 front, pi/2 bottom, 3pi/2 top. */
const eggPoint = (w, h, t, inset = 0) => {
  const y = (h / 2 - inset) * Math.sin(t);
  const x = (w / 2 - inset) * Math.cos(t) * (1 + 0.16 * (y / (h / 2)));
  return [x, y];
};

/**
 * An egg centred on (cx, cy), w wide and h tall, narrow end up, tilted by
 * `tilt` degrees (positive leans the top forward, to the right).
 */
const eggPath = (cx, cy, w, h, tilt = 0) => {
  const at = frame([cx, cy], tilt);
  const pts = [];
  for (let i = 0; i < 28; i += 1) pts.push(at(eggPoint(w, h, (i / 28) * Math.PI * 2)));
  return smooth(pts);
};

/**
 * Shapes [{ d, fill }] painted with one merged ink outline: every shape in ink
 * with a 4-unit stroke first (the 2-unit house outline), then every fill on
 * top, so the parts of one prop share a single outline instead of seaming.
 */
const outlined = (shapes, width = 4) =>
  shapes.map(({ d }) => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="${width}" stroke-linejoin="round"/>`).join("") +
  shapes.map(({ d, fill }) => `<path d="${d}" fill="${fill}"/>`).join("");

/**
 * A Top region: `inner` (markup) clipped to the body, then the body's own ink
 * outline restroked where it passes over `itemD`, so the clip never eats it.
 */
const onBody = (ctx, itemD, inner) => {
  const body = ctx.clip(ctx.bodyPath);
  const item = ctx.clip(itemD);
  const join = ctx.mitered ? "miter" : "round";
  return (
    `<defs>${body.def}${item.def}</defs>` +
    `<g clip-path="${body.url}">${inner}</g>` +
    `<g clip-path="${item.url}"><path d="${ctx.bodyPath}" fill="none" ${ctx.inkStroke(2, join)}/></g>`
  );
};

// ------------------------------------------------------------------- bib --

// Where a bib sits on each body: `back` is its back edge (a few units over
// the wing's leading edge, so the bib owns a clean vertical line instead of
// sharing the wing's outline), `hem` the lowest point of its rounded hem,
// `front` the hem's front end (past the chest edge; the body clip trims it),
// `splat` the sauce's centre and radius (already moved off-centre, down and
// forward of the panel's middle) and `drip` the y the drip's bulb ends on
// (1.5u above the hem, or above the body's own bottom where that is higher).
// The preener's chest is small, so its bib drops to y 54 and starts at x 42,
// giving at least 10u of bib in front of the wing.
const CHEST = {
  stock: { back: 44, hem: 57, front: [66, 50], splat: [56, 47.5, 5.4], drip: 55.5 },
  spiky: { back: 44, hem: 54.5, front: [65, 48], splat: [55.3, 46, 4.9], drip: 53 },
  broody: { back: 45, hem: 60, front: [70, 53], splat: [58, 50, 6], drip: 58.5 },
  preener: { back: 42, hem: 54, front: [66, 47], splat: [53.5, 44.6, 4.3], drip: 51.2 }
};

/**
 * A thrown sauce splat: a small core with five rays of uneven length and
 * spacing, not an even star. Round 3: five rays, not three; with three, the
 * splat and its drip made a little pointing hand.
 */
const RAYS = [
  [-0.9, 1.15],
  [0.35, 1.5],
  [2.25, 0.8],
  [2.95, 1.1],
  [4.3, 0.75]
];
const splatPath = (cx, cy, r) => {
  const pts = [];
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

/**
 * The splat's one detached droplet, thrown down and back of the splat: a round
 * drop (r 1.4) with a short tail pointing back at the splat, so it reads as
 * flung sauce, never as a ring. (Round 2 had two round droplets; with the drip
 * they made a small pointing glove at 304px.)
 */
const dropletPath = (cx, cy, r) => {
  const dx = cx - 1.3 * r;
  const dy = cy + 0.9 * r;
  const toward = Math.atan2(cy - dy, cx - dx);
  const pts = [];
  for (let i = 0; i < 36; i += 1) {
    const t = (i / 36) * Math.PI * 2;
    let d = Math.abs(t - ((toward + Math.PI * 2) % (Math.PI * 2)));
    d = Math.min(d, Math.PI * 2 - d);
    const rr = 1.4 + 1.3 * Math.exp(-((d / 0.4) ** 2));
    pts.push([dx + rr * Math.cos(t), dy + rr * Math.sin(t)]);
  }
  return smooth(pts);
};

/** A drip: a tongue from (x, y0) down to a round bulb `bulb` across ending at y1. */
const dripPath = (x, y0, y1, w, bulb) => {
  const b = bulb / 2;
  const cy = y1 - b;
  return (
    `M ${f(x - w * 1.5)} ${f(y0)} C ${f(x - w)} ${f(y0 + 1.2)} ${f(x - w * 0.8)} ${f(cy - b * 1.6)} ${f(x - b)} ${f(cy)} ` +
    `A ${f(b)} ${f(b)} 0 1 0 ${f(x + b)} ${f(cy)} C ${f(x + w * 0.8)} ${f(cy - b * 1.6)} ${f(x + w)} ${f(y0 + 1.2)} ${f(x + w * 1.5)} ${f(y0)} Z`
  );
};

/** The splat, its droplet and its drip, as path strings. */
const sauceParts = (c, dripW, bulb) => {
  const [sx, sy, sr] = c.splat;
  return [splatPath(sx, sy, sr), dropletPath(sx, sy, sr), dripPath(sx - 0.4, sy + sr * 0.35, c.drip, dripW, bulb)];
};

/**
 * The sauce on the ink bib: every part first stroked in ember (2.4u, so a
 * 1.2u warm rim shows past the fill), then filled in the team colour on top.
 * Without the rim a team splat beside the same-colour body read as a hole cut
 * through the bib; the rim lifts it off the ink on all four teams (ember on
 * ink is ~11:1) and the centre stays team colour, so no dark centre.
 */
const sauce = (ctx, c) => {
  const parts = sauceParts(c, 1.0, 2.2);
  return (
    parts.map((d) => `<path d="${d}" fill="${ctx.fill}" stroke="${EMBER}" stroke-width="2.4" stroke-linejoin="round"/>`).join("") +
    parts.map((d) => `<path d="${d}" fill="${ctx.fill}"/>`).join("")
  );
};

const lobsterBibD = (ctx) => {
  const c = CHEST[keyOf(ctx)];
  const s = ctx.head.shoulders;
  const { back, hem, front } = c;
  const mid = back + (front[0] - back) * 0.42;
  return `M ${back} ${s} L ${front[0] + 6} ${s} L ${front[0] + 6} ${front[1] - 2} L ${front[0]} ${front[1]} C ${front[0] - 4} ${hem} ${mid + 5} ${hem} ${mid} ${hem} C ${back + 3} ${hem} ${back} ${hem - 3} ${back} ${hem - 7} Z`;
};

const lobsterBib = (ctx) => {
  const c = CHEST[keyOf(ctx)];
  const d = lobsterBibD(ctx);
  return onBody(ctx, d, `<path d="${d}" fill="${INK}"/>${sauce(ctx, c)}`);
};

// The paper bib: the takeout-joint bib, a white square tied on below the
// neck, so it reads as a light block where variant a reads as a dark one. Its
// top sits at y 37 (under the neck's tip at 40) so no white comes within 16u
// of the drawn head's centre; its straight sides and square hem are what make
// it paper, not a panel. The splat is team colour with an ink outline (pink
// reads on white, chrome would not without it).
const PAPER = {
  stock: { back: 43, hem: 58, splat: [54.5, 47.5, 5], drip: 55.6 },
  spiky: { back: 43, hem: 55.5, splat: [54, 46.4, 4.6], drip: 53.2 },
  broody: { back: 44, hem: 61, splat: [57, 50, 5.6], drip: 58.6 },
  preener: { back: 41.5, hem: 54.5, splat: [52.5, 45.4, 4.1], drip: 52 }
};

const paperBib = (ctx) => {
  const c = PAPER[keyOf(ctx)];
  const top = Math.max(37, ctx.head.shoulders);
  const { back, hem } = c;
  const d = `M ${back} ${top} L 80 ${top} L 80 ${hem} L ${back + 6} ${hem} Q ${back} ${hem} ${back} ${hem - 6} Z`;
  const parts = sauceParts(c, 0.9, 2.0);
  // A 2.6u ink underlay, so the splat always has a solid ink silhouette.
  const sauceInk = parts.map((p) => `<path d="${p}" fill="${INK}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`).join("");
  // A team colour that cannot show on white paper (chrome, 1.35:1) is BBQ
  // sauce instead: a solid ink splat, still never another team's colour.
  const sauceColor = contrast(ctx.fill, WHITE) < 1.6 ? INK : ctx.fill;
  const sauceFill = parts.map((p) => `<path d="${p}" fill="${sauceColor}"/>`).join("");
  const paper = ctx.clip(d);
  // The tie: one ink string off the top-back corner, running back over the
  // wing, so the square says "tied on".
  const tie = `<path d="M ${back} ${top} L ${back - 4} ${top + 1.5}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`;
  return onBody(
    ctx,
    d,
    `<path d="${d}" fill="${WHITE}"/>` +
      `<g clip-path="${paper.url}"><defs>${paper.def}</defs>${sauceInk}${sauceFill}</g>` +
      // The bib's own back edge and hem in ink (the chest edge is the body's),
      // heavier than the house 2u so the paper holds on chrome.
      `<path d="${d}" fill="none" ${ctx.inkStroke(2.6)}/>` +
      tie
  );
};

// ------------------------------------------------------------------ sash --

/** A straight band from a to b, half-width hw, ends cut square, as points. */
const bandPts = (a, b, hw) => {
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

/** A polygon cut to y >= y0 (Sutherland–Hodgman against one half-plane). */
const belowY = (pts, y0) => {
  const out = [];
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

const sashMarkup = (ctx, d) => {
  const white = ctx.style === "white";
  const fill = ctx.styleFill;
  // White keeps its ink outline (a 3u stroke, so ~2u shows inside the body
  // clip at the band's sides); ink needs none on any team colour.
  const paint = white ? `fill="${fill}" ${ctx.inkStroke(2.4)}` : `fill="${fill}"`;
  return onBody(ctx, d, `<path d="${d}" ${paint}/>`);
};

// Over the near shoulder to the back hip. Round 3: steeper (the shoulder end
// 3u back, the hip end 3u down), so on the broody and the preener it is a
// shoulder-to-hip diagonal and not a belt lying along the wing. The hip end's
// lower edge now crosses the wing's scallops; they sit under the band's 2.4u
// outline.
const SASH = {
  stock: { shoulder: [64, 0], hip: [12, 56] },
  spiky: { shoulder: [63, 0], hip: [13, 55.5] },
  broody: { shoulder: [68, 0], hip: [12, 55.5] },
  preener: { shoulder: [60, 0], hip: [26, 55] }
};

// The band is cut flat at y 36.5 (or the shoulders line, if lower): the neck
// covers the cut on every head, and at 36.5 no white comes within 16u of the
// drawn head's centre (58, 20).
const pageantSash = (ctx) => {
  const c = SASH[keyOf(ctx)];
  const s = ctx.head.shoulders;
  return sashMarkup(ctx, poly(belowY(bandPts([c.shoulder[0], s - 4], c.hip, 4.2), Math.max(36.5, s))));
};

// The knotted sash (run 1b, replaces the cut far-shoulder sash, whose
// mirrored slash read as a prohibition sign). Polish round 2: the band is a's
// WHOLE diagonal, shoulder to back hip, because the full-length band is the
// one shape that says "sash"; round 1 stopped it at a fat knot ellipse with
// two forks splayed 60 degrees, which read as a white glove (ink: a crow).
// Now the knot is tied ON the band: a rounded rectangle 7u along it by 11u
// across (1.3x the band), half way down, with two short ribbon tails hanging
// almost straight down out of it in a narrow 20-degree inverted V. The critic
// asked for the knot at 60%; there the belly is so close under it that only
// 3u of tail showed, so it sits at 50% (45% on the preener, the highest its
// top corner can go without rising past the costume shoulders) and the tails
// get about 10u below the knot.
// `t` is where the knot sits along the band, `k` its scale, `tail` each
// tail's length from its root under the knot's middle: as long as the belly
// allows with every tip at least 2u inside it (stock tips y 60.8 over a belly
// at 62.9, spiky 57.6 / 59.6, broody 61.9 / 65.9). The preener's chest is
// ~11u deep under the band, so its knot is 85% and its tails show ~4u.
const KNOT = {
  stock: { t: 0.5, k: 1, tail: 15.5 },
  spiky: { t: 0.5, k: 1, tail: 12.3 },
  broody: { t: 0.5, k: 1, tail: 17 },
  preener: { t: 0.45, k: 0.85, tail: 8 }
};

/**
 * A constant-width ribbon from `a` to `b`, half-width hw, its far end cut into
 * one V `notch` deep.
 */
const ribbon = (a, b, hw, notch) => {
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

/** A rounded rectangle centred on `c`, `len` along `deg` by `wid` across, corner radius rx. */
const roundRect = (c, deg, len, wid, rx) => {
  const at = frame(c, deg);
  const [u, v] = [len / 2, wid / 2];
  const P = (a, b) => at([a, b]).map(f).join(" ");
  return (
    `M ${P(-u + rx, -v)} L ${P(u - rx, -v)} Q ${P(u, -v)} ${P(u, -v + rx)} L ${P(u, v - rx)} Q ${P(u, v)} ${P(u - rx, v)} ` +
    `L ${P(-u + rx, v)} Q ${P(-u, v)} ${P(-u, v - rx)} L ${P(-u, -v + rx)} Q ${P(-u, -v)} ${P(-u + rx, -v)} Z`
  );
};

const knottedSash = (ctx) => {
  const key = keyOf(ctx);
  const line = SASH[key];
  const c = KNOT[key];
  const s = ctx.head.shoulders;
  const bandD = poly(belowY(bandPts([line.shoulder[0], s - 4], line.hip, 4.2), Math.max(36.5, s)));
  // The knot is placed on the costume head's line (shoulder end at y 33), so
  // it sits in the same place on the drawn head, whose band only starts
  // higher under the neck.
  const a = [line.shoulder[0], 33];
  const b = line.hip;
  const kc = [a[0] + (b[0] - a[0]) * c.t, a[1] + (b[1] - a[1]) * c.t];
  const deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const along = frame(kc, deg);
  const [kl, kw] = [7 * c.k, 11 * c.k];
  const knotD = roundRect(kc, deg, kl, kw, 1.5);
  // The tails leave from under the knot, 3.1u apart along the band (u runs
  // toward the hip, -v is down), and hang 10 degrees back (100) and 10
  // degrees forward (80) of straight down.
  const hw = 2.6 * c.k;
  const tails = [
    [along([1.2 * c.k, -0.6]), 100],
    [along([-1.9 * c.k, -0.6]), 80]
  ].map(([p0, dir]) => {
    const tip = [p0[0] + c.tail * Math.cos(rad(dir)), p0[1] + c.tail * Math.sin(rad(dir))];
    return ribbon(p0, tip, hw, hw * 0.85);
  });
  const all = `${bandD} ${tails.join(" ")} ${knotD}`;
  const fill = ctx.styleFill;
  if (ctx.style === "white") {
    // White: the tails first, each with its own 2.4u ink edge, then the band
    // and the knot as ONE lump (both 4.8u strokes, then both fills), so the
    // knot is a cinch on the band and never an oval in its own ring.
    const tailWhite = tails.map((d) => `<path d="${d}" fill="${fill}" ${ctx.inkStroke(2.4)}/>`).join("");
    const lump = [bandD, knotD];
    return onBody(
      ctx,
      all,
      tailWhite +
        lump.map((d) => `<path d="${d}" fill="none" ${ctx.inkStroke(4.8)}/>`).join("") +
        lump.map((d) => `<path d="${d}" fill="${fill}"/>`).join("")
    );
  }
  // Ink: each tail keeps a 1.6u team-colour rim UNDER its fill, so the two
  // read as two ribbons; the knot has no ring (a ring round it drew an eye),
  // just two straight team-colour lines across the band at its two ends, so
  // it reads as a cinch.
  const tailInk = tails
    .map((d) => `<path d="${d}" fill="${fill}" stroke="${ctx.fill}" stroke-width="3.2" stroke-linejoin="miter" paint-order="stroke"/>`)
    .join("");
  const cinch = [-kl / 2, kl / 2]
    .map((u) => {
      const [p, q] = [along([u, -kw / 2]), along([u, kw / 2])];
      return `M ${f(p[0])} ${f(p[1])} L ${f(q[0])} ${f(q[1])}`;
    })
    .join(" ");
  return onBody(
    ctx,
    all,
    `${tailInk}<path d="${bandD}" fill="${fill}"/><path d="${knotD}" fill="${fill}"/>` +
      `<path d="${cinch}" fill="none" stroke="${ctx.fill}" stroke-width="1.6"/>`
  );
};

// ------------------------------------------------------------ golden egg --

// Under the wing's trailing edge, just forward of the grip, low enough to poke
// below the belly where the body allows it.
const CLUTCH = {
  stock: { c: [31, 60.5], tilt: -18 },
  spiky: { c: [31, 59.5], tilt: -18 },
  broody: { c: [35, 59], tilt: -14 },
  preener: { c: [29, 59], tilt: -20 }
};

/**
 * Gold reads as metal only with a highlight and a shade: a curved white
 * streak along the upper-back edge (an arc, never a dot: a dot on an oval is
 * an eye's catchlight) and an ink crescent at 22% across the lower front.
 */
const goldShine = (ctx, cx, cy, w, h, tilt) => {
  const at = frame([cx, cy], tilt);
  const eggD = eggPath(cx, cy, w, h, tilt);
  const egg = ctx.clip(eggD);
  // Shade: the egg's box minus the egg nudged up and back, inside the egg.
  const lit = eggPath(...at([-1.6, -2.6]), w, h, tilt);
  const box = `M ${f(cx - w)} ${f(cy - h)} L ${f(cx + w)} ${f(cy - h)} L ${f(cx + w)} ${f(cy + h)} L ${f(cx - w)} ${f(cy + h)} Z`;
  // Glint: 2u inside the outline, from about 9 o'clock round to 11.
  const arc = [];
  for (let i = 0; i <= 10; i += 1) arc.push(at(eggPoint(w, h, rad(186 + i * 7), 2)));
  const glint = `M ${arc.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")}`;
  return (
    `<defs>${egg.def}</defs><g clip-path="${egg.url}">` +
    `<path d="${box} ${lit}" fill="${INK}" fill-opacity="0.22" fill-rule="evenodd"/>` +
    `<path d="${glint}" fill="none" stroke="${WHITE}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</g>`
  );
};

const clutchedEgg = (ctx) => {
  const { c, tilt } = CLUTCH[keyOf(ctx)];
  const [w, h] = [10.5, 13.5];
  const shine = ctx.style === "gold" ? goldShine(ctx, c[0], c[1], w, h, tilt) : "";
  return outlined([{ d: eggPath(c[0], c[1], w, h, tilt), fill: ctx.styleFill }], 4.4) + shine;
};

// The trophy (run 1b, replaces the cut egg basket, which read as a padlock):
// the egg held ALOFT, the way the spec always wanted it, now that a prop may
// be held up and back (§2.1, run 1b). A championship cup gripped by its foot
// at the wing tip, tilted up and back so the cup and the egg stand up over the
// tail, never toward the face. The cup is silver (mutedWarm) in white, so the
// white egg is its own value step, and gold in gold (a gold cup with a gold
// egg: the prize). `base` is the plinth's centre, `deg` the axis from it
// toward the egg; the preener's is steepest, because the Night Fever drop
// swings anything left of x ~9 under the floor.
// Polish round 1: no handles (two solid ovals at the lip plus the stem made a
// dog bone). Polish round 2: in white it read as an egg cup or a cone tipped
// back 40 degrees, and its ink plinth as a black brick by the legs. Now it is
// HOISTED: nearly upright (15 degrees back of vertical), a light one-step foot
// in the wing tip, a 12u stem, a deep U bowl 16 wide with a flat lip, and a
// smaller egg (10 x 12.5) whose lower third is behind the lip, so the cup is
// the bigger shape. `base` is the foot's centre, `deg` the axis from it up
// toward the egg (-90 is straight up), `stem` the stem's length (12; the
// broody's back is low and round, so a full stem lifts the cup more than 10u
// past her outline).
const TROPHY = {
  stock: { base: [24.5, 55], deg: -105 },
  spiky: { base: [24.5, 54.5], deg: -105 },
  broody: { base: [29, 54], deg: -108, stem: 9.5 },
  preener: { base: [23.5, 54], deg: -103 }
};

/** A smooth open curve through points (Catmull-Rom), closed by a straight line. */
const smoothOpen = (pts) => {
  const n = pts.length;
  const P = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i += 1) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
};

const trophyParts = ({ base, deg, stem: stemLen = 12 }) => {
  const at = frame(base, deg);
  const P = (u, v) => at([u, v]);
  // u runs up the axis from the foot. The foot is one 11 x 3.5 step, then
  // the stem, then a deep U bowl 16 wide and 8 deep (straight-ish sides and a
  // round bottom: a V under the egg read as an ice-cream cone), and the lip a
  // flat 18 x 2.5 band over the bowl's mouth.
  const b0 = 1.75 + stemLen;
  const foot = poly([P(-1.75, -5.5), P(-1.75, 5.5), P(1.75, 5.5), P(1.75, -5.5)]);
  const stem = poly([P(1.75, -1.9), P(1.75, 1.9), P(b0 + 1, 1.9), P(b0 + 1, -1.9)]);
  const bowl = smoothOpen([P(b0 + 8, -8), P(b0 + 4, -7.8), P(b0 + 1, -5.6), P(b0, 0), P(b0 + 1, 5.6), P(b0 + 4, 7.8), P(b0 + 8, 8)]);
  const lip = poly([P(b0 + 7, -9), P(b0 + 7, 9), P(b0 + 9.5, 9), P(b0 + 9.5, -9)]);
  // The egg's lower third sits behind the lip (its narrow end along the axis;
  // eggPath's tilt is measured from straight up, so axis -90 is no tilt).
  const egg = { c: P(b0 + 9.5 + 6.25 - 4.2, 0), w: 10, h: 12.5, tilt: deg + 90 };
  return { foot, stem, bowl, lip, egg };
};

const trophyEgg = (ctx) => {
  const t = trophyParts(TROPHY[keyOf(ctx)]);
  const gold = ctx.style === "gold";
  // White: a silver cup (mutedWarm, the house grey) under the white egg, so
  // the egg is its own value step; the foot is cup colour too, so the bottom
  // of the trophy is light (round 1's ink plinth read as a brick).
  const cup = gold ? ctx.styleFill : ctx.colors.mutedWarm;
  const { c, w, h, tilt } = t.egg;
  const shine = gold ? goldShine(ctx, c[0], c[1], w, h, tilt) : "";
  return (
    // The egg first, with its own 4.4u outline, so gold egg and gold cup are
    // two shapes; then the cup over its lower third, the lip's 2.4u ink edge
    // across it.
    outlined([{ d: eggPath(c[0], c[1], w, h, tilt), fill: ctx.styleFill }], 4.4) +
    shine +
    outlined([t.foot, t.stem, t.bowl].map((d) => ({ d, fill: cup })), 4.8) +
    // The lip on its own, so its ink edge crosses the bowl's mouth.
    outlined([{ d: t.lip, fill: cup }], 4)
  );
};

// ------------------------------------------------------------- drumstick --

/**
 * One chicken drumstick from the knuckle k to the meat's tip t, as parts in a
 * local frame: a white bone with a two-lobed knuckle, and a fat teardrop of
 * meat over the far end. The meat is ember, the house cooked colour, in every
 * style; the style paints only the sauce on it.
 */
const drumstickParts = ({ k, t, r = 5, meat = 0.6, bone = 1.5 }) => {
  const deg = (Math.atan2(t[1] - k[1], t[0] - k[0]) * 180) / Math.PI;
  const L = Math.hypot(t[0] - k[0], t[1] - k[1]);
  const at = frame(k, deg);
  const m0 = L * (1 - meat);
  const P = (u, v) => at([u, v]).map(f).join(" ");
  const meatD = `M ${P(m0, -bone)} C ${P(m0 + L * meat * 0.3, -r * 1.2)} ${P(L - r * 0.1, -r * 1.05)} ${P(L, 0)} C ${P(L - r * 0.1, r * 1.05)} ${P(m0 + L * meat * 0.3, r * 1.2)} ${P(m0, bone)} Z`;
  const boneD = poly([[1, -bone], [m0 + 1.5, -bone], [m0 + 1.5, bone], [1, bone]].map(at));
  const lobes = [at([0.4, -2]), at([0.4, 2])].map((c) => circlePath(c[0], c[1], 2.3));
  return { at, L, m0, r, meatD, boneD, lobes };
};

/**
 * The sauce: `team` and `gold` paint a glaze cap over the bottom 45% of the
 * meat, its top edge wavy (three bumps), with one drip hanging off the tip;
 * `ink` paints BBQ char as two blotches on the meat's rim, off-centre (round
 * 2's three parallel stripes read as a bee at 76px).
 */
const ellipsePath = (cx, cy, rx, ry, deg) => {
  const at = frame([cx, cy], deg);
  const pts = [];
  for (let i = 0; i < 16; i += 1) {
    const t = (i / 16) * Math.PI * 2;
    pts.push(at([rx * Math.cos(t), ry * Math.sin(t)]));
  }
  return smooth(pts);
};

const sauceOnMeat = (ctx, p, cover = 0.45) => {
  const { at, L, m0, r, meatD } = p;
  const meatClip = ctx.clip(meatD);
  const len = L - m0;
  if (ctx.style === "ink") {
    // Both blotches sit on the meat's rim, diagonally opposite and clipped
    // by it, so they read as charred edges; two dots inside a round shape
    // would be a pair of eyes.
    const [c1, c2] = [at([L - r * 1.55, -r * 0.8]), at([L - r * 0.3, r * 0.6])];
    return (
      `<defs>${meatClip.def}</defs><g clip-path="${meatClip.url}">` +
      `<path d="${ellipsePath(c1[0], c1[1], 1.6, 1.1, 25)}" fill="${INK}"/>` +
      `<path d="${ellipsePath(c2[0], c2[1], 1.2, 0.9, 25)}" fill="${INK}"/></g>`
    );
  }
  const uc = L - len * cover;
  const edge = [];
  const span = r * 1.4;
  for (let i = 0; i <= 24; i += 1) {
    const v = -span + (2 * span * i) / 24;
    edge.push([uc - 0.85 * Math.abs(Math.sin((3 * Math.PI * (v + span)) / (2 * span))), v]);
  }
  const cap = poly([...edge, [L + 3, span], [L + 3, -span]].map(at));
  return `<defs>${meatClip.def}</defs><g clip-path="${meatClip.url}"><path d="${cap}" fill="${ctx.styleFill}"/></g>`;
};

/** The glaze's one drip, hanging straight down off the meat's tip. */
const glazeDrip = (t, end) => {
  const w = 0.7;
  return `M ${f(t[0] - 1.6)} ${f(t[1] - 1.2)} L ${f(t[0] + 1.4)} ${f(t[1] - 1.2)} L ${f(t[0] + w)} ${f(end - w * 1.4)} A ${f(w)} ${f(w)} 0 0 1 ${f(t[0] - w)} ${f(end - w * 1.4)} Z`;
};

// Mic drop: knuckle in the wing tip, meat hanging under the belly between
// the legs (x ~33.7..43.3), the moment after the last line.
const DROP = {
  stock: { k: [28.5, 53.5], t: [38.5, 69] },
  spiky: { k: [28.5, 53], t: [38.5, 69] },
  broody: { k: [31, 51], t: [39.6, 71], glazeEnd: 71 },
  preener: { k: [27.5, 52.5], t: [38.5, 69] }
};

const micDrop = (ctx) => {
  // Run 1b: the drip ends 1u higher (70.6, broody 71); at 71.6 / 72.4 the
  // pop squash and the broody walk tuck swung it under the floor.
  const { k, t, glazeEnd = 70.6 } = DROP[keyOf(ctx)];
  const p = drumstickParts({ k, t, r: 4.8, meat: 0.55 });
  const glazed = ctx.style !== "ink";
  return (
    outlined([
      { d: p.boneD, fill: WHITE },
      ...p.lobes.map((d) => ({ d, fill: WHITE })),
      ...(glazed ? [{ d: glazeDrip(t, glazeEnd), fill: ctx.styleFill }] : []),
      { d: p.meatD, fill: EMBER }
    ]) + sauceOnMeat(ctx, p)
  );
};

// The raised drumstick (run 1b, replaces the cut wing bucket, whose stripes
// read as teeth): the drumstick held UP like a mic, or a toast, now that a
// prop may be raised up and back (§2.1, run 1b). The knuckle is gripped at the
// wing tip and the meat stands up and back over the tail (steeper than this
// and lower, the flap and the Night Fever drop swing it under the floor),
// with one big round bite out of its underside: a single smooth arc, never a
// row of scallops (scallops read as teeth). It is bigger than a's (r 7.4, 28
// long) because the meat is the read. `k` is the knuckle, `deg` the axis.
const RAISED = {
  stock: { k: [27, 58.5], deg: -124 },
  spiky: { k: [27, 58], deg: -124 },
  broody: { k: [32.5, 54.5], deg: -134 },
  preener: { k: [25, 57], deg: -112 }
};

/** Sample a closed path of cubic segments (M x y C … Z) into points. */
const sampleCubics = (d) => {
  const n = d.match(/-?[\d.]+/g).map(Number);
  const pts = [];
  let p0 = [n[0], n[1]];
  for (let i = 2; i + 5 < n.length; i += 6) {
    const [c1, c2, p3] = [[n[i], n[i + 1]], [n[i + 2], n[i + 3]], [n[i + 4], n[i + 5]]];
    // Dense, so a bite's points land close enough together to draw its arc.
    for (let j = 0; j < 60; j += 1) {
      const t = j / 60;
      const m = 1 - t;
      pts.push([0, 1].map((a) => m * m * m * p0[a] + 3 * m * m * t * c1[a] + 3 * m * t * t * c2[a] + t * t * t * p3[a]));
    }
    p0 = p3;
  }
  return pts;
};

/** Points inside the circle (cx, cy, r) pushed out onto it: a round bite. */
const bite = (pts, cx, cy, r) =>
  pts.map(([x, y]) => {
    const d = Math.hypot(x - cx, y - cy);
    return d >= r ? [x, y] : [cx + ((x - cx) / (d || 1)) * r, cy + ((y - cy) / (d || 1)) * r];
  });

const raisedDrumstick = (ctx) => {
  const { k, deg } = RAISED[keyOf(ctx)];
  const L = 30;
  const t = frame(k, deg)([L, 0]);
  const p = drumstickParts({ k, t, r: 7.4, meat: 0.6, bone: 1.8 });
  // The bite: out of the meat's underside (-v), near its fat end, where it is
  // against the room on every body (its top edge runs along the tail).
  const [bx, by] = p.at([L - 5.5, -8.4]);
  const meatPts = bite(
    sampleCubics(p.meatD).map((q) => q.map(f)),
    bx,
    by,
    5
  );
  const meatD = poly(meatPts);
  const q = { ...p, meatD };
  // White is the plain roast: no sauce, so the whole ember meat and its bite
  // read (a team glaze over the same-colour tail behind it made the meat look
  // half its size; an ink char cap merged into the outline). Team and gold
  // glaze the top third.
  const sauce = ctx.style === "white" ? "" : sauceOnMeat(ctx, q, 0.34);
  return (
    outlined([
      { d: p.boneD, fill: WHITE },
      ...p.lobes.map((d) => ({ d, fill: WHITE })),
      { d: meatD, fill: EMBER }
    ]) + sauce
  );
};

// -------------------------------------------------------------- egg nest --

const eggsIn = (ctx, eggs) => outlined(eggs.map(([x, y, w, h, tilt]) => ({ d: eggPath(x, y, w, h, tilt), fill: ctx.styleFill })), 4.4);

/** The thin ink pad under the feet: reads as a ground shadow, keeps the legs clear. */
const PAD = `M -2 70 C 8 67.5 72 67.5 82 70 C 80 74.5 0 74.5 -2 70 Z`;

// The clutch: no bowl at all, just a heap of eggs behind the feet on a thin
// ink pad: three at the back, two at the front, overlapping, so the read is
// "eggs" from the TV.
const clutch = (ctx) => {
  const back = [
    [4, 64.5, 9, 11.5, -16],
    [14.5, 63, 10, 12.8, -4],
    [9, 68, 8.5, 9.5, 8]
  ];
  const front = [
    [67, 63.5, 10, 12.8, 6],
    [76, 66, 8.5, 10.5, 16]
  ];
  return `<path d="${PAD}" fill="${INK}" ${ctx.inkStroke(2)}/>` + eggsIn(ctx, back) + eggsIn(ctx, front);
};

// The nest (polish round 2, replaces the cut straw nest, whose ink bowl
// vanished into the dark floor and left two piles of straight crossed planks
// either side of the legs: a woodpile, or crossbones). Now there is ONE nest,
// beside her at the tail end, and it reads by one light shape: a thick straw
// (mutedWarm) wall, dished on top and round underneath, with three eggs of
// three sizes standing well up out of it, each with its own outline so they
// overlap as a clutch (never a same-size pair peeking over a wall, which read
// as eyes). Straw ends curl out of the wall's two ends: tapered, curved, light,
// sharing the wall's one ink outline, so nothing reads as a plank or a bone.
// No separate bowl or brim under the wall: a rim band over a smaller bowl
// read as a saucer (blurred, a flying saucer with egg domes), and ink spikes
// under it as its landing legs.
// It stops at x 20, short of the far foot (so straw never sits behind the
// orange legs) and as far back as the stage's side limit allows, because the
// stage paints behind the body and the broody's low belly hides anything
// right of x ~16 above y 61. Under the feet is the clutch's thin ink pad.
const NEST_WALL = "M -6.8 65 C -1 67.6 14 67.6 19.8 65 C 21 70 15 73.8 6.5 73.8 C -2 73.8 -8 70 -6.8 65 Z";

/**
 * A tapered strand: a quadratic curve from `a` (half-width w) through the
 * control point `c` to a point at `b`, as a filled outline.
 */
const strand = (a, c, b, w) => {
  const N = 12;
  const at = (t) => {
    const m = 1 - t;
    return [m * m * a[0] + 2 * m * t * c[0] + t * t * b[0], m * m * a[1] + 2 * m * t * c[1] + t * t * b[1]];
  };
  const left = [];
  const right = [];
  for (let i = 0; i <= N; i += 1) {
    const t = i / N;
    const [p, q] = [at(Math.max(0, t - 0.01)), at(Math.min(1, t + 0.01))];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const [nx, ny] = [-(q[1] - p[1]) / len, (q[0] - p[0]) / len];
    const hw = w * (1 - t);
    const o = at(t);
    left.push([o[0] + nx * hw, o[1] + ny * hw]);
    right.push([o[0] - nx * hw, o[1] - ny * hw]);
  }
  return poly([...left, ...right.reverse()]);
};

// Four straw ends, deliberately lopsided: one long curl up and out of the
// back corner, one short flick out low at the back, and two fanned out of
// the front end at their own angles. A matching pair at each end (round 2's
// first draft) made the nest a sack with four corners, or a cat's head. Each
// root sits inside the wall, so the wall's fill hides it.
const NEST_STRANDS = [
  [[-4.6, 66], [-8.2, 63.6], [-5.2, 57.4]],
  [[-3.4, 71.4], [-6, 72.4], [-7.2, 74.6]],
  [[17.4, 66], [21.6, 65.2], [25.6, 63.4]],
  [[16, 71], [19, 73], [20.6, 77]]
];

const strawNest = (ctx) => {
  // Back to front: the middle-sized egg, the small one, then the big one over
  // both, each outlined on its own.
  const eggs = [
    [-1.6, 64.4, 11, 13.5, -24],
    [14.2, 64.6, 10, 12.5, 14],
    [5.6, 63.2, 12.5, 15.5, -8]
  ];
  const straw = ctx.colors.mutedWarm;
  const strands = NEST_STRANDS.map(([a, c, b]) => strand(a, c, b, 1.9));
  return (
    `<path d="${PAD}" fill="${INK}" ${ctx.inkStroke(2)}/>` +
    eggs.map(([x, y, w, h, tilt]) => outlined([{ d: eggPath(x, y, w, h, tilt), fill: ctx.styleFill }], 4.4)).join("") +
    // The wall and its straw ends share one 1.6u ink outline.
    outlined([NEST_WALL, ...strands].map((d) => ({ d, fill: straw })), 3.2)
  );
};

// The big one (new in round 3, replaces the cut hatched shells): one giant
// egg behind the tail, with one ordinary egg at the front for scale. The read
// is the scale gag ("she laid THAT?"), where the clutch reads as many. Gold
// gives the giant egg the same glint and shade as the golden egg prop.
// Polish round 1: the giant was foot-sized and the small egg a 6.5u dot, so it
// read as an egg and a pebble. A stage's top edge may not rise above y 55, so
// the giant cannot stand taller than ~17u; it LEANS BACK on the pad instead,
// 27 long and 16.5 thick, its narrow end up and back at 30 degrees, filling
// the space behind the legs. The small egg is 9 wide.
const bigOne = (ctx) => {
  const giant = [7.5, 64.9, 16.5, 27, -60];
  const smalls = [[71, 65.3, 9, 11.5, 12]];
  const shine = ctx.style === "gold" ? goldShine(ctx, ...giant) : "";
  return (
    `<path d="${PAD}" fill="${INK}" ${ctx.inkStroke(2)}/>` +
    outlined([{ d: eggPath(...giant), fill: ctx.styleFill }], 4.4) +
    shine +
    eggsIn(ctx, smalls)
  );
};

// ------------------------------------------------------------------ items --

export const ITEMS = [
  {
    id: "wing-night-bib",
    slot: "top",
    name: "Wing-night bib",
    note: "The party's real uniform: a bib over the chest with one splat of sauce in the wearer's team colour, so it repaints per team and never brings in another team's colour. Round 3: the splat has five uneven rays, one tailed droplet thrown down and back and a drip ending in a bulb (round 2's three rays and two droplets made a little pointing glove).",
    variants: [
      {
        key: "a",
        note: "Lobster bib: a U-shaped ink panel from under the neck to the belly, following the chest edge, with a team-colour splatter thrown off-centre and one drip. Round 3: every sauce part has a 1.2u ember rim, so the splat sits ON the bib instead of reading as a hole through it to the same-colour body.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: lobsterBib
      },
      {
        key: "b",
        note: "Paper bib (new in round 2): the takeout bib, a white square tied on below the neck with straight sides and a square hem, so it reads as a light block where a reads dark. Round 3: a 2.6u outline, a 2.6u ink underlay under the splat, and one ink tie string off the top-back corner; on chrome (1.35:1 on white) the splat is solid ink (BBQ), elsewhere team colour.",
        styles: ["white"],
        whitePoints: 1,
        darkCentre: false,
        draw: paperBib
      }
    ]
  },
  {
    id: "team-sash",
    slot: "top",
    name: "Team sash",
    note: "A pageant sash across the chest. One flat band, no trim or lettering: at 76px it is a diagonal value stroke or nothing. Round 2: white is the default (with its outline it reads as a sash on all four, chrome included); ink stays as the second style.",
    variants: [
      {
        key: "a",
        note: "Near shoulder to back hip: an 8.4-unit band from the front shoulder (tucked under the neck) across the wing to the back hip. Round 3: steeper (shoulder end 3u back, hip end 3u down; the preener steeper still) and cut at y 36.5, which clears the light-near-head advisory; the wing scallops now sit under the band's outline.",
        styles: ["white", "ink"],
        whitePoints: 1,
        darkCentre: false,
        draw: pageantSash
      },
      {
        key: "b",
        note: "Knotted sash (run 1b, replaces the cut far-shoulder sash, which read as a prohibition sign). Polish round 2: a's whole shoulder-to-hip band with the knot tied ON it, because the full-length diagonal is what says sash (round 1 stopped the band at a knot ellipse with two forks splayed 60 degrees: a white glove, or in ink a crow). The knot is a rounded rectangle 7u along the band by 11u across (1.3x the band) half way down; in white it is one lump with the band under one 2.4u ink edge, in ink it has no ring, just two straight 1.6u team-colour lines across the band at its ends, a cinch. Two constant-width ribbon tails (5.2u, no flare) hang out of it almost straight down, 10 degrees back and 10 forward, each end with one 2.2u V notch; white tails keep their own ink edge, ink tails a 1.6u team rim. The knot sits at 50% (the critic's 60% left only 3u of tail above the belly) and every tip is at least 2u inside the belly; the preener's shallow chest gets an 85% knot at 45% and tails that show about 4u.",
        styles: ["white", "ink"],
        whitePoints: 1,
        darkCentre: false,
        draw: knottedSash
      }
    ]
  },
  {
    id: "golden-egg",
    slot: "prop",
    name: "Golden egg",
    note: "The golden egg. White with the house outline by default; gold is the trial style, with a curved glint and a shade crescent so it reads as metal, not mustard. Run 1b: with the relaxed prop sweep (§2.1) the egg can finally be held aloft, so a is the egg clutched low and b is the egg raised in a trophy.",
    variants: [
      {
        key: "a",
        note: "Clutched: a big egg (10.5 × 13.5) tucked under the wing's trailing edge, leaning back, its bottom poking below the belly. Gold adds a white streak along the upper-back edge and an ink crescent (22%) across the lower front.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: clutchedEgg
      },
      {
        key: "b",
        note: "The trophy (run 1b, replaces the cut egg basket): the egg held aloft. Polish round 2: hoisted. It stands only 15 degrees back of vertical (it was tipped back 40, so it read as poured), behind the tail at x ~8..26, away from the face. The ink plinth is gone (it read as a black brick by the legs): the foot is one light 11 x 3.5 step in the cup colour, gripped at the wing tip, then a 12u stem (9.5 on the broody, whose low round back would put a full-height cup more than 10u past her outline), a deep U bowl 16 wide and 8 deep with round bottom and straight-ish sides (a V read as an ice-cream cone, a shallow saucer as an egg cup) and a flat 18u lip with its own 2u ink edge. The egg shrinks to 10 x 12.5 so the cup is the bigger shape, its lower third behind the lip. No handles (solid lugs read as a dog bone). White: a white egg in a silver (mutedWarm) cup; gold: a gold egg in a gold cup, with the glint and shade.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: trophyEgg
      }
    ]
  },
  {
    id: "drumstick",
    slot: "prop",
    name: "Drumstick",
    note: "Wing-night food. The meat is always ember (the house cooked colour) with a white bone; the style paints only the sauce: team = wing sauce in the wearer's colour, ink = BBQ char, gold = honey glaze, white = none. Round 2: the mic grip was cut, so a is the mic drop, re-lettered from b. Run 1b: the relaxed sweep (§2.1) lets b hold one up and back, like a toast.",
    variants: [
      {
        key: "a",
        note: "Mic drop (was b in round 1): knuckle in the wing tip, ember meat hanging between the legs (r 4.8, so both legs show), glazed in the style with a wavy cap and one drip. Round 3: on the broody the knuckle is at the wing grip (31,51) and the meat hangs down to y 71.6, half below the body against the hearth; ink char is two blotches on the meat's rim, not stripes.",
        styles: ["team", "ink", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: micDrop
      },
      {
        key: "b",
        note: "Raised and bitten (run 1b, replaces the cut wing bucket): the drumstick held up like a mic or a toast, knuckle at the wing tip, a fat meat (r 7.4, 28 long) standing up and back over the tail with one big round bite out of its underside. White is the plain roast (white bone, all-ember meat, no sauce), the strongest read; team and gold glaze its top third. No ink: a char cap merged into the outline, and char blotches beside a bite would make a face.",
        styles: ["white", "team", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: raisedDrumstick
      }
    ]
  },
  {
    id: "egg-nest",
    slot: "stage",
    name: "Egg nest",
    note: "Eggs at the feet. Under the feet the stage is a thin ink pad, a ground shadow the orange legs cross cleanly; straw (mutedWarm, a house token) only goes out at the sides. The style paints the eggs: white, or a gold clutch. Round 2: both bowls were cut, so a is the clutch, re-lettered from c.",
    variants: [
      {
        key: "a",
        note: "The clutch (was c in round 1, kept): no bowl, a heap of eggs (three at the back, two at the front) on a thin ink pad, so the read from the TV is simply eggs.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: clutch
      },
      {
        key: "b",
        note: "The nest (polish round 2, replaces the cut straw nest, whose dark bowl vanished into the floor and left two piles of crossed planks: a woodpile, or crossbones). ONE nest beside her at the tail end (x -7.5..26), reading by one light shape: a thick straw (mutedWarm) wall, dished on top and round underneath, with three eggs of three sizes (12.5 x 15.5, 11 x 13.5, 10 x 12.5) standing well up out of it, each outlined on its own so they overlap as a clutch, never a same-size pair over a wall. Four tapered, curved straw ends share the wall's ink outline, deliberately lopsided (a long curl up off the back corner, a short flick low at the back, two fanned out of the front end): a matching pair at each end made a sack, or a cat's head, and a rim over a smaller bowl made a flying saucer. It stops short of the far foot, so no straw sits behind the orange legs; under the feet is the thin ink pad.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: strawNest
      },
      {
        key: "c",
        note: "The big one (new in round 3, replaces the cut hatched shells): one giant egg behind the legs, with one ordinary egg at the front for scale. A scale gag, where a reads as many eggs. Run 1b: the second small front egg is gone (the pair read as eyes in the dark). Polish round 1: the giant egg was foot-sized and the small one a 6.5u dot (an egg and a pebble); a stage may not rise above y 55, so instead of standing taller the giant leans back on the pad, 27 long and 16.5 thick with its narrow end up, about three times the small egg, which is now 9 wide.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: bigOne
      }
    ]
  }
];
