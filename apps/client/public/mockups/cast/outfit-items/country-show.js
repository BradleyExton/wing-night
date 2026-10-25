// country · show: the Prop and Stage items of the country rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Where a broody prop can live (run 1b sweep, §2.1). A prop is drawn only in
// the parade, the intro lineup and the portal, so it is held to the head box
// and the floor at rest (0°) and the walk tuck (−8°) only; at the dance
// extremes and the Moves it may pass behind the head and dip 4 under the
// floor. That opens the space ABOVE AND BEHIND THE TAIL (x −4..34, y 22..36,
// within the 10-unit reach of the tail tips and the back) and keeps the old
// pocket under the belly. Nothing may rise above y 32 right of x 34, and
// nothing points forward at the face.
//
// The hearth behind the bird is dark: an ink part that leaves the bird
// vanishes there. Every ink rope, neck or headstock that leaves the body is
// cased in mutedWarm (a 1-unit light rim), so it reads on the orange AND on
// the hearth. Team on country is 1.00:1 against the orange: no team props.
// Gold is 1.30:1 on the orange (GAPS): dropped from every country prop.
//
// Critic rounds 1–3 (2026-10-14) are in verdicts.js. Run 1b (2026-10-15):
// lasso a cut (tangle) and replaced by lasso b, the loop swung up behind the
// tail; lasso c fixed (ink rope on a mutedWarm casing, longer frayed end).
// Corn a fixed (scalloped cob, dry mutedWarm husks); corn b cut (lantern) and
// replaced by corn c, the cob held aloft like a trophy. Guitar a fixed
// (bigger bouts, neck below the wing outline); guitar b redrawn as the
// troubadour, slung behind with its neck rising over the tail. Hay a and b
// fixed (straw streaks, shaggy spiked outline, bigger). Sawdust c (knee-high
// fence) cut and replaced by the dropped Stetson.
//
// Polish round 1 (2026-10-15): lasso c moved off the legs to a teardrop noose
// lying back along the rear body from the wing tip. Hung under the tail, as
// the critic drew it, the flap swings it 8 under the floor, so it stays within
// about 41 units of the wing pivot. Corn cobs are ember (yellow) with white
// husks and lengthwise rows only. Guitar a is white only, tilted into playing
// position. Hay is ember straw with mutedWarm strands and shade; the stage
// region (y ≥ 55) caps a bale at 16 units tall, so bale a turns to show its
// left end and top face, the only parts not hidden behind the bird.
//
// Polish round 2 (2026-10-15): lasso c (the noose on the hip, a key fob) cut
// and replaced by the wind-up, a teardrop loop held up behind the back; lasso
// b loses its frayed end (an extra claw by the leg). Corn a (under the belly)
// cut and replaced by the harvest pair, two cobs in a V behind the back; corn
// c's kernels become knobs on the outline, its rows go, and its husk droops
// down off the grip. Hay a runs long behind the feet to a ragged end in front
// of the breast; hay b (the stack, books) cut and replaced by one chunky bale
// in front of the breast. No strands on any bale.
//
// Gate 1 (2026-10-20): hay a cut. Corn a and c get a gently lumpy cob with a
// blunt bullet tip, two lengthwise kernel rows and two hugging white husk
// leaves (the drooping husk goes); both lean back so the leaves stay left of
// x 34 above the chin. Guitar b is white only (the ink body was a frying pan),
// so no guitar has an ink style. Hay b is a soft straw block: rounded corners,
// a bowed top, long leaning wisps, splayed tufts, thicker twine.

import { COLORS } from "../outfit-harness.js";

export const GENRES = ["country"];

const INK = COLORS.ink;
const WHITE = COLORS.white;
const STRAW = COLORS.mutedWarm;
const EMBER = COLORS.ember;

const f = (n) => (Math.round(n * 100) / 100).toString();
const pt = (p) => `${f(p.x)} ${f(p.y)}`;
const add = (p, v, k = 1) => ({ x: p.x + v.x * k, y: p.y + v.y * k });
const unit = (a, b) => {
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
};
const normal = (u) => ({ x: -u.y, y: u.x });

