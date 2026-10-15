// metal · kit: the Top, Sleeve, Tail and Boots items of the metal rail
// (docs/research/bird-wardrobe.md §2.2), drawn on the spiky chrome bird.
//
// Chrome (#d9dee6) is the lightest team colour, so ink reads at 13.9:1 and
// white vanishes at 1.35:1 on the body. Two consequences run through every
// drawing here:
//  - on the body, an item lives on its ink (a dark block on a light bird);
//  - OFF the body, against the dark TV, ink vanishes too. Anything that
//    changes the outline out in the air (tail, flames) is drawn in a light
//    colour with an ink edge: chrome for steel, ember for fire.
// On the spiky bird the wing covers most of the body: a Top only shows in a
// strip about 13 units wide (x 50..63, y 38..58), so every Top here puts ONE
// big shape in that strip and nothing thin.
// The contract is at the top of ../outfit-harness.js.
//
// Round 2 (after critic 1): cut every face read (fangs, teeth, eye-pair toe
// caps, ring-and-hole chain links) and every duplicate; the cut slots hold
// new, different solutions under the same keys.
// Round 3 (after critic 2): fixes applied as specified; the five cut variants
// are replaced under the same keys (biker-jacket's keys are now a and b).

import { inkStroke, clip } from "../outfit-harness.js";

export const GENRES = ["metal"];

const INK = "#121212";
const EMBER = "#ffb35a";
const MITER = inkStroke(2, "miter");
const ROUND = inkStroke(2, "round");
const EDGE = inkStroke(1.5, "round");
const EDGE_MITER = inkStroke(1.5, "miter");
const THIN = inkStroke(1.2, "round");
const THIN_MITER = inkStroke(1.2, "miter");

const f1 = (n) => (Math.round(n * 100) / 100).toString();
const pt = (p) => `${f1(p.x)} ${f1(p.y)}`;

// ------------------------------------------------------------- the chest --
// The spiky chest that shows: right of the wing's front edge, under the neck,
// inside the body. A Top paints OVER the wing, so a panel that spilled left
// would swallow the wing; every panel starts at this edge instead.

const bez = (a, b, c, d, t) => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y
  };
};

// The wing's front edge (C 51 40 49 46 45 51 from the pivot), pushed 0.8
// forward so a panel clears the wing's ink line.
const WING_FRONT = Array.from({ length: 11 }, (_, i) =>
  bez({ x: 47, y: 35 }, { x: 51, y: 40 }, { x: 49, y: 46 }, { x: 45, y: 51 }, i / 10)
).map((p) => ({ x: p.x + 0.8, y: p.y }));

/** The left edge of a chest panel from y `top` down to the wing's foot. */
const frontEdgeFrom = (top) => {
  const pts = WING_FRONT.filter((p) => p.y > top);
  const first = WING_FRONT.findIndex((p) => p.y > top);
  if (first > 0) {
    const a = WING_FRONT[first - 1];
    const b = WING_FRONT[first];
    const t = (top - a.y) / (b.y - a.y);
    return [{ x: a.x + t * (b.x - a.x), y: top }, ...pts];
  }
  return [{ x: pts[0].x, y: top }, ...pts];
};

/** The whole chest, from `top` (≥ head.shoulders) down past the belly. */
const chestPanel = (top) => {
  const edge = frontEdgeFrom(top);
  return `M ${pt(edge[0])} L 72 ${f1(top)} L 72 66 L 43.6 66 L 44.4 56 ${edge
    .slice()
    .reverse()
    .map((p) => `L ${pt(p)}`)
    .join(" ")} Z`;
};

/** A panel clipped to the spiky body, so it can never leave the outline. */
const onBody = (ctx, inner) => {
  const c = clip(ctx.bodyPath);
  return `<defs>${c.def}</defs><g clip-path="${c.url}">${inner}</g>`;
};

// The laced vest: X laces down a line from the collar to the hem.
const LACE_LINE = { from: { x: 57.6, y: 38.6 }, to: { x: 53.6, y: 57 } };

// ------------------------------------------------------------------- TOP --

const BOLT = "M 56 39.4 L 62.2 39.4 L 58.8 45.4 L 62.8 45.4 L 51.4 57.8 L 54.4 49.6 L 50.4 49.6 Z";

