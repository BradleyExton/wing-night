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
const MUTED = COLORS.mutedWarm;

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
const sparkle = (cx, cy, r) => star(cx, cy, r, 4, 0.42);

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

const openShirt = {
  id: "open-shirt",
  slot: "top",
  name: "Open shirt",
  note: "The shirt unbuttoned to the navel, bare chest showing. Each variant carries one disco signifier that survives 76px: a tied knot, the medallion, the sequins.",
  variants: [
    {
      key: "a",
      note: "The collar out: an ink shirt open in a cyan V, its one big white collar point laid back across the chest toward the wing — seen in profile an open shirt shows one collar, and lying back on the diagonal it is a lapel, not a napkin. The white style swaps the two.",
      styles: ["ink", "white"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ bodyPath, fill, style, styleFill }) =>
        chestGround(
          bodyPath,
          styleFill,
          `<path fill="${fill}" ${inkStroke(2)} d="M 52 37 L 66 37 L 56.5 50 Z"/>
           <path fill="${style === "white" ? INK : WHITE}" ${inkStroke(1.6)} d="M 48.5 37 L 56.5 37 L 50 44.5 L 37 47.5 Z"/>`
        )
    },
    {
      key: "b",
      note: "The medallion: an ink shirt open to the navel, a deep cyan V of bare chest and a big solid ember medallion hung on a chain in the point of the V. The chain is what makes it a pendant and not a button; every ember line is cased in ink so it reads on cyan.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, styleFill }) =>
        chestGround(
          bodyPath,
          styleFill,
          `<path fill="${fill}" ${inkStroke(2)} d="M 48.5 37 L 67.5 37 L 57 52.5 Z"/>
           ${cased("M 52.5 38 L 57 44.2 L 62 38", EMBER, 1.1, 0.75)}
           <circle fill="${EMBER}" ${inkStroke(1.6)} cx="57" cy="47.5" r="3.4"/>`
        )
    },
    {
      key: "c",
      note: "The sequin shirt: the same open ink shirt, the glitter on the cloth instead of round the neck — three ember four-point sparkles on the ink panels.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, styleFill }) =>
        chestGround(
          bodyPath,
          styleFill,
          `<path fill="${fill}" ${inkStroke(2)} d="M 49 37 L 67 37 L 56 52 Z"/>
           <path fill="${EMBER}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(49.8, 46, 3)}"/>
           <path fill="${EMBER}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(42.5, 50, 3)}"/>
           <path fill="${EMBER}" ${inkStroke(1)} paint-order="stroke" d="${sparkle(35, 48.5, 3)}"/>`
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
  note: "The 1977 collar: two long points spread at the shoulders, kept under the neck. The collar is always the one dark shape on a light jacket, never two light points on a dark one (fangs).",
  variants: [
    {
      key: "b",
      note: "The Night Fever suit: a white jacket, the black shirt open in a narrow V, and the shirt's black collar spread out over the white lapels — the poster, in one ink shape.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, styleFill }) =>
        chestGround(bodyPath, WHITE, `<path fill="${styleFill}" ${inkStroke(1.2)} d="${FEVER_COLLAR}"/>`)
    },
    {
      key: "c",
      note: "The leisure suit: the same black shirt and spread collar, on a beige (mutedWarm) jacket whose notched lapel is drawn in as an ink seam from the collar point down to the hem — the tailoring line is what says suit, where b says it with white.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, styleFill }) =>
        chestGround(
          bodyPath,
          MUTED,
          `<path fill="none" ${inkStroke(1.4)} stroke-linecap="round" d="M 44 48.5 L 41.5 51 L 45 52.5 L 53.5 56 M 59.8 41.5 L 62.5 43.5 L 60.5 46 L 57 52.5"/>
           <path fill="${styleFill}" ${inkStroke(1.2)} d="${FEVER_COLLAR}"/>`
        )
    }
  ]
};

// The rib collar starts under the neck's lower edge and runs 5 units down
// from it, so it shows as a band at the throat and not a floating sliver.
const RIB = "M 46 32.6 L 62.5 40.3 L 61.8 45.2 L 46 37.6 Z";

const satinJacket = {
  id: "satin-jacket",
  slot: "top",
  name: "Satin jacket",
  note: "The roller-rink jacket: ink, zipped closed to a team-colour rib collar (no bare V, so it is never the open shirt), with one big team-colour accent that cuts across the cloth.",
  variants: [
    {
      key: "a",
      note: "The rink patch: closed ink jacket, team rib collar, and one fat team-colour star on the breast — arms at least 3 units wide so it survives 76px. In the white style the collar and star are ink.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, style, styleFill }) => {
        const accent = style === "white" ? INK : fill;
        const c = clip(CHEST);
        return chestGround(
          bodyPath,
          styleFill,
          `<defs>${c.def}</defs><g clip-path="${c.url}"><path fill="${accent}" ${inkStroke(1.2)} d="${RIB}"/></g>
           <path fill="${accent}" d="${star(55.5, 46.2, 5.8, 5, 0.52)}"/>`
        );
      }
    },
    {
      key: "b",
      note: "The rink stripe: closed ink jacket, team rib collar, and one level team-colour band straight across the middle of the chest, ink above and below it, butting square into the wing's slanted edge. The band is horizontal against the slanted wing edge — the broken angle is what tells a stripe of cloth from a layer of feathers.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ bodyPath, fill, style, styleFill }) => {
        const accent = style === "white" ? INK : fill;
        const c = clip(CHEST);
        return chestGround(
          bodyPath,
          styleFill,
          `<defs>${c.def}</defs><g clip-path="${c.url}"><path fill="${accent}" ${inkStroke(1.2)} d="${RIB}"/></g>
           <path fill="${accent}" ${inkStroke(2)} d="M 33.3 44 L 70 44 L 70 48.6 L 27.8 48.6 L 29.1 47.4 L 30.75 46 L 32.4 44.7 Z"/>`
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
/** The hem just inside the bell's mouth: the line that says "cuff". */
const BELL_HEM = "M 20.2 52.9 L 13.2 48.6";

const flareSleeve = {
  id: "flare-sleeve",
  slot: "sleeve",
  name: "Flare sleeve",
  note: "The ink wing with a bell cuff: the bell-bottom of the arm. Only a silhouette change says bell — a value change inside the outline reads as plumage (round 2's magpie wing).",
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
      note: "The turned-back cuff: the bell cut from the sleeve's own cloth, so the outline alone makes the flare, and its end folded back into a broad white cuff with a straight inner edge — a band across the sleeve's axis, never a crescent along its edge. b is a white trumpet; this is a dark flare with a white turn-up.",
      styles: ["ink", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, styleFill }) =>
        `<path fill="${styleFill}" ${inkStroke(2)} d="${wingPath}"/>
         <path fill="${styleFill}" ${inkStroke(2)} d="${BELL}"/>
         <path fill="${WHITE}" ${inkStroke(2)} stroke-linecap="round" d="M 24.2 52.2 L 16.8 46 L 10.8 48.7 C 12.6 53 17 56.2 21.6 55 Z"/>`
    }
  ]
};

const satinSleeve = {
  id: "satin-sleeve",
  slot: "sleeve",
  name: "Satin sleeve",
  note: "A white satin wing, held by its ink outline: the biggest single value change disco can make.",
  variants: [
    {
      key: "a",
      note: "The plain recolour: the wing in white with its 2-unit outline. The research's strongest kind.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, styleFill }) => `<path fill="${styleFill}" ${inkStroke(2)} d="${wingPath}"/>`
    },
    {
      key: "b",
      note: "The glam sleeve: the white satin wing with one team-colour star appliqué, ink-outlined, in the middle of the wing with at least 2 units of white all round it — a garment mark, never plumage, and never dark-in-light (round 2's ink star read as a pupil).",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ wingPath, fill, styleFill }) =>
        `<path fill="${styleFill}" ${inkStroke(2)} d="${wingPath}"/>
         <path fill="${fill}" ${inkStroke(1.5)} d="${star(32, 38.5, 4.6, 5, 0.5, -12)}"/>`
    }
  ]
};

