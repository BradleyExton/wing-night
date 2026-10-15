// country · show: the Prop and Stage items of the country rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Where a broody prop can live. The sweep (wing −62/−26/+75/+95° about (47,35))
// leaves one pocket: below y ≈ 49 (hurt lifts anything higher into the hair),
// right of a diagonal from (15,50) to (38,72) (flap swings anything further
// back through the floor) and left of x ≈ 55 unless it is low (flap lifts a
// point at x 57 into the head box unless it sits below y ≈ 58). That pocket is
// the lower body and the strip under the belly between the feet. Nothing can
// trail out past the tail, so a broody prop reads by being a big shape over the
// belly and by poking out under it, where the feet are.
//
// Team on country is 1.00:1 against the orange body: a team-coloured prop is
// only its ink outline there. Light props are white (or gold, on trial) on an
// ink casing; team stays an alternative only where the outline alone reads.
//
// Critic round 1 (2026-10-14): lasso a coiled, lasso b slack drop, corn kernel
// grid, guitar long neck, bale offset back. Cut and redrawn: lasso c (noose),
// corn b (pair), guitar b (reversed), hay b (stack), sawdust a (barrel) and
// b (round pen). Sawdust c (ranch rail) was the keep and is unchanged.
//
// Critic round 2 (2026-10-14): cut lasso a (ink coil scribble) and b (floor
// ring), corn b (two remotes) and guitar b (one-legged bird). New: lasso a
// (the roper's lariat: two hand coils and a running loop), corn b (the cob
// held up like a mic) and guitar b (dragged by the neck). Fixed: lasso c
// (white rope, end trails up under the wing), corn a (tapered cob in a husk
// V), guitar a (no team style, bigger lower bout, neck skewers the body), hay
// a (a 3/4 block) and b (stack moved out behind the tail), sawdust a (a
// wooden barrel with staves). Sawdust b (cactus) and c (ranch rail) were
// keeps and are unchanged.

import { COLORS } from "../outfit-harness.js";

export const GENRES = ["country"];

const INK = COLORS.ink;
const WHITE = COLORS.white;
const STRAW = COLORS.mutedWarm;

const f = (n) => (Math.round(n * 100) / 100).toString();
const pt = (p) => `${f(p.x)} ${f(p.y)}`;
const add = (p, v, k = 1) => ({ x: p.x + v.x * k, y: p.y + v.y * k });
const unit = (a, b) => {
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
};


