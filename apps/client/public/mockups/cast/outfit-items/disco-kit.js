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

/**
 * `inner` clipped to the visible chest, so nothing on the shirt crosses onto
 * the wing, and inside that to the body, so nothing runs off the belly. The
 * body clip is the inner one: the harness measures a shape by its nearest clip.
 */
const onChest = (bodyPath, inner) => {
  const c = clip(CHEST);
  const b = clip(bodyPath);
  return `<defs>${c.def}${b.def}</defs><g clip-path="${c.url}"><g clip-path="${b.url}">${inner}</g></g>`;
};

const openShirt = {
  id: "open-shirt",
  slot: "top",
  name: "Open shirt",
  note: "The shirt unbuttoned to the navel, bare chest showing. Each variant carries one disco signifier that survives 76px: the loud lapel, the medallion, the sequins.",
  variants: [
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
    }
  ]
};

// The rib collar starts under the neck's lower edge and runs 7.5 units down
// from it (about 7 square to the band), so it reads as a band at the throat at
// 76px and not a floating sliver. Its top is cut at y 37, the chest's top
// (the neck covers the rest), so the body clip alone can hold it.
const RIB = "M 46 37 L 55.43 37 L 62.5 40.3 L 62.5 47.8 L 46 40.1 Z";
// The zip: one closed vertical line down the front, out from under the rib to
// the belly — the opposite of the open shirt's V.
const ZIP = "M 57 40.5 L 55.5 58";

