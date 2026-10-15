// metal · show: the Prop and Stage items of the metal rail (docs/research/bird-wardrobe.md §2.2).
// Contract: the top of ../outfit-harness.js.
//
// Where a Prop can live. Swept about the wing pivot (47,35) by −62/−26/+75/+95,
// a held prop is confined to a low band under the wing: nothing above y≈48
// (it rises into the head box on hurt), nothing left of x≈13 (it drops through
// the floor on flap), and the back-bottom corner trimmed by the bounce line
// (y ≤ 54 + 0.49x). So every prop here lives at the bottom of the bird and
// makes its read *below the belly*, where the hearth glow is behind it, rather
// than over the body where the sketch round's Flying V turned into a chevron.
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

/** Sample a quadratic bezier p0 → p2 (control p1). */
const quad = (p0, p1, p2, n = 16) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = (1 - t) ** 2;
    const b = 2 * (1 - t) * t;
    const c = t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
  });

/** Sample a cubic bezier p0 → p3. */
const cubic = (p0, p1, p2, p3, n = 20) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    return [0, 1].map((k) => a * p0[k] + b * p1[k] + c * p2[k] + d * p3[k]);
  });

/** A filled band of half-width hw(t) along a sampled centreline. */
const ribbon = (pts, hw) => {
  const left = [];
  const right = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = typeof hw === "function" ? hw(i / (pts.length - 1)) : hw;
    const nx = (-dy / len) * w;
    const ny = (dx / len) * w;
    left.push([p[0] + nx, p[1] + ny]);
    right.push([p[0] - nx, p[1] - ny]);
  });
  return poly([...left, ...right.reverse()]);
};

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
 * A Flying V in its own frame: the neck joins at the origin and the body's
 * two prongs open along +u. L is prong length, s half the span at the tips,
 * w a prong's width at its tip, n the neck length, h the headstock length
 * (0 = no headstock: the neck stops at the wing).
 */
const flyingV = ({ o, deg, L, s, w, n, h, notch = 9, blade = 0, body, neck = body }) => {
  const at = frame(o, deg);
  // Pointed prongs: the tip cut slants back toward the neck, so each prong
  // ends in its outer corner, the way the Gibson's do.
  const B = [
    [-3, 0],
    [-1.5, -3.9],
    [L, -s],
    [L - 2.8, -(s - w)],
    [L - notch, 0],
    [L - 2.8, s - w],
    [L, s],
    [-1.5, 3.9]
  ].map(at);
  const shapes = [];
  if (n > 0) shapes.push({ d: poly([[-1, -1.7], [-1 - n, -1.6], [-1 - n, 1.6], [-1, 1.7]].map(at)), fill: neck });
  if (h > 0 && blade) {
    // A blade headstock: narrow at the nut, flaring to one side (the sign of
    // `blade` picks it) at the end. A symmetric diamond reads as a bone's knob.
    const u0 = -1 - n;
    shapes.push({ d: poly([[u0 + 0.5, -1.7 * blade], [u0 - h, -1 * blade], [u0 - h, 3.4 * blade], [u0 + 0.5, 1.7 * blade]].map(at)), fill: body });
  } else if (h > 0) {
    const u0 = -1 - n;
    shapes.push({
      d: poly([[u0 + 0.5, -2], [u0 - h * 0.45, -3.7], [u0 - h, -1.2], [u0 - h, 1.2], [u0 - h * 0.45, 3.7], [u0 + 0.5, 2]].map(at)),
      fill: body
    });
  }
  shapes.push({ d: poly(B), fill: body });
  return outlined(shapes);
};

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

// ------------------------------------------------------------- wishbone --

/**
 * A wishbone: two arms from the joint j to the tips, each bowed through its
 * control point, thickening a little to a flat foot at the tip, with the
 * keel's knob just past the joint.
 */