/**
 * A rope. Ink style: an ink core on a mutedWarm casing 1 unit wider each side,
 * so it shows on the dark hearth as well as on the orange. White style: a
 * white core in an ink casing.
 */
const rope = (d, style, w = 2.8) =>
  style === "ink"
    ? `<path fill="none" stroke="${STRAW}" stroke-width="${w + 2}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>
       <path fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`
    : `<path fill="none" stroke="${INK}" stroke-width="${w + 2}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>
       <path fill="none" stroke="${WHITE}" stroke-width="${w - 0.4}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;

/** The honda: the knot a lariat's loop runs through, a solid ink lozenge (rimmed light on ink rope). */
const honda = (c, along, style, len = 4.6, w = 3.6) => {
  const n = normal(along);
  const a = add(c, along, len / 2);
  const b = add(c, along, -len / 2);
  const d = `M ${pt(a)} L ${pt(add(c, n, w / 2))} L ${pt(b)} L ${pt(add(c, n, -w / 2))} Z`;
  const rim = style === "ink" ? STRAW : INK;
  return `<path fill="${INK}" stroke="${rim}" stroke-width="1.2" stroke-linejoin="round" d="${d}"/>`;
};

/**
 * A teardrop loop of rope from its point at `knot` to its round end `far`,
 * `across` units at its widest: pointed at the knot and longer than it is
 * wide, so it is a noose and never a ring (or, in white, an eye).
 */
const teardrop = (knot, far, across, n = 48) => {
  const u = unit(knot, far);
  const nn = normal(u);
  const L = Math.hypot(far.x - knot.x, far.y - knot.y);
  // sin(t)·|sin(t/2)| peaks at about 0.77, so scale the half-width to land on `across`.
  const half = across / 2 / 0.7698;
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    return add(add(knot, u, (L * (1 - Math.cos(t))) / 2), nn, half * Math.sin(t) * Math.abs(Math.sin(t / 2)));
  });
};

/** An ellipse as a closed path: centre c, radii rx/ry, turned `rot` degrees (+ = clockwise). */
const ellipsePoints = (c, rx, ry, rot, n = 48) => {
  const a = (rot * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    return { x: c.x + x * Math.cos(a) - y * Math.sin(a), y: c.y + x * Math.sin(a) + y * Math.cos(a) };
  });
};

// ------------------------------------------------------------------- corn --

/**
 * A tapered corn cob from the base p0 to the very end of its tip p1: w0 wide
 * at the base, swelling to wMax at t = 0.3, then narrowing to a rounded tip
 * wTip across.
 */
const cobFrame = (p0, p1, { w0, wMax, wTip }) => {
  const u = unit(p0, p1);
  const n = normal(u);
  const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const r1 = wTip / 2;
  const ts = (len - r1) / len; // where the round cap starts
  const width = (t) => {
    if (t <= 0.3) return w0 + (wMax - w0) * Math.sin(((t / 0.3) * Math.PI) / 2);
    const k = (t - 0.3) / (ts - 0.3);
    return wMax - (wMax - wTip) * Math.pow(k, 1.25);
  };
  const at = (t, o) => add(add(p0, u, t * len), n, o);
  return { u, n, len, r1, ts, width, at };
};

/**
 * The cob: its two long edges are a gentle lumpy wave (kernel bumps 0.9 high
 * every 3.4 units, Gate 1: 2.2 every 4.4 was a saw edge, a wheat sheaf or a
 * flame) ending in a blunt bullet tip, with two lengthwise ink kernel rows
 * (stroke 2) at ±width/5 from t 0.2 to 0.85, following the taper. Lengthwise
 * only: cross lines on a tapered oval are the pineapple grenade. Filled
 * ember, the yellow of corn; a white cob was a pinecone or a cone.
 */
const cob = (p0, p1, dims, fill) => {
  const { u, n, len, r1, ts, width, at } = cobFrame(p0, p1, dims);
  // Full-size bumps on the fat of the cob, easing to about half at the tip.
  const knob = (t) => Math.min(1, Math.max(0.55, width(t) / (0.75 * dims.wMax)));
  const bump = (d) => 0.9 * knob(d / len) * Math.abs(Math.sin((Math.PI * d) / 3.4));
  const side = (s) => {
    const pts = [];
    for (let d = 0; d <= ts * len + 1e-6; d += 0.25) {
      const t = d / len;
      pts.push(at(t, s * (width(t) / 2 - 0.8 + bump(d))));
    }
    return pts;
  };
  const left = side(1);
  const right = side(-1).reverse();
  const shoulder = add(p0, u, ts * len);
  const capR = r1 - 0.8 + bump(ts * len);
  const outline = `M ${left.map(pt).join(" L ")} A ${f(capR)} ${f(capR)} 0 0 0 ${pt(add(shoulder, n, -capR))} L ${right.map(pt).join(" L ")}
    C ${pt(add(right[right.length - 1], u, -1.6))} ${pt(add(left[0], u, -1.6))} ${pt(left[0])} Z`;
  const row = (s) => {
    const pts = [];
    for (let t = 0.2; t <= 0.85 + 1e-6; t += 0.05) pts.push(at(t, (s * width(t)) / 5));
    return `M ${pts.map(pt).join(" L ")}`;
  };
  return `<path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${outline}"/>
    <path fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="${row(1)} ${row(-1)}"/>`;
};

/**
 * A husk leaf hugging one side (s = 1 left of the axis, −1 right) of a cob
 * from its base to `reach` along it, its outer edge flaring `flare` out.
 */
const hugLeaf = (frame, s, reach = 0.58, flare = 2.6, overlap = 2.4) => {
  const { at, width } = frame;
  const half = (t) => width(t) / 2;
  const b0 = at(0.02, s * half(0.02) * 0.2);
  const tip = at(reach, s * (half(reach) + flare * 0.9));
  const outer = at(reach * 0.45, s * (half(reach * 0.45) + flare * 1.3));
  const inner = at(reach * 0.55, s * (half(reach * 0.55) - overlap));
  return `M ${pt(b0)} Q ${pt(outer)} ${pt(tip)} Q ${pt(inner)} ${pt(b0)} Z`;
};
/**
 * A husk sheath (run 5, corn a): two white leaves wrapping the whole width of
 * the cob from its base to `reach`, meeting on a seam down its middle that
 * splits at `split` so the cob's top shows in the V between their tips, each
 * tip peeling `flare` out past the cob's edge. A solid white cup rather than
 * two slivers: the slivers read as white puffs at 76px once the cob sank into
 * an orange team. Copied by the cast's countryShow `huskSheathPaths`.
 */
const sheathLeaf = (frame, s, { reach, split, flare }) => {
  const { at, width } = frame;
  const half = (t) => width(t) / 2;
  const seamBase = at(0, -s * 0.6);
  const outerBase = at(0, s * (half(0) + 0.6));
  const outer = at(reach * 0.5, s * (half(reach * 0.5) + flare * 0.9));
  const tip = at(reach, s * (half(reach) + flare));
  const inner = at((split + reach) / 2, s * half((split + reach) / 2) * 0.35);
  const seamTop = at(split, -s * 0.6);
  return `M ${pt(seamBase)} L ${pt(outerBase)} Q ${pt(outer)} ${pt(tip)} Q ${pt(inner)} ${pt(seamTop)} Z`;
};
/** Fresh husk: white with a 2-unit ink outline. White husk round a yellow lumpy cob is the corn icon; a dark leaf was the grenade's lever. */
const husk = (d) => `<path fill="${WHITE}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${d}"/>`;
/** The two white husk leaves hugging a cob's sides, tips up and out: the corn emoji's outline. */
const huskPair = (frame, reach, flare, overlap) =>
  husk(hugLeaf(frame, 1, reach, flare, overlap)) + husk(hugLeaf(frame, -1, reach, flare, overlap));
// ----------------------------------------------------------------- guitar --

/**
 * A figure-eight guitar body: lower bout (lx,ly,lr), upper bout (ux,uy,ur),
 * the waist `waist`×r either side of the line between them. Cased in ink
 * first (4 wide, so 2 shows outside), then filled without a stroke, so the
 * waist reads as one shape with no seam. No sound hole and no bridge: any
 * mark inside the body is an eye or a mouth at 76px.
 */
const guitarBody = ({ lx, ly, lr, ux, uy, ur, waist = 0.55 }, fill) => {
  const u = unit({ x: ux, y: uy }, { x: lx, y: ly });
  const n = normal(u);
  const U = { x: ux, y: uy };
  const L = { x: lx, y: ly };
  const poly = `M ${pt(add(U, n, ur * waist))} L ${pt(add(L, n, lr * waist))} L ${pt(add(L, n, -lr * waist))} L ${pt(add(U, n, -ur * waist))} Z`;
  const shapes = (attrs) =>
    `<circle ${attrs} cx="${f(lx)}" cy="${f(ly)}" r="${f(lr)}"/><circle ${attrs} cx="${f(ux)}" cy="${f(uy)}" r="${f(ur)}"/><path ${attrs} d="${poly}"/>`;
  return `<g>${shapes(`fill="${INK}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"`)}${shapes(`fill="${fill}"`)}</g>`;
};

/**
 * A neck from `from` to `end`, a slab headstock carrying on past it and a
 * tuning peg nub either side: a white neck and headstock in an ink casing, so
 * the part that leaves the bird shows on the orange and on the hearth.
 */
const neckAndHead = (from, end, { headLen = 6, headW = 5.6, neckW = 4, peg = 1.4 } = {}) => {
  const u = unit(from, end);
  const n = normal(u);
  const a = add(end, n, headW / 2);
  const b = add(end, n, -headW / 2);
  const a2 = add(add(a, u, headLen), n, 0.5);
  const b2 = add(add(b, u, headLen), n, -0.5);
  const mid = add(end, u, headLen * 0.55);
  const pegPts = [1, -1].map((s) => add(mid, n, s * (headW / 2 + 0.3 + peg / 2)));
  const neckD = `M ${pt(from)} L ${pt(add(end, u, 0.5))}`;
  const headD = `M ${pt(a)} L ${pt(a2)} L ${pt(b2)} L ${pt(b)} Z`;
  const pegs = (fill, r) => pegPts.map((p) => `<circle fill="${fill}" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r)}"/>`).join("");
  return `${pegs(INK, peg + 1)}
    <path fill="none" stroke="${INK}" stroke-width="${neckW + 2}" stroke-linecap="round" d="${neckD}"/>
    <path fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round" d="${headD}"/>
    <path fill="none" stroke="${WHITE}" stroke-width="${neckW}" stroke-linecap="round" d="${neckD}"/>
    <path fill="${WHITE}" stroke="${WHITE}" stroke-width="1" stroke-linejoin="round" d="${headD}"/>
    ${pegs(INK, peg)}`;
};