// ------------------------------------------------------------------ TAIL --

// Preener tail tips: (17, 0) on the high sickle, (9, 10) on the low one.

/**
 * A crinkled strand hanging straight down at x from y0 to y1: kinks of ±amp,
 * one full kink every `period` units, always starting to the left, so two
 * strands that start a whole period apart zig in step and never close up.
 */
const kink = (x, y0, y1, amp = 1.6, period = 3) => {
  let d = `M ${x} ${y0}`;
  const step = period / 2;
  let i = 0;
  for (let y = y0 + step / 2; y < y1; y += step, i += 1) d += ` L ${(x + (i % 2 === 0 ? -amp : amp)).toFixed(2)} ${y.toFixed(2)}`;
  return `${d} L ${x} ${y1}`;
};

/** A crinkled line along a quadratic curve: the points pushed ±amp off the curve's normal, alternately. */
const crinkleQ = (p0, c, p1, n, amp) => {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1];
    const dx = 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]);
    const dy = 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]);
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
      note: "Two strands per tip hang straight down, side by side and at least 5 units apart, each finely crinkled (±1.1 every 4 units — a tighter, deeper kink read as a coiled spring) and all in step so they never close up; long enough to hang clear below the tips: white cased in ink, round ends.",
      styles: ["white", "gold", "team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        cased(
          [
            "M 17 0 L 14.5 1.5", "M 17 0 L 19.5 1.5",
            kink(14.5, 1.5, 21.5, 1.1, 4), kink(19.5, 1.5, 21.5, 1.1, 4),
            "M 9 10 L 5.5 9.5", "M 9 10 L 10.5 9.5",
            kink(5.5, 9.5, 29.5, 1.1, 4), kink(10.5, 9.5, 29.5, 1.1, 4)
          ].join(" "),
          styleFill, 1, 1, "miter"
        )
    },
    {
      key: "b",
      note: "The garland: one crinkled tinsel rope strung across the front of both sickles in two deep U swags, its loose end dropping at the back — the Christmas-tree festoon. It crosses the sickles instead of following them (a crinkle along a sickle edge reads as a serrated feather).",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        cased(
          [crinkleQ([19, 8], [16.5, 26], [10.5, 13], 30, 0.8), crinkleQ([10.5, 13], [4.5, 31], [0.5, 18.5], 30, 0.8), crinkleQ([0.5, 18.5], [-1, 23.5], [0, 29], 12, 0.8)].join(" "),
          styleFill, 1.2, 1, "miter"
        )
    }
  ]
};