const satinJacket = {
  id: "satin-jacket",
  slot: "top",
  name: "Satin jacket",
  note: "The roller-rink jacket: ink, zipped closed to a team-colour rib collar (no bare V, so it is never the open shirt), with one big team-colour accent that cuts across the cloth.",
  variants: [
    {
      key: "a",
      note: "The rink patch: a closed ink jacket zipped up the front (a 2.6-unit white zip cased in ink, out from under the collar to the belly — a closed line, never the open shirt's V), a 7-unit team rib collar that reads as a band at 76, and one big team-colour star patch (15 units across, tilted, ink-edged) set back on the breast toward the wing, clipped to the chest. Gate 1 added the zip, widened the rib and dropped its piping, and grew the star from a glint to a patch. The star stays team-coloured in every style (an ink star on white is a splat); in the white style the rib and the zip turn ink.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, style, styleFill }) => {
        const white = style === "white";
        const rib = white ? INK : fill;
        const zip = white
          ? `<path fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" d="${ZIP}"/>`
          : cased(ZIP, WHITE, 2.6, 1.2);
        return chestGround(
          bodyPath,
          styleFill,
          onChest(
            bodyPath,
            `${zip}<path fill="${rib}" ${inkStroke(1.2)} d="${RIB}"/>
             <path fill="${fill}" ${inkStroke(1.2)} stroke-linejoin="miter" d="${star(40, 49.5, 7.5, 5, 0.42, 12)}"/>`
          )
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
// The cuff band (c, and b's team style): a broad ink stroke laid along the
// bell's joint, unclipped, so it shows on both sides of the seam.
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
      note: "The white trumpet: a white bell flares back out of the ink wing along its axis, past the back tip, with an ink hem line inside its mouth. In the team style the cyan sleeve melts into the body, so Gate 1 gave it the 3.4-unit ink cuff band along the bell's joint: a dark seam between the sleeve and the white bell, so the bell stays a bell and not a paper cup.",
      styles: ["ink", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, style, styleFill }) =>
        `<path fill="${styleFill}" ${inkStroke(2)} d="${wingPath}"/>
         <path fill="${WHITE}" ${inkStroke(2)} d="${BELL}"/>
         ${style === "team" ? `<path fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round" d="${BELL_CUFF}"/>` : ""}
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
      note: "Two crinkled foil ribbons of unequal length, one off each tip, each drooping in one gentle curve with big zigzag teeth (±1.6 units, a 3.4-unit core cased 1.2 in ink, mitered so the edge is foil) and ending in a fat four-point sparkle 12 units tip to tip: the long one off the low sickle down the back to (6, 37), its sparkle inside the tail's 10-unit reach, the short one off the high sickle stopping at y 17, above the low one. Gate 1 dropped the S-wiggle, which read as stink lines. The two sparkles sit at different heights far apart, so they never pair into eyes. White or gold cased in ink. No team style: cyan on the cyan sickles is mush.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        `${cased(
          `${crinkleC([9, 10], [4, 18], [3, 28], [6, 37], 12, 1.6)} ${crinkleC([17, 0], [21, 5], [22, 11], [21, 17], 7, 1.6)}`,
          styleFill, 3.4, 1.2, "miter"
        )}
         <path fill="${styleFill}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(6, 37, 6, 0.5)}"/>
         <path fill="${styleFill}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(21, 17, 6, 0.5)}"/>`
    }
  ]
};

// A boa is a long fluffy rope: drawn as a thick cased stroke whose edge is
// lumped by a second, much wider dotted stroke — round bumps every 5.5 units
// standing about 2.75 units proud of the rope, so the edge shows as a
// scalloped fluff at 76px (Gate 1: the 3.2-unit bumps were invisible and the
// boa read as a bent pipe). It stays out at the back (x < 22) so it never
// touches the wing tip and never merges with a white Sleeve.
/** The boa's widths: core and fluff, each as ink casing and colour, and the fluff's bump period. */
const BOA_FAT = { core: 7, coreIn: 4.4, fluff: 12.5, fluffIn: 9.6, period: 5.5 };
/** b's flung end: a's fluff on its original, slimmer rope. */
const BOA_FLUNG = { ...BOA_FAT, core: 6.6, coreIn: 3.8 };
const boaStroke = (d, color, w) => {
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
      note: "Slung: one fat boa comes out from behind the bird's back (its end tucked behind the body, so it has no knob there), sags in a gentle swag back to the low sickle, curves over it and falls down the outside as ONE long loose end to y 42, like a scarf thrown over a shoulder. Gate 1 re-pathed the hard L (a bent pipe, a hockey stick) into that swag and fattened the fluff to 12.5-unit bumps every 5.5, so the edge scallops at 76.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => boaStroke("M 33.5 31 C 26 34 15 31 10 16 C 4 20 1 30 3.5 42", styleFill, BOA_FAT)
    },
    {
      key: "b",
      note: "Flung: the boa caught on the high sickle's tip mid-twirl, its start hidden at the tip so only ONE free end shows, streaming straight back off the top of the tail in a wave, its tip flicking down — the diva's toss, an open wave with background all round it, the tail's outline made longer. Gate 1 hid the second end (two knobs made a bag handle) and gave it the fat 12.5-unit fluff every 5.5 units. a sags across the tail and hangs; b flies out behind it.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        boaStroke("M 17 1.5 C 15 -2.5 10 -1 8 3 C 6 7 3 8.5 0.5 11 C -2 13.5 -2 18 -0.5 23", styleFill, BOA_FLUNG)
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
// sole made b one white brick with no platform. Gate 1: the sole is always
// white, under an ink or gold upper, never cyan (a cyan sole drops into the
// lit-floor stage).

const platforms = {
  id: "platforms",
  slot: "boots",
  name: "Platforms",
  note: "Platform shoes: preener shows the most leg, the one bird where a platform reads. The sole is a tall block of its own value, the read at 76px.",
  variants: [
    {
      key: "a",
      note: "The platform shoe: a white sole cut as a shoe — a 9-unit heel and a 7-unit toe joined over a 3-unit arch notch that shows floor — under a short ink (or gold) upper, the sole always the other value. Gate 1 replaced the flat sole block (the two feet made one two-tone brick) with that silhouette, narrowed the far shoe to 13 units so near and far only kiss (the near heel runs 3 units further back, over the back toe), and dropped the cyan sole, which vanished into the lit floor; the white style is that white sole under an ink upper, so it replaces the old ink style.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, style, styleFill }) => {
        const x = leg.x - 1;
        const upper = style === "white" ? INK : styleFill;
        // The near (back) heel runs back to x−8 to cover the back toe, which
        // pokes out behind a 6-unit heel; the far heel keeps x−5, its toe hidden
        // behind the near shoe, so the two shoes still only kiss.
        const back = leg.far ? x - 5 : x - 8;
        return `<path fill="${WHITE}" ${inkStroke(1.8)} d="M ${back} 63.5 L ${x + 1} 63.5 L ${x + 8} 65.5 L ${x + 8} 72.5 L ${x + 2} 72.5 Q ${x + 0.5} 69.5 ${x - 1} 72.5 L ${back} 72.5 Z"/>
          <path fill="${upper}" ${inkStroke(1.8)} d="M ${x - 4} 60.5 L ${x + 2} 60.5 L ${x + 2.5} 62 C ${x + 5.5} 62.5 ${x + 8} 63.5 ${x + 8} 65.5 L ${x + 1} 63.5 L ${x - 4} 63.5 Z"/>`;
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
