// pop · kit: the Top, Sleeve, Tail and Boots items of the Spice Girls rail
// (docs/research/bird-wardrobe.md §2.2), drawn on the stock bird in pink
// (teamH). White (3.53:1) and ink both read on pink, so this is the one rail
// that leans on white.
//
// The stock bird, in the numbers these drawings are built on:
//   body front edge  (59.7,32.7) (61.7,35.4) (63,38.4) (63.9,44.9) (62.5,51.6) (61,55)
//   body bottom      (52.7,60.8) (41.4,63.3) (30,62.3)
//   neck             paints OVER the Top, down to the line (45,33)→(60,40)
//   wing top edge    (47,35) (44.2,33.5) (41.1,32.6) (37.9,32.2) (30.1,33.7) (22.4,39.5)
//   wing front edge  (48,36.5) (48.7,38.1) (49.2,41.4) (48.6,44.6) (47.1,47.9) (45,51)
//   wing scallops    tips (24,55) (31,54) (38,53) (45,51)
//   fan tail tips    (0,30) (2,20) (11,10); the body hides the tail at x > ~18
//   legs             hip (x,57) → ankle (x−1,68) → toes (x−7,70.5) (x,71) (x+6,70.5);
//                    the near leg is drawn over the belly from the hip down
//
// Every Top is a panel clipped to the body, with the body's own edge drawn
// back over it, so a garment never leaks past the outline. Tops start at y 37
// on both heads: the neck covers the drawn head's 32–37 band anyway, and a
// light point higher than that is within 16u of the drawn head's centre.
//
// Outline-only shapes (bow, ribbons) are drawn twice: once with the ink edge,
// then again without it, so only the outer silhouette is inked and no ink
// line chops a white shape into "eyes".

import { clip } from "../outfit-harness.js";

export const GENRES = ["pop"];

// ---------------------------------------------------------------- helpers --

const TOP_Y = 37;

const P = (x, y) => ({ x, y });

/** The colours a ctx paints with. */
const pal = (ctx) => ({
  ink: ctx.colors.ink,
  white: ctx.colors.white,
  team: ctx.fill,
  base: ctx.styleFill,
  // the colour that reads ON the base: white on ink, ink on everything else
  on: ctx.styleFill === ctx.colors.ink ? ctx.colors.white : ctx.colors.ink
});

/**
 * A chest garment: `panel` filled and outlined, clipped to the body, then the
 * body's own ink edge drawn back over it. Detail inside panel ∩ body comes in
 * two kinds, because the harness measures a shape by its innermost clip only:
 *   onEdge  — shapes whose geometry lies on the body's own edge (inset bands):
 *             the panel is their innermost clip, which keeps them off the
 *             body's upper edge.
 *   inBody  — everything else: the body is their innermost clip, so they must
 *             keep to y ≥ 37 themselves.
 */
const garment = (ctx, panel, fill, { onEdge = "", inBody = "" } = {}) => {
  const body = clip(ctx.bodyPath);
  const p = clip(panel);
  return `<defs>${body.def}${p.def}</defs>
    <g clip-path="${body.url}"><path fill="${fill}" ${ctx.inkStroke(2)} d="${panel}"/></g>
    ${onEdge ? `<g clip-path="${body.url}"><g clip-path="${p.url}">${onEdge}</g></g>` : ""}
    ${inBody ? `<g clip-path="${p.url}"><g clip-path="${body.url}">${inBody}</g></g>` : ""}
    <g clip-path="${p.url}"><path fill="none" ${ctx.inkStroke(2)} d="${ctx.bodyPath}"/></g>`;
};


/** The body's edge as inset bands: strokes centred on the edge, widest first. */
const edgeBands = (ctx, bands) =>
  bands
    .map(([colour, width]) => `<path fill="none" stroke="${colour}" stroke-width="${width}" stroke-linejoin="round" d="${ctx.bodyPath}"/>`)
    .join("");

/** Draw `d` with the ink edge, then again without, so only the silhouette is inked. */
const silhouette = (ctx, d, fill, edge = 2.4, attrs = "") =>
  `<path fill="${fill}" stroke="${ctx.colors.ink}" stroke-width="${edge * 2}" stroke-linejoin="round" ${attrs} d="${d}"/>
   <path fill="${fill}" ${attrs} d="${d}"/>`;