/** A rope: solid ink for the ink style, an ink-cased tube of the style colour otherwise. */
const rope = (d, style, styleFill, w = 2.8) =>
  style === "ink"
    ? `<path fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`
    : `<path fill="none" stroke="${INK}" stroke-width="${w + 2}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>
       <path fill="none" stroke="${styleFill}" stroke-width="${w - 0.4}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;

/** The honda: the knot a lariat's loop runs through, a solid ink lozenge. */
const honda = (c, along, len = 4.6, w = 3.6) => {
  const n = { x: -along.y, y: along.x };
  const a = add(c, along, len / 2);
  const b = add(c, along, -len / 2);
  return `<path fill="${INK}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round" d="M ${pt(a)} L ${pt(add(c, n, w / 2))} L ${pt(b)} L ${pt(add(c, n, -w / 2))} Z"/>`;
};

/**
 * A tapered corn cob from the base p0 to the very end of its tip p1: w0 wide
 * at the base, swelling to wMax at t = 0.3, then narrowing to a rounded tip
 * wTip across. A cob's silhouette, never a tube (a parallel white tube with a
 * grid on it is a TV remote at 76px). The kernels are a light ink grid: two
 * lengthwise lines that follow the taper and two across, at t 0.4 and 0.7.
 */
const cobFrame = (p0, p1, { w0, wMax, wTip }) => {
  const u = unit(p0, p1);
  const n = { x: -u.y, y: u.x };
  const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const r1 = wTip / 2;
  const ts = (len - r1) / len; // where the round cap starts
  const width = (t) => {
    if (t <= 0.3) return w0 + (wMax - w0) * Math.sin(((t / 0.3) * Math.PI) / 2);
    const k = (t - 0.3) / (ts - 0.3);
    return wMax - (wMax - wTip) * Math.pow(k, 1.25);
  };
  const half = (t) => {
    if (t <= ts) return width(t) / 2;
    const d = (t - ts) * len;
    return Math.sqrt(Math.max(r1 * r1 - d * d, 0));
  };
  const at = (t, o) => add(add(p0, u, t * len), n, o);
  return { u, n, len, r1, ts, width, half, at };
};

const cob = (p0, p1, dims, fill) => {
  const { u, n, len, r1, ts, width, half, at } = cobFrame(p0, p1, dims);
  const N = 18;
  const side = (s) => Array.from({ length: N + 1 }, (_, i) => at((ts * i) / N, (s * width((ts * i) / N)) / 2));
  const left = side(1);
  const right = side(-1).reverse();
  const shoulder = add(p0, u, ts * len);
  const outline = `M ${left.map(pt).join(" L ")} A ${f(r1)} ${f(r1)} 0 0 0 ${pt(add(shoulder, n, -r1))} L ${right.map(pt).join(" L ")}
    C ${pt(add(right[right.length - 1], u, -1.6))} ${pt(add(left[0], u, -1.6))} ${pt(left[0])} Z`;
  const lines = [];
  [1, -1].forEach((s) => {
    const pts = [];
    for (let i = 0; i <= 12; i += 1) {
      const t = 0.05 + ((ts + 0.02 - 0.05) * i) / 12;
      pts.push(at(t, s * 0.36 * half(t)));
    }
    lines.push(`M ${pts.map(pt).join(" L ")}`);
  });
  const across = [0.4, 0.7].map((t) => `M ${pt(at(t, half(t) - 0.3))} L ${pt(at(t, -(half(t) - 0.3)))}`);
  return `<path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${outline}"/>
    <path fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" d="${lines.join(" ")}"/>
    <path fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" d="${across.join(" ")}"/>`;
};

/** A pointed leaf from base b to tip t, about w wide at its belly; bend > 0 curves it to its left. */
const leaf = (b, t, w, bend = 0) => {
  const m = { x: (b.x + t.x) / 2, y: (b.y + t.y) / 2 };
  const len = Math.hypot(t.x - b.x, t.y - b.y);
  const n = { x: -(t.y - b.y) / len, y: (t.x - b.x) / len };
  const side = (s) => add(m, n, s * w + bend);
  return `M ${pt(b)} Q ${pt(side(1))} ${pt(t)} Q ${pt(side(-1))} ${pt(b)} Z`;
};
/**
 * A husk leaf hugging one side (s = 1 left of the axis, −1 right) of a cob from
 * its base to `reach` along it: its inner edge lies over the cob's edge and its
 * outer edge flares `flare` units out, ending in a point that curls away. The
 * corn icon is a light cob between two dark husk leaves.
 */
const hugLeaf = (frame, s, reach = 0.58, flare = 2.6, overlap = 2.4) => {
  const { at, half } = frame;
  const b0 = at(0.02, s * half(0.02) * 0.2);
  const tip = at(reach, s * (half(reach) + flare * 0.9));
  const outer = at(reach * 0.45, s * (half(reach * 0.45) + flare * 1.3));
  const inner = at(reach * 0.55, s * (half(reach * 0.55) - overlap));
  return `M ${pt(b0)} Q ${pt(outer)} ${pt(tip)} Q ${pt(inner)} ${pt(b0)} Z`;
};
const husk = (d) => `<path fill="${INK}" stroke="${INK}" stroke-width="1" stroke-linejoin="round" d="${d}"/>`;

/**
 * A figure-eight guitar body: lower bout (lx,ly,lr), upper bout (ux,uy,ur),
 * the waist `waist`×r either side of the line between them. Cased in ink
 * first (4 wide, so 2 shows outside), then filled without a stroke, so the
 * waist reads as one shape with no seam. No sound hole and no bridge: any
 * mark inside the body is an eye or a mouth at 76px.
 */
