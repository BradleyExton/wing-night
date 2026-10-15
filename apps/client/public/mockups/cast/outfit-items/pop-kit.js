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

import { clip, starPath } from "../outfit-harness.js";

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
const garment = (ctx, panel, fill, { onEdge = "", onEdgeWithin = "", inBody = "" } = {}) => {
  const body = clip(ctx.bodyPath);
  const p = clip(panel);
  // onEdgeWithin: one more area the onEdge shapes are kept to, outside the
  // panel's clip so the panel stays the clip they are measured by
  const w = onEdgeWithin ? clip(onEdgeWithin) : null;
  const edge = w ? `<g clip-path="${w.url}"><g clip-path="${p.url}">${onEdge}</g></g>` : `<g clip-path="${p.url}">${onEdge}</g>`;
  return `<defs>${body.def}${p.def}${w ? w.def : ""}</defs>
    <g clip-path="${body.url}"><path fill="${fill}" ${ctx.inkStroke(2)} d="${panel}"/></g>
    ${onEdge ? `<g clip-path="${body.url}">${edge}</g>` : ""}
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
      note: "The V-neck: the bomber's white body and ink rib hem, opened at the throat in one short pink V that closes inside the chest (apex y 44), so the white either side of it joins below as one piece. White only: in ink the rib was ink on ink and the crop line vanished, and an ink bomber is b's job.",
      styles: ["white"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const hem = 53;
        const notch = `M 54 ${TOP_Y} L 58 44 L 62 ${TOP_Y}`;
        // the rib in the colour that reads on the body, so it is always a hem
        const band = `<path fill="${c.on}" d="M 38 ${hem - 4.5} L 74 ${hem - 3} L 74 ${hem + 4} L 38 ${hem + 4} Z"/>`;
        return garment(ctx, JACKET(hem), c.base, { inBody: `${band}<path fill="${c.team}" ${ctx.inkStroke(2)} d="${notch}"/>` });
      }
    },
    {
      key: "b",
      note: "Star bomber: an ink crop where a is white, closed at the throat (no V), with a white rib hem so the crop line shows against the pink belly, and one big team-pink star (14u across, ink-edged, clear of the rib so it never splits the white into two dashes) on the chest where a letterman puts its patch. Ink only: on the white body the star chopped the white into small pieces. (Also dropped: an ink rib collar under the neck, which chopped the white into a skull.)",
      styles: ["ink"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        // a longer cut than a, so the rib below the star is a full 3.5u band
        const hem = 56;
        const band = `<path fill="${c.on}" ${ctx.inkStroke(2)} d="M 38 ${hem - 4.6} L 74 ${hem - 3.4} L 74 ${hem + 4} L 38 ${hem + 4} Z"/>`;
        const star = `<path fill="${c.team}" ${ctx.inkStroke(2)} stroke-linejoin="round" d="${starPath(55.6, 44.5, 7)}"/>`;
        return garment(ctx, JACKET(hem), c.base, { inBody: band + star });
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
      note: "Full-length track top: chest and front in ink, back under the wing, hemmed level at y 56 by a plain band with one 2u ink hem line on its top edge. The two white stripes run down the front (zip) edge only, from the neck to the hem, and end square there: they are clipped to the front (x ≥ 49, y ≤ 56), so no white curves under the belly or the wing (that wrap read as ribs, and in Sporty it ran parallel to the sleeve's arcs).",
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
        const hemBand = `<path fill="${c.base}" d="M 28 56 L 74 56 L 74 61 L 28 61 Z"/>
          <path fill="none" ${ctx.inkStroke(2)} d="M 28 56 L 74 56"/>`;
        return garment(ctx, panel, c.base, { onEdge: bands, onEdgeWithin: "M 49 30 L 80 30 L 80 56 L 49 56 Z", inBody: hemBand });
      }
    },
    {
      key: "b",
      note: "Shell suit: the same full-length track top as a, colour-blocked the nineties way in three diagonal blocks: a white yoke over the chest, a 6u team-pink band falling steeply from under the wing to the front edge (each edge inked 2u), and the ink lower body under it. White, pink and ink on a steep diagonal is the windbreaker read; a is stripes on one value, and crop-jacket a's level hem is a different line. Ink only: the white style (ink yoke, white lower body) read as a penguin's white belly.",
      styles: ["ink"],
      whitePoints: 1,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const panel = `M 46.5 ${TOP_Y} C 50 40 51.5 46 46.5 52 L 38 54.6 L 30 57 L 30 60.5 L 64 58.5 L 72 58.5 L 72 ${TOP_Y} Z`;
        // the band's edges, run on past the panel at both ends (the panel clips them)
        const upper = (dy) => `M 40 ${45.5 + dy} L 46 ${45 + dy} C 53 ${44 + dy} 60 ${46.5 + dy} 71 ${51 + dy} L 77 ${53.6 + dy}`;
        const upperBack = (dy) => `L 77 ${53.6 + dy} L 71 ${51 + dy} C 60 ${46.5 + dy} 53 ${44 + dy} 46 ${45 + dy} L 40 ${45.5 + dy}`;
        const yoke = `<path fill="${c.on}" d="M 40 ${TOP_Y} L 77 ${TOP_Y} ${upperBack(0)} Z"/>`;
        const band = `<path fill="${c.team}" d="${upper(0)} ${upperBack(6)} Z"/>`;
        const edges = `<path fill="none" ${ctx.inkStroke(2)} d="${upper(0)} ${upper(6)}"/>`;
        return garment(ctx, panel, c.base, { inBody: yoke + band + edges });
      }
    }
  ]
};

// The little black dress keeps the bird's outline: b runs a pink rim inside
// the body's edge all round the dress, a cuts a pink waist wedge into the
// front edge, so the ink never melts into the outline and the dark room (the
// critic's "black chest bib"). Its skirt runs back
// under the wing: its top edge IS the wing's scalloped trailing edge (ink on
// the wing's own ink line, so it reads as tucked under the arm), and its hem
// sits 3-4u above the body's bottom so the near leg steps out below it.
const LBD_RIM = (c) => [[c.team, 5.6]];
const UNDER_WING = "L 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51";
const LBD_HEM = "L 72 51 L 62 53.2 C 57 55.6 50 58.6 41 59.6 C 33 60 27 58.5 22.5 56.3";

const littleBlackDress = {
  id: "little-black-dress",
  slot: "top",
  name: "Little black dress",
  note: "Posh: a short ink dress on the pink bird. The cue is the silhouette (bodice, waist, a skirt that flares back under the wing, legs stepping out below the hem) in ink on pink, never a chest patch, and never ink laid flat against the bird's own outline: a pinches a pink wedge into the front edge, b keeps a pink rim inside the body's edge.",
  variants: [
    {
      key: "a",
      note: "Front hourglass: the dress fills the whole chest between the wing and the front, with a neckline straight across at y 39 from the wing's front edge. The hourglass is cut into the FRONT edge, where it shows against the room: the dress leaves the body's edge at y 42, slopes in to a pointed waist at (56.5,49) so a wedge of the bird's own pink about 6.5u deep and 13u tall shows between the dress and the outline (inked on the dress side only), and flares back out to the edge at y 55.5: a > of pink on the front, the hourglass's side. Then a level hem at y 57.5 runs from the front back under the wing, so a band of pink belly shows under the skirt above the legs. Black bodice, pink pinch, black skirt, pink band, legs. No rim: the waist wedge already parts the ink from the outline. (Round 2 pinched the back edge at the wing instead and the dress was a dark sliver that read as a heavy outline.)",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const panel = `M 48.5 39 L 72 39 L 72 41.5 L 64.5 41.5 C 61.5 43.5 58 46.5 56.5 49 C 58 51.5 60.5 54 63 56
          L 72 56 L 72 57.5 L 24 57.5 ${UNDER_WING} C 47 48.5 49.2 44 49.2 41.4 C 49.2 40.2 48.9 39.4 48.5 39 Z`;
        return garment(ctx, panel, c.base);
      }
    },
    {
      key: "b",
      note: "Strapless with a big bow: no straps, so a band of pink shoulder shows above a straight neckline at y 42; the bodice fills the chest from the wing to the front edge, the skirt runs back under the wing like a's, and a big pink bow (12.5u across, inked only round its outside) is tied at the waist where its loops stand out on the black. Where a reads by its pinched waist, b reads by pink shoulders and Posh's bow.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const panel = `M 49 42.5 L 72 41.5 ${LBD_HEM} ${UNDER_WING}
          C 49 47.5 50.2 45 49 42.5 Z`;
        const bow = `<g transform="translate(55.5 48.6) rotate(-10) scale(0.74)">${silhouette(ctx, BOW, c.team, 2)}</g>`;
        return garment(ctx, panel, c.base, { onEdge: edgeBands(ctx, LBD_RIM(c)) }) + bow;
      }
    }
  ]
};

// The Union Jack dress's skirt hem: cut diagonally from under the chest down
// to the body's bottom edge, so a wedge of pink lower body shows below it
// behind the near leg and the bird keeps its silhouette on the dark room.
const DIAGONAL_HEM = `L 72 74 L 58 74 L 57 66 L 38 56.5 L 38 54.6 L 46.5 52`;

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

const stripeSleeve = {
  id: "stripe-sleeve",
  slot: "sleeve",
  name: "Tracksuit stripes",
  note: "White bands on the wing: the tracksuit's arm.",
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
      note: "Three stripes: three 2.6u white bars slanted across the wing, 5.2u apart centre to centre so the gaps match the bars, the sportswear mark. (Two bars read as a tilted pause icon on ink and as slashes on pink.)",
      styles: ["team", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const bands = ["M 20 31 L 32 57.5", "M 25.2 29 L 37.2 55.5", "M 30.4 27 L 42.4 53.5"]
          .map((d) => `<path fill="none" stroke="${c.white}" stroke-width="2.6" d="${d}"/>`)
          .join("");
        return wingGarment(ctx, c.base, bands);
      }
    }
  ]
};

// The ruffle hangs off the wing's scalloped trailing edge, in the sleeve's
// 7-unit fringe below it: its top is tucked under the wing (the wing is
// redrawn over it), its hem a run of three broad lobes that step up towards
// the front the way the trailing edge does. One white shape inked only round
// its outside, so no ink line splits the lobes into teeth.
const RUFFLE = `M 21 48 L 47.5 46.5 L 47.5 52 Q 47.8 56.4 44.6 57.4 Q 42.4 57.8 41.4 55.9
  Q 38.1 62.4 34.6 56.8 Q 31.2 63.6 27.6 57.6 Q 24.2 64.2 20.8 57.4 Q 19.8 53 21 48 Z`;
// The wing redrawn over the ruffle with its trailing edge smoothed through the
// scallop tips: a sleeve's cuff, one clean line. Over the white, the wing's own
// scallops zig-zagged across the frill and read as teeth.
const CUFF_WING = "M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 C 31 54.6 39 53.4 45 51 C 49 46 51 40 47 35 Z";

const puffSleeve = {
  id: "puff-sleeve",
  slot: "sleeve",
  name: "Party sleeve",
  note: "Baby and the stage: a sleeve that changes the wing's outline or its whole value, never a colour patch inside it. (The id is round 1's puff sleeve; no puff reads inside the outline, so the item is the party sleeve now.)",
  variants: [
    {
      key: "a",
      note: "Ruffle cuff: the wing's scalloped trailing edge is smoothed into one clean cuff line through the scallop tips, and a white frill hangs below it, one broad lobe (about 7u wide, 3-4u deep) under each tip so it steps up towards the front with the arm. An outline change below the arm, the baby-doll ruffle, where b is a value change on it. Inked only round its outside, so no line splits the lobes. White only: in ink it was a dark underside, a shadow. (Replaces the shoulder cap, which inside the outline could only be a white patch with a slash; the wing's own scallops over the frill zig-zagged into teeth, hence the smooth cuff.)",
      styles: ["white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        return `${silhouette(ctx, RUFFLE, c.base, 1.6)}<path fill="${c.team}" ${ctx.inkStroke(2)} d="${CUFF_WING}"/>`;
      }
    },
    {
      key: "b",
      note: "Star sleeve: the whole wing an ink sleeve with one big star on it (18u across, upright, ink-edged), the spec's star patch as a Sleeve style. Team pink by default, white as a style. Where a changes the outline under the wing, b reads by a pink star on black. Not with crop-jacket b, which wears the same pink star on black. (Replaces round 1's Juliet ball on an ink arm, whose pink ball melted into the pink body.)",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const star = `<path fill="${c.base}" ${ctx.inkStroke(2)} stroke-linejoin="round" d="${starPath(34, 43.6, 9.5)}"/>`;
        return wingGarment(ctx, c.ink, star);
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
 * joined end to start), `width(s)` wide at the fraction s of its length, its
 * end cut into a swallowtail fork `fork` units deep: the fork is what says
 * "ribbon" rather than "squiggle".
 */
const ribbonBand = (segments, width, fork) => {
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
    const w = width(i / n) / 2;
    left.push({ x: p.x - tangent.y * w, y: p.y + tangent.x * w });
    right.push({ x: p.x + tangent.y * w, y: p.y - tangent.x * w });
  });
  const end = samples[n];
  const notch = { x: end.x - tangent.x * fork, y: end.y - tangent.y * fork };
  const f = (p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  return `M ${left.map(f).join(" L ")} L ${f(notch)} L ${right.reverse().map(f).join(" L ")} Z`;
};


/**
 * One cubic from `from` to `to` with one shallow S-wave of `amp` across it:
 * a ribbon hanging by gravity, not a flick.
 */
const hang = (from, to, amp) => {
  const d = { x: to.x - from.x, y: to.y - from.y };
  const l = Math.hypot(d.x, d.y);
  const n = { x: -d.y / l, y: d.x / l };
  const at = (s, k) => P(from.x + d.x * s + n.x * amp * k, from.y + d.y * s + n.y * amp * k);
  return [[at(0, 0), at(1 / 3, 1), at(2 / 3, -1), at(1, 0)]];
};

// Tied on just inside the top and middle tips and splayed wide (the top one
// hangs steep, the lower one swings well back) so they never hang parallel,
// which read as a tally mark; each within the tail rule's 10u of the genre tail.
const STREAMERS = [
  { from: P(12, 13), to: P(6, 30), amp: 2.6 },
  { from: P(3.2, 22), to: P(-7, 34), amp: 2.6 }
];

/** An even band, tapering gently from 3.8u at the tie to 3.0u at the fork. */
const streamerWidth = (s) => 3.8 - 0.8 * s;

const ribbonStreamers = {
  id: "ribbon-streamers",
  slot: "tail",
  name: "Ribbon streamers",
  note: "Ribbons trailing off the fan's tips: an outline change that flutters behind the bird. Each ends in a swallowtail fork, the mark that says ribbon.",
  variants: [
    {
      key: "a",
      note: "Streamers: two ribbons tied at the top and middle tips, splayed wide apart (the top one hangs steep, the lower one swings well back) so they fan out instead of hanging parallel, each an even band tapering gently from 3.8u at the tie to 3.0u at the end, with one clear S-wave (amp 2.6) and a swallowtail 3.5u deep. (Parallel straight strips read as a tally mark; flicking up and back, as flame curls; pinched at a twist, as dog-bones.)",
      styles: ["white", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const d = STREAMERS.map(({ from, to, amp }) =>
          ribbonBand(hang(from, to, amp), streamerWidth, 3.5)
        ).join(" ");
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
          (s) => 5.2 - s,
          3.8
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
      note: "Buffalo stack: a white high-top upper from under the body's edge (y 56.5) down to y 65.5, so its lower part shows below the belly with the vamp curving forward into a toe box that swells to x+8.6 under a radius-3 front corner; a 2u ink band at y 65.5-67.5, then a white platform from 67.5 to the floor (4.25u, twice a normal sole) sticking out 1u past the upper at both ends so it reads as a ledge under a shoe, with a 1.5u arch curved up under it. White sole plus ink band, where a has a grey slab. (Round 1 stacked it higher, the upper hid under the belly and the bird stood on two sugar cubes.)",
      styles: ["white", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const x = ctx.leg.x - 1;
        const upper = `M ${x - 6.6} 66 C ${x - 6.6} 62.5 ${x - 4.4} 60 ${x - 3.8} 56.5 Q ${x - 0.5} 55 ${x + 3} 56.5
          L ${x + 3.3} 58.4 C ${x + 3.6} 60.2 ${x + 4.4} 61 ${x + 5.6} 61 Q ${x + 8.6} 61 ${x + 8.6} 64 L ${x + 8.6} 66 Z`;
        const band = `M ${x - 7.6} 65.5 L ${x + 9.6} 65.5 L ${x + 9.6} 67.5 L ${x - 7.6} 67.5 Z`;
        const platform = `M ${x - 7.6} 67.5 L ${x + 8.1} 67.5 Q ${x + 9.6} 67.5 ${x + 9.6} 69 L ${x + 9.6} ${SOLE}
          L ${x + 4.6} ${SOLE} Q ${x + 1.6} ${SOLE - 1.5} ${x - 1.4} ${SOLE} L ${x - 7.6} ${SOLE} Z`;
        return `<path fill="${c.white}" ${ctx.inkStroke(2)} stroke-linejoin="round" d="${platform}"/>
          <path fill="${c.base}" ${ctx.inkStroke(2)} d="${upper}"/>
          <path fill="${c.ink}" d="${band}"/>`;
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
      note: "Mod boot: a wide white fold-over cuff (y 56.4-63, below the wing so all of it shows) flares past the shank, then a straight ink shank, a square toe and a low block heel; the light band marks where the boot starts instead of a shine.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = pal(ctx);
        const x = ctx.leg.x - 1;
        const boot = `M ${x - 3.5} 56.4 L ${x + 2.5} 56.4 L ${x + 2.5} 65.5 Q ${x + 3} 66.6 ${x + 5} 66.8 L ${x + 8} 67.2
          Q ${x + 9.2} 67.4 ${x + 9.2} 69 L ${x + 9.2} ${SOLE} L ${x + 1.5} ${SOLE} Q ${x + 1} ${SOLE - 2} ${x - 0.5} ${SOLE - 2}
          L ${x - 0.5} ${SOLE} L ${x - 6.5} ${SOLE} L ${x - 6.5} 68.6 Q ${x - 5.5} 67.2 ${x - 3.5} 66.6 Z`;
        // the cuff sits below the wing's scallops (y ≈55 over the near leg), a
        // flared band from 56.4 that shows in full: tucked under them it was a
        // 3u white slit in a black block, a mouth. Its top 1u covers the leg's
        // round cap at the hip, so no orange shows above it.
        const cuff = `M ${x - 5.5} 56.4 L ${x + 4.5} 56.4 L ${x + 3.6} 63 L ${x - 4.6} 63 Z`;
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
