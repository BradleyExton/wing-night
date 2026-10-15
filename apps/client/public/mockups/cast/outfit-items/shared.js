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
// Shared items have to work on all four bodies, so every placement is read off
// the silhouette (stock/pop, spiky/metal, broody/country, preener/disco):
//
// - Tops are drawn generously and clipped to ctx.bodyPath, so the item always
//   follows that genre's chest edge; the body's ink outline is then restroked
//   over the item (clipped to the item) so the clip never eats the edge.
//   The neck is painted after the Top, so a Top's upper edge tucks under it.
// - Props live in the one band the sweep allows: y >= ~49, x >= ~14 and under
//   the bounce line y <= ~53 + x/2 (bottom-left trimmed), and never higher
//   than ~49 right of x 30 (hurt swings that into the head box). That band is
//   the lower body and the gap under the belly, so a prop makes its read
//   below the belly against the hearth, where light reads and ink does not.
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
const band = (a, b, hw) => poly(bandPts(a, b, hw));

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

// Over the FAR shoulder: the opposite diagonal, from high on the back (where
// it comes over the far shoulder, off the body's back edge) down across the
// wing to the front of the belly. Its long lower run is on the open chest and
// belly, clear of the wing outline, where white reads largest.
const FAR = {
  stock: { from: [16, 28], to: [64, 63] },
  spiky: { from: [17, 30], to: [63, 60] },
  broody: { from: [14, 31], to: [68, 66] },
  preener: { from: [24, 27], to: [62, 56] }
};

