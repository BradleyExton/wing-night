// disco · kit: the Top, Sleeve, Tail and Boots items of the disco rail
// (docs/research/bird-wardrobe.md §2.2). Drawn on the preener: the smallest
// chest (it shows only as a crescent between the wing's front edge and the
// neck), the biggest tail (two sickles to y 0) and 16 units of leg — so the
// loud items live on the tail, the wing and the feet, and the Tops are big
// flat value shapes that fill the crescent, each with its own signifier
// (round 1's lesson: five black crescents with cyan nicks are one item).
//
// Contract: ../outfit-harness.js. Every shape is in bird units (80×72, y down,
// facing right).

import { inkStroke, clip, COLORS } from "../outfit-harness.js";

export const GENRES = ["disco"];

const INK = COLORS.ink;
const WHITE = COLORS.white;
const EMBER = COLORS.ember;

/** A cased strand: an ink stroke with a coloured core, so a light strand survives on cyan. */
const cased = (d, color, core = 2.4, edge = 1.6, join = "round") =>
  `<path fill="none" stroke="${INK}" stroke-width="${core + 2 * edge}" stroke-linecap="round" stroke-linejoin="${join}" d="${d}"/>` +
  `<path fill="none" stroke="${color}" stroke-width="${core}" stroke-linecap="round" stroke-linejoin="${join}" d="${d}"/>`;

