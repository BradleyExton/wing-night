// pop · show: the Prop and Stage items of the pop rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Where a prop can go (run 1b). A prop is only drawn in the parade, the
// lineup and the portal, so it is swept at rest (0°) and the walk tuck (−8°)
// strictly — out of the head box (x 36..80, y −12..37), above the floor —
// and at the dance and Move extremes softly: behind the head is fine (the
// prop paints under it), and it may dip 4 under the floor. That frees the
// BAY above the back: the dark gap between the top tail feather, the body's
// top edge (y ~25 at x 25..40) and the neck (x 45). A prop held up there is
// on the page, not on the pink, and reads by its outline. Three limits shape
// it: the chin (nothing above y 32 right of x 34), reach (10 past the
// outline at rest, so no higher than y ~16 in the middle of the bay, higher
// only near the tail tip), and the Move extremes that swing the wing over —
// the chicken-dance clap (−138°) and the heart-point (−167°) throw a raised
// prop down in front, so nothing reaches further than ~40 from the pivot.

import { COLORS } from "../outfit-harness.js";

export const GENRES = ["pop"];

const INK = COLORS.ink;
const WHITE = COLORS.white;

const n2 = (v) => (Math.round(v * 100) / 100).toString();
const pt = ([x, y]) => `${n2(x)} ${n2(y)}`;
/** A closed polygon path through points. */
const polyD = (pts) => `M ${pts.map(pt).join(" L ")} Z`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** A star with `points` tips, the first aimed at `aimDeg` (y down), optionally squashed. */
const star = (cx, cy, r, { aimDeg = -90, inner = 0.5, points = 5, sx = 1, sy = 1 } = {}) => {
  const out = [];
  for (let i = 0; i < points * 2; i += 1) {
    const rad = i % 2 === 0 ? r : r * inner;
    const a = ((aimDeg + (i * 180) / points) * Math.PI) / 180;
    out.push([cx + rad * Math.cos(a) * sx, cy + rad * Math.sin(a) * sy]);
  }
  return polyD(out);
};

/** The unit normal of `centre` at t (left of the direction of travel, y down). */
const normalAt = (centre, t) => {
  const [xa, ya] = centre(Math.max(0, t - 0.01));
  const [xb, yb] = centre(Math.min(1, t + 0.01));
  const len = Math.hypot(xb - xa, yb - ya) || 1;
  return [-(yb - ya) / len, (xb - xa) / len];
};

/**
 * A ribbon round a centreline: `centre(t)` and half-width `w(t)` for t 0..1,
 * offset along the normal. Returns a closed polygon path.
 */
const ribbon = (centre, w, steps = 36) => {
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const [x, y] = centre(t);
    const [nx, ny] = normalAt(centre, t);
    const h = w(t);
    left.push([x + nx * h, y + ny * h]);
    right.push([x - nx * h, y - ny * h]);
  }
  return polyD([...left, ...right.reverse()]);
};

/**
 * A cloud disc of deep round lobes: `bumps` cubic lobes between valleys at
 * radius rv, each leaving its valley straight out along the radius and
 * rounding over at rp. Every lobe keeps to its own wedge, so neighbours never
 * cross, and each one is wider at the top than at its root: fluffy, where
 * `scallop`'s deep quadratic lobes come to points.
 */
const cloud = (cx, cy, rv, rp, bumps, rotDeg = 0) => {
  const h = Math.PI / bumps;
  const k = ((4 * rp) / Math.cos(h) - rv) / 3; // the controls' radius that puts the lobe's top at rp
  const rot = (rotDeg * Math.PI) / 180;
  const at = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  let d = `M ${pt(at(rv, rot))}`;
  for (let i = 0; i < bumps; i += 1) {
    const a0 = rot + 2 * h * i;
    const a1 = a0 + 2 * h;
    d += ` C ${pt(at(k, a0))} ${pt(at(k, a1))} ${pt(at(rv, a1))}`;
  }
  return `${d} Z`;
};

/**
 * An ink band across the segment p0 → p1 at t: the grip collar where a handle
 * meets its head. `reach` is how far it runs either side of the centreline.
 */