const guitarBody = ({ lx, ly, lr, ux, uy, ur, waist = 0.55 }, fill) => {
  const u = unit({ x: ux, y: uy }, { x: lx, y: ly });
  const n = { x: -u.y, y: u.x };
  const U = { x: ux, y: uy };
  const L = { x: lx, y: ly };
  const poly = `M ${pt(add(U, n, ur * waist))} L ${pt(add(L, n, lr * waist))} L ${pt(add(L, n, -lr * waist))} L ${pt(add(U, n, -ur * waist))} Z`;
  const shapes = (attrs) =>
    `<circle ${attrs} cx="${f(lx)}" cy="${f(ly)}" r="${f(lr)}"/><circle ${attrs} cx="${f(ux)}" cy="${f(uy)}" r="${f(ur)}"/><path ${attrs} d="${poly}"/>`;
  return `<g>${shapes(`fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"`)}${shapes(`fill="${fill}"`)}</g>`;
};

/** A neck from `from` to `end`, a slab headstock carrying on past it, and a tuning peg nub either side. */
const neckAndHead = (from, end, { headLen = 5, headW = 4.8, neckW = 3.2, peg = 1.2 } = {}) => {
  const u = unit(from, end);
  const n = { x: -u.y, y: u.x };
  const a = add(end, n, headW / 2);
  const b = add(end, n, -headW / 2);
  const a2 = add(add(a, u, headLen), n, 0.4);
  const b2 = add(add(b, u, headLen), n, -0.4);
  const mid = add(end, u, headLen * 0.55);
  const pegs = [1, -1]
    .map((s) => {
      const p = add(mid, n, s * (headW / 2 + 0.2 + peg / 2));
      return `<circle fill="${INK}" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(peg)}"/>`;
    })
    .join("");
  return `<path fill="none" stroke="${INK}" stroke-width="${neckW}" stroke-linecap="round" d="M ${pt(from)} L ${pt(add(end, u, 0.5))}"/>
    <path fill="${INK}" stroke="${INK}" stroke-width="1" stroke-linejoin="round" d="M ${pt(a)} L ${pt(a2)} L ${pt(b2)} L ${pt(b)} Z"/>${pegs}`;
};

// ------------------------------------------------------------------ props --

const LASSO_STYLES = ["white", "team"];

const lasso = {
  id: "lasso",
  slot: "prop",
  name: "Lasso",
  note: "A lariat: rope loops at least 14 units across, so it reads as rope and never as an eye, and a solid honda knot. White rope cased in ink by default (2.91:1 on the orange); team rope is the outline only on country. Held low, because a broody prop cannot trail past the tail without swinging through the floor on flap.",
  variants: [
    {
      key: "a",
      note: "The roper's lariat: two big coils (15×17, 4.5 apart) pinched in the wing tip and hanging as teardrops, and the running loop, an 18×13 teardrop fed from the hand, swung forward over the belly. Coils in the hand and a loop out front is how every roper stands; two cased white coils, not three ink ones, so they stay rope.",
      styles: LASSO_STYLES,
      whitePoints: 1,
      darkCentre: false,
      draw: ({ style, styleFill }) => {
        // Each coil is pinched at the hand and hangs as a teardrop: held coils, not rings.
        const coil = (top, cx, bottom, hw) =>
          `M ${pt(top)} C ${f(top.x - hw * 1.1)} ${f(top.y + 5)} ${f(cx - hw)} ${f(bottom)} ${f(cx)} ${f(bottom)} C ${f(cx + hw)} ${f(bottom)} ${f(top.x + hw * 1.1)} ${f(top.y + 5)} ${pt(top)} Z`;
        const coils = [coil({ x: 32, y: 52 }, 31.8, 68.8, 7.5), coil({ x: 33.6, y: 52.4 }, 36.3, 69.6, 7.5)]
          .map((d) => rope(d, style, styleFill, 2.2))
          .join("");
        const loop = "M 37.2 55.6 C 41 51.4 53.6 52.4 54.6 58 C 55.4 62.8 49 66.6 43.4 64.6 C 39.6 63.2 37.6 59.8 37.2 55.6";
        const feed = "M 33.2 52.4 C 34.6 53 36 54 37.2 55.6";
        return `${coils}${rope(feed, style, styleFill, 2.2)}${rope(loop, style, styleFill, 2.4)}
          ${honda({ x: 32.8, y: 52.2 }, unit({ x: 30.6, y: 50 }, { x: 35, y: 54.4 }), 4.4, 3.6)}`;
      }
    },
    {
      key: "c",
      note: "The noose: one big 21×16 teardrop loop hung forward over the belly from a honda at the hand, its point at the knot and its belly swinging down to the feet, the rope's free end trailing up and back under the wing tip. The point at the knot is what makes it a lasso; a round loop is a ring.",
      styles: LASSO_STYLES,
      whitePoints: 1,
      darkCentre: false,
      draw: ({ style, styleFill }) => {
        const loop = "M 34.2 54.6 C 33.4 62.6 38.4 70.2 45 70.2 C 51.6 70.2 56 64.2 54.6 59.6 C 53 54.8 42 53.2 35.6 54.2";
        const end = "M 33 54 C 29.6 55.2 26.4 54.8 24.6 52.6";
        const spoke = "M 31.4 50.8 L 33.4 53.6";
        return `${rope(end, style, styleFill, 2.4)}${rope(loop, style, styleFill, 2.8)}${rope(spoke, style, styleFill, 2.4)}
          ${honda({ x: 33.6, y: 53.8 }, unit({ x: 31, y: 50.6 }, { x: 36, y: 57 }), 5.2, 4)}`;
      }
    }
  ]
};