/** A star of n points, radius r, inner ratio k, turned by `turn` degrees. */
const star = (cx, cy, r, n = 5, k = 0.45, turn = 0) => {
  const pts = [];
  for (let i = 0; i < 2 * n; i += 1) {
    const rad = i % 2 === 0 ? r : r * k;
    const a = ((-90 + turn) * Math.PI) / 180 + (i * Math.PI) / n;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
};

/** A four-point sequin sparkle: long thin rays, so it is a glint and never a flower. */
const sparkle = (cx, cy, r, k = 0.42) => star(cx, cy, r, 4, k);

// Everything visible of the chest: the body below y 37 and in front of the
// wing's front edge (traced from the preener wing, pivot round to the
// trailing edge), so a Top fills the body right up to the wing without
// painting over it. Clipped to the body by the caller. The neck is painted
// after the Top and covers it above the line (45,33)–(60,40), so that line is
// the Top's real upper edge at the throat.
const CHEST = "M 47 37 L 70 37 L 70 60 L 20 60 L 23 54 C 28 48 33 43 40 41 C 46 40 49.5 38.5 48 37 Z";

/** The chest, filled, clipped to the body: the shirt ground every Top starts from. */
const chestGround = (bodyPath, color, inner) => {
  const c = clip(bodyPath);
  return `<defs>${c.def}</defs><g clip-path="${c.url}"><path fill="${color}" d="${CHEST}"/>${inner}</g>`;
};

// ------------------------------------------------------------------- TOP --

// The open shirt's V: deep, its apex below the belly outline, so the cyan
// opening runs off the bottom of the bird — unbuttoned to the navel.
const OPEN_V = "M 45 37 L 68 37 L 57.5 57 Z";
// a's V is narrower, so a strip of the white shirt shows in front of it too
// and the white reads as a shirt worn open, not as a white belly.
const SHIRT_V = "M 50 37 L 62.6 37 L 56 55 Z";

/** `inner` clipped to the visible chest, so nothing on the shirt crosses onto the wing. */
const onChest = (inner) => {
  const c = clip(CHEST);
  return `<defs>${c.def}</defs><g clip-path="${c.url}">${inner}</g>`;
};

const openShirt = {
  id: "open-shirt",
  slot: "top",
  name: "Open shirt",
  note: "The shirt unbuttoned to the navel, bare chest showing. Each variant carries one disco signifier that survives 76px: the loud lapel, the medallion, the sequins.",
  variants: [
    {
      key: "a",
      note: "The loud shirt: a WHITE shirt, so it is never the bird's black belly and it parts from every ink sleeve, open in a deep cyan V, with one big ember 70s lapel laid back along the V's back edge — the V and the lapel are one silhouette. Round 2's ink shirt with a white collar triangle read as a tuxedo front or a penguin bib.",
      styles: ["white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, styleFill }) =>
        chestGround(
          bodyPath,
          styleFill,
          `<path fill="${styleFill}" ${inkStroke(2)} d="${CHEST}"/>
           <path fill="${fill}" ${inkStroke(2)} d="${SHIRT_V}"/>
           <path fill="${EMBER}" ${inkStroke(1.6)} d="M 50 37 L 53.6 37 L 56.8 49.6 L 45.2 46.8 Z"/>`
        )
    },
    {
      key: "b",
      note: "The medallion: an ink shirt open to the navel in a deep cyan V, and a big solid ember medallion (12 units across with its casing) hung on a heavy chain in the V — the largest light shape on the chest, sitting wholly on the bare chest so it is a pendant and never a button. Every ember line is cased in ink so it reads on cyan; the disc is solid, no ring and no dark centre.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, styleFill }) =>
        chestGround(
          bodyPath,
          styleFill,
          `<path fill="${fill}" ${inkStroke(2)} d="${OPEN_V}"/>
           ${cased("M 51 38.6 L 56.8 41.2 L 61.8 38", EMBER, 1.8, 1)}
           <circle fill="${EMBER}" ${inkStroke(1.6)} cx="56.8" cy="45" r="4.6"/>`
        )
    },
    {
      key: "c",
      note: "The sequin shirt: the same open ink shirt, the glitter on the cloth instead of round the neck — one big ember four-point sparkle (12.4 tip to tip) on the ink panel below the wing and a smaller one (8.4) down and behind it on a diagonal, never level and never the same size, both wholly on the cloth (round 2's belly-clipped small one was a crumb), so the two can never pair into a pair of eyes.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, styleFill }) =>
        chestGround(
          bodyPath,
          styleFill,
          `<path fill="${fill}" ${inkStroke(2)} d="M 49 37 L 67 37 L 56 52 Z"/>
           <path fill="${EMBER}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(46.6, 47.3, 6.2, 0.42)}"/>
           <path fill="${EMBER}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(37.2, 50.8, 4.2, 0.42)}"/>`
        )
    }
  ]
};

// The Night Fever collar: the black shirt's V and its spread collar as one
// ink shape on a light jacket. Round 2 cut the two-separate-blade versions:
// two points with light between them read as a sawtooth jaw, and two light
// points on ink read as fangs whatever their colour.
const FEVER_COLLAR = "M 49.5 37 L 62 37.5 L 59.8 41.5 L 55.5 52 L 51.5 42.5 L 44 48.5 Z";
// The buttoned shirt under the kipper tie: a black shirt front from the throat
// down the middle, its collar points spread out over the white lapels — the
// back one long, toward the wing. The tie blade covers its middle.
const TIE_SHIRT = "M 46 37 L 61 37.5 L 59.6 43.2 L 55.6 41.2 L 56.8 51 L 47.4 51 L 48.4 42.6 L 39.5 47.8 Z";
// The kipper: a small knot at the throat and a 10-unit blade that widens to a
// point above the belly outline. Ember, never the team colour: a cyan blade on
// the black shirt reads as bare chest, which is b's open V again.
const KIPPER = "M 49.6 38.6 L 54.6 38.6 L 53.8 42 L 57.2 48.8 L 52.2 52.6 L 47.2 48.8 L 50.4 42 Z";

const daggerCollar = {
  id: "dagger-collar",
  slot: "top",
  name: "Dagger collar",
  note: "The 1977 collar: two long points spread at the shoulders, kept under the neck. The collar is always the one dark shape on a light jacket, never two light points on a dark one (fangs). The style is the jacket's: a white suit wants an ink or team sleeve beside it.",
  variants: [
    {
      key: "b",
      note: "The Night Fever suit: a white jacket, the black shirt open in a narrow V, and the shirt's black collar spread out over the white lapels — the poster, in one ink shape. The style names the jacket (its dominant value), so the pair rule measures what the eye sees; the gold lamé suit is the trial.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, styleFill }) =>
        chestGround(bodyPath, styleFill, `<path fill="${INK}" ${inkStroke(1.2)} d="${FEVER_COLLAR}"/>`)
    },
    {
      key: "c",
      note: "The kipper tie: the white suit, a black shirt buttoned up under a spread black collar, and a fat ember kipper tie down the middle, widening to its point — the 1975 leisure suit. b is the shirt open in a V; c is the shirt done up with a tie, so the middle of the chest is an ember blade on ink, never a black wedge and never a bare-chest cyan V.",
      styles: ["white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, styleFill }) =>
        chestGround(
          bodyPath,
          styleFill,
          `<path fill="${INK}" ${inkStroke(1.2)} d="${TIE_SHIRT}"/>
           <path fill="${EMBER}" ${inkStroke(1.4)} stroke-linejoin="round" d="${KIPPER}"/>`
        )
    }
  ]
};

// The rib collar starts under the neck's lower edge and runs 5 units down
// from it, so it shows as a band at the throat and not a floating sliver.
const RIB = "M 46 32.6 L 62.5 40.3 L 61.8 45.2 L 46 37.6 Z";
// a's piping: a white line just under the rib's lower edge, its ink stroke
// left showing between them, so the collar is a cased band on the ink jacket.
const RIB_PIPING = "M 45.5 38.9 L 61.3 46.5";

// b's triple stripe: three level bars, each starting on the wing's trailing
// edge (sampled from CHEST's curve, so a bar never paints over the wing) and
// running to the front, where the body clip trims it. The white stripes carry
// no stroke, so a strip of jacket always shows between them and the band.
const STRIPE_HI = "M 43.86 40.2 L 70 40.2 L 70 42.6 L 35.91 42.6 L 37.68 41.8 L 40 41 Z";
const STRIPE_BAND = "M 32.88 44.4 L 70 44.4 L 70 49 L 27.48 49 L 29.06 47.47 L 30.83 45.93 Z";
const STRIPE_LO = "M 25.59 51 L 70 51 L 70 53.4 L 23.5 53.4 L 24.18 52.6 L 24.88 51.8 Z";

const satinJacket = {
  id: "satin-jacket",
  slot: "top",
  name: "Satin jacket",
  note: "The roller-rink jacket: ink, zipped closed to a team-colour rib collar (no bare V, so it is never the open shirt), with one big team-colour accent that cuts across the cloth.",
  variants: [
    {
      key: "a",
      note: "The rink patch: closed ink jacket, team rib collar edged below with a white piping line (so the collar shows as a band at 76 and is not lost in the cyan neck), and one big sharp team-colour star (13 units across, tilted, thin points) set back on the breast toward the wing, off the belly's centre and clipped to the chest. The star stays team-coloured in every style (an ink star on white is a splat); in the white style the rib turns ink and the piping drops.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, style, styleFill }) => {
        const white = style === "white";
        const rib = white ? INK : fill;
        const piping = white ? "" : `<path fill="none" stroke="${WHITE}" stroke-width="1.6" stroke-linecap="butt" d="${RIB_PIPING}"/>`;
        return chestGround(
          bodyPath,
          styleFill,
          onChest(
            `<path fill="${rib}" ${inkStroke(1.2)} d="${RIB}"/>${piping}
             <path fill="${fill}" ${inkStroke(1.2)} stroke-linejoin="miter" d="${star(41.6, 48.4, 6.4, 5, 0.42, 12)}"/>`
          )
        );
      }
    },
    {
      key: "b",
      note: "The rink stripe: closed ink jacket, team rib collar, and one level team-colour band straight across the chest, edged above and below by a 2.4-unit flat white stripe with a gap of jacket between — the team, white and ink triple stripe of a roller-rink jacket, which no feather pattern makes. Each stripe runs from the wing's trailing edge to the front. In the white style the band stays team colour and the stripes and rib turn ink.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, style, styleFill }) => {
        const white = style === "white";
        const rib = white ? INK : fill;
        const pin = white ? INK : WHITE;
        return chestGround(
          bodyPath,
          styleFill,
          `${onChest(`<path fill="${rib}" ${inkStroke(1.2)} d="${RIB}"/>`)}
           <path fill="${pin}" d="${STRIPE_HI}"/>
           <path fill="${pin}" d="${STRIPE_LO}"/>
           <path fill="${fill}" ${inkStroke(2)} d="${STRIPE_BAND}"/>`
        );
      }
    }
  ]
};

// ---------------------------------------------------------------- SLEEVE --

// The preener wing: M 47 34 C 37 29 21 32 17 43 C 16 48 19 53 23 54 C 28 48
// 33 43 40 41 C 46 40 50 38 47 34 Z — back tip near (16.6, 46), trailing
// edge the lower curve from (23, 54) up to the pivot.

// The bell flares back along the wing's own axis, past the back tip
// (16.6, 46): its upper edge runs on along the line from the pivot through
// the back tip (the sleeve rule allows nothing off the wing above that line),
// its mouth no more than 7 units past the trailing edge and its lowest point
// near y 56 — round 2's bell hung straight down beside the thigh
// and read as a patch on the bird's rear, not the mouth of a sleeve.
const BELL = "M 27 34 C 24 39 25 45 29 49 L 21.6 55 C 17 56.2 12.6 53 10.8 48.7 L 16.8 46 C 16.6 44.5 16.9 43.5 17.4 42.6 C 19 38 22.5 35 27 34 Z";
// c's cuff band: a broad ink stroke laid along the bell's joint, unclipped, so
// it shows on both sides of the seam between the white sleeve and its bell.
const BELL_CUFF = "M 27 34 C 24 39 25 45 29 49";
/** The hem just inside the bell's mouth: the line that says "cuff". */
const BELL_HEM = "M 20.2 52.9 L 13.2 48.6";

const flareSleeve = {
  id: "flare-sleeve",
  slot: "sleeve",
  name: "Flare sleeve",
  note: "A sleeve with a bell cuff: the bell-bottom of the arm. Only a silhouette change says bell — a value change inside the outline reads as plumage (round 2's magpie wing) — and the bell is always light, because it flares out over the dark floor where an ink bell vanishes.",
  variants: [
    {
      key: "b",
      note: "The white trumpet: a white bell flares back out of the ink wing along its axis, past the back tip, with an ink hem line inside its mouth.",
      styles: ["ink", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, styleFill }) =>
        `<path fill="${styleFill}" ${inkStroke(2)} d="${wingPath}"/>
         <path fill="${WHITE}" ${inkStroke(2)} d="${BELL}"/>
         <path fill="none" ${inkStroke(1.4)} stroke-linecap="round" d="${BELL_HEM}"/>`
    },
    {
      key: "c",
      note: "The white flare: the whole sleeve in white satin, flaring at its back end into b's wide white trumpet, a broad ink cuff band round the joint and the hem line in its mouth. b is a black sleeve with a white bell; c is one white flared sleeve banded in black — the bell is light against the dark floor either way, so the flare always reads by silhouette, and a white sleeve contrasts with every ink Top.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, styleFill }) =>
        `<path fill="${styleFill}" ${inkStroke(2)} d="${wingPath}"/>
         <path fill="${styleFill}" ${inkStroke(2)} d="${BELL}"/>
         <path fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" d="${BELL_CUFF}"/>
         <path fill="none" ${inkStroke(1.4)} stroke-linecap="round" d="${BELL_HEM}"/>`
    }
  ]
};