const collar = (p0, p1, t, reach, width = 1.2) => {
  const [x, y] = lerp(p0, p1, t);
  const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const nx = -(p1[1] - p0[1]) / len;
  const ny = (p1[0] - p0[0]) / len;
  return `<path fill="none" stroke="${INK}" stroke-width="${width}" stroke-linecap="butt" d="M ${pt([x + nx * reach, y + ny * reach])} L ${pt([x - nx * reach, y - ny * reach])}"/>`;
};

/** A fat white mic handle p0 → p1, half-width w0 → w1, ink-outlined, with its grip collar at 0.85. */
const micHandle = (p0, p1, w0, w1, fill = WHITE) => {
  const w = (t) => w0 + (w1 - w0) * t;
  return `<path fill="${fill}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" d="${ribbon((t) => lerp(p0, p1, t), w, 6)}"/>
    ${collar(p0, p1, 0.85, w(0.85) + 0.8, 1.6)}`;
};

/** Which way p0 → p1 points, in degrees (y down): a star head aims a tip along its handle. */
const heading = (p0, p1) => (Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 180) / Math.PI;

// ------------------------------------------------------------------ props --

const starMic = {
  id: "star-mic",
  slot: "prop",
  name: "Star mic",
  note: "The pop-star mic with a star for a head. Posh's prop. The handle is a fat white rod with a thin (1.6) ink outline and an ink grip collar, so its white core survives at 76 and the star reads as a mic head, not a sticker. No ink style: an ink star dies on the ink outline.",
  variants: [
    {
      key: "a",
      note: "NEW (fix 2, replaces the cut hip mic). Out to the crowd: the mic held out back at shoulder height, the handle running back nearly level out of the wing and a big star (r 9) aimed away from the face, out over the tail fan where its tips break the fan's outline: the sing-it-back-to-me gesture, where b sings into it and c raises it. White on the pink fan reads by value; the level handle is what makes the outline new.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const p0 = [40, 42];
        const p1 = [20.6, 33];
        const u = heading(p0, p1);
        const r = (u * Math.PI) / 180;
        return `${micHandle(p0, p1, 2, 2.6, styleFill)}
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${star(p1[0] + Math.cos(r) * 8, p1[1] + Math.sin(r) * 8, 9, { aimDeg: u, inner: 0.5 })}"/>`;
      }
    },
    {
      key: "b",
      note: "Held up to sing (Gate 1: tilted up toward the chin, so a level stub at the belly no longer reads as a sheriff badge): the fat white handle (half-width 2.4 to 3) rises about 33 degrees from the wing at (49,57.4) toward the beak, and the star (r 8.6, a tip straight up) sits at (63.2,48.2), half past the breast on the dark page, its top tip at y 39.6 so the walk tuck keeps it out of the head box and its upper-right edge under the y-40 face line. A mic held up under the chin.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const p0 = [49, 57.4];
        const p1 = [58.6, 51];
        return `${micHandle(p0, p1, 2.4, 3, styleFill)}
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${star(63.2, 48.2, 8.6, { aimDeg: -90, inner: 0.5 })}"/>`;
      }
    },
    {
      key: "c",
      note: "NEW (run 1b). Held up to sing: the mic raised up and back behind the head, the star head in the bay above the back where the page is dark, a tip aimed straight up the handle. The handle rises from mid-wing past the back's top edge. Behind the neck, never in front of the face; in the heart-point the wing throws it out front at chest height, a mic pointed at the room.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const p0 = [36.5, 44];
        const p1 = [29, 30.5];
        return `${micHandle(p0, p1, 2, 2.6, styleFill)}
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${star(25.4, 24.2, 8.4, { aimDeg: heading(p0, p1), inner: 0.5 })}"/>`;
      }
    }
  ]
};