const battleVest = {
  id: "battle-vest",
  slot: "top",
  name: "Battle vest",
  note: "Round one's survivor: the denim/leather cut-off in ink, with ONE back-patch-sized team patch. Kept big and flat so it reads as a dark block with a light mark.",
  variants: [
    {
      key: "a",
      note: "Ink vest, one fat chrome lightning-bolt patch (18 units tall, 12 wide) cut into it, no outline to thin it. The bolt is the team colour showing through: the most metal 13-unit shape that is not a face.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) =>
        onBody(ctx, `<path fill="${ctx.styleFill}" d="${chestPanel(ctx.head.shoulders)}"/><path fill="${ctx.fill}" d="${BOLT}"/>`)
    },
    {
      key: "b",
      note: "Round 3, replaces the inverted-star patch (a duplicate of a): no patch at all. The vest is LACED: a lace-up leather front, a thin chrome gap running from the collar to the hem with three fat chrome X laces across it. A light zigzag down a dark block reads as leather lacing where a reads as one emblem; nothing in it is a dot, a ring or a pair.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const { from, to } = LACE_LINE;
        const L = (t) => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
        const xs = [0.2, 0.5, 0.8]
          .map((t) => {
            const c = L(t);
            return `M ${f1(c.x - 3)} ${f1(c.y - 2.6)} L ${f1(c.x + 3)} ${f1(c.y + 2.6)} M ${f1(c.x + 3)} ${f1(c.y - 2.6)} L ${f1(c.x - 3)} ${f1(c.y + 2.6)}`;
          })
          .join(" ");
        const gap = `M ${pt(from)} L ${pt(to)}`;
        return onBody(
          ctx,
          `<path fill="${ctx.styleFill}" d="${chestPanel(ctx.head.shoulders)}"/><path fill="none" stroke="${ctx.fill}" stroke-width="1.6" d="${gap}"/><path fill="none" stroke="${ctx.fill}" stroke-width="2" stroke-linecap="round" d="${xs}"/>`
        );
      }
    }
  ]
};

// The bandolier's strap: a band of half-width `half` along the line
// from → to, cut level at the top (under the neck) and run long at the
// bottom, where the body clip ends it.
const strapFrame = ({ from, to }) => {
  const l = Math.hypot(to.x - from.x, to.y - from.y);
  const u = { x: (to.x - from.x) / l, y: (to.y - from.y) / l };
  return { u, n: { x: -u.y, y: u.x } };
};
const strapPath = (s, top, bottom = 66) => {
  const { u, n } = strapFrame(s);
  const edge = (side) => {
    const o = { x: s.from.x + n.x * s.half * side, y: s.from.y + n.y * s.half * side };
    const at = (y) => ({ x: o.x + (u.x * (y - o.y)) / u.y, y });
    return [at(top), at(bottom)];
  };
  const [l0, l1] = edge(1);
  const [r0, r1] = edge(-1);
  return `M ${pt(r0)} L ${pt(r1)} L ${pt(l1)} L ${pt(l0)} Z`;
};
const strapAt = (s, y) => {
  const { u } = strapFrame(s);
  return { x: s.from.x + (u.x * (y - s.from.y)) / u.y, y };
};

// One cartridge, 5.5 long × 3.2 wide, pointed end (1.6) out along +x.
const CARTRIDGE = "M -2.75 -1.6 L 1.15 -1.6 L 2.75 0 L 1.15 1.6 L -2.75 1.6 Z";
const BELT = { from: { x: 48, y: 37 }, to: { x: 63, y: 55 }, half: 4.5 };

/**
 * A straight band of half-width `half` from a to b, cut flat at y = top so
 * nothing of it rises above the shoulders (the measurement reads only one
 * clip, the body's, so the cut is in the geometry).
 */