// The preener wing's axis, pivot (47, 34) to back tip (16.6, 46): a unit
// vector along it and one square to it.
const WING_AXIS = (() => {
  const dx = 16.6 - 47;
  const dy = 46 - 34;
  const len = Math.hypot(dx, dy);
  return { ux: dx / len, uy: dy / len, nx: -dy / len, ny: dx / len, slope: dy / dx };
})();

/**
 * A band `w` units wide laid square across the wing, centred where its axis
 * crosses x = `atX`, long enough to run past both edges (the caller clips it).
 */
const armBand = (atX, w) => {
  const { ux, uy, nx, ny, slope } = WING_AXIS;
  const cx = atX;
  const cy = 34 + (atX - 47) * slope;
  const h = w / 2;
  const L = 16;
  const p = (a, b) => `${(cx + ux * a + nx * b).toFixed(2)} ${(cy + uy * a + ny * b).toFixed(2)}`;
  return `M ${p(-h, -L)} L ${p(h, -L)} L ${p(h, L)} L ${p(-h, L)} Z`;
};

const satinSleeve = {
  id: "satin-sleeve",
  slot: "sleeve",
  name: "Satin sleeve",
  note: "A white satin wing, held by its ink outline, and always with a garment mark on it — a plain white wing reads as plumage.",
  variants: [
    {
      key: "a",
      note: "The track stripe: the white satin wing crossed by two team-colour bands across its back third, square to the wing's axis, top edge to trailing edge, white between them — the stripe round the arm of a tracksuit or a rink jacket, a garment mark that no feather makes. Round 2's plain white wing read as a white-winged bird. b keeps the star, so the two never meet. The bands stay team in the gold trial.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, fill, styleFill }) => {
        const c = clip(wingPath);
        return `<path fill="${styleFill}" d="${wingPath}"/>
          <defs>${c.def}</defs><g clip-path="${c.url}">
            <path fill="${fill}" ${inkStroke(1.2)} d="${armBand(22.6, 3.5)}"/>
            <path fill="${fill}" ${inkStroke(1.2)} d="${armBand(28.1, 3.5)}"/>
          </g>
          <path fill="none" ${inkStroke(2)} d="${wingPath}"/>`;
      }
    },
    {
      key: "b",
      note: "The glam sleeve: the white satin wing with one big team-colour star appliqué, thinly ink-outlined, on the wing's broad back half, turned so a valley and not a point faces the trailing edge, with about 2 units of white all round it — big enough that its points read as a star and not a ringed dot — a garment mark, never plumage, and never dark-in-light (round 2's ink star read as a pupil).",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, fill, styleFill }) =>
        `<path fill="${styleFill}" ${inkStroke(2)} d="${wingPath}"/>
         <path fill="${fill}" ${inkStroke(1)} stroke-linejoin="round" d="${star(26.5, 41.5, 5, 5, 0.5, 35)}"/>`
    }
  ]
};

