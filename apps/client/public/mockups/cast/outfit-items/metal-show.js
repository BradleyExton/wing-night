// metal · show: the Prop and Stage items of the metal rail (docs/research/bird-wardrobe.md §2.2).
// Contract: the top of ../outfit-harness.js.
//
// Where a Prop can live (run 1b, §2.1). A prop is drawn only in the parade,
// the intro lineup and the portal, so it is swept at rest (0°) and the walk
// tuck (−8°) strictly — out of the head box (x 36..80, y −12..37) and above
// the floor — and at the dance extremes (−26°, −62°) and metal's Moves plus
// the Chicken Dance softly: it may pass behind the head and dip 4 under the
// floor. That frees the space above the back, behind the head column (x < 34),
// so the props here are held UP like a performer's: the Flying V slung across
// the back with its neck rising over the tail, the drumsticks raised to count
// in, the battle axe stood behind the wing. What still binds is the low back: on
// the −62° flap and the Chicken Dance's −40° flap-down, anything far back and
// low (x < 16 below y 62) drops through the floor.
//
// Every filled shape is drawn twice: once in ink with a 4-unit stroke (the
// merged 2-unit house outline) and once in its colour on top, so overlapping
// parts of one prop share a single outline instead of seaming.

export const GENRES = ["metal"];

const INK = "#121212";

// ------------------------------------------------------------- geometry --

const f = (n) => Math.round(n * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;

/** A local frame: u along `deg` from `o`, v a quarter turn clockwise of it. */
const frame = (o, deg) => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return ([u, v]) => [o[0] + u * c - v * s, o[1] + u * s + v * c];
};

const poly = (pts) => `M ${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")} Z`;

const ellipsePath = (cx, cy, rx, ry) =>
  `M ${f(cx - rx)} ${f(cy)} A ${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)} A ${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)} Z`;

/**
 * Shapes [{ d, fill }] painted with one merged ink outline: every shape in ink
 * with a 4-unit stroke first, then every fill on top.
 */
const outlined = (shapes, width = 4) =>
  shapes.map(({ d }) => `<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="${width}" stroke-linejoin="round"/>`).join("") +
  shapes.map(({ d, fill }) => `<path d="${d}" fill="${fill}"/>`).join("");

// ------------------------------------------------------------ Flying V --

/**
 * A Flying V held as a guitar, in its own frame: J is where the neck meets
 * the body, u runs along `deg` from J into the body (the two prongs open
 * along +u) and v is a quarter turn clockwise of u. L is prong length, s
 * half the span at the tips, w a prong's width at its tip, notch how deep
 * the V is cut, n the neck length (along −u), nw the neck's half-width, h the
 * headstock length; `flare` (+1 or −1) picks the side the Gibson blade
 * headstock sweeps to. An ink pickup bar crosses the body and an ink nut
 * bar caps the neck: two dark cross-strokes in a white shape are what say
 * "instrument" rather than "arrow".
 */
const guitarV = ({ J, deg, L, s, w, notch, n, nw = 2, h, flare = 1, body, detail = INK, strap }) => {
  const at = frame(J, deg);
  const shapes = [
    { d: poly([[1, -nw], [-n, -nw], [-n, nw], [1, nw]].map(at)), fill: body },
    {
      d: poly([[-n + 0.5, -nw - 0.3 * flare], [-n - h, -nw - 1.2 * flare], [-n - h - 1.5, nw + 3.4 * flare], [-n + 0.5, nw + 0.6 * flare]].map(at)),
      fill: body
    },
    {
      d: poly([[-2.5, 0], [-1.2, -4.4], [L, -s], [L - 3, -(s - w)], [L - notch, 0], [L - 3, s - w], [L, s], [-1.2, 4.4]].map(at)),
      fill: body
    }
  ];
  const bar = (u0, u1, hv) => `<path d="${poly([[u0, -hv], [u1, -hv], [u1, hv], [u0, hv]].map(at))}" fill="${detail}"/>`;
  // A worn guitar's strap, under the guitar: an ember band in an ink outline,
  // from the far prong's tip up over the shoulder at `strap.at` and back
  // down to the neck. Ember, not ink: an ink line on the wing is lost among
  // the wing's own ink feather lines.
  const strapD = strap
    ? (() => {
        const d = `M ${[at([L - 2, -s + 2]), strap.at, at([-strap.neck, 0])].map(([x, y]) => `${f(x)} ${f(y)}`).join(" L ")}`;
        const line = (color, width) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
        return line(INK, strap.width + 4) + line(strap.color, strap.width);
      })()
    : "";
  return strapD + outlined(shapes) + bar(2.2, 4.6, 3.6) + bar(-n - 0.2, -n + 1.8, nw);
};