const band = (a, b, half, top) => {
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  const n = { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
  const quad = [
    { x: a.x + n.x * half, y: a.y + n.y * half },
    { x: b.x + n.x * half, y: b.y + n.y * half },
    { x: b.x - n.x * half, y: b.y - n.y * half },
    { x: a.x - n.x * half, y: a.y - n.y * half }
  ];
  const out = [];
  quad.forEach((p, i) => {
    const q = quad[(i + 1) % quad.length];
    if (p.y >= top) out.push(p);
    if (p.y >= top !== q.y >= top) {
      const t = (top - p.y) / (q.y - p.y);
      out.push({ x: p.x + t * (q.x - p.x), y: top });
    }
  });
  return `M ${out.map(pt).join(" L ")} Z`;
};

const bandolier = {
  id: "bandolier",
  slot: "top",
  name: "Bullet belt",
  note: "A bandolier across the open chest: a wide ink strap from under the neck down to the belly's front edge, so it crosses the visible chest strip diagonally instead of hiding under the wing.",
  variants: [
    {
      key: "a",
      note: "Round 2: a 9-unit ink strap from (48,37) to (63,55) carrying three fat cartridges (5.5 × 3.2, pointed tips) set across it. Default bullets are ember, a house token at about 11:1 on the ink, so they read as brass; the gold style is the open-question-4 trial.",
      styles: ["ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const brass = ctx.style === "gold" ? ctx.colors.gold : EMBER;
        const { n } = strapFrame(BELT);
        const rot = (Math.atan2(-n.y, -n.x) * 180) / Math.PI; // tips point up and forward
        const top = Math.max(ctx.head.shoulders, 36);
        const bullets = [41.2, 46.6, 51.8]
          .map((y) => {
            const p = strapAt(BELT, y);
            return `<path fill="${brass}" ${inkStroke(1, "miter")} transform="translate(${f1(p.x - 0.4)} ${f1(p.y)}) rotate(${f1(rot)})" d="${CARTRIDGE}"/>`;
          })
          .join("");
        return onBody(ctx, `<path fill="${INK}" d="${strapPath(BELT, top)}"/>${bullets}`);
      }
    },
    {
      key: "b",
      note: "Round 3, the gag made legible: ONE hot-sauce bottle as big as the chest strip allows, standing upright (body 6.8 × 12.5 with round shoulders, a 2.4-unit neck, an ink cap, an ink label band), stroked a full 2 units so the bottle's silhouette holds on chrome, where ember alone is only 1.4:1. A short 5-unit ink strap comes over the shoulder from behind the wing to the cap, so the neck and cap make the outline and it hangs like a holstered bottle.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const top = Math.max(ctx.head.shoulders, 36);
        const strap = band({ x: 47.6, y: 35.4 }, { x: 57, y: 39.8 }, 2.5, top);
        const bottle =
          "M 53.6 57 L 53.6 47.6 Q 53.6 45 55.8 44.5 L 55.8 40.8 L 58.2 40.8 L 58.2 44.5 Q 60.4 45 60.4 47.6 L 60.4 57 Z";
        const label = "M 53.6 49 L 60.4 49 L 60.4 51.6 L 53.6 51.6 Z";
        const cap = "M 55.2 38.4 L 58.8 38.4 L 58.8 40.8 L 55.2 40.8 Z";
        return onBody(
          ctx,
          `<path fill="${INK}" d="${strap}"/><path fill="${EMBER}" d="${bottle}"/><path fill="${INK}" d="${label}"/><path fill="none" ${ROUND} d="${bottle}"/><path fill="${INK}" ${ROUND} d="${cap}"/>`
        );
      }
    }
  ]
};

const bikerJacket = {
  id: "biker-jacket",
  slot: "top",
  name: "Biker jacket",
  note: "The Perfecto: an ink jacket, one big lapel point, an off-centre zip. The lapel is what says 'jacket' and not 'vest'.",
  variants: [
    {
      key: "a",
      note: "Round 3 (was b): the Perfecto's asymmetry is the read. A 2.4-unit chrome zip runs straight on the diagonal from under the collar (61.4,39.6) down to the hem at (51.8,57.4), and a big notched chrome lapel folds back on the zip side. Nothing is centred, so it cannot read as a shirt front.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const lapel = "M 53.4 37.2 L 63.2 38.4 L 59.8 43.4 L 61.8 46.6 L 56.2 47.2 Z";
        return onBody(
          ctx,
          `<path fill="${ctx.styleFill}" d="${chestPanel(ctx.head.shoulders)}"/><path fill="none" stroke="${ctx.fill}" stroke-width="2.4" stroke-linecap="butt" d="M 61.4 39.6 L 51.8 57.4"/><path fill="${ctx.fill}" ${EDGE_MITER} d="${lapel}"/>`
        );
      }
    },
    {
      key: "b",
      note: "Round 3 (was c): the cropped jacket, ink down to y 48.6 and then the bare chrome belly, now with a chrome collar point on the yoke. The point stops 2 units above the crop, so the belly below stays one clean light block. It reads by its lapel and its crop; a reads by its full length and its diagonal zip.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const s = ctx.head.shoulders;
        const edge = frontEdgeFrom(s).filter((p) => p.y <= 48.6);
        const panel = `M ${pt(edge[0])} L 72 ${f1(s)} L 72 48.6 L ${pt(edge[edge.length - 1])} ${edge
          .slice()
          .reverse()
          .map((p) => `L ${pt(p)}`)
          .join(" ")} Z`;
        const lapel = "M 53.6 37.2 L 61.6 39 L 56.6 46.6 Z";
        return onBody(ctx, `<path fill="${ctx.styleFill}" d="${panel}"/><path fill="${ctx.fill}" ${EDGE_MITER} d="${lapel}"/>`);
      }
    }
  ]
};