/**
 * A corded handheld mic: a white egg head at `ball` (6.8 along the handle, 6
 * across), an ink collar band 2.4 deep and 7.5 wide where it meets the handle
 * (painted under the head, so it never crosses it), and a white handle 14
 * long, half-width 3.2 at the collar tapering to 1.8 at the butt, with a 1.6
 * ink outline, running toward `toward`: an ice-cream-cone outline under the
 * head, which is what says mic at 76. No grille stripes: stripes on a ball
 * read as teeth. Returns the markup and the handle's butt, where the cable
 * leaves.
 */
const cordedMic = (ball, toward, styleFill) => {
  const along = 6.8;
  const across = 6;
  const len = Math.hypot(toward[0] - ball[0], toward[1] - ball[1]);
  const d = [(toward[0] - ball[0]) / len, (toward[1] - ball[1]) / len];
  const at = (s) => [ball[0] + d[0] * s, ball[1] + d[1] * s];
  const n = (half) => [-d[1] * half, d[0] * half];
  const quad = (s0, s1, w0, w1) => {
    const [a, b] = [at(s0), at(s1)];
    const [h0, h1] = [n(w0), n(w1)];
    return polyD([
      [a[0] + h0[0], a[1] + h0[1]],
      [b[0] + h1[0], b[1] + h1[1]],
      [b[0] - h1[0], b[1] - h1[1]],
      [a[0] - h0[0], a[1] - h0[1]]
    ]);
  };
  const collarTop = along - 1.2;
  const collarEnd = collarTop + 2.4;
  const buttS = collarEnd + 14;
  const butt = at(buttS);
  // the egg: two half-arcs between its tips on the handle's axis, the long axis along it
  const rot = n2((Math.atan2(d[1], d[0]) * 180) / Math.PI);
  const [tipA, tipB] = [at(-along), at(along)];
  const egg = `M ${pt(tipA)} A ${along} ${across} ${rot} 1 0 ${pt(tipB)} A ${along} ${across} ${rot} 1 0 ${pt(tipA)} Z`;
  const markup = `<path fill="${styleFill}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round" d="${quad(collarEnd - 0.4, buttS, 3.2, 1.8)}"/>
    <path fill="${INK}" stroke="${INK}" stroke-width="0.6" stroke-linejoin="round" d="${quad(collarTop, collarEnd, 3.75, 3.75)}"/>
    <path fill="${styleFill}" stroke="${INK}" stroke-width="2" d="${egg}"/>`;
  return { markup, butt };
};

/** The mic's cable: an ink cord (2.2 unless `width` says) from the butt along a path of cubic segments. */
const cable = (butt, segs, width = 2.2) =>
  `<path fill="none" stroke="${INK}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" d="M ${pt(butt)} ${segs}"/>`;

const cordedMicItem = {
  id: "corded-mic",
  slot: "prop",
  name: "Corded mic",
  note: "Replaces the chili mic (the palette has no red, so a chili never read as one). A corded handheld mic: a white egg head (6.8 along the handle, 6 across), an ink collar band 2.4 deep and 7.5 wide, and a white cone handle 14 long tapering from half-width 3.2 to 1.8 with a 1.6 ink outline, so the outline is an ice-cream cone and not a lollipop (fix 2: the old 2.6 ink handle vanished at 76). No grille stripes (stripes read as teeth). A short ink cable (2.2) off the butt. White by default: an ink head dies on the ink outline.",
  variants: [
    {
      key: "a",
      note: "Sung into (Gate 1: raised to the chin, so a cone poking forward at crotch height no longer reads as an ice cream): the egg head at (61.5,46.3), half off the breast on the dark page, the white cone rising about 43 degrees from the wing toward the beak. A 14 cone puts the butt at (45.3,61.2), on the belly's bottom edge, so the cable (2.4) loops back up from it onto the pink under the wing (x 41..47, y 55..61) and tucks under the handle: dark on pink, not ink lost on the page.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const { markup, butt } = cordedMic([61.5, 46.3], [48.5, 58.3], styleFill);
        return `${cable(butt, "C 42.6 61.4 40.6 59.6 40.9 57.4 C 41.2 55.2 44 54.4 45.6 55.6 C 46.8 56.5 46.6 58 46 58.8", 2.4)}
          ${markup}`;
      }
    },
    {
      key: "b",
      note: "Raised to sing (fix 2): the mic held up and back like star-mic c, the egg head in the dark bay above the back and 8+ units of white cone handle showing against the page before it enters the wing; the cable hangs from the butt in one loose U across the wing, dropping under 10 and ending on the body, never below y 60.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const { markup, butt } = cordedMic([25.4, 24.6], [36.6, 44], styleFill);
        return `${cable(butt, "C 40 54 30 56 30 50")}
          ${markup}`;
      }
    }
  ]
};

