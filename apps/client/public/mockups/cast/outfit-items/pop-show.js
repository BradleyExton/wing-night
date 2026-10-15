// pop · show: the Prop and Stage items of the pop rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Where a prop can go. The sweep (the wing turned about its pivot (47,35) to
// flap, bounce, ride and hurt) leaves a prop a disc of radius ~37.5 round the
// pivot, below y ~48, and no further round the back than ~150° (past that it
// rises into the head box on hurt). The body's lower-back edge already sits
// at radius 33–35, so a prop pokes only 2–4 units past the outline at the
// back and ~6 below the belly. The §2.1 hope of pushing props to the 10-unit
// limit does not survive the sweep. So these props go big INSIDE that disc:
// flat value shapes 16–20 units across over the lower body and wing, held at
// the wing's trailing edge.

import { COLORS } from "../outfit-harness.js";

export const GENRES = ["pop"];

const INK = COLORS.ink;
const WHITE = COLORS.white;

const n2 = (v) => (Math.round(v * 100) / 100).toString();
const pt = ([x, y]) => `${n2(x)} ${n2(y)}`;
/** A closed polygon path through points. */
const polyD = (pts) => `M ${pts.map(pt).join(" L ")} Z`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** A point on the cubic Bézier p0 c1 c2 p3. */
const bez = (p0, c1, c2, p3) => (t) => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map((i) => k[0] * p0[i] + k[1] * c1[i] + k[2] * c2[i] + k[3] * p3[i]);
};

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
    const [xa, ya] = centre(Math.max(0, t - 0.01));
    const [xb, yb] = centre(Math.min(1, t + 0.01));
    const len = Math.hypot(xb - xa, yb - ya) || 1;
    const nx = -(yb - ya) / len;
    const ny = (xb - xa) / len;
    const h = w(t);
    left.push([x + nx * h, y + ny * h]);
    right.push([x - nx * h, y - ny * h]);
  }
  return polyD([...left, ...right.reverse()]);
};

/** A fluffy scalloped disc: `bumps` round lobes between valleys at radius rv, lobes peaking near rp. */
const scallop = (cx, cy, rv, rp, bumps, rotDeg = 0) => {
  const step = (2 * Math.PI) / bumps;
  const rot = (rotDeg * Math.PI) / 180;
  const at = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const ctrl = 2 * rp - rv * Math.cos(step / 2); // a quadratic's peak sits halfway to its control
  let d = `M ${pt(at(rv, rot))}`;
  for (let i = 0; i < bumps; i += 1) {
    const a0 = rot + i * step;
    d += ` Q ${pt(at(ctrl, a0 + step / 2))} ${pt(at(rv, a0 + step))}`;
  }
  return `${d} Z`;
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

/** The other light/dark value, for detail on a base. */
const against = (style) => (style === "ink" ? WHITE : INK);

/** A circle as a path, for clips. */
const circleD = (cx, cy, r) => `M ${n2(cx - r)} ${n2(cy)} A ${r} ${r} 0 1 0 ${n2(cx + r)} ${n2(cy)} A ${r} ${r} 0 1 0 ${n2(cx - r)} ${n2(cy)} Z`;

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

// ------------------------------------------------------------------ props --

const starMic = {
  id: "star-mic",
  slot: "prop",
  name: "Star mic",
  note: "The pop-star mic with a star for a head. Posh's prop. The handle is a fat white rod with a thin (1.6) ink outline and an ink grip collar, so its white core survives at 76 and the star reads as a mic head, not a sticker. No ink style: an ink star dies on the ink outline.",
  variants: [
    {
      key: "a",
      note: "Star on the hip: a 17-unit star head held down-back, a fat white handle (half-width 2 rising to 2.6) running up into the wing, an ink collar where handle meets star. As big a star as the sweep allows; one tip pokes past the lower back. The handle starts at (42.3,48.4): its fat back corner at (42.5,47.5) swung to x 36.6 on hurt, into the head box.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, inkStroke }) => {
        const p0 = [42.3, 48.4];
        const p1 = [35.5, 53.2];
        const w = (t) => 2 + 0.6 * t;
        const handle = ribbon((t) => lerp(p0, p1, t), w, 6);
        return `<path fill="${styleFill}" ${inkStroke(1.6)} d="${handle}"/>
          ${collar(p0, p1, 0.85, w(0.85) + 0.8, 1.6)}
          <path fill="${styleFill}" ${inkStroke(2)} d="${star(31, 57.2, 8.4, { aimDeg: 140, inner: 0.5 })}"/>`;
      }
    },
    {
      key: "b",
      note: "Held out to the crowd: the fat white handle runs forward-down from the wing and the star head sits out in front of the legs, tip aimed forward-down, the mic pointed at the room. A forward stick-and-star where a is a star on the hip.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, inkStroke }) => {
        const p0 = [42.5, 49];
        const p1 = [48.5, 56];
        const w = (t) => 1.8 + 0.6 * t;
        const handle = ribbon((t) => lerp(p0, p1, t), w, 6);
        return `<path fill="${styleFill}" ${inkStroke(1.6)} d="${handle}"/>
          ${collar(p0, p1, 0.85, w(0.85) + 0.8, 1.6)}
          <path fill="${styleFill}" ${inkStroke(2)} d="${star(51, 61.5, 6.5, { aimDeg: 20, inner: 0.5 })}"/>`;
      }
    }
  ]
};