// ------------------------------------------------------------------ tops --

// The crop jacket's body: over the front third of the wing (a jacket is worn
// over the arm) to a hem across the chest at y≈52.
const JACKET = (hem) => `M 44 ${TOP_Y} C 41.5 41 41 47 43.5 ${hem - 0.5} L 70 ${hem + 1} L 70 ${TOP_Y} Z`;

const cropJacket = {
  id: "crop-jacket",
  slot: "top",
  name: "Crop jacket",
  note: "Round-1 survivor: a white jacket cropped at mid-chest, so pink shows under it.",
  variants: [
    {
      key: "a",
      note: "The V-neck: the bomber's white body and ink rib hem, opened at the throat in one short pink V that closes inside the chest (apex y 44), so the white either side of it joins below as one piece.",
      styles: ["white", "ink"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const hem = 53;
        const notch = `M 54 ${TOP_Y} L 58 44 L 62 ${TOP_Y}`;
        const band = `<path fill="${c.ink}" d="M 38 ${hem - 4.5} L 74 ${hem - 3} L 74 ${hem + 4} L 38 ${hem + 4} Z"/>`;
        return garment(ctx, JACKET(hem), c.base, { inBody: `${band}<path fill="${c.team}" ${ctx.inkStroke(2)} d="${notch}"/>` });
      }
    },
    {
      key: "b",
      note: "Biker crop: no V at the throat. The same white crop with its ink rib hem, closed by a heavy asymmetric zip that cuts straight across the chest from under the collar at the front down to the hem at the back, the biker jacket's one unmistakable line. Straight, so it never reads as a mouth or a grin.",
      styles: ["white", "ink"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const hem = 53;
        const band = `<path fill="${c.ink}" d="M 38 ${hem - 4.5} L 74 ${hem - 3} L 74 ${hem + 4} L 38 ${hem + 4} Z"/>`;
        // the zip runs against the neck's own edge (which falls the other
        // way), so the two never read as parallel stripes
        const zip = `<path fill="none" stroke="${c.on}" stroke-width="2.6" d="M 61.5 ${TOP_Y + 1.5} L 47 ${hem}"/>`;
        return garment(ctx, JACKET(hem), c.base, { inBody: band + zip });
      }
    }
  ]
};

const tracksuitTop = {
  id: "tracksuit-top",
  slot: "top",
  name: "Tracksuit top",
  note: "Sporty: an ink track top with two white stripes that echo the body's own edge.",
  variants: [
    {
      key: "a",
      note: "Full-length track top: chest and front in ink, back under the wing, hemmed straight at y ≈60 by a 3u hem band, so the stripes run down the front edge and stop square at the hem (never turning under the belly), and the near leg shows from y 61 down.",
      styles: ["ink", "white"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const panel = `M 46.5 ${TOP_Y} C 50 40 51.5 46 46.5 52 L 38 54.6 L 30 57 L 30 60.5 L 64 58.5 L 72 58.5 L 72 ${TOP_Y} Z`;
        // inside the edge: base 0–1.5, stripe 1.5–4, base 4–6.5, stripe 6.5–9
        const bands = edgeBands(ctx, [
          [c.on, 18],
          [c.base, 13],
          [c.on, 8],
          [c.base, 3]
        ]);
        const hemBand = `<path fill="${c.base}" d="M 28 57.5 L 74 55.5 L 74 61 L 28 61 Z"/>`;
        return garment(ctx, panel, c.base, { onEdge: bands, inBody: hemBand });
      }
    },
    {
      key: "b",
      note: "Cropped track top: chest only, cut square at y 55 so the pink belly shows; the stripes run down the front edge and stop at an ink hem band.",
      styles: ["ink", "white"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const hem = 55;
        const panel = `M 46.5 ${TOP_Y} C 50 40 51.5 46 47.5 ${hem} L 72 ${hem - 1} L 72 ${TOP_Y} Z`;
        const bands = edgeBands(ctx, [
          [c.on, 18],
          [c.base, 13],
          [c.on, 8],
          [c.base, 3]
        ]);
        const hemBand = `<path fill="${c.base}" d="M 40 ${hem - 4} L 74 ${hem - 5} L 74 ${hem + 2} L 40 ${hem + 2} Z"/>`;
        return garment(ctx, panel, c.base, { onEdge: bands, inBody: hemBand });
      }
    }
  ]
};