/** `hex` at 0.7 over the ink page, solid: the far side's dimming (the far leg's 0.7) without seeing through. */
const dimmed = (hex) => {
  const mix = (i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.7 + parseInt(INK.slice(i, i + 2), 16) * 0.3);
  return `#${[1, 3, 5].map((i) => mix(i).toString(16).padStart(2, "0")).join("")}`;
};

/** An ink stick from p0 to p1: the pom's handle, painted under the pom so its top shows. */
const stick = (p0, p1) => `<path fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" d="M ${pt(p0)} L ${pt(p1)}"/>`;

/**
 * A stick for the dark bay: a 4.4 ink line with a 2.4 mutedWarm core over it,
 * so the length that crosses the near-ink page still shows (a plain ink stick
 * there is invisible).
 */
const litStick = (p0, p1) => `${stick(p0, p1).replace('stroke-width="2.4"', 'stroke-width="4.4"')}
  <path fill="none" stroke="${COLORS.mutedWarm}" stroke-width="2.4" stroke-linecap="round" d="M ${pt(p0)} L ${pt(p1)}"/>`;

/** A white cloud pom, its outline painted under the fill so the lobe roots stay white. */
const cloudPom = (styleFill, cx, cy, rot = -6) =>
  `<path fill="${styleFill}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" d="${cloud(cx, cy, 5.6, 8.5, 13, rot)}"/>`;