/**
 * A chili's half-width along its length: a plump shoulder at the stem, a long
 * curved taper to the tip. The tip never drops under `min`: at 1.1 a 2-unit
 * hook still shows at 76; at 0.4 it dissolved into the nearest ink edge.
 */
const chiliWidth = (shoulder, min = 1.1) => (t) => {
  if (t < 0.08) return shoulder * (0.75 + (0.25 * t) / 0.08);
  if (t < 0.35) return shoulder;
  return Math.max(min, shoulder * (1 - (t - 0.35) / 0.65) ** 0.7);
};

/**
 * A centreline that runs `path` (t 0..1) for t up to `split`, then bends on
 * through `turnDeg` over `hookLen` units: the chili's hook. Positive turns
 * clockwise on screen (y down).
 */
const hooked = (path, hookLen, turnDeg, split = 0.86) => {
  const end = path(1);
  const before = path(0.995);
  const a0 = Math.atan2(end[1] - before[1], end[0] - before[0]);
  const turn = (turnDeg * Math.PI) / 180;
  return (t) => {
    if (t <= split) return path(t / split);
    // an arc of length s from the end, its heading going a0 → a0 + turn
    const s = ((t - split) / (1 - split)) * hookLen;
    if (Math.abs(turn) < 1e-6) return [end[0] + s * Math.cos(a0), end[1] + s * Math.sin(a0)];
    const rad = hookLen / turn;
    const a = a0 + s / rad;
    return [end[0] + rad * (Math.sin(a) - Math.sin(a0)), end[1] - rad * (Math.cos(a) - Math.cos(a0))];
  };
};

/**
 * A three-lobed calyx cap wrapping a chili's shoulder at the start of
 * `centre`, in a frame along the chili: u along it, v across it.
 */
const calyx = (centre, shoulder, colour, inkStroke) => {
  const o = centre(0);
  const ahead = centre(0.04);
  const len = Math.hypot(ahead[0] - o[0], ahead[1] - o[1]);
  const d = [(ahead[0] - o[0]) / len, (ahead[1] - o[1]) / len];
  const nrm = [-d[1], d[0]];
  const at = (u, v) => [o[0] + u * d[0] + v * nrm[0], o[1] + u * d[1] + v * nrm[1]];
  const half = shoulder * 0.78;
  const lobeW = (2 * half) / 3;
  const capPts = [at(-1.6, -half)];
  for (let k = 0; k < 3; k += 1) {
    for (let s = 0; s <= 10; s += 1) {
      const a = Math.PI * (s / 10);
      const v = -half + lobeW * k + (lobeW / 2) * (1 - Math.cos(a));
      capPts.push(at(0.7 + 1.3 * Math.sin(a), v));
    }
  }
  capPts.push(at(-1.6, half));
  return `<path fill="${colour}" ${inkStroke(1.2)} d="${polyD(capPts)}"/>`;
};