// ------------------------------------------------------------------ props --

/** Where the wind-up's loop ends: up and back over the tail. */
const WINDUP_FAR = { x: 4.6, y: 34 };

const lasso = {
  id: "lasso",
  slot: "prop",
  name: "Lasso",
  note: "A lariat: a rope loop at least 14 units across, so it reads as rope and never as an eye, and a solid honda knot. Ink rope by default on a 1-unit mutedWarm casing, so the rope shows on the orange and on the dark hearth alike; white rope in an ink casing is the alternative (2.91:1 on the orange, on its outline). No team style: on country it is 1.00:1.",
  variants: [
    {
      key: "b",
      note: "The twirl: the loop swung up and spinning behind the tail, a flat 28×12 ellipse tipped toward the room, fed from the wing tip by the spoke and its honda, with the slack hanging from the hand. The cowboy-with-a-spinning-loop icon, turned to hang behind the bird; it rides the wing, so the lasso-twirl Move spins it overhead.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ style }) => {
        const pts = ellipsePoints({ x: 14.6, y: 34.1 }, 15, 5.4, 5);
        const loop = `M ${pts.map(pt).join(" L ")} Z`;
        const hand = { x: 30, y: 46.5 };
        const knot = { x: 28.8, y: 36.4 };
        const spoke = `M ${pt(hand)} C 29.6 42.4 28.8 38.6 ${pt(knot)}`;
        const slack = "M 30 46.5 C 26.6 49.2 22.8 50.8 21.4 54.6";
        return `${rope(slack, style, 2.4)}
          ${rope(loop, style, 2.6)}${rope(spoke, style, 2.4)}
          ${honda(knot, unit({ x: 29, y: 39.6 }, knot), style, 5, 3.8)}`;
      }
    },
    {
      key: "c",
      note: "The wind-up: the loop shaken out and held up behind the back before the swing, a long teardrop 14 across hanging from the honda at the wing tip, its point at the knot and its round end out over the tail, with the slack dropping from the hand. Upright and drooping where the twirl is a flat spinning disc: the moment before the throw.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ style }) => {
        const hand = { x: 30, y: 46.5 };
        const knot = { x: 28.8, y: 40.2 };
        const loop = `M ${teardrop(knot, WINDUP_FAR, 14).map(pt).join(" L ")} Z`;
        const spoke = `M ${pt(hand)} L ${pt(knot)}`;
        const slack = "M 30 46.5 C 27 50.5 23.6 52 21 56.6";
        return `${rope(slack, style, 2.4)}${rope(loop, style, 2.6)}${rope(spoke, style, 2.4)}
          ${honda(knot, unit(hand, knot), style, 5, 3.8)}`;
      }
    }
  ]
};