// ------------------------------------------------------------------ TAIL --

// Preener tail tips: (17, 0) on the high sickle, (9, 10) on the low one.

/** A crinkled line along a cubic curve: the points pushed ±amp off the curve's normal, alternately. */
const crinkleC = (p0, c1, c2, p1, n, amp) => {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const u = 1 - t;
    const x = u ** 3 * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * p1[0];
    const y = u ** 3 * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * p1[1];
    const dx = 3 * u * u * (c1[0] - p0[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p1[0] - c2[0]);
    const dy = 3 * u * u * (c1[1] - p0[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p1[1] - c2[1]);
    const len = Math.hypot(dx, dy) || 1;
    const o = i === 0 || i === n ? 0 : i % 2 === 0 ? amp : -amp;
    pts.push(`${(x - (dy / len) * o).toFixed(2)} ${(y + (dx / len) * o).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")}`;
};

const tinsel = {
  id: "tinsel",
  slot: "tail",
  name: "Tinsel",
  note: "Tinsel streamers off the two sickle tips — the sketch round's best read. An outline item, so it carries any style. Strands never cross and never fan from a point (a fan is a bird's foot or a hand).",
  variants: [
    {
      key: "a",
      note: "Two glinting ribbons of unequal length, one off each tip: each a broad flat ribbon fluttering in a wide S (amplitude 3, period 10 — round 2's quick ±0.6 kink was sub-pixel and the strands read as candy canes or steam lines) and ending in a big four-point glint, the long one off the low sickle down the back to y 38.5 (its glint inside the tail's 10-unit reach), the short one off the high sickle stopping above the low one. The two glints sit at different heights far apart, so they never pair into eyes. White or gold cased in ink. No team style: cyan on the cyan sickles is mush.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        `${cased(
          "M 9 10 Q 4 10 4 16 C 7 21 1 26 4 31 C 7 35 4.5 37 5.5 38.5 M 17 0 Q 20 0 20 4 C 23 8 17 12 20 16",
          styleFill, 3, 1.2
        )}
         <path fill="${styleFill}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(5.5, 38.5, 4.5)}"/>
         <path fill="${styleFill}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(20, 16, 4.5)}"/>`
    },
    {
      key: "b",
      note: "The garland: one finely crinkled tinsel rope strung across the faces of both sickles in two stacked drooping loops, high tip to low tip to body — the Christmas-tree festoon. It crosses the sickles instead of following them (a crinkle along a sickle edge reads as a serrated feather).",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        cased(
          [
            crinkleC([17, 1], [22, 18], [8, 24], [9, 10.5], 30, 0.55),
            crinkleC([9, 10.5], [3, 31], [19, 35], [27, 28], 30, 0.55)
          ].join(" "),
          styleFill, 3, 1.2, "miter"
        )
    }
  ]
};

// A boa is a long fluffy rope: drawn as a thick cased stroke whose edge is
// lumped by a second, wider dotted stroke — round bumps every 3.2 units, so
// the edge reads as feathers at 304px (not finger lobes) and merely soft at
// 76. It stays out at the back (x < 22) so it never touches the wing tip and
// never merges with a white Sleeve.
/** The boa's widths: core and fluff, each as ink casing and colour, and the fluff's bump period. */
const BOA_THIN = { core: 6.6, coreIn: 3.8, fluff: 8.6, fluffIn: 5.8, period: 3.2 };
const BOA_FAT = { core: 7.4, coreIn: 4.6, fluff: 10, fluffIn: 7.2, period: 3.6 };
const boaStroke = (d, color, w = BOA_THIN) => {
  const fluff = `stroke-dasharray="0 ${w.period}" stroke-linecap="round"`;
  const line = 'stroke-linecap="round" stroke-linejoin="round"';
  return (
    `<path fill="none" stroke="${INK}" stroke-width="${w.core}" ${line} d="${d}"/>` +
    `<path fill="none" stroke="${INK}" stroke-width="${w.fluff}" ${fluff} d="${d}"/>` +
    `<path fill="none" stroke="${color}" stroke-width="${w.coreIn}" ${line} d="${d}"/>` +
    `<path fill="none" stroke="${color}" stroke-width="${w.fluffIn}" ${fluff} d="${d}"/>`
  );
};

const featherBoa = {
  id: "feather-boa",
  slot: "tail",
  name: "Feather boa",
  note: "A boa on the tail. A boa is a long rope with loose ends, so every variant is an open line with its ends hanging long, never a loop, a rosette or a round end-tuft (two round tufts are eyes or earmuffs).",
  variants: [
    {
      key: "a",
      note: "Slung: one fat boa comes out from behind the bird's back (its end tucked behind the body, so it has no knob there), sags across both sickles to the back and falls on down the outside as ONE long loose end to y 40, like a scarf thrown over a shoulder. Round 2's two short splayed ends made it a bone with knobbed ends; one fat drape with one long tail can only be a boa.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => boaStroke("M 33.5 33 C 25 17 14 29 3 21 C 0 27 1 34 4 40", styleFill, BOA_FAT)
    },
    {
      key: "b",
      note: "Flung: the boa caught on the high sickle's tip mid-twirl, its long end streaming straight back off the top of the tail in a wave, its tip flicking down — the diva's toss. a sags across the tail and hangs; b flies out behind it, an open wave with background all round it, the tail's outline made longer.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => boaStroke("M 21.5 7 C 21 0 15 -2.5 11.5 1 C 8.5 4 7 8.5 3.5 10 C 0 11.5 -1.5 15 -0.5 20", styleFill)
    }
  ]
};

// ----------------------------------------------------------------- BOOTS --

// Each leg: hip (X, 57), shank to (X−1, 68), toes to (X−7, 70.5), (X, 71)
// and (X+6, 70.5), a 3.5-unit round stroke — so with x = X−1 the toes cover
// x−7.75..x+8.75 down to y 72.75. The thigh hides the shank down to ~y 60, so
// a boot owns y 60..72.5. Nothing may fall below 72.75, so a platform is built
// UP from the floor. The feet stand on the dark hearth, where an ink sole
// vanishes, so a sole is never ink, and it is always a different value from
// the upper (cyan under white, white under ink or gold): round 2's same-value
// sole made b one white brick with no platform.

/** The sole is always a different value from the upper: team under white, white under ink or gold. */
const soleOf = (style, fill) => (style === "white" ? fill : WHITE);

const platforms = {
  id: "platforms",
  slot: "boots",
  name: "Platforms",
  note: "Platform shoes: preener shows the most leg, the one bird where a platform reads. The sole is a tall block of its own value, the read at 76px.",
  variants: [
    {
      key: "a",
      note: "The platform shoe: a short upper on a 7-unit sole block, and the sole always a different value from the upper — a cyan sole under the white shoe, a white sole under the ink or gold one — so at 76px the platform is its own slab and not one white brick.",
      styles: ["white", "ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, style, styleFill, fill }) => {
        const x = leg.x - 1;
        return `<path fill="${soleOf(style, fill)}" ${inkStroke(1.8)} d="M ${x - 7.5} 65.5 L ${x + 8} 65.5 L ${x + 8} 72.5 L ${x - 7.5} 72.5 Z"/>
          <path fill="${styleFill}" ${inkStroke(1.8)} d="M ${x - 4.5} 60.5 L ${x + 2} 60.5 L ${x + 2.5} 62 C ${x + 5.5} 62.5 ${x + 8} 63.5 ${x + 8} 65.5 L ${x - 7.5} 65.5 C ${x - 7} 63.5 ${x - 5.5} 61.5 ${x - 4.5} 60.5 Z"/>`;
      }
    },
    {
      key: "b",
      note: "Knee-high platform boot: the upper runs from under the thigh down to an 8.5-unit sole block, so all the leg you see is boot, standing on a slab of its own value (a's sole rule) — the go-go boot on a platform, not one white brick.",
      styles: ["white", "ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, style, styleFill, fill }) => {
        const x = leg.x - 1;
        return `<path fill="${soleOf(style, fill)}" ${inkStroke(1.8)} d="M ${x - 6.5} 64 L ${x + 7.5} 64 L ${x + 7.5} 72.5 L ${x - 6.5} 72.5 Z"/>
          <path fill="${styleFill}" ${inkStroke(1.8)} d="M ${x - 3} 55.5 L ${x + 3.5} 55.5 L ${x + 3} 61 C ${x + 5.5} 61.4 ${x + 7.5} 62.5 ${x + 7.5} 64 L ${x - 6.5} 64 C ${x - 5} 62 ${x - 3.6} 59.5 ${x - 3} 55.5 Z"/>`;
      }
    }
  ]
};

// A skate hides the whole foot: the ink plate runs x−8..x+8 (9 units from the hip, the Boots region) and drops to
// y 70.4 behind the wheels, a truck block fills the gap between the wheels
// down to 72.6, and the wheels sit over the outer toes. Wheels are solid
// discs (no hub: a light disc with a dark centre is an eye) and their fill
// never passes 72.75.
const skateBase = (x, wheel, r, cy, back, front) =>
  `<path fill="${INK}" d="M ${x - 8} 66.4 L ${x + 8} 66.4 L ${x + 8} 70.4 L ${x - 8} 70.4 Z"/>
   <path fill="${INK}" d="M ${x - 2} 69 L ${x + 3} 69 L ${x + 2.6} 72.6 L ${x - 1.6} 72.6 Z"/>
   <circle fill="${wheel}" ${inkStroke(1.8)} cx="${x + back}" cy="${cy}" r="${r}"/>
   <circle fill="${wheel}" ${inkStroke(1.8)} cx="${x + front}" cy="${cy}" r="${r}"/>`;

const rollerSkates = {
  id: "roller-skates",
  slot: "boots",
  name: "Roller skates",
  note: "Quad skates for the rink, big wheels kept apart under heel and toe; the bird's toes never show. The wheels' lowest point is y 72.7.",
  variants: [
    {
      key: "a",
      note: "The classic high-top: a light roller boot laced up the shank, on an ink plate, with two big team-colour wheels (white in the ink style).",
      styles: ["white", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, style, styleFill, fill }) => {
        const x = leg.x - 1;
        const wheel = style === "ink" ? WHITE : fill;
        return `${skateBase(x, wheel, 3, 69.7, -4.8, 5)}
          <path fill="${styleFill}" ${inkStroke(1.8)} d="M ${x - 4.5} 59.5 L ${x + 2} 59.5 L ${x + 2.5} 62.5 C ${x + 5.5} 63 ${x + 7.5} 64.5 ${x + 7.5} 67 L ${x - 7} 67 C ${x - 7.2} 64 ${x - 5.5} 61.5 ${x - 4.5} 59.5 Z"/>`;
      }
    },
    {
      key: "b",
      note: "The roller-girl boot: the skate boot runs knee-high from under the body, with a broad ember band round the shin below the thigh — a warm stripe between the boot and its white wheels that never touches the cyan belly. a is cyan wheels; b is an ember-banded boot. Round 2's team cuff butted onto the belly and merged into it, and its 1-unit laces were noise.",
      styles: ["white", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, styleFill }) => {
        const x = leg.x - 1;
        return `${skateBase(x, WHITE, 3, 69.7, -4.8, 5)}
          <path fill="${styleFill}" ${inkStroke(1.8)} d="M ${x - 3.4} 55 L ${x + 3.6} 55 L ${x + 3} 63 C ${x + 5.5} 63.5 ${x + 7.5} 65 ${x + 7.5} 67 L ${x - 7} 67 C ${x - 6} 64 ${x - 3.8} 61 ${x - 3.4} 55 Z"/>
          <path fill="${EMBER}" ${inkStroke(1.6)} d="M ${x - 3.6} 60 L ${x + 3.8} 60 L ${x + 3.4} 64 L ${x - 3.8} 64 Z"/>`;
      }
    }
  ]
};

export const ITEMS = [openShirt, daggerCollar, satinJacket, flareSleeve, satinSleeve, tinsel, featherBoa, platforms, rollerSkates];