const chiliMic = {
  id: "chili-mic",
  slot: "prop",
  name: "Chili mic",
  note: "\"Spice\" Girls: a handheld mic made of a chili. The chili is a free crescent over pink, never laid along the wing's ink edge, and its tip keeps 1.1 units of width so the hook survives at 76. No new colour: ink, white, and gold on trial.",
  variants: [
    {
      key: "a",
      note: "NEW (replaces the cut forward chili with the grey ball). Chili head: the chili IS the mic head, held out to the crowd. A plump chili with a calyx collar on a fat white rod, hanging forward-down off the front of the belly and curling up at the tip. It hangs steep: any flatter, flap lifts its tip into the head box. The star-mic's build with a chili for the star, where b makes the chili the handle and a grille ball the head.",
      styles: ["white", "ink"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, style, inkStroke }) => {
        const p0 = [42.5, 49];
        const p1 = [46.2, 53.2];
        const w = (t) => 1.6 + 0.4 * t;
        const handle = ribbon((t) => lerp(p0, p1, t), w, 6);
        const centre = hooked(bez([46.2, 54], [48.6, 57.4], [51.6, 60], [51.8, 64.4]), 3, -120, 0.82);
        const body = ribbon(centre, chiliWidth(3.6), 48);
        return `<path fill="${WHITE}" ${inkStroke(1.6)} d="${handle}"/>
          <path fill="${styleFill}" ${inkStroke(2)} d="${body}"/>
          ${calyx(centre, 3.6, against(style), inkStroke)}`;
      }
    },
    {
      key: "b",
      note: "Chili handle: an ink mesh ball (two parallel white grille arcs, so it reads as a mic head, not a wheel) at the rear hip, and the white chili swooping from it forward along the lower belly, kept up off the belly's outline, to a 3-unit hook that curls back at the front. The mic reads first, the chili second.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, inkStroke, clip }) => {
        const centre = hooked(bez([31.5, 57.6], [37, 61.4], [45, 61.8], [49, 56.6]), 4.2, -150, 0.78);
        const body = ribbon(centre, chiliWidth(4.4, 1.5), 64);
        const [gx, gy, gr] = [27.6, 59.6, 4.6];
        const g = clip(circleD(gx, gy, gr));
        // two parallel latitude arcs: a grille. Crossing arcs made an X that read as a wheel hub.
        const mesh = `M ${n2(gx - gr)} ${n2(gy - 1.8)} Q ${n2(gx)} ${n2(gy - 0.2)} ${n2(gx + gr)} ${n2(gy - 1.8)} M ${n2(gx - gr)} ${n2(gy + 1.2)} Q ${n2(gx)} ${n2(gy + 2.8)} ${n2(gx + gr)} ${n2(gy + 1.2)}`;
        return `<path fill="${styleFill}" ${inkStroke(2)} d="${body}"/>
          ${calyx(centre, 4.4, INK, inkStroke)}
          ${g.def}<circle fill="${INK}" cx="${gx}" cy="${gy}" r="${gr}"/>
          <path fill="none" stroke="${WHITE}" stroke-width="0.9" clip-path="${g.url}" d="${mesh}"/>
          <circle fill="none" ${inkStroke(2)} cx="${gx}" cy="${gy}" r="${gr}"/>`;
      }
    }
  ]
};

/**
 * The pom's handle: a solid ink stick from inside the wing down into the pom,
 * painted under it so its top shows above. It starts on the wing's pink, not
 * on its scalloped edge: from (41.5,49) it lay along that edge and vanished.
 */
const POM_HANDLE = `<path fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" d="M 40.6 46.8 L 36.6 54.5"/>`;