const farShoulderSash = (ctx) => {
  const c = FAR[keyOf(ctx)];
  const s = ctx.head.shoulders;
  return sashMarkup(ctx, poly(belowY(bandPts(c.from, c.to, 4.4), s)));
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

// The egg basket: a little straw basket hung on the wing tip at the back hip,
// one egg sitting up out of it. Round 3: the weave hatching (mush at 76px) is
// gone; the basket is a solid mutedWarm tub (10 x 6) with the house outline
// and one ink rim band, and an arched ink handle is what says "basket". The egg
// is bigger (6.5 x 8.5) and sits high, its top 6.3u over the rim, behind the
// handle. It stays left of the near leg so both legs stay clear, and nothing
// rises above y 49.5 (higher swings into the head box on hurt).
const BASKET = {
  stock: { x0: 19, x1: 30, rim: 57.5, base: 63.5, eggX: 22.6 },
  spiky: { x0: 19, x1: 30, rim: 57.5, base: 63.5, eggX: 22.6 },
  broody: { x0: 19.5, x1: 30.5, rim: 57, base: 63, eggX: 23.1 },
  preener: { x0: 19, x1: 30, rim: 57, base: 63, eggX: 22.6 }
};

const eggBasket = (ctx) => {
  const b = BASKET[keyOf(ctx)];
  const taper = 1.2;
  const r = 1.6;
  const basketD =
    `M ${f(b.x0)} ${f(b.rim)} L ${f(b.x1)} ${f(b.rim)} L ${f(b.x1 - taper)} ${f(b.base - r)} ` +
    `Q ${f(b.x1 - taper - 0.2)} ${f(b.base)} ${f(b.x1 - taper - r)} ${f(b.base)} L ${f(b.x0 + taper + r)} ${f(b.base)} ` +
    `Q ${f(b.x0 + taper + 0.2)} ${f(b.base)} ${f(b.x0 + taper)} ${f(b.base - r)} Z`;
  const [ew, eh] = [6.5, 8.5];
  const eggCy = b.rim - 6.3 + eh / 2;
  const eggD = eggPath(b.eggX, eggCy, ew, eh, -8);
  // Handle: rim end to rim end, a round arch whose apex is ~7.9u over the
  // rim (y ~49.6), in front of the egg, which sits in the back half so the
  // arch's front leg shows clear against the body.
  const handle = `M ${f(b.x0 + 0.9)} ${f(b.rim)} C ${f(b.x0 + 0.9)} ${f(b.rim - 10.5)} ${f(b.x1 - 0.9)} ${f(b.rim - 10.5)} ${f(b.x1 - 0.9)} ${f(b.rim)}`;
  const band = `M ${f(b.x0 + 0.3)} ${f(b.rim + 1.3)} L ${f(b.x1 - 0.35)} ${f(b.rim + 1.3)}`;
  const shine = ctx.style === "gold" ? goldShine(ctx, b.eggX, eggCy, ew, eh, -8) : "";
  return (
    outlined([{ d: eggD, fill: ctx.styleFill }], 3.6) +
    shine +
    // An ink-only handle vanished into the wing's own scalloped outline, so
    // it is a straw band (1.8u mutedWarm) inside a 3.4u ink edge.
    `<path d="${handle}" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="${handle}" fill="none" stroke="${ctx.colors.mutedWarm}" stroke-width="1.8" stroke-linecap="round"/>` +
    outlined([{ d: basketD, fill: ctx.colors.mutedWarm }]) +
    `<path d="${band}" fill="none" stroke="${INK}" stroke-width="1.5"/>`
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

const sauceOnMeat = (ctx, p) => {
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
  const uc = L - len * 0.45;
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
  broody: { k: [31, 51], t: [39.6, 71.6], glazeEnd: 72.4 },
  preener: { k: [27.5, 52.5], t: [38.5, 69] }
};

const micDrop = (ctx) => {
  const { k, t, glazeEnd = 71.6 } = DROP[keyOf(ctx)];
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

// The wing bucket: the night's order, a striped bucket hung at the back hip
// with drumsticks heaped out of the top (ember meat, one white bone up). The
// bucket is white with the house outline; the style paints its stripes, so
// the default team stripes make it that team's bucket. It sits left of the
// near leg, and nothing rises above y 49.5 (hurt swings that into the head).
const BUCKET = {
  stock: { x0: 18.5, x1: 30.5, rim: 57.5, base: 64 },
  spiky: { x0: 18.5, x1: 30.5, rim: 57.5, base: 64 },
  broody: { x0: 19, x1: 31, rim: 57, base: 63.5 },
  preener: { x0: 18.5, x1: 30, rim: 57, base: 63.5 }
};

const wingBucket = (ctx) => {
  const b = BUCKET[keyOf(ctx)];
  const taper = 1.8;
  const w = b.x1 - b.x0;
  const bucketD = poly([
    [b.x0, b.rim],
    [b.x1, b.rim],
    [b.x1 - taper, b.base],
    [b.x0 + taper, b.base]
  ]);
  // Two stripes, each following the bucket's taper.
  const stripe = (t0, t1) => {
    const top = (t) => b.x0 + w * t;
    const bot = (t) => b.x0 + taper + (w - 2 * taper) * t;
    return poly([
      [top(t0), b.rim],
      [top(t1), b.rim],
      [bot(t1), b.base],
      [bot(t0), b.base]
    ]);
  };
  // The heap: three low lumps of meat over the rim and two bones standing
  // up out of it in a V (the bones are what say chicken, not popcorn). The
  // knuckles stop at y 49.6: anything higher swings into the head on hurt.
  const lumps = [
    [b.x0 + w * 0.2, b.rim - 0.9, 2.5],
    [b.x0 + w * 0.5, b.rim - 1.5, 2.7],
    [b.x0 + w * 0.8, b.rim - 0.9, 2.4]
  ].map(([x, y, r]) => circlePath(x, y, r));
  const bones = [
    { from: [b.x0 + w * 0.36, b.rim - 1.5], to: [b.x0 + w * 0.12, 51.6] },
    { from: [b.x0 + w * 0.62, b.rim - 1.5], to: [b.x0 + w * 0.86, 51.4] }
  ].flatMap(({ from, to }) => {
    const deg = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
    const at = frame(to, deg);
    return [band(from, to, 0.85), ...[at([0.3, -1.05]), at([0.3, 1.05])].map((c) => circlePath(c[0], c[1], 1.15))];
  });
  const clipB = ctx.clip(bucketD);
  const stripeFill = ctx.styleFill;
  return (
    outlined([
      ...lumps.map((d) => ({ d, fill: EMBER })),
      ...bones.map((d) => ({ d, fill: WHITE })),
      { d: bucketD, fill: WHITE }
    ]) +
    `<defs>${clipB.def}</defs><g clip-path="${clipB.url}">` +
    `<path d="${stripe(0.2, 0.4)}" fill="${stripeFill}"/><path d="${stripe(0.6, 0.8)}" fill="${stripeFill}"/>` +
    `</g><path d="${bucketD}" fill="none" ${ctx.inkStroke(1.4)}/>`
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

/**
 * A low straw mound from x0 to x1: a smooth top arc peaking at `top`, a flat
 * base at `base`, ends rounded. No teeth along the top (round 2's zigzag cut
 * across the white eggs and read as snow-capped peaks, or teeth).
 */
const strawMound = (x0, x1, top, base) => {
  const mid = (x0 + x1) / 2;
  const endY = top + (base - top) * 0.55;
  return (
    `M ${f(x0)} ${f(endY)} C ${f(x0 + 2)} ${f(top)} ${f(mid - 6)} ${f(top)} ${f(mid)} ${f(top)} ` +
    `C ${f(mid + 6)} ${f(top)} ${f(x1 - 2)} ${f(top)} ${f(x1)} ${f(endY)} ` +
    `C ${f(x1 + 1)} ${f(base - 0.6)} ${f(x1 - 1)} ${f(base)} ${f(x1 - 3)} ${f(base)} L ${f(x0 + 3)} ${f(base)} ` +
    `C ${f(x0 + 1)} ${f(base)} ${f(x0 - 1)} ${f(base - 0.6)} ${f(x0)} ${f(endY)} Z`
  );
};

/** Short ink straws (1u, 3u long) poking out past a mound's ends and base. */
const strawPokes = (x0, x1, top, base) => {
  const endY = top + (base - top) * 0.55;
  const stick = (x, y, deg) => {
    const dx = 3 * Math.cos(rad(deg));
    const dy = 3 * Math.sin(rad(deg));
    return `M ${f(x - dx * 0.35)} ${f(y - dy * 0.35)} L ${f(x + dx * 0.65)} ${f(y + dy * 0.65)}`;
  };
  const d = [
    stick(x0 + 0.2, endY - 0.6, 180 + 28), // out of the back end, up and out
    stick(x0 + 0.4, endY + 1.6, 180 - 22), // out of the back end, down and out
    stick(x1 - 0.2, endY - 0.6, -28), // out of the front end, up and out
    stick(x1 - 0.4, endY + 1.6, 22), // out of the front end, down and out
    stick(x0 + (x1 - x0) * 0.3, base, 90 + 35), // under the base, down and back
    stick(x0 + (x1 - x0) * 0.72, base, 90 - 35) // under the base, down and forward
  ].join(" ");
  return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>`;
};

// The straw nest: the clutch sat down on straw. A low smooth mutedWarm mound
// either side of the bird (never under the feet: the ink pad stays alone
// there), the eggs whole in FRONT of it with full outlines, so no egg is cut
// by any line; the straw shows round their bottoms and out at the ends, and a
// few ink straws poke past the mound's ends and base.
const strawNest = (ctx) => {
  const back = [
    [3, 62.4, 8.5, 10.8, -14],
    [12.5, 61.4, 9.5, 11.6, -3],
    [18.6, 65.4, 6.6, 8, 12]
  ];
  const front = [
    [66, 61.6, 9.5, 11.6, 5],
    [75.5, 63.6, 8, 10, 16]
  ];
  const straw = ctx.colors.mutedWarm;
  const [top, base] = [65.5, 73.5];
  const mound = (x0, x1) => strawPokes(x0, x1, top, base) + `<path d="${strawMound(x0, x1, top, base)}" fill="${straw}" ${ctx.inkStroke(2)}/>`;
  return `<path d="${PAD}" fill="${INK}" ${ctx.inkStroke(2)}/>` + mound(-5.5, 24) + mound(58.5, 85.5) + eggsIn(ctx, back) + eggsIn(ctx, front);
};

// The big one (new in round 3, replaces the cut hatched shells): one giant
// egg, as tall as the legs, stood on the ink pad behind the tail, with one
// ordinary egg at the front for scale. The read is the scale gag ("she laid
// THAT?"), where the clutch reads as many. Gold gives the giant egg the same
// glint and shade as the golden egg prop.
const bigOne = (ctx) => {
  const giant = [3.5, 64.7, 15, 18.8, -5];
  const smalls = [
    [69, 68.2, 5.8, 7.2, 10],
    [76.5, 69.2, 5, 6.2, 22]
  ];
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
        note: "Far shoulder (new in round 2, replaces the cut chest band): the opposite diagonal, from high on the back down across the wing to the front of the belly, so its long lower run lies on the open chest and belly, clear of the wing outline.",
        styles: ["white", "ink"],
        whitePoints: 1,
        darkCentre: false,
        draw: farShoulderSash
      }
    ]
  },
  {
    id: "golden-egg",
    slot: "prop",
    name: "Golden egg",
    note: "An egg held low (never aloft: up is the face). White with the house outline by default; gold is the trial style, and now carries a curved glint and a shade crescent so it reads as metal, not mustard. Back and down only, inside the sweep band.",
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
        note: "Egg basket (new in round 2): a little basket hung on the wing tip at the back hip, one egg sitting up out of it. Round 3: a solid mutedWarm tub (11 x 6) with an ink rim band, an arched straw handle (apex ~y 49.6) in front of a bigger egg (6.5 x 8.5, 6.3u over the rim). Left of the near leg, so both legs stay clear.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: eggBasket
      }
    ]
  },
  {
    id: "drumstick",
    slot: "prop",
    name: "Drumstick",
    note: "Wing-night food, held low. The meat is always ember (the house cooked colour) with a white bone; the style paints only the sauce: team = wing sauce in the wearer's colour, ink = BBQ char stripes, gold = honey glaze. Round 2: the mic grip was cut (the sweep keeps every prop off the beak), so a is the mic drop, re-lettered from b.",
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
        note: "Wing bucket (new in round 2): a white bucket hung at the back hip, stripes in the style, drumsticks heaped out of the top (ember meat, one white bone up). The order, not the bite.",
        styles: ["team", "ink"],
        whitePoints: 1,
        darkCentre: false,
        draw: wingBucket
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
        note: "Straw nest (new in round 2): the clutch sat on straw either side of the bird; the ink pad stays alone under the feet. Round 3: the eggs are whole ovals in front of a smooth low mutedWarm mound (no zigzag), the straw showing under and round them, with six short ink straws poking past the mound's ends and base.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: strawNest
      },
      {
        key: "c",
        note: "The big one (new in round 3, replaces the cut hatched shells): one giant egg, as tall as the legs, stood on the ink pad behind the tail, with one ordinary egg at the front for scale. A scale gag, where a reads as many eggs.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: bigOne
      }
    ]
  }
];