const cornCob = {
  id: "corn-cob",
  slot: "prop",
  name: "Corn cob",
  note: "A tapered ember (yellow) cob ending in a blunt bullet, its long edges a gentle lumpy wave, two lengthwise ink kernel rows down it, and two white husk leaves hugging its sides with their tips up and out: the corn emoji, a yellow striped bullet between two white leaves. Lengthwise rows only (cross lines are the grenade); a white cob read as a pinecone or a cone. The default style is named white for the husk; the cob is always ember. No gold: it is 1.30:1 on country's orange (Gate 1).",
  variants: [
    {
      key: "a",
      note: "The harvest pair: two gold cobs, 9 to 12 across with blunt 8.5-unit tips, raised in a V behind the back from one grip at the wing tip, each in a white husk sheath that wraps its lower part and peels into two pointed tips. Gate 1 blunted the saw edge, added the kernel rows and swapped the drooping husk for the hugging leaves; run 5 (2026-10-24) found the ember cobs sank into the country orange at 76px, leaving four white slivers that read as puffs, so the cob went gold (outlined in ink; it reads on the hearth) and the slivers became a sheath. The upright cob leans back to (21.8,23) and the back cob drops to (7.8,36), so the right-hand leaf stays left of x 34 above the chin line and the V stays about 46 degrees open.",
      styles: ["white"],
      whitePoints: 1,
      darkCentre: false,
      draw: () => {
        const dims = { w0: 9, wMax: 12, wTip: 8.5 };
        const sheath = { reach: 0.62, split: 0.25, flare: 1.8 };
        const ear = (p0, p1) => {
          const frame = cobFrame(p0, p1, dims);
          return `${cob(p0, p1, dims, COLORS.gold)}${husk(sheathLeaf(frame, 1, sheath))}${husk(sheathLeaf(frame, -1, sheath))}`;
        };
        return `${ear({ x: 29, y: 46 }, { x: 7.8, y: 36 })}${ear({ x: 29.6, y: 46 }, { x: 21.8, y: 23 })}`;
      }
    },
    {
      key: "c",
      note: "The trophy: one fat yellow cob (13.5 across, a 9-unit blunt bullet tip) hoisted up behind the back like a prize, with two lengthwise kernel rows and two big white husk leaves flaring out either side of its lower half. Gate 1 dropped the drooping husk and the flame tip; the cob leans back to (19.4,23.6) so the leaves stay left of x 34 above the chin line.",
      styles: ["white"],
      whitePoints: 1,
      darkCentre: false,
      draw: () => {
        const p0 = { x: 29, y: 46 };
        const p1 = { x: 19.4, y: 23.6 };
        const dims = { w0: 9.4, wMax: 13.5, wTip: 9 };
        return `${cob(p0, p1, dims, EMBER)}${huskPair(cobFrame(p0, p1, dims), 0.6, 4.2, 1.8)}`;
      }
    }
  ]
};