const pomPom = {
  id: "pom-pom",
  slot: "prop",
  name: "Pom-pom",
  note: "Sporty's cheer pom-pom: a big fluffy white outline, never a ring and never a dark centre. Held over the near thigh at the belly line on a solid ink stick, so it is in the hand, not a cottontail on the rump. No team style: pink on the pink body is 1.00:1.",
  variants: [
    {
      key: "a",
      note: "Cloud: thirteen deep round lobes, each wider at its top than its root, 17 units across, over the near thigh, on a solid ink stick from the wing. No strand ticks (they made a snowflake) and no inner curls (three made a smiley face): the lobed outline alone. The outline is painted under the fill, so the thin lobe roots stay white and only notch the valleys.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const cx = 34;
        const cy = 60;
        return `${POM_HANDLE}
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" d="${cloud(cx, cy, 5.6, 8.5, 13, -6)}"/>`;
      }
    },
    {
      key: "b",
      note: "Mop: the plastic-strip cheer pom, twenty separate blunt strands of two lengths (9 and 7.4), each gently curled and jittered so it is shaggy and never a starburst, over the near thigh on a solid ink stick whose top shows above the mop. All strands are one path with its outline painted under the fill, so the outline only rings the mop's edge.",
      styles: ["white", "gold"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const c = [34, 60.5];
        const n = 20;
        const jitter = [6, -4, 2, -6, 4, -2, 5, -5, 1, -3];
        const strands = [];
        for (let k = 0; k < n; k += 1) {
          const a = (((k * 360) / n - 80 + jitter[k % jitter.length]) * Math.PI) / 180;
          const r = k % 2 === 0 ? 9 : 7.4;
          const dir = [Math.cos(a), Math.sin(a)];
          const side = [-dir[1], dir[0]];
          const bend = (k % 3 === 0 ? 1.3 : k % 3 === 1 ? -1 : 0.6) * (r / 9);
          // a strand from the core out to r, its tip 0.9 from straight: a curl, not a spike
          const centre = (t) => {
            const d = 1 + (r - 1.6) * t;
            const off = bend * t * t;
            return [c[0] + dir[0] * d + side[0] * off, c[1] + dir[1] * d + side[1] * off];
          };
          strands.push(ribbon(centre, (t) => 0.95 + 0.25 * t, 8));
        }
        return `${POM_HANDLE}
          <path fill="${styleFill}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" d="${strands.join(" ")} ${circleD(c[0], c[1], 3.4)}"/>`;
      }
    }
  ]
};

/**
 * A Union Jack in pink, white and ink on the parallelogram whose top edge
 * runs tl → tr and whose drop is `down`. `field` is the base, `cross` the
 * saltire and cross, `centre` (optional) a thinner line down the cross, so no
 * blue or red comes in. See `jackColours` for the two palettes.
 * Band widths are in bird units, so the thinnest stripe stays 2.
 */
const unionJack = ({ tl, tr, down, field, cross, centre, inkStroke, clip }) => {
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
  const crossD = `${band(0, 0.5, 1, 0.5, 3.6)} ${band(0.5, 0, 0.5, 1, 3.6)}`;
  const centreD = `${band(0, 0.5, 1, 0.5, 2)} ${band(0.5, 0, 0.5, 1, 2)}`;
  return `${c.def}<path fill="${field}" d="${outline}"/>
    <g clip-path="${c.url}"><path fill="${cross}" d="${saltire}"/><path fill="${cross}" d="${crossD}"/>${centre ? `<path fill="${centre}" d="${centreD}"/>` : ""}</g>
    <path fill="none" ${inkStroke(2)} d="${outline}"/>`;
};


/**
 * The flag's palette per style. White reads like the real flag's red-on-white
 * crosses: a white field with team-pink crosses (3.53:1), apart from the ink
 * Union Jack dress. Ink is the dark flag: white crosses, a pink centre line.
 */
const jackColours = (style, styleFill, fill) =>
  style === "ink" ? { field: styleFill, cross: WHITE, centre: fill } : { field: styleFill, cross: fill, centre: null };