const wishbone = ({ j, arms, knob, color, hw = 2.5, knobR = 3, horn = true }) => {
  // horn: the arms taper to points (horns); otherwise they end in the bone's flat feet.
  const width = horn ? (t) => hw * (1 - 0.82 * t ** 1.4) : (t) => hw * 0.8 + 1 * t * t;
  const shapes = arms.map(({ c, c2, tip }) => ({
    d: ribbon(c2 ? cubic(j, c, c2, tip, 24) : quad(j, c, tip, 18), width),
    fill: color
  }));
  shapes.push({ d: ellipsePath(knob[0], knob[1], knobR, knobR), fill: color });
  return outlined(shapes);
};

// ---------------------------------------------------------------- items --

/** Drumstick meat: ember (a buffalo wing on wing night) unless the gold style fries it gold. */
const meatOf = (ctx) => (ctx.style === "gold" ? ctx.colors.gold : ctx.colors.ember);

/**
 * A 4x12 speaker cab, front on: an ink box with mutedWarm piping inset 1.6u,
 * a plain ink grille inside it (diagonal grille-cloth hairlines read as the
 * glint on a pane of glass, a picture frame), a white logo plate along the grille's top edge and mutedWarm corner
 * protectors. No cones (two dark circles in a light panel are a face), no
 * dots (a row of dots is teeth). The top sits at y 55, the stage band's top.
 */
const cab = (ctx, x, w, plate = [7, 1.8]) => {
  const M = ctx.colors.mutedWarm;
  const y = 55;
  const h = 15.5;
  const gx = x + 1.6;
  const gy = y + 1.6;
  const gw = w - 3.2;
  const gh = h - 3.2;
  const c = 2.2;
  const corners = [
    [x, y],
    [x + w - c, y],
    [x, y + h - c],
    [x + w - c, y + h - c]
  ]
    .map(([cx, cy]) => `<rect x="${f(cx)}" y="${f(cy)}" width="${c}" height="${c}" fill="${M}"/>`)
    .join("");
  return (
    `<rect x="${f(x)}" y="${y}" width="${f(w)}" height="${h}" rx="1" fill="${INK}"/>` +
    `<rect x="${f(gx)}" y="${f(gy)}" width="${f(gw)}" height="${f(gh)}" fill="none" stroke="${M}" stroke-width="1"/>` +
    `<rect x="${f(gx + 1.9)}" y="${f(gy + 1.4)}" width="${plate[0]}" height="${plate[1]}" fill="${ctx.colors.white}"/>` +
    corners
  );
};