// A dress hem that is not the body's bottom: cut diagonally from under the
// chest down to the body's bottom edge, so a wedge of pink lower body shows
// below it behind the near leg and the bird keeps its silhouette on the dark
// room (ink to the body bottom melts into the outline).
const DIAGONAL_HEM = `L 72 74 L 58 74 L 57 66 L 38 56.5 L 38 54.6 L 46.5 52`;

const littleBlackDress = {
  id: "little-black-dress",
  slot: "top",
  name: "Little black dress",
  note: "Posh: a short ink dress on the pink bird. Always a hem above the body's bottom, so pink lower body shows and the silhouette survives the dark room.",
  variants: [
    {
      key: "a",
      note: "One-shoulder mini: ink rises to the neck on the wing side only, the neckline falls diagonally to the chest's front edge, and the hem is cut straight across at y ≈55 so a wide band of pink belly shows under it.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const panel = `M 46.5 ${TOP_Y} L 52.5 ${TOP_Y} L 66 46 L 66 53 C 58 55 48 55.5 38 54.6 L 46.5 52 C 51.5 46 50 40 46.5 ${TOP_Y} Z`;
        return garment(ctx, panel, c.base);
      }
    },
    {
      key: "b",
      note: "Plunging halter: ink rises to the neck at the back and front with an open pink V between them (apex y 47), and the hem is cut straight at y ≈58 so a 4-5u band of pink shows across the whole front under the dress and the belly keeps its curve.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const panel = `M 46.5 ${TOP_Y} L 50 ${TOP_Y} L 56.5 47 L 63 ${TOP_Y} L 72 ${TOP_Y} L 72 57 C 60 58.5 48 59 38 56.5 L 38 54.6 L 46.5 52 C 51.5 46 50 40 46.5 ${TOP_Y} Z`;
        return garment(ctx, panel, c.base);
      }
    }
  ]
};

/**
 * The Union Jack's lines through (cx, cy): saltire at ±angle, cross upright.
 * The arms run long and are clipped by the panel they sit in, except upward.
 */
const unionJack = (ctx, cx, cy, { saltire, cross, inner, angle, top }) => {
  const c = pal(ctx);
  const L = 40;
  const a = (angle * Math.PI) / 180;
  const dx = L * Math.cos(a);
  const dy = L * Math.sin(a);
  // the upward arms stop at `top`: the harness measures these lines by the
  // body clip, so they keep themselves under the neck
  const ux = (cy - top) / Math.tan(a);
  const diag = `M ${cx - ux} ${top} L ${cx + dx} ${cy + dy} M ${cx - dx} ${cy + dy} L ${cx + ux} ${top}`;
  const plus = `M ${cx} ${top} L ${cx} ${cy + L} M ${cx - L} ${cy} L ${cx + L} ${cy}`;
  return `<path fill="none" stroke="${c.white}" stroke-width="${saltire}" d="${diag}"/>
    <path fill="none" stroke="${c.white}" stroke-width="${cross}" d="${plus}"/>
    <path fill="none" stroke="${accentOf(c)}" stroke-width="${inner}" d="${plus}"/>`;
};

/** The flag's accent: team pink on an ink field, ink on a pink one. */
const accentOf = (c) => (c.base === c.team ? c.ink : c.team);

/**
 * A two-panel dress: `flag` holds the jack, `plain` is the rest of the dress
 * in the field colour, and a 2.4u accent line along `seam` keeps the two from
 * melting into one field. Both panels are filled shapes clipped to the body;
 * the flag's lines are clipped to the flag panel AND the body.
 */
const jackDress = (ctx, flag, plain, seam, jack) => {
  const c = pal(ctx);
  const body = clip(ctx.bodyPath);
  const f = clip(flag);
  const both = clip(`${flag} ${plain}`);
  return `<defs>${body.def}${f.def}${both.def}</defs>
    <g clip-path="${body.url}">
      <path fill="${c.base}" ${ctx.inkStroke(2)} d="${plain}"/>
      <path fill="${c.base}" ${ctx.inkStroke(2)} d="${flag}"/>
    </g>
    <g clip-path="${f.url}"><g clip-path="${body.url}">${unionJack(ctx, ...jack)}</g></g>
    <g clip-path="${body.url}"><path fill="none" stroke="${accentOf(c)}" stroke-width="2.4" d="${seam}"/></g>
    <g clip-path="${both.url}"><path fill="none" ${ctx.inkStroke(2)} d="${ctx.bodyPath}"/></g>`;
};