const CORN_STYLES = ["white", "gold"];

const cornCob = {
  id: "corn-cob",
  slot: "prop",
  name: "Corn cob",
  note: "A tapered cob, light against the orange on its ink outline, with a light kernel grid, framed by ink husk leaves peeling back from its base: the peeled husk round a tapered cob is the corn icon. White by default; gold is the yellow corn, on trial.",
  variants: [
    {
      key: "a",
      note: "The club: one cob gripped by the husk and swung down across the thigh, its rounded tip poking out under the belly. Three ink leaves peel back from the base, one up and back under the wing, one down and back, one along the cob's back, so the cob sits in a dark V.",
      styles: CORN_STYLES,
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const grip = { x: 32.4, y: 53.4 };
        const p0 = { x: 33.4, y: 54 };
        const p1 = { x: 44.6, y: 69.4 };
        const dims = { w0: 9, wMax: 11, wTip: 4.5 };
        const frame = cobFrame(p0, p1, dims);
        const peeled = [leaf(grip, { x: 21.8, y: 49.4 }, 5.4, 0.6), leaf(grip, { x: 23.6, y: 60.4 }, 5.4, -0.4)];
        return `${peeled.map(husk).join("")}
          ${cob(p0, p1, dims, styleFill)}
          ${husk(hugLeaf(frame, 1, 0.56, 2.4, 2))}${husk(hugLeaf(frame, -1, 0.5, 2.2, 2))}`;
      }
    },
    {
      key: "b",
      note: "The mic: the cob held upright in front of the belly like a microphone, tapered tip up, the husk flared open at the bottom in three ink leaves. A crooner's pose; one upright cob on its husk is corn on the stalk, not a stick.",
      styles: CORN_STYLES,
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const base = { x: 42.4, y: 65.8 };
        const tip = { x: 45.2, y: 49.2 };
        const dims = { w0: 7.6, wMax: 9.6, wTip: 4.4 };
        const frame = cobFrame(base, tip, dims);
        const stalk = leaf({ x: 41.4, y: 64.6 }, { x: 41.8, y: 70.8 }, 4, 0);
        return `${husk(stalk)}
          ${cob(base, tip, dims, styleFill)}
          ${husk(hugLeaf(frame, 1, 0.54, 3.2, 1.3))}${husk(hugLeaf(frame, -1, 0.54, 3.2, 1.3))}`;
      }
    }
  ]
};