// ---------------------------------------------------------------- SLEEVE --

const leatherSleeve = {
  id: "leather-sleeve",
  slot: "sleeve",
  name: "Leather sleeve",
  note: "The whole wing in ink: the strongest read in the render test. A 507-square-unit dark shape on a chrome bird.",
  variants: [
    {
      key: "a",
      note: "Plain ink wing, mitered like the body. Nothing else: the value change is the item.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => `<path fill="${ctx.styleFill}" ${MITER} d="${ctx.wingPath}"/>`
    },
    {
      key: "b",
      note: "Round 3: the long band read as a racing stripe, so the chrome now runs ACROSS the wing at its back end: a 5-unit wristband (x 24..30) on the ink sleeve, the cuff of a leather jacket. One short light bar at the wing's end, not a slit along it.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = clip(ctx.wingPath);
        return `<defs>${c.def}</defs><path fill="${ctx.styleFill}" d="${ctx.wingPath}"/><g clip-path="${c.url}"><path fill="${ctx.fill}" d="M 25.4 33.6 L 30.6 33.2 L 29.4 57 L 24.2 56.6 Z"/></g><path fill="none" ${MITER} d="${ctx.wingPath}"/>`;
      }
    }
  ]
};

const flameSleeve = {
  id: "flame-sleeve",
  slot: "sleeve",
  name: "Flame sleeve",
  note: "The ink wing on fire. Ember is a house token and light, so a flame reads against the dark TV where an ink spike would vanish.",
  variants: [
    {
      key: "a",
      note: "Round 3, replaces the loose ember tongues (orange crumbs by the legs; the 7-unit fringe below the wing's back cannot hold a flame big enough to read). The fire moves inside the wing instead and burns UP from its hem: the trailing feathers are alight, an ember band along the wing's whole bottom edge with four tongues licking up and back into the ink. b is a painted decal trailing from the shoulder; this is the sleeve itself on fire from the bottom.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = clip(ctx.wingPath);
        const fire =
          "M 14 62 L 14 49 C 17 48.6 19 47.2 19.8 44.6 C 21.4 46.6 22.8 47.6 24.4 48 C 23.6 45.4 23.8 42.4 25.4 39.6 C 26.6 43 28.4 45.2 30.6 46.2 C 30 43.4 30.6 40.6 32.6 38.4 C 33.6 42 35.6 44.4 38 45.4 C 37.8 43 38.6 41 40.6 39.4 C 41.2 42.4 43 44.4 46.4 45 L 52 45 L 52 62 Z";
        return `<defs>${c.def}</defs><path fill="${ctx.styleFill}" d="${ctx.wingPath}"/><g clip-path="${c.url}"><path fill="${EMBER}" ${ROUND} d="${fire}"/></g><path fill="none" ${MITER} d="${ctx.wingPath}"/>`;
      }
    },
    {
      key: "b",
      note: "Hot-rod decal: ember flames painted ON the ink wing, starting at the shoulder and licking back in three tongues to the wing's tip. Surface, not outline, but one 20-unit flat shape at 9:1 against the ink.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = clip(ctx.wingPath);
        const decal =
          "M 50 37 C 45 35.6 39 35.4 31.6 35.8 C 36 37.4 38.6 38.6 40.4 39.8 C 34 39.8 27.6 41 21.4 44.6 C 28.6 43.8 34.6 43.8 39.6 44.6 C 35 46 31 48.4 28 52 C 34.6 49 41.6 47.6 50 47.6 Z";
        return `<defs>${c.def}</defs><path fill="${ctx.styleFill}" d="${ctx.wingPath}"/><g clip-path="${c.url}"><path fill="${EMBER}" ${ROUND} d="${decal}"/></g><path fill="none" ${MITER} d="${ctx.wingPath}"/>`;
      }
    }
  ]
};

// ------------------------------------------------------------------ TAIL --
// The spiky tail's three blades, tip first: (2,46) (0,26) (7,9). The body
// covers the roots from x ≈ 18–29, so what shows is the outer two-thirds.

/** Points every `step` units along a cubic Bézier, by arc length. */
const alongCubic = (a, b, c, d, step) => {
  const samples = Array.from({ length: 241 }, (_, i) => bez(a, b, c, d, i / 240));
  const out = [samples[0]];
  let acc = 0;
  for (let i = 1; i < samples.length; i += 1) {
    acc += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    if (acc >= step) {
      out.push(samples[i]);
      acc = 0;
    }
  }
  return out;
};