const pomPom = {
  id: "pom-pom",
  slot: "prop",
  name: "Pom-pom",
  note: "Sporty's cheer pom-pom: a big fluffy white outline, thirteen deep round lobes each wider at its top than its root, never a ring and never a dark centre, on a solid ink stick, so it is in the hand, not a cottontail on the rump. No strand ticks (a snowflake) and no inner curls (a smiley face). No team style: pink on the pink body is 1.00:1.",
  variants: [
    {
      key: "a",
      note: "NEW (fix 2, replaces the cut thigh pom). High V, a pom in each wing: the near pom punched out front at breast height as in b, and the far wing's pom thrown up behind the back, peeking over it in the bay: the bird's body hides its lower half and its stick (it is clipped to outside the body outline) and it is painted 0.7 over the page like the far leg, solid so the tail does not show through, so it reads as behind. Two poms in a V is the cheer pose itself, where b and c each throw one.",
      styles: ["white"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, uid, shapes }) => {
        const id = uid("pfar");
        // outside the body: a big box with the body cut out of it, even-odd
        const behind = `<clipPath id="${id}"><path fill-rule="evenodd" clip-rule="evenodd" d="M -20 -30 H 100 V 100 H -20 Z ${shapes.body}"/></clipPath>`;
        return `<defs>${behind}</defs><g clip-path="url(#${id})">${stick([38, 40], [30, 30])}
          ${cloudPom(dimmed(styleFill), 25, 26.8, 8)}</g>
          ${stick([45, 48], [57.6, 50.3])}
          ${cloudPom(styleFill, 64.4, 49.8, 10)}`;
      }
    },
    {
      key: "b",
      note: "Punched out front (fix 2): the cloud pom thrust forward at breast height on its ink stick, half on the dark page in front of the breast, its top at y 41 (below the face line) and well clear of the feet and trainers. The cheer punched at the crowd.",
      styles: ["white"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => `${stick([45, 48], [57.6, 50.3])}
          ${cloudPom(styleFill, 64.4, 49.8, 10)}`
    },
    {
      key: "c",
      note: "NEW (run 1b). Shaken high: the cloud pom thrown up and back on its stick, in the bay above the back. Gate 1 lifted it clear of the back, so it no longer sits on the rump like a cottontail: the pom up over the top tail feathers at (15.5,20), clear of the back, which is as high as reach 10 allows at this size, on a long stick from the wing (36,45) to (19.5,25), drawn as a 4.4 ink line with a 2.4 mutedWarm core so the length crossing the dark bay shows. The cheer at the top of the shake, where a and b hold it low.",
      styles: ["white"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => `${litStick([36, 45], [19.5, 25])}
          ${cloudPom(styleFill, 15.5, 20, 4)}`
    }
  ]
};

/**
 * A Union Jack in pink, white and ink on the parallelogram whose top edge
 * runs tl → tr and whose drop is `down`. `field` is the base, `cross` the
 * saltire and cross, `centre` (optional) a thinner line down the cross, so no
 * blue or red comes in. `hem` (optional) is an inset band just inside the ink
 * outline, so an ink flag keeps a light rim on an ink dress or the dark page.
 * See `jackColours` for the two palettes. Band widths are in bird units, so
 * the thinnest stripe stays 2.
 */
const unionJack = ({ tl, tr, down, field, cross, centre, hem, clip, crossW = 3.4, hemW = 2.8 }) => {
  const at = (u, v) => [tl[0] + u * (tr[0] - tl[0]) + v * down[0], tl[1] + u * (tr[1] - tl[1]) + v * down[1]];
  const outline = polyD([at(0, 0), at(1, 0), at(1, 1), at(0, 1)]);
  const c = clip(outline);
  // a straight band between two flag-space points, `width` bird units across, run long past the edges
  const band = (u0, v0, u1, v1, width) => {
    const a = at(u0, v0);
    const b = at(u1, v1);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dx = (b[0] - a[0]) / len;
    const dy = (b[1] - a[1]) / len;
    const ext = 6;
    const a2 = [a[0] - dx * ext, a[1] - dy * ext];
    const b2 = [b[0] + dx * ext, b[1] + dy * ext];
    const h = width / 2;
    return polyD([
      [a2[0] - dy * h, a2[1] + dx * h],
      [b2[0] - dy * h, b2[1] + dx * h],
      [b2[0] + dy * h, b2[1] - dx * h],
      [a2[0] + dy * h, a2[1] - dx * h]
    ]);
  };
  const saltire = `${band(0, 0, 1, 1, 2)} ${band(0, 1, 1, 0, 2)}`;
  const crossD = `${band(0, 0.5, 1, 0.5, crossW)} ${band(0.5, 0, 0.5, 1, crossW)}`;
  const centreD = `${band(0, 0.5, 1, 0.5, 2)} ${band(0.5, 0, 0.5, 1, 2)}`;
  // the hem: a white stroke clipped to the flag shows (hemW − 2) / 2 inside the
  // 2-unit ink outline. Painted under the crosses, so they run through it to
  // the edge. Thin (2.8) by default, so the ink field triangles stay big and
  // never read as a white flag with black teeth.
  const hemD = hem ? `<path fill="none" stroke="${hem}" stroke-width="${hemW}" stroke-linejoin="miter" d="${outline}"/>` : "";
  return `${c.def}<path fill="${field}" d="${outline}"/>
    <g clip-path="${c.url}">${hemD}<path fill="${cross}" d="${saltire}"/><path fill="${cross}" d="${crossD}"/>${centre ? `<path fill="${centre}" d="${centreD}"/>` : ""}</g>
    <path fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${outline}"/>`;
};

/**
 * The flag's palette per style. Ink (the default) is the dark flag: white
 * crosses, a pink centre line and a white inset hem, so it reads instantly as
 * a Union Jack and keeps a light rim on the ink Union Jack dress. White is a
 * white field with team-pink crosses, like the real flag's red on white.
 */
const jackColours = (style, styleFill, fill, { centre = true } = {}) =>
  style === "ink"
    ? { field: styleFill, cross: WHITE, centre: centre ? fill : null, hem: WHITE }
    : { field: styleFill, cross: fill, centre: null, hem: null };

/**
 * A Union Jack streaming in the wind: the flag's centreline `path(t)`
 * (t 0 at the hoist, 1 at the fly) and half-height `h`. The outline and the
 * horizontal arm of the cross are ribbons round the centreline, the saltire's
 * two arms run corner to corner along it, and the vertical arm crosses at
 * mid-fly, so the whole pattern rides the wave. Same palettes as `unionJack`.
 */
const wavyJack = ({ path, h, field, cross, centre: mid, hem, clip, crossW = 3.4, hemW = 2.8 }) => {
  const off = (k) => (t) => {
    const [x, y] = path(t);
    const [nx, ny] = normalAt(path, t);
    return [x + nx * k(t), y + ny * k(t)];
  };
  const outline = ribbon(path, () => h);
  const c = clip(outline);
  // the arms run past the flag's ends, so the clip cuts them clean at the edge
  const long = (t) => path(Math.min(1, Math.max(0, t)));
  const ext = (f) => (t) => f(-0.15 + t * 1.3);
  const diagA = ribbon(ext(off((t) => h * (1 - 2 * t))), () => 1);
  const diagB = ribbon(ext(off((t) => -h * (1 - 2 * t))), () => 1);
  const armH = (w) => ribbon(ext(long), () => w / 2);
  const [mx, my] = path(0.5);
  const [nx, ny] = normalAt(path, 0.5);
  const armV = (w) => {
    const [tx, ty] = [ny, -nx];
    const a = [mx + nx * (h + 4), my + ny * (h + 4)];
    const b = [mx - nx * (h + 4), my - ny * (h + 4)];
    return polyD([
      [a[0] + (tx * w) / 2, a[1] + (ty * w) / 2],
      [b[0] + (tx * w) / 2, b[1] + (ty * w) / 2],
      [b[0] - (tx * w) / 2, b[1] - (ty * w) / 2],
      [a[0] - (tx * w) / 2, a[1] - (ty * w) / 2]
    ]);
  };
  const hemD = hem ? `<path fill="none" stroke="${hem}" stroke-width="${hemW}" stroke-linejoin="round" d="${outline}"/>` : "";
  return `${c.def}<path fill="${field}" d="${outline}"/>
    <g clip-path="${c.url}">${hemD}<path fill="${cross}" d="${diagA} ${diagB}"/><path fill="${cross}" d="${armH(crossW)} ${armV(crossW)}"/>${mid ? `<path fill="${mid}" d="${armH(2)} ${armV(2)}"/>` : ""}</g>
    <path fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${outline}"/>`;
};

/** The flag's solid ink pole. */
const pole = (p0, p1) => `<path fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" d="M ${pt(p0)} L ${pt(p1)}"/>`;

const unionJackFlag = {
  id: "union-jack-flag",
  slot: "prop",
  name: "Union Jack flag",
  note: "Ginger's flag on a stick, in pink, white and ink: the cross reads by its geometry. Ink by default (white saltire and cross, pink centre line) with a white inset hem, so it reads at once as a Union Jack and keeps a light rim against the ink Union Jack dress. White, with pink crosses, as the second style.",
  variants: [
    {
      key: "a",
      note: "Waved at the crowd. Gate 1 flew it forward off the breast with a wave, so it is no flat patch on the belly merging into the jack dress: the pole stands at the front of the wing, (53,58) to (54.5,40.6), and the flag (9 deep) streams 17 forward off its top, dipping slightly, in one full wave that grows toward the fly end, so its waving fly half (x 63..71.5) is on the dark page, about 8 past the breast (the critic's pole at x 62 put the fly 17 past, over the reach limit). The wave rises first and falls at the fly, so the top edge stays at or below y 40.6 past x 64 and clear of the head box in the walk tuck. A crowd flag waved at chest height, where b trails low behind and c flies high behind the head.",
      styles: ["ink", "white"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, style, fill, clip }) => {
        const top = [54.5, 40.6];
        const len = 17;
        const half = 4.5;
        const d = [1 / Math.hypot(1, 0.12), 0.12 / Math.hypot(1, 0.12)];
        // the centreline: half a flag below the top edge, one full wave across it growing to 1.8 at the fly,
        // up first (so the near half never lifts the top edge toward the face) and down at the fly
        const centre = (t) => {
          const w = -Math.sin(t * Math.PI * 2) * 1.8 * t;
          return [top[0] + d[0] * len * t - d[1] * (half + w), top[1] + d[1] * len * t + d[0] * (half + w)];
        };
        return `${pole([53, 58], top)}
          ${wavyJack({ path: centre, h: half, ...jackColours(style, styleFill, fill), clip })}`;
      }
    },
    {
      key: "b",
      note: "NEW (fix 2, replaces the cut tail banner). Trailed: a short pole held level out of the back of the wing at hip height and the flag streaming straight back off its end, in the wind of a strut, on the dark page under the tail fan and behind the rump, never on the tail. White by default (pink crosses on white), so it reads by value on the page. Low and behind where a flies at the breast and c flies high.",
      styles: ["ink", "white"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, style, fill, clip }) => {
        const p0 = [40, 42];
        const p1 = [23.4, 32.6];
        const len = 22;
        const u = [(p1[0] - p0[0]) / Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), (p1[1] - p0[1]) / Math.hypot(p1[0] - p0[0], p1[1] - p0[1])];
        // straight back along the pole, one full wave across it
        const centre = (t) => {
          const w = Math.sin(t * Math.PI * 2) * 2.2 * t;
          return [p1[0] + u[0] * len * t - u[1] * w, p1[1] + u[1] * len * t + u[0] * w];
        };
        return `${pole(p0, p1)}
          ${wavyJack({ path: centre, h: 5.6, ...jackColours(style, styleFill, fill), clip })}`;
      }
    },
    {
      key: "c",
      note: "Waved high (run 1b; hem thinned to 2.8 and cross to 3.4 in the polish, so the ink triangles grow): the pole raised up and back from the wing, the flag flying back off its top over the bay and the top tail feather, its fly end lifted toward the tail tip. In ink its white hem draws its outline on the dark page; it never comes near the face.",
      styles: ["ink", "white"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, style, fill, clip }) =>
        `${pole([36, 45.5], [30.2, 18.2])}
          ${unionJack({ tl: [30.2, 19], tr: [12.4, 15], down: [0.9, 10.4], ...jackColours(style, styleFill, fill), clip })}`
    }
  ]
};