const acousticGuitar = {
  id: "acoustic-guitar",
  slot: "prop",
  name: "Acoustic guitar",
  note: "A figure-eight body with a deep waist, a neck and a slab headstock with a peg nub either side. No sound hole and no bridge: any light mark inside a dark body (or dark inside a light one) is an eye or a mouth at 76px. The waist and the neck are the read. White and gold are the cased figure-eight (no hole, so no dark centre) for wearing over ink clothes. No team style: on country it is 1.00:1, an outline only.",
  variants: [
    {
      key: "a",
      note: "The strummer: slung across the belly, body forward and low, the neck running back under the wing to a headstock at the bird's back edge, and running 2 units into the upper bout so a light body is skewered by it, never floating. The pose every honky-tonk poster has.",
      styles: ["ink", "white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const body = { lx: 46.4, ly: 61.4, lr: 7, ux: 39.4, uy: 58.2, ur: 4.4, waist: 0.42 };
        return `${guitarBody(body, styleFill)}
          ${neckAndHead({ x: 37, y: 58 }, { x: 21.6, y: 54.6 })}`;
      }
    },
    {
      key: "b",
      note: "Dragged by the neck: the headstock gripped at the wing tip, the neck running down and forward, and the body trailing low between the feet with its lower bout near the floor. A guitar hauled to the gig, held the one way that keeps it off the head on hurt.",
      styles: ["ink", "white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const body = { lx: 45.2, ly: 65, lr: 5.8, ux: 39.8, uy: 60.4, ur: 4.2, waist: 0.45 };
        return `${neckAndHead({ x: 39, y: 59.6 }, { x: 31.4, y: 53.2 }, { headLen: 4.2, headW: 4.4 })}
          ${guitarBody(body, styleFill)}`;
      }
    }
  ]
};

// ----------------------------------------------------------------- stages --

/**
 * A bale: a rounded block with a ragged cut end on the left (and the right if
 * asked), 2-spike straw tufts sticking up from the top edge at `tufts`, and ink
 * twine bands at `bands`. The tufts are outline, not texture.
 */
const bale = ({ x0, x1, top, bottom, raggedLeft = 2.6, raggedRight = 0, tufts = [], bands = [] }, fill) => {
  const h = bottom - top;
  const tuft = (x) => `L ${f(x)} ${f(top)} L ${f(x + 1.2)} ${f(top - 2.4)} L ${f(x + 2.4)} ${f(top)} L ${f(x + 3.6)} ${f(top - 2.4)} L ${f(x + 4.8)} ${f(top)}`;
  const rightEnd = raggedRight
    ? [0.2, 0.4, 0.6, 0.8].map((t, i) => `L ${f(x1 + (i % 2 === 0 ? raggedRight : 0))} ${f(top + h * t)}`).join(" ")
    : "";
  const leftEnd = [0.8, 0.6, 0.4, 0.2].map((t, i) => `L ${f(x0 - (i % 2 === 0 ? raggedLeft : 0))} ${f(top + h * t)}`).join(" ");
  const d = `M ${f(x0 + 2)} ${f(top)} ${tufts.map(tuft).join(" ")} L ${f(x1 - 2)} ${f(top)} Q ${f(x1)} ${f(top)} ${f(x1)} ${f(top + 2)} ${rightEnd}
    L ${f(x1)} ${f(bottom - 2)} Q ${f(x1)} ${f(bottom)} ${f(x1 - 2)} ${f(bottom)} L ${f(x0 + 2)} ${f(bottom)} Q ${f(x0)} ${f(bottom)} ${f(x0)} ${f(bottom - 2)}
    ${leftEnd} L ${f(x0)} ${f(top + 2)} Q ${f(x0)} ${f(top)} ${f(x0 + 2)} ${f(top)} Z`;
  const twine = bands.map((x) => `M ${f(x)} ${f(top + 0.8)} L ${f(x)} ${f(bottom - 0.8)}`).join(" ");
  // Cut-straw hatching just inside the ragged end: mutedWarm alone is concrete.
  const hatch = [0.3, 0.55, 0.8]
    .map((t, i) => `M ${f(x0 + 1.2 + (i % 2) * 0.8)} ${f(top + h * t)} L ${f(x0 + 3.6 + (i % 2) * 0.8)} ${f(top + h * t - 0.7)}`)
    .join(" ");
  return `<path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${d}"/>
    <path fill="none" stroke="${INK}" stroke-width="2.4" d="${twine}"/>
    <path fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" d="${hatch}"/>`;
};