/** A flat link: a long chrome stadium (aspect 2.2+, so never a bead) with only an ink slit along its long axis. */
const flatLink = (m, ang, fill, len = 7.6, wid = 3.4) => {
  const tf = `translate(${f1(m.x)} ${f1(m.y)}) rotate(${f1(ang)})`;
  const slit = len * 0.5; // a slit, never a round hole: the link reads as steel, not a ring or a "0"
  return `<g transform="${tf}"><rect fill="${fill}" ${THIN} x="${f1(-len / 2)}" y="${f1(-wid / 2)}" width="${f1(len)}" height="${f1(wid)}" rx="${f1(wid / 2)}"/><rect fill="${INK}" x="${f1(-slit / 2)}" y="-0.4" width="${f1(slit)}" height="0.8" rx="0.4"/></g>`;
};

/** An edge-on link: a solid chrome bar. */
const barLink = (m, ang, fill, len = 6, wid = 1.8) =>
  `<rect fill="${fill}" ${THIN} transform="translate(${f1(m.x)} ${f1(m.y)}) rotate(${f1(ang)})" x="${f1(-len / 2)}" y="${f1(-wid / 2)}" width="${f1(len)}" height="${f1(wid)}" rx="${f1(wid / 2)}"/>`;

/** Links on every segment of `points`, edge-on bars under flat links. */
const chain = (points, fill) => {
  const bars = [];
  const flats = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    (i % 2 === 0 ? flats : bars).push(i % 2 === 0 ? flatLink(m, ang, fill) : barLink(m, ang, fill));
  }
  return bars.join("") + flats.join("");
};

/**
 * A spiked ball as ONE outline: arcs of the disc between six fat cones, so
 * the spikes are chrome with a single ink edge, never ink slivers.
 */
const spikeBall = (c, r, spike, fill, count = 6, half = (23 * Math.PI) / 180) => {
  const at = (a, rad) => `${f1(c.x + rad * Math.cos(a))} ${f1(c.y + rad * Math.sin(a))}`;
  const step = (2 * Math.PI) / count;
  let d = "";
  for (let i = 0; i < count; i += 1) {
    const a = i * step;
    d += `${i === 0 ? "M" : "L"} ${at(a - half, r)} L ${at(a, r + spike)} L ${at(a + half, r)} A ${f1(r)} ${f1(r)} 0 0 1 ${at(a + step - half, r)} `;
  }
  return `<path fill="${fill}" ${THIN_MITER} d="${d}Z"/>`;
};

const chainLoop = {
  id: "chain-loop",
  slot: "tail",
  name: "Chain loop",
  note: "Steel chain on the tail. Drawn in the team colour with an ink edge, because chrome IS steel and an ink chain off the body vanishes on the dark TV. No link is a ring round a dark hole: flat links carry only a thin slit, the rest are edge-on bars.",
  variants: [
    {
      key: "a",
      note: "Round 3: the swag across all three blades, sagging back, alternating flat links and edge-on bars. The links are now long (7.6 × 3.4, aspect 2.2, a slit half their length) and the bars 6 × 1.8, stepped 6 apart, so the swag reads as heavy chain and not a string of beads. No round dark centres.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => chain(alongCubic({ x: 18.5, y: 17.5 }, { x: 7, y: 24 }, { x: 2, y: 40 }, { x: 15, y: 50.5 }, 6), ctx.styleFill)
    },
    {
      key: "b",
      note: "Round 3: the morning-star flail, now a studded ball and not a star. A solid chrome ball (r 4.8) with eight short studs (2.4 long, narrow) hangs off the middle blade on a visible three-link chain (flat, bar, flat, the long links of a), so it spans about 8 units of chain above the ball and reads as hanging steel. It fills the gap between the lower two blades.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const links =
          barLink({ x: 5.8, y: 32 }, 105, ctx.styleFill) +
          flatLink({ x: 6.6, y: 28.6 }, 105, ctx.styleFill) +
          flatLink({ x: 5, y: 35.4 }, 105, ctx.styleFill);
        return `${links}${spikeBall({ x: 4.2, y: 40.4 }, 4.8, 2.4, ctx.styleFill, 8, (14 * Math.PI) / 180)}`;
      }
    }
  ]
};

/** A cone with base corners b1, b2 and its point at tip. */
const cone = (b1, b2, tip) => `M ${pt(b1)} L ${pt(tip)} L ${pt(b2)} Z`;