const unionJackFlag = {
  id: "union-jack-flag",
  slot: "prop",
  name: "Union Jack flag",
  note: "Ginger's flag on a stick, in pink, white and ink: the cross reads by its geometry. White by default, with team-pink crosses like the real flag's red on white, so it parts from the ink Union Jack dress. The Ginger Look should wear b: a's flag lies over the hip and reads as dress print next to the dress's own Union Jack.",
  variants: [
    {
      key: "a",
      note: "Flown back: a solid ink pole (2.6) runs from the wing down-back past the hip, its butt poking 3.8 units past the flag; the flag, 22 by 10, droops off it, its drop sheared a little forward over the lower back.",
      styles: ["white", "ink"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, style, fill, inkStroke, clip }) => {
        const p0 = [44, 49.2];
        const p1 = [17, 59.9];
        const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        const along = (s) => lerp(p0, p1, s);
        const back = (len - 5) / len;
        const front = (len - 5 - 22) / len;
        // the butt stops 1.2 short of the line: further out, flap swings it through the floor
        const butt = along((len - 1.2) / len);
        return `${unionJack({ tl: along(back), tr: along(front), down: [5, 8.4], ...jackColours(style, styleFill, fill), inkStroke, clip })}
          <path fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" d="M ${pt(p0)} L ${pt(butt)}"/>`;
      }
    },
    {
      key: "b",
      note: "Waved upright: a near-upright stick from the front of the wing, the flag flying straight back off its top, 19 by 10. The stick stops just below the flag, before the shins, so it never reads as a third leg. A parade flag held at the side.",
      styles: ["white", "ink"],
      whitePoints: 1,
      darkCentre: false,
      draw: ({ styleFill, style, fill, inkStroke, clip }) => {
        const p0 = [43.8, 46.6];
        const p1 = [44.9, 64.5];
        return `<path fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" d="M ${pt(p0)} L ${pt(p1)}"/>
          ${unionJack({ tl: [25.6, 52.2], tr: [44.2, 50.6], down: [0.4, 10], ...jackColours(style, styleFill, fill), inkStroke, clip })}`;
      }
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
      note: "Drum: a lit white top under the feet, a team-pink drum side, and one big star on the drum's front right, under the breast where no foot covers it, breaking the drum's top edge.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill, inkStroke }) =>
        `<path fill="${fill}" ${inkStroke(2)} d="M 5 70.6 L 5 75.2 A 33 4.6 0 0 0 71 75.2 L 71 70.6 Z"/>
         <ellipse fill="${styleFill}" ${inkStroke(2)} cx="38" cy="70.6" rx="33" ry="4.6"/>
         <path fill="${styleFill}" ${inkStroke(2)} d="${star(59, 73.6, 6.8, { inner: 0.5 })}"/>`
    },
    {
      key: "b",
      note: "NEW (replaces the cut star slab). LED band: the drum inside out, a team-pink top under the feet on a lit band whose front is studded with a row of small pink LED stars, unoutlined so the row reads as lights, not a zigzag. A string of lights where a is one emblem.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill, inkStroke }) => {
        const cx = 38;
        const rx = 32;
        const ry = 3.6;
        const top = 70.2;
        const band = 6;
        let studs = "";
        for (const x of [10.5, 19.5, 28.5, 38, 47.5, 56.5, 65.5]) {
          const front = top + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
          studs += star(x, front + band / 2, 2.7, { inner: 0.48 }) + " ";
        }
        return `<path fill="${styleFill}" ${inkStroke(2)} d="M ${cx - rx} ${top} L ${cx - rx} ${top + band} A ${rx} ${ry} 0 0 0 ${cx + rx} ${top + band} L ${cx + rx} ${top} Z"/>
          <path fill="${fill}" d="${studs.trim()}"/>
          <ellipse fill="${fill}" ${inkStroke(2)} cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}"/>`;
      }
    },
    {
      key: "c",
      note: "Walk of Fame: not a riser but the Hollywood plaque, a team-pink star on a lit slab set into the floor, seen from low enough that the star still reads. The star sits forward of the foot line, two thirds of it in front of y 71, so the feet cover only its top points. The pop-star joke, flat.",
      styles: ["white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill, inkStroke }) =>
        `<path fill="${styleFill}" ${inkStroke(2)} d="M 8 63 L 68 63 L 77 79 L -1 79 Z"/>
         <path fill="${fill}" ${inkStroke(2)} d="${star(38, 75.3, 22, { inner: 0.42, sy: 0.26, aimDeg: -90 })}"/>`
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
      note: "NEW (replaces the cut hard plate). Star gobo: a dimmer soft pool scattered with crisp four-point light glints round its rim, the gobo a pop show throws on the floor. Sparkle where a is plain glow.",
      styles: ["white", "team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, uid }) => {
        const glints = [
          [5, 70.6, 2.8],
          [13.5, 75.2, 2.4],
          [25, 77.4, 2.6],
          [38, 77.8, 2.2],
          [51, 77.4, 2.6],
          [62.5, 75.2, 2.4],
          [71, 70.6, 2.8]
        ]
          .map(([x, y, r]) => star(x, y, r, { points: 4, inner: 0.28, sy: 0.75 }))
          .join(" ");
        return `${softPool(uid("pgobo"), styleFill, { rx: 36, ry: 6.6, peak: 0.7, mid: 0.4 })}
          <path fill="${styleFill}" d="${glints}"/>`;
      }
    }
  ]
};

export const ITEMS = [starMic, chiliMic, pomPom, unionJackFlag, ledStarRiser, spotlight];