/**
 * A bale in 3/4: a front face (x0..x1, top..bottom) with a ragged left end, a
 * top face receding up and to the right by (dx, dy), the right end face behind
 * it, ink twine bands wrapping over the top and down the front at `bands`,
 * straw ticks splayed off the top-left edge and cut-straw hatching on the
 * ragged end.
 */
const bale3q = ({ x0, x1, top, bottom, dx, dy, bands }, fill) => {
  const h = bottom - top;
  // The ragged cut end, walked from the top corner down to the bottom one.
  const rag = [0.85, 0.68, 0.5, 0.32, 0.15].map((t, i) => `L ${f(x0 + (i % 2 === 0 ? -1.2 : 0.7))} ${f(bottom - h * t)}`).join(" ");
  const front = `M ${f(x0)} ${f(bottom)} L ${f(x1)} ${f(bottom)} L ${f(x1)} ${f(top)} L ${f(x0)} ${f(top)} ${rag} Z`;
  const topFace = `M ${f(x0)} ${f(top)} L ${f(x1)} ${f(top)} L ${f(x1 + dx)} ${f(top - dy)} L ${f(x0 + dx)} ${f(top - dy)} Z`;
  const endFace = `M ${f(x1)} ${f(top)} L ${f(x1 + dx)} ${f(top - dy)} L ${f(x1 + dx)} ${f(bottom - dy)} L ${f(x1)} ${f(bottom)} Z`;
  const twine = bands.map((x) => `M ${f(x + dx)} ${f(top - dy + 0.4)} L ${f(x)} ${f(top)} L ${f(x)} ${f(bottom - 0.6)}`).join(" ");
  // Straw ticks splayed off the back-left corner and along the top's back edge.
  const ticks = [
    [x0 + dx * 0.35, top - dy * 0.35, -1.3, -0.4],
    [x0 + dx * 0.8, top - dy * 0.8, -1.2, -1],
    [x0 + dx + 2.4, top - dy, -0.7, -1.7],
    [x0 + dx + 5.4, top - dy, 0.4, -1.8],
    [x0 + dx + 8.4, top - dy, -0.6, -1.7]
  ]
    .map(([x, y, ddx, ddy]) => `M ${f(x)} ${f(y)} L ${f(x + ddx)} ${f(y + ddy)}`)
    .join(" ");
  const hatch = [0.22, 0.42, 0.62, 0.82]
    .map((t, i) => {
      const y = bottom - h * t;
      const x = x0 + 1.2 + (i % 2) * 0.8;
      return `M ${f(x)} ${f(y)} L ${f(x + 2.6)} ${f(y - 0.7)}`;
    })
    .join(" ");
  return `<path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${endFace}"/>
    <path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${topFace}"/>
    <path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${front}"/>
    <path fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" d="${twine}"/>
    <path fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" d="${ticks} ${hatch}"/>`;
};

const strawOf = (style, styleFill) => (style === "gold" ? styleFill : STRAW);