// The spiky tail's blades, top to bottom: tip t and base corners a, b.
const TAIL_BLADES = [
  { t: { x: 7, y: 9 }, a: { x: 29, y: 34 }, b: { x: 31, y: 27 } },
  { t: { x: 0, y: 26 }, a: { x: 28, y: 42 }, b: { x: 29, y: 33 } },
  { t: { x: 2, y: 46 }, a: { x: 30, y: 48 }, b: { x: 28, y: 40 } }
];

/**
 * A blade's frame: at(f, w) is the point a fraction f of the way from the
 * base's midpoint to the tip, w units off the axis. Positive w is the side
 * that faces up/forward (screen up for every blade here).
 */
const bladeFrame = ({ t, a, b }) => {
  const base = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const len = Math.hypot(t.x - base.x, t.y - base.y);
  const u = { x: (t.x - base.x) / len, y: (t.y - base.y) / len };
  // the normal whose y is negative: "up"
  let n = { x: -u.y, y: u.x };
  if (n.y > 0) n = { x: -n.x, y: -n.y };
  const half = (f) => (Math.hypot(a.x - b.x, a.y - b.y) / 2) * (1 - f); // the blade's half-width at f
  return { len, half, at: (f, w) => ({ x: base.x + u.x * f * len + n.x * w, y: base.y + u.y * f * len + n.y * w }) };
};

const spikedCuff = {
  id: "spiked-cuff",
  slot: "tail",
  name: "Spiked cuff",
  note: "A steel cuff round the tail, with real spikes: it must change the tail's outline, not tint it.",
  variants: [
    {
      key: "a",
      note: "Round 3, replaces the all-chrome cuff (it merged into the tail): a studded-collar cuff on each blade, out where the blades are clear of the body. An INK band wraps each blade (ink on chrome, 13.9:1, so the item is visibly worn), and the outer two cuffs each throw one long chrome spike straight out sideways, up off the top blade and down off the bottom one, into the dark air. The spikes stand perpendicular to the blades, where b's spearheads run along them.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) =>
        TAIL_BLADES.map((blade, i) => {
          const { at, len, half } = bladeFrame(blade);
          const f = [0.5, 0.55, 0.55][i];
          const w = half(f) + 2.4; // the band stands 2.4 proud of the blade each side
          const df = 2.4 / len; // the band is 4.8 units along the blade
          const cuff = `M ${pt(at(f - df, w))} L ${pt(at(f + df, w))} L ${pt(at(f + df, -w))} L ${pt(at(f - df, -w))} Z`;
          const side = [1, 0, -1][i]; // top blade spikes up, bottom blade down
          const sf = 2.3 / len; // a 4.6-unit spike base, inside the band
          const spike = side
            ? `<path fill="${ctx.styleFill}" ${THIN_MITER} d="${cone(at(f - sf, side * (w - 0.6)), at(f + sf, side * (w - 0.6)), at(f, side * (w + 7.4)))}"/>`
            : "";
          return `${spike}<path fill="${INK}" ${THIN_MITER} d="${cuff}"/>`;
        }).join("")
    },
    {
      key: "b",
      note: "Steel spearheads capping each blade: three chrome points 6 units longer than the blade, ringed by an ink collar. The tail gets longer and sharper; the collar is the cuff.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        // Each blade: tip t, and its two base corners a/b; the spearhead sits
        // on the outer quarter and runs past the tip along the blade's axis.
        const blades = [
          { t: { x: 2, y: 46 }, a: { x: 30, y: 48 }, b: { x: 28, y: 40 } },
          { t: { x: 0, y: 26 }, a: { x: 28, y: 42 }, b: { x: 29, y: 33 } },
          { t: { x: 7, y: 9 }, a: { x: 29, y: 34 }, b: { x: 31, y: 27 } }
        ];
        return blades
          .map(({ t, a, b }) => {
            const base = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            const len = Math.hypot(t.x - base.x, t.y - base.y);
            const u = { x: (t.x - base.x) / len, y: (t.y - base.y) / len };
            const n = { x: -u.y, y: u.x };
            const at = (d, w) => ({ x: t.x - u.x * d + n.x * w, y: t.y - u.y * d + n.y * w });
            const tip = at(-5.6, 0);
            const head = `M ${pt(at(6, 3.4))} L ${pt(tip)} L ${pt(at(6, -3.4))} Z`;
            const collar = `M ${pt(at(8.6, 3.2))} L ${pt(at(5.4, 3.2))} L ${pt(at(5.4, -3.2))} L ${pt(at(8.6, -3.2))} Z`;
            return `<path fill="${ctx.styleFill}" ${MITER} d="${head}"/><path fill="${INK}" ${MITER} d="${collar}"/>`;
          })
          .join("");
      }
    }
  ]
};