const acousticGuitar = {
  id: "acoustic-guitar",
  slot: "prop",
  name: "Acoustic guitar",
  note: "A figure-eight body with a deep waist, a neck and a slab headstock with a peg nub either side. No sound hole and no bridge: any mark inside the body is an eye or a mouth at 76px. The waist and the neck are the read. White only, in its ink casing (2.91:1 on the orange, on its outline): an ink body was a frying pan. The neck and headstock carry the ink casing where they leave the bird, so they show on the hearth. No team (1.00:1) and no gold (1.30:1) on country.",
  variants: [
    {
      key: "a",
      note: "The strummer: in playing position across the belly, a big body forward and low and the neck rising up and back over the thigh to a pegged headstock at the bird's back edge. The rising diagonal neck is what makes it a guitar (a level neck read as a bone or a frying pan). White only: an ink body here lands on the wing's lower outline and the waist vanishes.",
      styles: ["white"],
      whitePoints: 0,
      darkCentre: false,
      draw: () => {
        const body = { lx: 50, ly: 60.5, lr: 8.5, ux: 41.6, uy: 56, ur: 5.6, waist: 0.5 };
        return `${neckAndHead({ x: 38.6, y: 54.4 }, { x: 24, y: 47 })}
          ${guitarBody(body, WHITE)}`;
      }
    },
    {
      key: "b",
      note: "The troubadour: slung across the back, the body on the rear of the bird under the wing and the long neck rising up and back over the tail to a headstock against the hearth. A guitar carried to the gig on the back; the rising neck is what says guitar. White only since Gate 1: the ink body was a black frying pan.",
      styles: ["white"],
      whitePoints: 0,
      darkCentre: false,
      draw: () => {
        const body = { lx: 32, ly: 56.6, lr: 8, ux: 24.6, uy: 47.8, ur: 5.6, waist: 0.48 };
        return `${neckAndHead({ x: 23, y: 45.4 }, { x: 14, y: 35 }, { headLen: 5.2, headW: 5.4 })}
          ${guitarBody(body, WHITE)}`;
      }
    }
  ]
};