// A boa is a long fluffy rope: drawn as a thick cased stroke whose edge is
// lumped by a second, wider dotted stroke — round bumps every 3.2 units, so
// the edge reads as feathers at 304px (not finger lobes) and merely soft at
// 76. It stays out at the back (x < 22) so it never touches the wing tip and
// never merges with a white Sleeve.
const BOA_FLUFF = 'stroke-dasharray="0 3.2" stroke-linecap="round"';
const boaStroke = (d, color) =>
  `<path fill="none" stroke="${INK}" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>` +
  `<path fill="none" stroke="${INK}" stroke-width="8.6" ${BOA_FLUFF} d="${d}"/>` +
  `<path fill="none" stroke="${color}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>` +
  `<path fill="none" stroke="${color}" stroke-width="5.8" ${BOA_FLUFF} d="${d}"/>`;

const featherBoa = {
  id: "feather-boa",
  slot: "tail",
  name: "Feather boa",
  note: "A boa on the tail. A boa is a long rope with loose ends, so every variant is an open line with its ends hanging long, never a loop, a rosette or a round end-tuft (two round tufts are eyes or earmuffs).",
  variants: [
    {
      key: "a",
      note: "Wrapped: the boa sags across both sickles in a catenary, tied off at the back, and its two loose ends hang long — one straight down the outside to y 38, one short to y 29, splayed apart so the two never merge into one lump — like a scarf.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        boaStroke("M 20 14 C 15 22 8 24 2.5 21 M 2.5 21 C 0 26 0 32 2 38 M 3.5 21.5 C 6 24 7.5 26 8 29", styleFill)
    },
    {
      key: "b",
      note: "Wound round: the boa spirals twice round the high sickle — two fluffy turns crossing its face on the slant, each standing proud of both edges — and its end drops free down the gap behind the body. The turns stick out past the sickle's outline, so they read as something wrapped on, never as bands in the feather.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) =>
        boaStroke("M 8.5 5 C 11.5 5.5 14.5 7 18 9.5", styleFill) +
        boaStroke("M 7 13.5 C 10.5 14 14.5 15.5 19 18.5 C 21 21 21.5 26 21.5 31", styleFill)
    }
  ]
};

// ----------------------------------------------------------------- BOOTS --