// A three-tongue flame pointing up (−y) in local units: the root at y +2
// (it swallows the blade tip), the tallest tongue at y −10, ~6.6 wide.
const TORCH =
  "M -2.4 2 C -3.6 0 -3.8 -3 -2.8 -6 C -2 -4.4 -1.2 -3.8 -0.6 -3.6 C -1 -6 -0.4 -8.4 0.2 -10 C 1 -8 1.6 -6.6 1.4 -4.8 C 2 -5.4 2.4 -6.2 2.6 -7 C 3.6 -4.4 3.6 -1 2.4 2 Z";

const lavaTips = {
  id: "lava-tips",
  slot: "tail",
  name: "Lava tips",
  note: "The sketch's tinted tips were invisible at 76px. Fixed by making the fire LEAVE the blades: ember flames that add to the tail's outline.",
  variants: [
    {
      key: "a",
      note: "Round 2: each blade burns at its tip. A 10-unit three-tongue ember flame is rooted ON the tip (it swallows the last 2 units of the blade, so the steel runs into the fire) and licks up and back toward (−2,38) (−3,17) (4,0).",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: () =>
        [
          [{ x: 2, y: 46 }, { x: -2, y: 38 }],
          [{ x: 0, y: 26 }, { x: -3, y: 17 }],
          [{ x: 7, y: 9 }, { x: 4, y: 0 }]
        ]
          .map(([tip, to]) => {
            const deg = (Math.atan2(to.x - tip.x, -(to.y - tip.y)) * 180) / Math.PI;
            return `<path fill="${EMBER}" ${EDGE} transform="translate(${f1(tip.x)} ${f1(tip.y)}) rotate(${f1(deg)})" d="${TORCH}"/>`;
          })
          .join("")
    },
    {
      key: "b",
      note: "The whole tail burning: one big ember flame mass behind all three blades (the tail is redrawn on top in its own chrome, so the slot adds to the tail and never replaces it). An aura of fire, read as one silhouette.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const fire =
          "M 26 50.6 C 18 53 9 53 2 49.4 C 4 49 5 48.2 5.6 47.4 C -0.6 46.4 -3.4 42.8 -2.6 37.6 C -1 39.6 0.8 40.4 2.6 40 C -1.6 35 -2.6 29 -1.2 23 C -0.6 25.6 1.4 27.2 3.6 27.6 C 1.4 21.6 2.6 15 6.4 10 C 6.4 6.6 5.6 3.6 3.6 1.2 C 8.8 1.6 12.6 5 13.8 10.2 C 14.8 7.8 16.4 6.8 18.6 6.4 C 17 9.8 17.8 14 20.4 18.4 L 30 30 Z";
        return `<path fill="${EMBER}" ${ROUND} d="${fire}"/><path fill="${ctx.fill}" ${MITER} d="${ctx.tailPath}"/>`;
      }
    }
  ]
};

// ----------------------------------------------------------------- BOOTS --
// Drawn once per leg (ctx.leg). The leg runs hip (x,57) → ankle (x−1,68),
// toes back to x−7 and forward to x+6 at y ≈ 70.5–71, stroked 3.5 wide, so
// the foot reaches x−8.75..x+7.75. A boot covers all of it; its sole stops
// at 72.2, above the 72.75 floor. The far leg's top (y < ~60) is behind the
// body, so anything that must read on the far boot sits below y 60.

const SOLE_Y = 72.2;

const combatBoot = (ax, top = 60) =>
  `M ${ax - 5} ${top} L ${ax + 3.4} ${top} L ${ax + 3.4} 64.6 C ${ax + 7} 64.6 ${ax + 9.6} 66.4 ${ax + 9.6} 69.4 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} L ${ax - 7.8} 68.8 L ${ax - 5} 67.6 Z`;