export const ITEMS = [
  {
    id: "flying-v",
    slot: "prop",
    name: "Flying V",
    note:
      "The headline metal prop, white with the ink outline so it stands off an ink leather sleeve. Chrome is the lightest team colour (white on it is 1.35:1), so the V makes its read OFF the body, below the belly where the hearth is behind it. The sweep confines a held prop to a strip under the belly (nothing above y≈48, nothing far back-low, nothing forward-high), so it pokes out a few units, not the brief's 10. The guitar cue is a long thin neck into a chunky V: never shorten the neck to make room for the V.",
    variants: [
      {
        key: "a",
        note:
          "Low sling at 30°: headstock in the wing tip, a long thin 10u neck through the grip, and a short chunky V (3.8u prongs, 8.5u half-span) opening down-forward under the belly. The long neck into a wide V is the guitar read; a short neck read as a Y or scissors.",
        styles: ["white", "ink", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) => flyingV({ o: [39.7, 58.3], deg: 30, L: 14, s: 8.5, w: 3.8, n: 10, h: 4, notch: 10, body: ctx.styleFill })
      },
      {
        key: "b",
        note:
          "Played: the guitar the way it is actually held, V back at the hip and the neck forward, but laid nearly flat and dropped into the strip under the belly so the V sits against the hearth between the legs instead of over the chrome rump (round 1's cut b). The neck runs forward low past the chest and the headstock pokes out in front of the feet; it cannot rise, as anything forward and high swings into the face on the flap.",
        styles: ["white", "ink", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) => flyingV({ o: [46, 65], deg: 189, L: 12, s: 6, w: 3.2, n: 9, h: 4.5, notch: 8.5, blade: -1, body: ctx.styleFill })
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
          "Crossed under the belly, meat down: a wide X splaying out below the body, knuckles up in the wing and at the chest. Small meat (0.4 of the stick, 3.4u half-width) with the two tips pushed apart, so ink-outlined dark shows between the lobes; bigger lobes side by side fused into one peach blob on the feet.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) =>
          outlined([
            ...drumstickShapes({ k: [30, 52], t: [57, 66.5], r: 3.4, meat: 0.4, color: meatOf(ctx), boneColor: ctx.colors.white }),
            ...drumstickShapes({ k: [52, 53], t: [29, 65], r: 3.4, meat: 0.4, color: meatOf(ctx), boneColor: ctx.colors.white })
          ])
      },
      {
        key: "b",
        note: "Tucked under the wing, a pair: two drumsticks side by side (a II, not an X), knuckles forward at the chest and the ember meat poking out behind the rump against the hearth, the way a drummer carries sticks between songs.",
        styles: ["white", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) =>
          outlined([
            ...drumstickShapes({ k: [44, 50.5], t: [14.5, 53.5], r: 3.6, color: meatOf(ctx), boneColor: ctx.colors.white }),
            ...drumstickShapes({ k: [47, 55.5], t: [20, 62.5], r: 3.6, color: meatOf(ctx), boneColor: ctx.colors.white })
          ])
      }
    ]
  },
  {
    id: "wishbone-horns",
    slot: "prop",
    name: "Wishbone horns",
    note:
      "A wishbone held knob-down so its two arms rise as devil horns: tapered, pointed, flared outward at the tips. Without the horns it is just a chicken bone, so both variants are a U with horn points, held low (the sweep forbids up or forward). Tips never curl inward: a closed ring reads as an eye.",
    variants: [
      {
        key: "a",
        note:
          "Horns in front: a squat pair held knob-down under the chest, in front of the far leg, the white horns against the dark hearth rather than the chrome body. Forward points swing toward the face on the flap, so the front horn stops at about y 63 and the pair is small. Author's read at 76px: it covers the far leg and reads as a white boot or crescent, not horns; drawn because the cut rule asks for a second solution, and it shows the front of the bird has no room for horns.",
        styles: ["white", "ink", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) =>
          wishbone({
            j: [50.5, 67.6],
            knob: [50.5, 69.8],
            knobR: 2.2,
            hw: 2.8,
            arms: [
              { c: [44.5, 66], tip: [43.5, 59] },
              { c: [55.5, 66.5], tip: [57.5, 63] }
            ],
            color: ctx.styleFill,
            horn: true
          })
      },
      {
        key: "b",
        note:
          "Horns at the hip: a U held by the knob at the bottom, behind the near leg, the two arms rising to pointed tips that flare outward, below the wing's trailing edge and well clear of the face. Ink is the second style, for a bare chrome bird where white horns over the rump would only show as an outline.",
        styles: ["white", "ink", "gold"],
        whitePoints: 1,
        darkCentre: false,
        draw: (ctx) =>
          wishbone({
            j: [27, 61.5],
            knob: [27, 64],
            knobR: 2.3,
            hw: 2.6,
            arms: [
              { c: [21, 58], tip: [19.5, 50.5] },
              { c: [33, 57.5], tip: [35.5, 49.5] }
            ],
            color: ctx.styleFill,
            horn: true
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
          "Cracked crust: three bold forks (3.2u, mitered) run out from a point between the feet along the disc's front rim, and the two outer ones turn back up into the visible upper disc at its open ends, where there are no toes. Above y 72 every crack stays at x<24 or x>56, clear of the feet.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const disc = ellipsePath(39, 72.5, 37, 7);
          const { def, url } = ctx.clip(disc);
          const cracks = [
            "M 38 74 L 30 76 L 24 75.5 L 14 77.5 L 5 76",
            "M 14 77.5 L 10 72.5 L 13 68.5",
            "M 24 75.5 L 19 79.5",
            "M 38 74 L 48 76.5 L 55 75.8 L 64 77.8 L 73 75.5",
            "M 64 77.8 L 68 72 L 65 68.5",
            "M 55 75.8 L 59 79.5"
          ];
          return (
            def +
            `<path d="${disc}" fill="${INK}"/>` +
            `<g clip-path="${url}" fill="none" stroke="${ctx.colors.ember}" stroke-width="3.2" stroke-linejoin="miter" stroke-linecap="butt">${cracks
              .map((d) => `<path d="${d}"/>`)
              .join("")}</g>`
          );
        }
      },
      {
        key: "b",
        note: "Molten front: the disc's back half is ink crust and its whole front half, below the toe line, is a molten ember crescent with a jagged crust edge. One big flat value shape, kept under the toes so it never touches the orange legs.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const E = ctx.colors.ember;
          const disc = ellipsePath(39, 72.5, 37, 7);
          const id = ctx.uid("pool");
          const molten =
            "M 0 75 L 7 73.8 L 13 75.4 L 19 74 L 26 75.8 L 32 74.4 L 39 76 L 46 74.4 L 52 75.8 L 59 74 L 65 75.4 L 71 73.8 L 78 75 L 78 81 L 0 81 Z";
          return (
            `<clipPath id="${id}"><path d="${disc}"/></clipPath>` +
            `<path d="${disc}" fill="${INK}"/>` +
            `<g clip-path="url(#${id})"><path d="${molten}" fill="${E}"/></g>` +
            `<path d="${disc}" fill="none" stroke="${INK}" stroke-width="2"/>`
          );
        }
      },
      {
        key: "c",
        note: "Lit lip and flames: an ink disc whose front lip glows ember, with flame tongues licking up behind the bird at either end. The loudest stage on the rail; the flames are the question.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => {
          const E = ctx.colors.ember;
          const flame = (x, top, wd, lean = 0) =>
            `M ${x - wd} 70 C ${x - wd - 1} ${top + 8} ${x - 2 + lean} ${top + 6} ${x + lean} ${top} C ${x + 2 + lean} ${top + 6} ${x + wd + 1} ${top + 7} ${x + wd} 70 Z`;
          const flames = [flame(7, 58.5, 5, -2), flame(17.5, 55, 6.5, 1), flame(66, 55.5, 6.5, 2)];
          return (
            flames.map((d) => `<path d="${d}" fill="${E}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`).join("") +
            `<path d="${ellipsePath(39, 72.5, 37, 7)}" fill="${INK}"/>` +
            `<path d="M 5 75 C 14 80.5 64 80.5 73 75" fill="none" stroke="${E}" stroke-width="3" stroke-linecap="round"/>`
          );
        }
      }
    ]
  },
  {
    id: "speaker-cab",
    slot: "stage",
    name: "Speaker cab",
    note:
      "Amp gear behind the feet: a near-square 4x12 cab, ink with mutedWarm piping and corner protectors and a white logo plate, the Marshall read. The bird stands in front on the same floor and is never raised onto it. A long slab with a light grille read as books, a toaster or a VCR, so the grille stays ink and the box stays square. The stage band tops out at y 55, so the cab is knee-high; if the orchestrator raises the stage top to about y 45, make it 20 x 25.",
    variants: [
      {
        key: "a",
        note: "One 20 x 15.5 cab behind the tail, no separate head: a plain ink grille inside a mutedWarm piping frame, a white logo plate along the top and four corner protectors.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => cab(ctx, -6, 20)
      },
      {
        key: "b",
        note: "Flanked: a 16-wide cab either side of the bird, one behind the tail and one past the chest (ending at x 85), so the bird stands between its amps like a stage centre.",
        styles: ["ink"],
        whitePoints: 0,
        darkCentre: false,
        draw: (ctx) => cab(ctx, -7, 16, [6, 1.6]) + cab(ctx, 69, 16, [6, 1.6])
      }
    ]
  }
];