/** The pickup and nut bars: ink on a white or gold guitar, mutedWarm on an ink one, so the ink guitar is still an instrument. */
const detailOf = (ctx) => (ctx.style === "ink" ? ctx.colors.mutedWarm : INK);

/** Variant a's sling, shared with the worn variant b. */
const SLUNG = { J: [27.5, 45.5], deg: 66, L: 19, s: 11, w: 5.6, notch: 11.5, n: 27, nw: 2.1, h: 7, flare: 1 };

// ------------------------------------------------------------ drumstick --

/**
 * One chicken drumstick from the knuckle k to the meat's tip t: a bone with
 * a two-lobed knuckle, a teardrop of meat over its far end. `r` is the meat's
 * half-width, `meat` the fraction of the length it covers.
 */
const drumstickShapes = ({ k, t, r = 4.4, meat = 0.55, bone = 1.35, color, boneColor }) => {
  const deg = (Math.atan2(t[1] - k[1], t[0] - k[0]) * 180) / Math.PI;
  const L = Math.hypot(t[0] - k[0], t[1] - k[1]);
  const at = frame(k, deg);
  const m0 = L * (1 - meat);
  const P = (u, v) => at([u, v]).map(f).join(" ");
  const meatD = `M ${P(m0, -bone)} C ${P(m0 + L * meat * 0.35, -r * 1.15)} ${P(L - r * 0.2, -r * 1.05)} ${P(L, 0)} C ${P(L - r * 0.2, r * 1.05)} ${P(m0 + L * meat * 0.35, r * 1.15)} ${P(m0, bone)} Z`;
  const boneD = poly([[1.2, -bone], [m0 + 2, -bone], [m0 + 2, bone], [1.2, bone]].map(at));
  const knuckle = [
    { c: at([1.1, -1.5]), r: 1.9 },
    { c: at([1.1, 1.5]), r: 1.9 }
  ];
  return [
    { d: boneD, fill: boneColor },
    ...knuckle.map(({ c, r: kr }) => ({ d: ellipsePath(c[0], c[1], kr, kr), fill: boneColor })),
    { d: meatD, fill: color }
  ];
};

// ----------------------------------------------------------- battle axe --

/**
 * A battle axe hafted on a drumstick bone, in its own frame: `top` is the
 * haft's top, u runs `haft` units from it along `deg` to a two-lobed knuckle
 * at the foot, and v is a quarter turn clockwise of u. `blades` are
 * [{ side, u0, u1, reach, bulge }]: each leaves the haft as a narrow neck,
 * flares along concave sides to an edge from u0 to u1 standing `reach` out
 * on `side` (+1 or −1 in v), and bows out by `bulge` across the edge, so the
 * outline is a crescent bit, the axe's whole read. The blades take the
 * style's fill and the haft stays white bone, so even the ink axe keeps its
 * wing-night joke. `spikes` are [{ u, side, len }]: a short point standing
 * `len` off the haft at u on `side` (side 0 caps the top, along −u), the
 * hardware that turns a crescent on a stick into a weapon rather than a flag.
 */