const combatBoots = {
  id: "combat-boots",
  slot: "boots",
  name: "Combat boots",
  note: "Chunky ink boots round the leg, covering the toes, the sole at 72.2. Down by the floor the TV's glow is behind them, which is where ink still reads off the body.",
  variants: [
    {
      key: "a",
      note: "Round 3: the shaft now runs up to the thigh (y 56, as c) so no orange shin shows under it. A big round toe and a 3.2-unit lug sole in the contrasting value (team chrome under ink, ink under white) so the boot stands on the floor instead of melting into it.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const sole = ctx.style === "white" ? INK : ctx.fill;
        return `<path fill="${ctx.styleFill}" ${ROUND} d="${combatBoot(ax, 56)}"/><path fill="${sole}" ${ROUND} d="M ${ax - 7.8} 69 L ${ax + 9.6} 69 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} Z"/>`;
      }
    },
    {
      key: "b",
      note: "Round 3, replaces the greave (it read as a white sock): platform stompers. The ink upper sits on a slab of a sole, 5.8 units deep, squared at both ends and left as one unbroken light block (a tread line split it into stripes, a trainer read), so the bird stands on two light slabs. The silhouette change is the sole; a is the plain boot, c the knee-high one with a cuff.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const slab = ctx.style === "white" ? INK : ctx.fill;
        const upper = `M ${ax - 5} 56 L ${ax + 3.4} 56 L ${ax + 3.4} 62 C ${ax + 7} 62 ${ax + 9.6} 63.6 ${ax + 9.6} 66.6 L ${ax - 7} 66.6 L ${ax - 5} 64 Z`;
        const sole = `M ${ax - 7.8} 66.4 L ${ax + 9.6} 66.4 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} Z`;
        return `<path fill="${ctx.styleFill}" ${ROUND} d="${upper}"/><path fill="${slab}" ${ROUND} d="${sole}"/>`;
      }
    },
    {
      key: "c",
      note: "Round 2: knee-high, the shaft up to the thigh (y 56) as one tall column, now with the chrome turn-down cuff actually drawn: a 3-unit band a unit proud of the shaft each side, ink-edged, at y 58–61, because at the critic's y 55–57.5 the wing's trailing feathers (down to y 55, plus their ink) cover it on the near leg and the body hides it on the far one. Plus a 2.4-unit chrome sole so the column stands on the floor. The white style flips both bands to ink.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const band = ctx.style === "white" ? INK : ctx.fill;
        return `<path fill="${ctx.styleFill}" ${ROUND} d="${combatBoot(ax, 56)}"/><path fill="${band}" ${THIN} d="M ${ax - 7.8} 69.8 L ${ax + 9.6} 69.8 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} Z"/><path fill="${band}" ${THIN} d="M ${ax - 6} 58 L ${ax + 4.4} 58 L ${ax + 4.4} 61 L ${ax - 6} 61 Z"/>`;
      }
    }
  ]
};

const spikedBoots = {
  id: "spiked-boots",
  slot: "boots",
  name: "Spiked boots",
  note: "An ink boot with ONE cone each, in steel so it reads over the dark floor. The 9-unit leg band is the limit: a toe spike cannot get 5 units past a boot that covers the whole foot, so the cones go on the shin and the calf instead.",
  variants: [
    {
      key: "a",
      note: "Round 3: a slender shin spike, low against the dark floor (higher up, the near boot sits over the chrome belly and a chrome spike vanishes): a 3.6-unit base on the shaft front at y 60.2–63.8 and a point 6.6 units forward, mitered so the tip stays sharp. The shaft now runs up to y 56, so no orange shows under the thigh.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const spike = `M ${ax + 3.4} 60.2 L ${ax + 10} 62 L ${ax + 3.4} 63.8 Z`;
        return `<path fill="${INK}" ${ROUND} d="${combatBoot(ax, 56)}"/><path fill="${ctx.styleFill}" ${THIN_MITER} d="${spike}"/>`;
      }
    },
    {
      key: "b",
      note: "Round 3, replaces the rooster spur (invisible: the back of the leg band has no room): a toe horn. One curved chrome cone hooks up and forward off the toe cap like a rhino horn (base about 4, tip at y 60.6, 8.8 units ahead of the hip). It stops below the body's underside, because higher up the near horn sits over the chrome belly and vanishes, so both horns stand over the dark floor; a's spike lies flat on the shin instead.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const horn = `M ${ax + 3.4} 64.6 Q ${ax + 7.6} 64.2 ${ax + 9.8} 60.6 Q ${ax + 9.6} 64.6 ${ax + 7.8} 66.2 Z`;
        return `<path fill="${INK}" ${ROUND} d="${combatBoot(ax, 56)}"/><path fill="${ctx.styleFill}" ${THIN_MITER} d="${horn}"/>`;
      }
    }
  ]
};

export const ITEMS = [
  battleVest,
  bandolier,
  bikerJacket,
  leatherSleeve,
  flameSleeve,
  chainLoop,
  spikedCuff,
  lavaTips,
  combatBoots,
  spikedBoots
];