const hayBale = {
  id: "hay-bale",
  slot: "stage",
  name: "Hay bale",
  note: "Straw (mutedWarm) with ink twine and ink straw marks, BEHIND the bird and sat on the ground further back, so its base is level with the feet and the bird keeps its own floor line. mutedWarm alone reads as grey concrete; the straw ticks and hatching are what make it hay. Gold recolours the straw, on trial.",
  variants: [
    {
      key: "a",
      note: "The bale behind, in 3/4: one short square bale lying behind the tail with its top face and twine bands showing, straw ticks off its top-left edge and a ragged, hatched cut end. Its right end runs behind the feet, so the left third reads as a bale and the rest grounds the bird.",
      styles: ["ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ style, styleFill }) =>
        bale3q({ x0: -6.6, x1: 20, top: 60, bottom: 71, dx: 3, dy: 3.2, bands: [-1, 9] }, strawOf(style, styleFill))
    },
    {
      key: "b",
      note: "The stack: two short bales stacked fully behind the tail, out from under the body, the top one set back, so the hen stands in front of a barn stack on bare floor. Each has a ragged cut end and one twine band; the top bale's straw tufts stand clear below the tail feathers.",
      styles: ["ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ style, styleFill }) => {
        const fill = strawOf(style, styleFill);
        return `${bale({ x0: -6, x1: 13, top: 64, bottom: 71, raggedLeft: 2, bands: [-1.5] }, fill)}
          ${bale({ x0: -4, x1: 9, top: 57.6, bottom: 64, raggedLeft: 2, tufts: [-2.6, 2, 6.2], bands: [1.5] }, fill)}`;
      }
    }
  ]
};

const DISC = (styleFill) => `<ellipse fill="${STRAW}" stroke="${styleFill}" stroke-width="2.4" cx="39" cy="71.6" rx="33" ry="5.2"/>`;
const cased = (d, w, cap = "square") =>
  `<path fill="none" stroke="${INK}" stroke-width="${w + 2}" stroke-linecap="${cap}" stroke-linejoin="round" d="${d}"/><path fill="none" stroke="${WHITE}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="round" d="${d}"/>`;

const sawdustRing = {
  id: "sawdust-ring",
  slot: "stage",
  name: "Sawdust ring",
  note: "The rodeo arena floor: a sawdust (mutedWarm) disc under the feet, never an annulus (a light ring round a dark middle is an eye, even on the floor). A plain disc is a plate; the arena read comes from what stands on it, so every variant adds one rodeo object on ink casing, far from the head.",
  variants: [
    {
      key: "a",
      note: "Barrel racing: the arena disc with one wooden barrel standing on it in front of the breast, bulged, with two ink hoops, two curved staves and its lid showing. It is team orange: it stands on the dark floor off the bird, so it contrasts there, and a bulged wooden barrel with staves is a barrel at any size where a white drum was a paint tin.",
      styles: ["ink", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const barrel = "M 72.6 57.4 Q 69.2 64.4 72.6 71.6 L 83.4 71.6 Q 86.8 64.4 83.4 57.4 Z";
        const hoops = "M 71.4 61.6 Q 78 63 84.6 61.6 M 71.4 67.4 Q 78 68.8 84.6 67.4";
        const staves = "M 75.4 58.6 Q 73.8 64.7 75.4 70.8 M 80.6 58.6 Q 82.2 64.7 80.6 70.8";
        return `${DISC(styleFill)}
          <path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${barrel}"/>
          <path fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" d="${staves}"/>
          <path fill="none" stroke="${INK}" stroke-width="2" d="${hoops}"/>
          <ellipse fill="${fill}" stroke="${INK}" stroke-width="1.8" cx="78" cy="57.4" rx="5.4" ry="1.6"/>`;
      }
    },
    {
      key: "b",
      note: "The desert: the sawdust disc with one white saguaro standing on its far edge in front of the breast, two arms up. The trident silhouette is the West at any size; it stands on the floor band, so it never reaches the head.",
      styles: ["ink", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const cactus = "M 79 71 L 79 57.4 M 79 66.4 L 74.6 66.4 L 74.6 60.4 M 79 63.4 L 83.6 63.4 L 83.6 58.6";
        return `${DISC(styleFill)}
          <path fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round" d="${cactus}"/>
          <path fill="none" stroke="${WHITE}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" d="${cactus}"/>`;
      }
    },
    {
      key: "c",
      note: "The ranch rail: the arena disc with a white post-and-rail fence standing behind it, showing either side of the bird. White lives here on its ink casing against the dark floor, far from the head.",
      styles: ["ink", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const posts = [3, 21, 39, 57, 75].map((x) => `M ${x} 57.6 L ${x} 68`).join(" ");
        const rails = "M 2 60.4 L 76 60.4 M 2 65 L 76 65";
        return `${cased(posts, 2.6)}${cased(rails, 2.2)}
          ${DISC(styleFill)}`;
      }
    }
  ]
};

export const ITEMS = [lasso, cornCob, acousticGuitar, hayBale, sawdustRing];