// ----------------------------------------------------------------- stages --

/**
 * A cut end walked from (x, yFrom) to (x, yTo): `n` tufts of straw splayed
 * out `out` units (negative = to the left) at uneven lengths (0.75 to 1 of
 * it) and angles, so the end of the outline is shaggy at 76.
 */
const ragged = (x, yFrom, yTo, out, n = 4) => {
  const K = [0.8, 1, 0.75, 0.95];
  const T = [-0.8, 0.4, -0.3, 0.7];
  const step = (yTo - yFrom) / n;
  return Array.from({ length: n }, (_, i) => {
    const y = yFrom + step * (i + 0.5);
    return `L ${f(x + out * K[i % 4])} ${f(y + T[i % 4])} L ${f(x)} ${f(y + step / 2)}`;
  }).join(" ");
};

/**
 * A soft straw block seen side on: corners rounded `r`, the top edge bowed up
 * `bow` at its middle, long wisps of straw poking out of the top (each
 * { x, h, lean } — h units tall, leaning `lean` degrees, + = to the right),
 * tufted cut ends `out` long, and ink twine `twine` wide at `bands`. Nothing
 * on its face: strands read as concrete scratches.
 */
const bale = ({ x0, x1, top, bottom, r, bow, wisps, out, bands, twine }, fill) => {
  const mid = (x0 + x1) / 2;
  const half = (x1 - x0) / 2 - r;
  const topY = (x) => top - bow * (1 - ((x - mid) / half) ** 2);
  const edge = [];
  let x = x0 + r;
  for (const w of [...wisps].sort((p, q) => p.x - q.x)) {
    for (; x < w.x - 1.2; x += 1) edge.push(`L ${f(x)} ${f(topY(x))}`);
    const tip = { x: w.x + w.h * Math.tan((w.lean * Math.PI) / 180), y: topY(w.x) - w.h };
    edge.push(`L ${f(w.x - 1.2)} ${f(topY(w.x - 1.2))} L ${pt(tip)} L ${f(w.x + 1.2)} ${f(topY(w.x + 1.2))}`);
    x = w.x + 2.2;
  }
  for (; x < x1 - r; x += 1) edge.push(`L ${f(x)} ${f(topY(x))}`);
  const corner = (px, py) => `A ${f(r)} ${f(r)} 0 0 1 ${f(px)} ${f(py)}`;
  const d = `M ${f(x0)} ${f(top + r)} ${corner(x0 + r, top)} ${edge.join(" ")} L ${f(x1 - r)} ${f(top)} ${corner(x1, top + r)}
    ${ragged(x1, top + r, bottom - r, out)} L ${f(x1)} ${f(bottom - r)} ${corner(x1 - r, bottom)} L ${f(x0 + r)} ${f(bottom)} ${corner(x0, bottom - r)}
    ${ragged(x0, bottom - r, top + r, -out)} Z`;
  const ties = bands.map((bx) => `M ${f(bx)} ${f(topY(bx) + 0.6)} L ${f(bx)} ${f(bottom - 0.6)}`).join(" ");
  return `<path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${d}"/>
    <path fill="none" stroke="${INK}" stroke-width="${twine}" d="${ties}"/>`;
};