const battleAxe = ({ top, deg, haft, blades, spikes = [], color, bone }) => {
  const at = frame(top, deg);
  const P = (u, v) => at([u, v]).map(f).join(" ");
  const bw = 1.6;
  const shapes = [
    { d: poly([[-1, -bw], [haft - 1, -bw], [haft - 1, bw], [-1, bw]].map(at)), fill: bone },
    ...[-1.7, 1.7].map((v) => {
      const [cx, cy] = at([haft, v]);
      return { d: ellipsePath(cx, cy, 2.2, 2.2), fill: bone };
    }),
    ...blades.map(({ side: k, u0, u1, reach, bulge, neck = [u0 + 2.5, u1 - 2.5] }) => {
      const mid = (u0 + u1) / 2;
      return {
        d:
          `M ${P(neck[0], k)} Q ${P(neck[0] + 0.5, k * reach * 0.5)} ${P(u0, k * reach)} ` +
          `Q ${P(mid, k * (reach + bulge * 2))} ${P(u1, k * reach)} ` +
          `Q ${P(neck[1] - 0.5, k * reach * 0.5)} ${P(neck[1], k)} Z`,
        fill: color
      };
    }),
    ...spikes.map(({ u, side: k, len }) =>
      k === 0
        ? { d: poly([[0, -2.4], [-len, 0], [0, 2.4]].map(at)), fill: color }
        : { d: poly([[u - 2.2, 0], [u, k * len], [u + 2.2, 0]].map(at)), fill: color }
    )
  ];
  return outlined(shapes);
};

// ---------------------------------------------------------------- stages --

/**
 * A lightning bolt in the box (x, top, w, h): a wide top bar, a zigzag step
 * and a point at the bottom. The narrowest limb is about a third of w, so at
 * w 12 every limb is 4 or more units across. `mirror` flips it left to right.
 */
const boltPath = (x, top, w, h, mirror = false) =>
  poly(
    [
      [0.42, 0],
      [1, 0],
      [0.64, 0.4],
      [0.97, 0.4],
      [0.1, 1],
      [0.36, 0.56],
      [0.03, 0.56]
    ].map(([u, v]) => [x + (mirror ? 1 - u : u) * w, top + v * h])
  );

// ---------------------------------------------------------------- items --

/** Drumstick meat: ember (a buffalo wing on wing night) unless the gold style fries it gold. */
const meatOf = (ctx) => (ctx.style === "gold" ? ctx.colors.gold : ctx.colors.ember);