const unionJackDress = {
  id: "union-jack-dress",
  slot: "top",
  name: "Union Jack dress",
  note: "Ginger: the flag in pink, white and ink only. No new colour comes in; the cross reads by its geometry. The jack sits in one panel, the plain ink in another, a pink seam between.",
  variants: [
    {
      key: "a",
      note: "Flag bodice, plain mini skirt: the jack fills the chest from y 40 to the waist at y 56 (thin white so every ink triangle stays 3u+), a pink waistline, then a short plain ink skirt with a diagonal hem.",
      styles: ["ink", "team"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const bodice = `M 48.5 41 Q 57 39.5 70 40 L 70 56 L 47.5 56 C 50.5 50 50.5 45 48.5 41 Z`;
        const skirt = `M 47.5 56 L 72 56 ${DIAGONAL_HEM} Z`;
        return jackDress(ctx, bodice, skirt, `M 44 56 L 72 56`, [56.5, 48.5, { saltire: 2.2, cross: 4.6, inner: 2.4, angle: 46, top: 38.5 }]);
      }
    },
    {
      key: "b",
      note: "Flag tube dress: one piece, no waist seam and no skirt. The whole mini is the jack, from the neckline at y 40 to a straight hem at y ≈58, its centre low at the hip so the saltire's long lower arms run down the whole dress; bolder lines than a (cross 5.6, saltire 3), and a band of pink body shows under the hem where a has its ink skirt. (Tried and dropped: the jack centred on the front edge so only its hoist half shows read as >> chevrons; a square flag skirt under an ink bodice read as a keyboard at 76.)",
      styles: ["ink", "team"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const panel = `M 48.5 40.5 Q 57 39 70 39.5 L 72 57 C 60 58.5 50 58.8 44 57.6 L 46.5 52 C 50.5 48 50.5 45 48.5 40.5 Z`;
        const jack = unionJack(ctx, 55.5, 50, { saltire: 3, cross: 5.6, inner: 2.6, angle: 42, top: 39 });
        return garment(ctx, panel, pal(ctx).base, { inBody: jack });
      }
    }
  ]
};

// --------------------------------------------------------------- sleeves --

/** Redraw the wing in `fill`, put `inner` inside it, and restore its outline. */
const wingGarment = (ctx, fill, inner = "") => {
  const w = clip(ctx.wingPath);
  return `<defs>${w.def}</defs>
    <path fill="${fill}" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>
    ${inner ? `<g clip-path="${w.url}">${inner}</g>` : ""}
    <path fill="none" ${ctx.inkStroke(2)} d="${ctx.wingPath}"/>`;
};

// The wing's own top edge from the pivot, split off its first cubic, so a
// sleeve shape can hug it exactly (off the wing on that side is a fail).
const WING_TOP_TO_35 = "C 43.4 32.6 39 31.8 34.76 32.41"; // pivot → (34.8,32.4)

const stripeSleeve = {
  id: "stripe-sleeve",
  slot: "sleeve",
  name: "Tracksuit stripes",
  note: "Two white bands on the wing: the tracksuit's arm.",
  variants: [
    {
      key: "a",
      note: "Down the arm: two bands from the shoulder to the wing tip, following its long axis.",
      styles: ["team", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const bands = `<path fill="none" stroke="${c.white}" stroke-width="2.8" d="M 51 38.5 C 41 34.5 29 37 22.5 46.5"/>
          <path fill="none" stroke="${c.white}" stroke-width="2.8" d="M 51 43.5 C 42 40 31 42.5 25.5 51.5"/>`;
        return wingGarment(ctx, c.base, bands);
      }
    },
    {
      key: "b",
      note: "Cuff stripes: two bands round the wing near its tip, square to the arm's axis, like a sleeve's ribbed cuff.",
      styles: ["team", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const bands = `<path fill="none" stroke="${c.white}" stroke-width="3" d="M 21.5 30 L 33.5 57"/>
          <path fill="none" stroke="${c.white}" stroke-width="3" d="M 28.5 27.5 L 40.5 54.5"/>`;
        return wingGarment(ctx, c.base, bands);
      }
    }
  ]
};