// Each leg: hip (X, 57), shank to (X−1, 68), toes to (X−7, 70.5), (X, 71)
// and (X+6, 70.5), a 3.5-unit round stroke — so with x = X−1 the toes cover
// x−7.75..x+8.75 down to y 72.75. The thigh hides the shank down to ~y 60, so
// a boot owns y 60..72.5. Nothing may fall below 72.75, so a platform is built
// UP from the floor. The feet stand on the dark hearth, where an ink sole
// vanishes, so a sole is always light: white under an ink upper, the style
// colour otherwise.

const soleOf = (style, styleFill) => (style === "ink" ? WHITE : styleFill);

const platforms = {
  id: "platforms",
  slot: "boots",
  name: "Platforms",
  note: "Platform shoes: preener shows the most leg, the one bird where a platform reads. The sole is a 6-unit light block, the read at 76px.",
  variants: [
    {
      key: "a",
      note: "The platform shoe: a short upper on a 6-unit sole, an ink seam between them, the leg bare above.",
      styles: ["white", "ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, style, styleFill }) => {
        const x = leg.x - 1;
        return `<path fill="${soleOf(style, styleFill)}" ${inkStroke(1.8)} d="M ${x - 7.5} 66 L ${x + 8} 66 L ${x + 8} 72.5 L ${x - 7.5} 72.5 Z"/>
          <path fill="${styleFill}" ${inkStroke(1.8)} d="M ${x - 4.5} 61.5 L ${x + 2} 61.5 L ${x + 2.5} 63 C ${x + 5.5} 63.5 ${x + 8} 64.5 ${x + 8} 66 L ${x - 7.5} 66 C ${x - 7} 64 ${x - 5.5} 62.5 ${x - 4.5} 61.5 Z"/>`;
      }
    },
    {
      key: "b",
      note: "Knee-high platform boot: the upper runs from under the thigh to the sole, so all the leg you see is boot.",
      styles: ["white", "ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, style, styleFill }) => {
        const x = leg.x - 1;
        return `<path fill="${soleOf(style, styleFill)}" ${inkStroke(1.8)} d="M ${x - 6.5} 67 L ${x + 7.5} 67 L ${x + 7.5} 72.5 L ${x - 6.5} 72.5 Z"/>
          <path fill="${styleFill}" ${inkStroke(1.8)} d="M ${x - 3} 55.5 L ${x + 3.5} 55.5 L ${x + 3} 63.5 C ${x + 5.5} 64 ${x + 7.5} 65.5 ${x + 7.5} 67 L ${x - 6.5} 67 C ${x - 5} 64 ${x - 3.5} 61 ${x - 3} 55.5 Z"/>`;
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
      note: "The roller-girl boot: the skate boot runs knee-high from under the body, laced with crosses up the shin, with a broad team-colour band round its top — the colour moves from the wheels (a) to the cuff, so at 76px a is cyan feet and b is a cyan-topped boot on white wheels.",
      styles: ["white", "ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ leg, style, styleFill, fill }) => {
        const x = leg.x - 1;
        const lace = style === "ink" ? WHITE : INK;
        return `${skateBase(x, WHITE, 3, 69.7, -4.8, 5)}
          <path fill="${styleFill}" ${inkStroke(1.8)} d="M ${x - 3.4} 55 L ${x + 3.6} 55 L ${x + 3} 63 C ${x + 5.5} 63.5 ${x + 7.5} 65 ${x + 7.5} 67 L ${x - 7} 67 C ${x - 6} 64 ${x - 3.8} 61 ${x - 3.4} 55 Z"/>
          <path fill="${fill}" ${inkStroke(1.6)} d="M ${x - 3.9} 54.6 L ${x + 4.1} 54.6 L ${x + 3.9} 58.8 L ${x - 3.9} 58.8 Z"/>
          <path fill="none" stroke="${lace}" stroke-width="1" stroke-linecap="round" d="M ${x + 0.8} 60 L ${x + 2.8} 62 M ${x + 2.8} 60 L ${x + 0.8} 62 M ${x + 1.4} 62.6 L ${x + 3.6} 64.6 M ${x + 3.6} 62.6 L ${x + 1.4} 64.6"/>`;
      }
    }
  ]
};

export const ITEMS = [openShirt, daggerCollar, satinJacket, flareSleeve, satinSleeve, tinsel, featherBoa, platforms, rollerSkates];