// ----------------------------------------------------------------- stages --
// A stage is behind the bird and the bird covers its middle, so what reads is
// its two sides and its front edge. The page is near-ink, so every stage is
// built from light values: an ink stage would vanish into the room.

const ledStarRiser = {
  id: "led-star-riser",
  slot: "stage",
  name: "LED star riser",
  note: "The pop star's riser under the feet, with a star on it. Ginger stands on it.",
  variants: [
    {
      key: "a",
      note: "Podium (fix 2): a narrower drum (rx 30) with a tall team-pink side, 8.4 deep at the front with a 2 ink outline, under a lit white top the feet stand on, and one big star (r 8.6) on the drum's front right, under the breast where no foot covers it, breaking the white top edge by about 5 and filling the side. A tall podium, not a plate: the top is a thin lens (ry 2.6) so the side, not the top, carries the outline. The front bottom is at 79.4.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const [cx, rx, ry, top, side] = [38, 30, 2.6, 68.4, 8.4];
        return `<path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="M ${cx - rx} ${top} L ${cx - rx} ${top + side} A ${rx} ${ry} 0 0 0 ${cx + rx} ${top + side} L ${cx + rx} ${top} Z"/>
         <ellipse fill="${styleFill}" stroke="${INK}" stroke-width="2" cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}"/>
         <path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${star(58, 72.2, 8.6, { inner: 0.5 })}"/>`;
      }
    },
    {
      key: "b",
      note: "Marquee band (critic fix): the drum inside out, a team-pink top under the feet on a tall lit band (8.4) whose front carries five big unoutlined pink stars, 8.4 across and 13 apart, centred on the band's curved front. Few and big, so they read as a marquee of lights and not a dotted cake. A string of stars where a is one emblem.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const cx = 38;
        const rx = 32;
        const ry = 3.2;
        const top = 68.4;
        const band = 8.4;
        const front = (x) => top + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
        const studs = [12, 25, 38, 51, 64].map((x) => star(x, front(x) + band / 2, 4.2, { inner: 0.5 })).join(" ");
        return `<path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="M ${cx - rx} ${top} L ${cx - rx} ${top + band} A ${rx} ${ry} 0 0 0 ${cx + rx} ${top + band} L ${cx + rx} ${top} Z"/>
          <path fill="${fill}" d="${studs}"/>
          <ellipse fill="${fill}" stroke="${INK}" stroke-width="2" cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}"/>`;
      }
    },
    {
      key: "c",
      note: "NEW (replaces the cut Walk of Fame slab). Star posts: a low squared-off riser, white top and team-pink face, with a big lit star standing up on an ink post at each end, either side of the bird. The stars change the stage's outline: it is wider and taller than the bird's feet, a stage set and not a disc.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const top = 70;
        const face = 76;
        const box = `M 1 ${top} L 75 ${top} L 75 ${face} L 1 ${face} Z`;
        const lid = `M 1 ${top} L 5.5 ${top - 2.6} L 70.5 ${top - 2.6} L 75 ${top} Z`;
        const posts = `M 3.5 ${top - 1.4} L 3.5 63 M 72.5 ${top - 1.4} L 72.5 63`;
        return `<path fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" d="${posts}"/>
          <path fill="${fill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${box}"/>
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${lid}"/>
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" d="${star(3.5, 62.2, 7, { inner: 0.48 })} ${star(72.5, 62.2, 7, { inner: 0.48 })}"/>`;
      }
    }
  ]
};