export const ITEMS = [
  {
    id: "flying-v",
    slot: "prop",
    name: "Flying V",
    note:
      "The headline metal prop, white with the ink outline so it stands off an ink leather sleeve (white on bare chrome is 1.35:1, so it reads there by its outline and by the parts that leave the body). Every variant holds the guitar the way a player or a roadie does, never hung straight down under the belly (run 1's paper plane), and gives it a real Flying V: a deep notch between two chunky prongs, a short neck, a flared Gibson blade headstock, a pickup bar across the body and a nut bar at the headstock. Two dark cross-strokes in a white shape say instrument, not arrow; on the ink style they turn mutedWarm so the ink guitar keeps them.",
    variants: [
      {
        key: "a",
        note: "Slung across the back: the V body low at the hip with its prongs opening down either side of the near leg, the neck rising up and BACK across the wing and the tail root, the headstock out in the dark gap between the tail blades. Polish 1 made the body chunkier and the neck shorter (body 19 long and 22 across the tips, was 16 and 19; neck 27, was 30), so on bare chrome the V is a third of the guitar rather than a split end on a stick. The low prong still stops at about y 67.2 and the headstock tip near (13.7, 14.4).",
        styles: ["white", "ink", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) => guitarV({ ...SLUNG, body: ctx.styleFill, detail: detailOf(ctx) })
      },
      {
        key: "b",
        note: "Worn: a's slung guitar on an ember strap 2.6 wide in the merged ink outline, running from the far prong up across the wing to the shoulder at (42, 41.5), just under the head box, and back down to the neck. The strap is what turns a white diagonal into a guitar someone is wearing, and it brings metal's ember accent onto bare chrome; ember rather than ink because an ink line on the wing is lost among the wing's own ink feather lines. Replaces polish 1's cut b, the 'played' pose across the belly, which read as a paper plane flying across the bird. No ink style: on an ink guitar the strap's ink outline and the body fuse into one black sash.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) => guitarV({ ...SLUNG, body: ctx.styleFill, detail: detailOf(ctx), strap: { at: [42, 41.5], neck: 14, width: 2.6, color: ctx.colors.ember } })
      },
      {
        key: "c",
        note: "Hoisted: a's guitar lifted 8.5 units up the back and stood steeper (the neck 16° off vertical, was 24°; neck 23, was 27), the way a player raises the axe at the end of a song. The V sits on the wing instead of at the hip, so both legs stand clear under it (a's low prong hides the near shank, the one fault the critic found in a), and the neck rises over the dorsal spikes to a headstock at about (16, 6.5). Lifting it further fails the rules: a neck that towers more than 10 past the outline breaks the reach limit, and a longer one drops through the floor on the Chicken Dance clap. A low-angle carry with the neck out over the tail was tried and read as an arrow through the back. Replaces polish 1's c, the V laid back over the shoulder, which read as a delta jet or paper dart stuck in the back: here the V opens down on the body and the long neck rises out of it, so the guitar's proportions (a third body, two thirds neck) carry it.",
        styles: ["white", "ink", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) => guitarV({ ...SLUNG, J: [25.5, 37], deg: 74, n: 23, body: ctx.styleFill, detail: detailOf(ctx) })
      }
    ]
  },
  {
    id: "drumsticks",
    slot: "prop",
    name: "Drumsticks",
    note:
      "Two chicken drumsticks as a drummer's sticks. White bone and knuckles with the merged ink outline; the meat is ember, a cooked buffalo drumstick on wing night, or gold in the gold style. White meat on white bone read as crossbones. The ink outline is what keeps the ember meat off the orange feet: never thin it.",
    variants: [
      {
        key: "a",
        note:
          "Crossbones under the belly, meat down: a wide X with the knuckles up at the wing and the chest. The X is raised and splayed so each ember meat lands OUTSIDE the legs, the back one behind the near leg and the front one ahead of the far leg's toes, both against the dark, with the orange shanks standing clear between them (run 1 put the meat on the toes and the two fused into one orange mass). Short meat (a third of the stick) keeps the bones long, which is the crossbones read.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) =>
          outlined([
            ...drumstickShapes({ k: [29, 49], t: [60, 60.5], r: 3.7, meat: 0.33, color: meatOf(ctx), boneColor: ctx.colors.white }),
            ...drumstickShapes({ k: [51, 49.5], t: [19, 60.5], r: 3.7, meat: 0.33, color: meatOf(ctx), boneColor: ctx.colors.white })
          ])
      },
      {
        key: "b",
        note: "Mid-fill: one stick up, one stick down, the instant between two hits. The raised stick leans back over the tail root with its meat in the dark above the back; the low stick swings forward under the belly with its meat ahead of the far leg's toes, where a puts its front meat. The two cross at the wing in a lopsided λ, neither a's low X nor c's high X, and the outline says motion: a drummer mid-beat. Replaces polish 1's tucked pair, whose low meats read as exhaust puffs out of the rump.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) =>
          outlined([
            ...drumstickShapes({ k: [24, 48], t: [58, 61], r: 3.7, meat: 0.33, color: meatOf(ctx), boneColor: ctx.colors.white }),
            ...drumstickShapes({ k: [36, 50], t: [24, 10], r: 4, meat: 0.42, color: meatOf(ctx), boneColor: ctx.colors.white })
          ])
      },
      {
        key: "c",
        note: "Raised: the sticks crossed high behind the back like a drummer counting in, knuckles down at the wing, the X up over the tail root and the two ember meats fanned out in the dark above the tail, as far from the orange feet as the bird allows. Kept behind the head column (x < 34) at rest; on the Chicken Dance clap they swing down behind and stop at y 72.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) =>
          outlined([
            ...drumstickShapes({ k: [33, 44], t: [12, 13], r: 4, meat: 0.42, color: meatOf(ctx), boneColor: ctx.colors.white }),
            ...drumstickShapes({ k: [18, 45], t: [30, 11], r: 4, meat: 0.42, color: meatOf(ctx), boneColor: ctx.colors.white })
          ])
      }
    ]
  },
  {
    id: "battle-axe",
    slot: "prop",
    name: "Battle axe",
    note:
      "Replaces the wishbone horns, cut twice: horns only read on a head and the head box forbids one there. A Viking axe hafted on a chicken drumstick bone, two-lobed knuckle at the foot, held up behind the wing so the bit stands in the dark above the back. It reads by outline, a crescent blade on a stick, which no other prop on the rail has. White blades with the merged ink outline (white on bare chrome reads by that outline; on an ink leather sleeve it is the loudest shape), or gold. No ink style: the bit stands in the dark above the back, where ink blades vanish and leave a bare white bone.",
    variants: [
      {
        key: "a",
        note: "Double-bit, upright: a labrys on a 29-unit bone stood behind the wing, tilted 8° back, the haft's top at (21, 16) and two crescent bits either side of it, each 8 out from the haft and 16 along the edge, so the head spans about x 11..31, y 8..24, behind the head column, with a short spike capping the haft. Symmetric and upright: a standard planted on stage.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) =>
          battleAxe({
            top: [21, 17.5],
            deg: 82,
            haft: 29,
            bone: ctx.colors.white,
            color: ctx.styleFill,
            blades: [
              { side: 1, u0: -8, u1: 8, reach: 8, bulge: 2.4 },
              { side: -1, u0: -8, u1: 8, reach: 8, bulge: 2.4 }
            ],
            spikes: [{ u: 0, side: 0, len: 5 }]
          })
      },
      {
        key: "b",
        note: "Bearded, swung back: a single big bit on a longer haft slung diagonally across the back like the Flying V, the knuckle down at the wing and the head up over the tail root, the blade facing up into the dark with its long beard hooking down the haft, and a short back spike on the tail side. Lopsided where a is symmetric, and the diagonal swing a warrior holds it in, not a standard.",
        styles: ["white", "gold"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) =>
          battleAxe({
            top: [13, 18],
            deg: 58,
            haft: 35,
            bone: ctx.colors.white,
            color: ctx.styleFill,
            blades: [{ side: -1, u0: -3, u1: 15, reach: 12.5, bulge: 3.2, neck: [0, 5.5] }],
            spikes: [{ u: 2.5, side: 1, len: 5.5 }]
          })
      }
    ]
  },
  {
    id: "lava-disc",
    slot: "stage",
    name: "Lava disc",
    note: "An ink disc under the feet with ember cracks. The disc reads dark against the hearth glow; the ember is the heat. Cracks stay off the toe line so they never merge with the orange legs.",
    variants: [
      {
        key: "a",
        note:
          "Cracked crust: two separate fissure forks (3.6u, mitered), one at each end of the disc, each running along the front rim, forking down once and hooking back up into the visible upper disc at the open end, where there are no toes. Polish 2 removed the shared origin under the feet: the front rim is dark from x 29 to x 49, so blurred at 130 the orange is two forks at the ends and never one crescent (a grin) under the bird; the stroke went from 3.2 to 3.6 so the forks survive the blur. Above y 72 every crack stays at x<24 or x>56, clear of the feet.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const disc = ellipsePath(39, 72.5, 37, 7);
          const { def, url } = ctx.clip(disc);
          const cracks = [
            "M 29 76.8 L 24 75.5 L 14 77.5 L 5 76",
            "M 14 77.5 L 10 72.5 L 13 68.5",
            "M 24 75.5 L 19 79.5",
            "M 49 77 L 55 75.8 L 64 77.8 L 73 75.5",
            "M 64 77.8 L 68 72 L 65 68.5",
            "M 55 75.8 L 59 79.5"
          ];
          return (
            def +
            `<path d="${disc}" fill="${INK}"/>` +
            `<g clip-path="${url}" fill="none" stroke="${ctx.colors.ember}" stroke-width="3.6" stroke-linejoin="miter" stroke-linecap="butt">${cracks
              .map((d) => `<path d="${d}"/>`)
              .join("")}</g>`
          );
        }
      },
      {
        key: "b",
        note: "Rock in a lava lake: the value of a turned inside out. A wide unoutlined ember pool with the bird standing on a slab of ink crust cut in a few big straight facets; the slab runs from the pool's back rim to its front rim, so the ember is two separate pools at the ends, never a ring round a dark centre (an eye) and never a crescent along the front (a grin). Polish 2 dropped polish 1's scalloped rim, which read as orange clouds, for a smooth oval, and gave the pool the merged ink outline (a 2-unit visible rim) so the ember stands off the orange hearth glow instead of bleeding into it like a spill. Two short ember cracks (3u) run in from the pools across the slab's front face, asymmetric, so the crust reads as cracking over the melt. No dark spot sits inside the ember (two dark islands in light pools would be eyes).",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const E = ctx.colors.ember;
          const pool = ellipsePath(39, 72.5, 39, 6.2);
          const raft = "M 19 80 L 15 75.5 L 20.5 70 L 22 64 L 57 64 L 59.5 69 L 65 73.5 L 61 80 Z";
          const { def, url } = ctx.clip(pool);
          const cracks = ["M 15.5 77.5 L 23 75 L 26 78", "M 64 76 L 58 74.5"];
          return (
            def +
            outlined([{ d: pool, fill: E }]) +
            `<g clip-path="${url}"><path d="${raft}" fill="${INK}"/>` +
            `<g fill="none" stroke="${E}" stroke-width="3" stroke-linejoin="miter" stroke-linecap="butt">${cracks.map((d) => `<path d="${d}"/>`).join("")}</g></g>`
          );
        }
      },
      {
        key: "c",
        note: "Flames: an ink disc with flame tongues licking up behind the bird at either end. Polish 1 redrew each tongue with S-curved sides and twin tips (a tall main tip and a lower second one), leaning alternately and at three heights, so they flicker instead of standing like candy-corn cones; and it removed the ember lip along the front, which was the crescent-under-the-bird this unit calls a grin.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const E = ctx.colors.ember;
          const flame = (x, top, wd, lean) =>
            `M ${x - wd} 70 C ${x - wd - 2} ${top + 11} ${x - wd + 1} ${top + 5} ${x - 1 + lean} ${top} ` +
            `C ${x + 1} ${top + 6} ${x + 1.5} ${top + 7} ${f(x + wd * 0.55)} ${top + 4} ` +
            `C ${x + wd + 0.5} ${top + 9} ${x + wd + 1.5} ${top + 12} ${x + wd} 70 Z`;
          const flames = [flame(7, 57.5, 5, -2), flame(17.5, 55, 6.5, 1.5), flame(66, 56, 6.5, -1.5)];
          return (
            flames.map((d) => `<path d="${d}" fill="${E}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`).join("") +
            `<path d="${ellipsePath(39, 72.5, 37, 7)}" fill="${INK}"/>`
          );
        }
      }
    ]
  },
  {
    id: "bolt-disc",
    slot: "stage",
    name: "Lightning bolts",
    note:
      "Replaces polish 1's cut speaker cab, whose Marshall stack read at 76px as a beige microwave on a mini fridge: at this size a box has no amp cue left that the face rules allow (no cones, no dots). A zigzag lightning bolt reads by its outline at any size and says heavy metal from across the room. An ink disc under the feet, bolts standing on it outside the feet; every limb of a bolt is 4 or more units across.",
    variants: [
      {
        key: "a",
        note: "Flanked: two ember bolts 12 wide and 21 tall standing either end of the disc (x 2..14 behind the tail, x 66..78 past the chest), mirrored so they point down and out, with the ink outline so they stay off the hearth glow. The bird stands between them like a band logo.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const bolts = [boltPath(2, 55, 12, 21), boltPath(66, 55, 12, 21, true)];
          return `<path d="${ellipsePath(39, 72.5, 37, 7)}" fill="${INK}"/>` + outlined(bolts.map((d) => ({ d, fill: ctx.colors.ember })));
        }
      },
      {
        key: "b",
        note: "Struck: one big white bolt behind the tail, 17 wide and 23 tall, its top bar out in the dark behind the tail and its point striking down and in to the back of the disc's front rim, with two short ember scorch cracks running forward from where it lands. Lopsided where a is symmetric, white where a is ember, and one loud shape instead of a pair.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const disc = ellipsePath(39, 72.5, 37, 7);
          const { def, url } = ctx.clip(disc);
          const scorch = ["M 9 77.5 L 15 75.5 L 21 77.5", "M 9 77.5 L 13 79.6"];
          return (
            def +
            `<path d="${disc}" fill="${INK}"/>` +
            `<g clip-path="${url}" fill="none" stroke="${ctx.colors.ember}" stroke-width="2.6" stroke-linejoin="miter">${scorch.map((d) => `<path d="${d}"/>`).join("")}</g>` +
            outlined([{ d: boltPath(-6.5, 55, 17, 23, true), fill: ctx.colors.white }])
          );
        }
      }
    ]
  }
];