/** The first part, [p0, a1, a2, a3], of the cubic (p0,p1,p2,p3) split at t. */
const splitCubic = ([p0, p1, p2, p3], t) => {
  const lerp = (a, b) => P(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  const q0 = lerp(p0, p1);
  const q1 = lerp(p1, p2);
  const q2 = lerp(p2, p3);
  const r0 = lerp(q0, q1);
  const r1 = lerp(q1, q2);
  return [p0, q0, r0, lerp(r0, r1)];
};

const puffSleeve = {
  id: "puff-sleeve",
  slot: "sleeve",
  name: "Puff sleeve",
  note: "Baby: a white puff where the wing meets the body, gathered into an ink cuff so the pink wing below reads as the arm coming out of it.",
  variants: [
    {
      key: "a",
      note: "Gathered puff: the shoulder third of the wing turns white, hugging the wing's top edge and swelling forward past the wing's front edge as a ball, gathered into a heavy straight ink cuff that runs ACROSS the arm (top edge to front scallop), so the pink rest of the wing reads as the arm coming out of the puff. No fold lines inside: a row of short gathers read as teeth, one pleat from the middle as a clock hand, two long folds as leaf veins; the clean swell against the cuff reads best at 76.",
      styles: ["white", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        // the back boundary is one straight chord, and the cuff lies on it: a
        // curved cuff ran parallel to the puff's back and read as an eyelid
        const puff = `M 47 35 ${WING_TOP_TO_35}
          L 45.5 50.5
          C 55.5 53.5 60 40 48 36.5 Z`;
        const cuffD = `M 35 34 L 45.5 50.5`;
        return `${wingGarment(ctx, c.team)}
          <path fill="${c.base}" ${ctx.inkStroke(2)} d="${puff}"/>
          <path fill="none" stroke="${c.on}" stroke-width="3.6" stroke-linecap="round" d="${cuffD}"/>`;
      }
    },
    {
      key: "b",
      note: "Leg-of-mutton: the whole arm is one white sleeve, from a puff that swells past the wing's front edge and below its scallops (one smooth curve, never lobes: those read as teeth) right back to a straight ink cuff near the wing's tip, slanted square to the arm, with the pink tip poking out past it like a hand. Where a puffs only the shoulder, b sleeves the whole arm, so the white keeps the wing's long shape and reads as an arm, not an egg.",
      styles: ["white", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        // the wing's own top edge from the pivot to x ≈23.5 (off the wing on
        // that side is a fail), split off its first cubic
        const [, a1, a2, a3] = splitCubic([P(47, 35), P(38, 29), P(24, 33), P(20, 44)], 0.8);
        const f = (p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
        const sleeve = `M 47 35 C ${f(a1)} ${f(a2)} ${f(a3)}
          L 28.5 54.5
          C 33 59.5 44 59.5 48.5 51.5
          C 52 46 52 40 48 36.5 Z`;
        const cuffD = `M ${f(a3)} L 28.5 54.5`;
        return `${wingGarment(ctx, c.team)}
          <path fill="${c.base}" ${ctx.inkStroke(2)} d="${sleeve}"/>
          <path fill="none" stroke="${c.on}" stroke-width="3.6" stroke-linecap="round" d="${cuffD}"/>`;
      }
    }
  ]
};

// ------------------------------------------------------------------ tails --

// A bow in local units, centred on its knot, 17 wide: two loops pinched at
// the knot and two ribbon ends hanging below it.
const BOW = [
  "M -1.5 -1.6 C -4 -6.5 -8.5 -6.8 -8.5 -2.6 L -8.5 2.6 C -8.5 6.6 -4 6.4 -1.5 1.6 Z",
  "M 1.5 -1.6 C 4 -6.5 8.5 -6.8 8.5 -2.6 L 8.5 2.6 C 8.5 6.6 4 6.4 1.5 1.6 Z",
  "M -2.4 -2.8 L 2.4 -2.8 L 2.1 2.8 L -2.1 2.8 Z",
  "M -1.2 1.8 L -5.5 10 L -3 9.4 L -1.6 11.6 L 1.2 2.4 Z",
  "M 1.2 1.8 L 5.5 10 L 3 9.4 L 1.6 11.6 L -1.2 2.4 Z"
].join(" ");

const bigBow = {
  id: "big-bow",
  slot: "tail",
  name: "Big bow",
  note: "Baby: a big white bow on the fan tail, 17 units across. Inked only round its outside, so no dark knot sits between two light loops.",
  variants: [
    {
      key: "a",
      note: "On the fan: tied across the middle of the fan, loops left and right, ribbon ends hanging down the tail.",
      styles: ["white", "team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        return `<g transform="translate(9 26) rotate(-18)">${silhouette(ctx, BOW, c.base, 1.6)}</g>`;
      }
    },
    {
      key: "b",
      note: "Ponytail bow: perched on the top feather's tip and tied square across it, loops standing out past the fan, the way Baby's bunches wore theirs.",
      styles: ["white", "team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        return `<g transform="translate(11.5 13) rotate(-28)">${silhouette(ctx, BOW, c.base, 1.6)}</g>`;
      }
    }
  ]
};

/** A point on the cubic (p0, p1, p2, p3) at t. */
const bez = ([p0, p1, p2, p3], t) => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return { x: k[0] * p0.x + k[1] * p1.x + k[2] * p2.x + k[3] * p3.x, y: k[0] * p0.y + k[1] * p1.y + k[2] * p2.y + k[3] * p3.y };
};

/**
 * A flat ribbon as one filled band along a chain of cubics (each [p0,p1,p2,p3],
 * joined end to start), tapering w0 → w1, its end cut into a swallowtail fork:
 * the fork is what says "ribbon" rather than "squiggle".
 */
const ribbonBand = (segments, w0, w1, fork = 0.9) => {
  const samples = [];
  segments.forEach((seg, i) => {
    for (let j = i === 0 ? 0 : 1; j <= 14; j += 1) samples.push(bez(seg, j / 14));
  });
  const n = samples.length - 1;
  const left = [];
  const right = [];
  let tangent = { x: 1, y: 0 };
  samples.forEach((p, i) => {
    const a = samples[Math.max(0, i - 1)];
    const b = samples[Math.min(n, i + 1)];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    tangent = { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
    const w = (w0 + ((w1 - w0) * i) / n) / 2;
    left.push({ x: p.x - tangent.y * w, y: p.y + tangent.x * w });
    right.push({ x: p.x + tangent.y * w, y: p.y - tangent.x * w });
  });
  const end = samples[n];
  const notch = { x: end.x - tangent.x * w1 * fork, y: end.y - tangent.y * w1 * fork };
  const f = (p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  return `M ${left.map(f).join(" L ")} L ${f(notch)} L ${right.reverse().map(f).join(" L ")} Z`;
};


/**
 * Two chained cubics from `from`, heading back (−x) and `angle`° below
 * horizontal for `length`: the first bows one way, the second the other,
 * so the ribbon ripples twice.
 */
const ripple = (from, angle, length, amp) => {
  const a = (angle * Math.PI) / 180;
  const d = { x: -Math.cos(a), y: Math.sin(a) };
  const n = { x: -d.y, y: d.x };
  const at = (s, k) => P(from.x + d.x * length * s + n.x * amp * k, from.y + d.y * length * s + n.y * amp * k);
  return [
    [at(0, 0), at(1 / 6, 1.3), at(2 / 6, 1.3), at(0.5, 0)],
    [at(0.5, 0), at(4 / 6, -1.3), at(5 / 6, -1.3), at(1, 0)]
  ];
};

// Tied on a few units inside each tip (on the feather), so the ribbon can be
// long and still end within the tail rule's 10u of the fan. Top first. The
// fan opens downward: the top streamer flies flattest and the low one hangs
// steepest, so no ribbon crosses toward the next tip down (the critic's
// −40° top ribbon ran straight into the middle tip). The low one is short:
// the low feather curls back under the bird, so past ~9.5u off its tip a
// ribbon leaves the tail rule's 10u.
const STREAMERS = [
  { from: P(11.5, 13), angle: 15, length: 12, amp: 1.8 },
  { from: P(3.8, 24), angle: 30, length: 11.5, amp: 1.8 }
];

const ribbonStreamers = {
  id: "ribbon-streamers",
  slot: "tail",
  name: "Ribbon streamers",
  note: "Ribbons trailing off the fan's tips: an outline change that flutters behind the bird. Each ends in a swallowtail fork, the mark that says ribbon.",
  variants: [
    {
      key: "a",
      note: "Streamers: two wide ribbons (4.4u tapering to 3.4u, about 4px at 76) tied on near the top and middle tips, each rippling twice and hanging back and down at its own angle (top −15°, middle −30°), each ending in a swallowtail fork. Wide enough to read as ribbons, not speed lines.",
      styles: ["white", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const d = STREAMERS.map(({ from, angle, length, amp }) => ribbonBand(ripple(from, angle, length, amp), 4.4, 3.4, 1.1)).join(" ");
        return silhouette(ctx, d, c.base, 1.4);
      }
    },
    {
      key: "b",
      note: "Gymnast's ribbon: one long, wide ribbon off the top feather, cascading down the back of the fan in an S to below the lowest tip.",
      styles: ["white", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const hi = ctx.tailTips[2];
        const d = ribbonBand(
          [
            [P(hi.x + 1, hi.y + 0.5), P(hi.x - 3, hi.y - 4.5), P(hi.x - 8.5, hi.y - 2), P(hi.x - 8, hi.y + 3)],
            [P(hi.x - 8, hi.y + 3), P(hi.x - 7.5, hi.y + 7.5), P(hi.x - 13.5, hi.y + 7), P(hi.x - 13, hi.y + 12)],
            [P(hi.x - 13, hi.y + 12), P(hi.x - 12.5, hi.y + 16.5), P(hi.x - 17, hi.y + 17), P(hi.x - 16.5, hi.y + 22)]
          ],
          5.2,
          4.2
        );
        return silhouette(ctx, d, c.base, 1.6);
      }
    }
  ]
};

// ------------------------------------------------------------------ boots --
// Fill bottoms sit on y 71.75 so the 2-unit ink edge lands on the 72.75 floor.
// `x` is the ankle (the leg's x − 1). Below the body the boots are seen
// against the room, not the bird, so the part that has to read is the white.

const SOLE = 71.75;

const platformTrainers = {
  id: "platform-trainers",
  slot: "boots",
  name: "Platform trainers",
  note: "Sporty: chunky trainers. The sole cannot go below the floor, so the platform is built upward from it.",
  variants: [
    {
      key: "a",
      note: "Chunky high-top: a big white upper whose top tucks under the body's edge (y 56.5), so no ankle shows above it,, on a 5-unit platform sole in warm grey, so the platform reads against the dark floor where an ink sole vanished.",
      styles: ["white", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const x = ctx.leg.x - 1;
        const upper = `M ${x - 6} 67.5 L ${x - 5} 56.5 Q ${x - 1} 55 ${x + 3.5} 56.5 L ${x + 4} 62 C ${x + 6.5} 62.5 ${x + 8.6} 63.5 ${x + 8.6} 67.5 Z`;
        const sole = `M ${x - 7.5} 66.5 L ${x + 8.4} 66.5 C ${x + 9.3} 67.5 ${x + 9.3} 70.5 ${x + 8.4} ${SOLE} L ${x - 7.5} ${SOLE} Z`;
        return `<path fill="${c.base}" ${ctx.inkStroke(2)} d="${upper}"/><path fill="${ctx.colors.mutedWarm}" ${ctx.inkStroke(2)} d="${sole}"/>`;
      }
    },
    {
      key: "b",
      note: "Buffalo stack: a short high-top upper, an ink sole band, then a 6-unit white platform under it, so the shoe is a white-ink-white tower and the bird stands tall on it. The tower's heel reaches x−7.5 to cover the back toe.",
      styles: ["white", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const x = ctx.leg.x - 1;
        const upper = `M ${x - 4} 62.5 L ${x - 3.5} 56 Q ${x - 0.5} 54.6 ${x + 3} 56 L ${x + 3.5} 59.5 C ${x + 6} 60 ${x + 8} 60.5 ${x + 8} 62.5 Z`;
        const band = `M ${x - 6} 62 L ${x + 8.1} 62 L ${x + 8.1} 65 L ${x - 6} 65 Z`;
        const tower = `M ${x - 7.5} 65 L ${x + 7.9} 65 C ${x + 8.8} 67 ${x + 8.8} 70 ${x + 7.9} ${SOLE} L ${x - 7.5} ${SOLE} Z`;
        return `<path fill="${c.white}" ${ctx.inkStroke(2)} d="${tower}"/>
          <path fill="${c.ink}" ${ctx.inkStroke(2)} d="${band}"/>
          <path fill="${c.base}" ${ctx.inkStroke(2)} d="${upper}"/>`;
      }
    }
  ]
};

const goGoBoots = {
  id: "go-go-boots",
  slot: "boots",
  name: "Go-go boots",
  note: "Posh: tall ink boots. Ink on the dark floor loses the leg, so each solution carries one light mark that draws the boot's form. White is the sixties original, offered as a style.",
  variants: [
    {
      key: "a",
      note: "Patent knee-high with a block heel: the shank starts under the body's edge (no leg shows above it), a pointed toe, a heel block with a notch under the arch, one thick patent shine down the shin, and a warm-grey line along the sole so the foot holds on the floor.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const x = ctx.leg.x - 1;
        const boot = `M ${x - 3.5} 56 L ${x + 2.5} 56 L ${x + 2.5} 66.5 C ${x + 5} 67.5 ${x + 8} 69 ${x + 9.5} ${SOLE}
          L ${x + 1} ${SOLE} L ${x} ${SOLE - 1.8} L ${x - 2} ${SOLE - 1.8} L ${x - 2} ${SOLE} L ${x - 7.5} ${SOLE}
          C ${x - 7.5} 69.5 ${x - 5} 68.5 ${x - 3.5} 67 Z`;
        // one patent highlight down a tall tube (a second glint on the toe
        // read as a stray tick), and a warm-grey line along the sole so the
        // foot reads against the dark floor; it breaks at the heel notch
        const shine = `M ${x + 1} 58 L ${x + 1} 66.5`;
        const sole = `M ${x - 7} 71.2 L ${x - 2.4} 71.2 M ${x + 1.4} 71.2 L ${x + 9} 71.2`;
        return `<path fill="${c.base}" ${ctx.inkStroke(2)} d="${boot}"/>
          <path fill="none" stroke="${c.on}" stroke-width="2.2" stroke-linecap="round" d="${shine}"/>
          <path fill="none" stroke="${ctx.colors.mutedWarm}" stroke-width="1.2" stroke-linecap="round" d="${sole}"/>`;
      }
    },
    {
      key: "b",
      note: "Mod boot: a wide white fold-over cuff at the top flares past the shank, then a straight ink shank, a square toe and a low block heel; the light band marks where the boot starts instead of a shine.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const x = ctx.leg.x - 1;
        const boot = `M ${x - 3.5} 58 L ${x + 2.5} 58 L ${x + 2.5} 65.5 Q ${x + 3} 66.6 ${x + 5} 66.8 L ${x + 8} 67.2
          Q ${x + 9.2} 67.4 ${x + 9.2} 69 L ${x + 9.2} ${SOLE} L ${x + 1.5} ${SOLE} Q ${x + 1} ${SOLE - 2} ${x - 0.5} ${SOLE - 2}
          L ${x - 0.5} ${SOLE} L ${x - 6.5} ${SOLE} L ${x - 6.5} 68.6 Q ${x - 5.5} 67.2 ${x - 3.5} 66.6 Z`;
        // the cuff's top tucks just under the wing's scallops (y ≈55 over the
        // near leg) so no leg shows above it, and it is 5.6u tall so most of it
        // shows: half-hidden it was a white slit in a black block, a mouth
        const cuff = `M ${x - 5} 55.6 L ${x + 4} 55.6 L ${x + 3.4} 61.2 L ${x - 4.4} 61.2 Z`;
        return `<path fill="${c.base}" ${ctx.inkStroke(2)} d="${boot}"/>
          <path fill="${c.on}" ${ctx.inkStroke(2)} d="${cuff}"/>`;
      }
    }
  ]
};

export const ITEMS = [
  cropJacket,
  tracksuitTop,
  littleBlackDress,
  unionJackDress,
  stripeSleeve,
  puffSleeve,
  bigBow,
  ribbonStreamers,
  platformTrainers,
  goGoBoots
];