/** The soft radial pool a and b stand in. */
const softPool = (id, styleFill, { rx, ry, cy = 71.4, peak = 0.95, mid = 0.6 }) =>
  `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${styleFill}" stop-opacity="${peak}"/><stop offset="0.55" stop-color="${styleFill}" stop-opacity="${mid}"/><stop offset="1" stop-color="${styleFill}" stop-opacity="0"/></radialGradient></defs>
   <ellipse fill="url(#${id})" cx="38" cy="${cy}" rx="${rx}" ry="${ry}"/>`;

const spotlight = {
  id: "spotlight",
  slot: "stage",
  name: "Spotlight",
  note: "A pool of light on the floor. Never a cone from above: it would cross the face. Every pool is soft-edged: a hard ellipse reads as a dinner plate.",
  variants: [
    {
      key: "a",
      note: "Soft pool: a wide radial glow under the feet, brightest in the middle and gone at the edge.",
      styles: ["white", "team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, uid }) => softPool(uid("pspot"), styleFill, { rx: 40, ry: 7.4 })
    },
    {
      key: "b",
      note: "Star gobo (critic fix): a soft pool with four crisp four-point glints off the feet, big pair at the ends (r 6) and an inner pair (r 5.2, 10.4 by 8.3), painted full strength with a 2-unit ink edge under the fill (a 1-unit rim shows) so they hold on the light pool. No glint under the feet. Sparkle where a is plain glow.",
      styles: ["white", "team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, uid }) => {
        const glints = [
          [2, 68, 6],
          [13, 74.5, 5.2],
          [63, 74.5, 5.2],
          [74, 68, 6]
        ]
          .map(([x, y, r]) => star(x, y, r, { points: 4, inner: 0.28, sy: 0.8 }))
          .join(" ");
        return `${softPool(uid("pgobo"), styleFill, { rx: 36, ry: 6.6, peak: 0.8, mid: 0.45 })}
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" paint-order="stroke" d="${glints}"/>`;
      }
    }
  ]
};

export const ITEMS = [starMic, cordedMicItem, pomPom, unionJackFlag, ledStarRiser, spotlight];