const hayBale = {
  id: "hay-bale",
  slot: "stage",
  name: "Hay bale",
  note: "Straw on the ground in front of the breast, its base level with the feet so the bird keeps its own floor line. Straw is ember (warm yellow): grey straw read as concrete, planks or a pallet. What makes it hay and not a crate or a block of cheese: rounded corners and a top bowed up 1 unit, long wisps of straw leaning out of the top, ragged tufted ends, and ink twine. Nothing on its face: strands read as concrete scratches. The default style is named ink for the twine and outline. No gold: it is 1.30:1 on country's orange (Gate 1).",
  variants: [
    {
      key: "b",
      note: "The bale in front: one soft straw block 25 by 12.6 standing on the floor in front of the breast, corners rounded 2.6 and its top bowed up 1: five wisps leaning out 30 to 42 degrees (two at each top corner, one mid-top, 2.8 to 3.8 tall so the tallest reach y 55), four tufts splayed 2.4 to 3 out at each end, and two 2.2-wide twine bands. Gate 1 traded the uniform spike row for the wisps; the bird paints over its left end.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: () =>
        bale(
          {
            x0: 60,
            x1: 85,
            top: 59,
            bottom: 71.6,
            r: 2.6,
            bow: 1,
            wisps: [
              { x: 63.4, h: 3.8, lean: -42 },
              { x: 66, h: 3.3, lean: -30 },
              { x: 72.5, h: 2.8, lean: 10 },
              { x: 78.4, h: 3.3, lean: 30 },
              { x: 81.6, h: 3.8, lean: 42 }
            ],
            out: 3,
            bands: [67, 80],
            twine: 2.2
          },
          EMBER
        )
    }
  ]
};

const DISC = (styleFill) => `<ellipse fill="${STRAW}" stroke="${styleFill}" stroke-width="2.4" cx="39" cy="71.6" rx="33" ry="5.2"/>`;

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
      note: "Thrown: the arena disc with a white Stetson lying where it landed, in front of the breast: a pinched crown, an ink hat band and a wide brim curled up at both ends. The cowboy hat is the most recognisable shape in the genre, and one on the arena floor says somebody just got bucked.",
      styles: ["ink", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        // Side on: a wide brim flicked up hard at both ends, a crown leaning in
        // to a dented top (one smooth dip: humps under a band read as teeth), one ink band.
        const brim = "M 64.2 60.8 C 65 66.4 69.4 70.6 76.4 70.6 C 83.4 70.6 87.6 66.6 88 60.8 C 86.4 64.4 82.4 66.4 76.4 66.4 C 70.4 66.4 66 64.4 64.2 60.8 Z";
        const crown = "M 70.2 66.2 C 69.6 62 70 58.4 71.8 56.2 C 74.6 57.8 78.4 57.8 81.2 56.2 C 83 58.4 83.4 62 82.8 66.2 C 78.6 67 74.4 67 70.2 66.2 Z";
        const band = "M 70 62.6 C 74.2 63.6 78.8 63.6 83 62.6";
        return `${DISC(styleFill)}
          <path fill="${WHITE}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${crown}"/>
          <path fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="butt" d="${band}"/>
          <path fill="${WHITE}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${brim}"/>`;
      }
    }
  ]
};

export const ITEMS = [lasso, cornCob, acousticGuitar, hayBale, sawdustRing];
