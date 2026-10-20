// disco · show: the Prop and Stage items of the disco rail (docs/research/bird-wardrobe.md §2.2).
// The contract is at the top of ../outfit-harness.js.
//
// Where a disco prop can live (the run 1b sweep, §2.1). A prop rides the wing,
// which turns about its pivot (47,35). Props are only drawn in the parade, the
// lineup and the portal, so at rest and on the walk tuck a prop stays out of
// the head box (x 36..80, y −12..37), under the chin line in the head column
// (x > 34) and above the floor; on the dance extremes and the Moves' wing
// extremes it may pass behind the head and dip 4 units under the floor. Some
// pose swings almost every direction from the pivot straight down (the clap
// at −138° takes up-and-back there), so a prop stays within about 41 units of
// the pivot. The preener leaves two dark pockets of backdrop to read
// against: under the lower tail sickle behind the wing (x 4..18, y 44..62),
// and between the upper sickle and the head (x 20..34, y 0..26). Everything
// else a prop crosses is cyan, where ink and outlined white read and team
// vanishes.
//
// Stages animate with CSS only (no filters, no SMIL): a <style> block rides
// inside each stage, keyed on the team colour so pages never share a wrong
// palette, and it stands still under prefers-reduced-motion.

import { COLORS, clip } from "../outfit-harness.js";

export const GENRES = ["disco"];

// ------------------------------------------------------------ geometry --

const r2 = (n) => Math.round(n * 100) / 100;
const rad = (deg) => (deg * Math.PI) / 180;

/** Rotate (x,y) about (cx,cy) by deg (screen space, y down: + is clockwise). */
const turn = (x, y, cx, cy, deg) => {
  const a = rad(deg);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
};

const poly = (pts) => `M ${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(" L ")} Z`;
const line = (pts) => `M ${pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(" L ")}`;

/** An egg: wider at the bottom, tilted by rot degrees about its centre. */
const eggPoints = (cx, cy, rx, ry, rot, n = 48) => {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const t = (2 * Math.PI * i) / n;
    const x = cx + rx * Math.cos(t) * (1 + 0.13 * Math.sin(t));
    const y = cy + ry * Math.sin(t);
    pts.push(turn(x, y, cx, cy, rot));
  }
  return pts;
};

/** A four-point sparkle, the mirror ball's glint. */
const sparkle = (cx, cy, r, rot = 0, inner = 0.36) => {
  const pts = [];
  for (let i = 0; i < 8; i += 1) {
    const radius = i % 2 === 0 ? r : r * inner;
    const a = rad(rot - 90 + i * 45);
    pts.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
  }
  return poly(pts);
};

/** A rotated rectangle's corners (no transform, so it can sit under a clip). */
const boxPts = (cx, cy, w, h, rot) =>
  [
    [cx - w / 2, cy - h / 2],
    [cx + w / 2, cy - h / 2],
    [cx + w / 2, cy + h / 2],
    [cx - w / 2, cy + h / 2]
  ].map(([x, y]) => turn(x, y, cx, cy, rot));

/** Point at angle deg (90 = straight down) and radius r from (cx,cy). */
const at = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

const circle = (cx, cy, r) =>
  `M ${r2(cx - r)} ${r2(cy)} A ${r} ${r} 0 1 0 ${r2(cx + r)} ${r2(cy)} A ${r} ${r} 0 1 0 ${r2(cx - r)} ${r2(cy)} Z`;

/** An arc of radius r about (cx,cy) from angle a0 to a1 (degrees, clockwise), as an open path. */
const arc = (cx, cy, r, a0, a1) => {
  const [x0, y0] = at(cx, cy, r, a0);
  const [x1, y1] = at(cx, cy, r, a1);
  return `M ${r2(x0)} ${r2(y0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${r2(x1)} ${r2(y1)}`;
};

const outlined = `stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round"`;

const glint = (x, y, r) =>
  `<path fill="${COLORS.white}" stroke="${COLORS.ink}" stroke-width="1.1" stroke-linejoin="round" d="${sparkle(x, y, r, 0, 0.42)}"/>`;

// ------------------------------------------------------- mirror-ball egg --

/** An egg placed in bird units, with a helper that maps egg-local points (x right, y down, before the tilt) out. */
const placeEgg = (cx, cy, rx, ry, rot) => {
  const local = (pts) => pts.map(([x, y]) => turn(cx + x, cy + y, cx, cy, rot));
  return { cx, cy, rx, ry, rot, d: poly(eggPoints(cx, cy, rx, ry, rot)), local, at: (x, y) => local([[x, y]])[0] };
};

// The low egg (a) hangs in the back pocket, its top tucked under the wing's
// lower edge and its front stopping near x 31.5, clear of the near leg (x 32),
// so the leg never seems to start from it. 14 × 17.8 units: run 1's egg grown
// by a fifth, now the sweep no longer pins it under the belly.
const LOW = placeEgg(24.6, 56.4, 7, 8.9, -12);
// The aloft egg (c) floats as a balloon over the upper tail sickle, in the dark
// pocket between it and the head, the ball-overhead pose at rest.
const HIGH = placeEgg(20.2, 17.6, 7.2, 8.6, -6);

/**
 * The square-facet grid of a light ball: three columns, four rows, ruled in
 * fine ink, with the back facets shaded and the front left lit. `k` scales
 * run 1's 5.8-unit grid to the egg. `backInk` puts the two lowest back facets
 * in ink (the low egg, where the wing shadows them); without it they are
 * mutedWarm, so a ball against the dark backdrop keeps its whole outline.
 */
const facetGrid = (egg, k, backInk = true) => {
  const gx = [-12, -2.1 * k, 2.1 * k, 12];
  const gy = [-12, -3.9 * k, 0, 3.9 * k, 12];
  const cell = (c, r) => poly(egg.local([[gx[c], gy[r]], [gx[c + 1], gy[r]], [gx[c + 1], gy[r + 1]], [gx[c], gy[r + 1]]]));
  const back = backInk ? COLORS.ink : COLORS.mutedWarm;
  const cells = [
    ...[[0, 2], [0, 3]].map(([c, r]) => `<path fill="${back}" d="${cell(c, r)}"/>`),
    ...[[0, 1], [1, 3]].map(([c, r]) => `<path fill="${COLORS.mutedWarm}" d="${cell(c, r)}"/>`)
  ].join("");
  const rules = [
    ...[gx[1], gx[2]].map((x) => line(egg.local([[x, -12], [x, 12]]))),
    ...[gy[1], gy[2], gy[3]].map((y) => line(egg.local([[-12, y], [12, y]])))
  ].join(" ");
  return `${cells}<path fill="none" stroke="${COLORS.ink}" stroke-width="${r2(0.75 * Math.min(k, 1.2))}" d="${rules}"/>`;
};


/** A faceted egg: fill, clipped facets, then the 2u outline over them. */
const facetedEgg = (egg, fill, facets) => {
  const c = clip(egg.d);
  return `${c.def}
    <path fill="${fill}" d="${egg.d}"/>
    <g clip-path="${c.url}">${facets}</g>
    <path fill="none" ${outlined} d="${egg.d}"/>`;
};

const mirrorBallEgg = {
  id: "mirror-ball-egg",
  slot: "prop",
  name: "Mirror-ball egg",
  note: "An egg-shaped mirror ball: faceted by a grid, mostly light, and never a light disc with a dark centre (the dark facets go to the back rim, the middle stays light). Held low in the back pocket (a), swung up on a chain (b) or floated overhead on a string (c).",
  variants: [
    {
      key: "a",
      note: "Value facets, held low: a white egg ruled into a 3 × 4 grid of square facets in fine ink lines, with the back facets in shadow (two ink, two mutedWarm) and the front left lit, and one white glint standing off its back. The tiled grid plus a patch of shade is what makes a ball a mirror ball. Grown by a fifth from run 1. White only: the ink ball read as a grenade and the gold one as a pineapple, so both styles are gone. Pair it with a sleeve that is not white.",
      styles: ["white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => `${facetedEgg(LOW, styleFill, facetGrid(LOW, 1.2))}${glint(14.2, 51.6, 3.6)}`
    },
    {
      key: "c",
      note: "Held aloft: a mirror-ball foil balloon, the same white value-faceted egg (14.4 × 17.2) floating up in the dark pocket between the upper tail sickle and the head on a 2-unit ink string tied at the wing tip, with a knot under it and one big glint off its back-top. It is the ball-overhead pose at rest; on the dance extremes it swings up behind the head, which is allowed (it paints under the head). Its back facets are mutedWarm, not ink, so its rim never merges into the dark backdrop into a half-moon. No rigid handle: on a cane the gridded egg read as a tennis racket.",
      styles: ["white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        const [kx, ky] = HIGH.at(0.3, HIGH.ry);
        const string = `M ${r2(kx)} ${r2(ky + 1.6)} C ${r2(kx - 4)} ${r2(ky + 10)} ${r2(kx + 5)} ${r2(ky + 18)} 22.6 53.2`;
        const knot = poly([[kx - 1.8, ky + 2.4], [kx + 1.8, ky + 2.4], [kx, ky - 0.5]]);
        return `<path fill="none" stroke="${COLORS.ink}" stroke-width="2" stroke-linecap="round" d="${string}"/>
          <path fill="${COLORS.ink}" d="${knot}"/>
          ${facetedEgg(HIGH, styleFill, facetGrid(HIGH, 1.24, false))}${glint(12.6, 10.4, 3)}`;
      }
    }
  ]
};

// -------------------------------------------------------------- hand fan --

// Held up and fluttered across the back: the rivet sits at the wing tip and the
// leaf opens 140 degrees from back-and-up round to up-and-forward, so it lies
// on the cyan wing and back, where an ink leaf reads (7.72:1). It stays out of
// the head box: the rivet sits at (26.5, 49.5), 1.5 below Gate 1's (26.5, 48),
// because the scallops standing 1.5 past r 14 put ten rim points in the head
// box at rest. Its far rim stays within 41 units of the wing pivot so the flap
// never swings it through the floor. Angles: 90 is straight down, 180 straight
// back, 270 straight up.
//
// The leaf is SOLID from r 3 to the rim, with no bare-stick band: Gate 1's
// hollow band on bare sticks read as an eggshell with a toothed edge. White
// pleat lines (ink on a light leaf) and a rounded, scalloped rim say fan.
const FAN = { x: 26.5, y: 49.5, ri: 3, r: 14, from: 200, to: 340, scallops: 7, bulge: 1.5 };

/** The leaf: a solid band from ri to r, its outer edge `scallops` round bulges standing `bulge` proud of r. */
const fanLeaf = (f) => {
  const step = (f.to - f.from) / f.scallops;
  // Each scallop is a circular arc between two rim points whose peak is `bulge` past r.
  const half = f.r * Math.sin(rad(step / 2));
  const sag = f.r + f.bulge - f.r * Math.cos(rad(step / 2));
  const R = r2((half * half + sag * sag) / (2 * sag));
  let d = `M ${at(f.x, f.y, f.ri, f.from).map(r2).join(" ")} L ${at(f.x, f.y, f.r, f.from).map(r2).join(" ")}`;
  for (let i = 1; i <= f.scallops; i += 1) {
    d += ` A ${R} ${R} 0 0 1 ${at(f.x, f.y, f.r, f.from + i * step).map(r2).join(" ")}`;
  }
  const [ix, iy] = at(f.x, f.y, f.ri, f.from);
  return `${d} L ${at(f.x, f.y, f.ri, f.to).map(r2).join(" ")} A ${f.ri} ${f.ri} 0 0 0 ${r2(ix)} ${r2(iy)} Z`;
};

/** One radial line per scallop valley, r 5 to 12: the pleats. */
const fanPleats = (f) => {
  const step = (f.to - f.from) / f.scallops;
  return Array.from({ length: f.scallops - 1 }, (_, i) =>
    line([at(f.x, f.y, 5, f.from + (i + 1) * step), at(f.x, f.y, 12, f.from + (i + 1) * step)])
  ).join(" ");
};

const handFan = {
  id: "hand-fan",
  slot: "prop",
  name: "Hand fan",
  note: "An open folding fan riveted at the wing tip, held up and fluttered across the back like a performer's, never pointed forward at the face. The leaf is solid with pleat lines and a scalloped rim: a hollow leaf on bare sticks read as an eggshell, and a solid wedge low at the rump would read as the bird's own tail plume, so it is held up on the back.",
  variants: [
    {
      key: "b",
      note: "The black-lacquer fan, held up and fluttered across the back: a solid ink leaf from radius 3 to 14 riveted at (26.5, 49.5) and opened 140 degrees (back tip about (13.3, 44.7), top (26.5, 35.5), front tip (39.7, 44.7)) on the cyan wing and back, where it reads at 7.72:1, with six 2-unit white pleat lines from r 5 to 12, a rim of seven rounded scallops standing 1.5 proud, and two 2.5-unit ink guard sticks along its edges running 1 unit past the rim. Gate 1 made ink the default, filled the leaf solid (the hollow band on bare sticks read as an eggshell with a toothed edge), rounded the points into scallops, dropped the light rivet, and set the rivet 1.5 lower than the critic's (26.5, 48) so the scallops clear the head box at rest. The white and gold leaves carry ink pleats.",
      styles: ["ink", "white", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ style, styleFill }) => {
        const f = FAN;
        const pleat = style === "ink" ? COLORS.white : COLORS.ink;
        const guards = [f.from, f.to].map((a) => line([[f.x, f.y], at(f.x, f.y, f.r + 1, a)])).join(" ");
        return `<path fill="${styleFill}" stroke="${COLORS.ink}" stroke-width="1.6" stroke-linejoin="round" d="${fanLeaf(f)}"/>
          <path fill="none" stroke="${pleat}" stroke-width="2" stroke-linecap="round" d="${fanPleats(f)}"/>
          <path fill="none" stroke="${COLORS.ink}" stroke-width="2.5" stroke-linecap="butt" d="${guards}"/>`;
      }
    }
  ]
};

// ----------------------------------------------------------------- vinyl --

const vinyl = {
  id: "vinyl",
  slot: "prop",
  name: "Vinyl",
  note: "A twelve-inch, held up behind (a) or leaving its sleeve (b). The label is never a plain light disc (a white label is an eye) and never a plain team disc over the team body (it reads as a hole), and it has no spindle hole: a light dot with a dark centre is exactly the eye the rules ban.",
  variants: [
    {
      key: "b",
      note: "The LP leaving its sleeve, held up behind: a white 12.5-unit square jacket at a slight tilt, held up on the back where the wing meets the tail (x 15..27, y 33..45, nowhere near the legs), with a team-colour diagonal band as its cover art, and the black record slid up and back out of its top-back corner, most of a solid disc against the cyan tail sickles, with one white sheen along its top-back rim. The team (or gold) colour is the cover art; the record carries no label, because a team label on the team body reads as a hole and the half-disc becomes a mug handle. No ring or label shows, so nothing reads as an eye.",
      styles: ["team", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill }) => {
        // Run 1 hung the sleeve low with the record sliding out of its front
        // edge onto the near leg, where the black half-disc read as a boot;
        // lower down behind the wing the record had only the dark backdrop
        // or the wing's ink edge behind it, and read as a dome or a bowling
        // ball. Up here it has the cyan tail.
        const sx = 21;
        const sy = 39;
        const rot = -8;
        const s = 12.5;
        const sleeve = poly(boxPts(sx, sy, s, s, rot));
        const c = clip(sleeve);
        // The cover art: a band across the face from the top-front corner down to the bottom-back.
        const band = poly(
          [
            [-12, 12 - 2.5],
            [12, -12 - 2.5],
            [12, -12 + 2.5],
            [-12, 12 + 2.5]
          ].map(([x, y]) => turn(sx + x, sy + y, sx, sy, rot))
        );
        // The record: behind the sleeve, slid up and back out of its top-back
        // corner, so it shows as most of a disc (slid straight up half way
        // and centred, the black dome on the white box read as a lidded cup).
        // Solid black with one white sheen (a groove ring as well made it a
        // speaker's sound waves) and NO label.
        const rr = 6.4;
        const [rcx, rcy] = turn(sx - 3, sy - s / 2 - 1.8, sx, sy, rot);
        return `${c.def}
          <path fill="${COLORS.ink}" ${outlined} d="${circle(rcx, rcy, rr)}"/>
          <path fill="none" stroke="${COLORS.white}" stroke-width="1.4" stroke-linecap="round" d="${arc(rcx, rcy, rr - 1.6, 210, 270)}"/>
          <path fill="${COLORS.white}" d="${sleeve}"/>
          <path fill="${styleFill}" clip-path="${c.url}" d="${band}"/>
          <path fill="none" ${outlined} d="${sleeve}"/>`;
      }
    }
  ]
};

// ------------------------------------------------------------- lit floor --

const BEAT_S = 0.5; // 120 bpm, the lobby's tempo
const hex = (c) => c.replace("#", "");

const litFloor = {
  id: "lit-floor",
  slot: "stage",
  name: "Lit floor",
  note: "The Saturday Night Fever floor under the feet, lit on the beat with a CSS animation (no filters). Tiles are always lit, white and team; ink is only the grout, never a tile, and never ember: the feet are leg-orange and would vanish on it.",
  variants: [
    {
      key: "a",
      note: "A perspective floor, two rows of six tiles in ink grout, every tile always lit. It flips like a chequerboard on every beat, white tiles going team and team going white, so the whole floor pulses. Reduced motion holds a lit white and team chequer.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ fill }) => {
        const k = `dsh-lfa-${hex(fill)}`;
        const vx = 40;
        const vy = 28;
        const rows = [66, 71.4, 77.4];
        const cols = [0, 13, 26, 39, 52, 65, 78];
        const xAt = (xf, y) => vx + ((xf - vx) * (y - vy)) / (rows[2] - vy);
        let tiles = "";
        for (let r = 0; r < 2; r += 1) {
          for (let c = 0; c < 6; c += 1) {
            const [y0, y1] = [rows[r], rows[r + 1]];
            const d = poly([
              [xAt(cols[c], y0), y0],
              [xAt(cols[c + 1], y0), y0],
              [xAt(cols[c + 1], y1), y1],
              [xAt(cols[c], y1), y1]
            ]);
            const odd = (r + c) % 2;
            tiles += `<path class="${k}" style="animation-delay:-${odd * BEAT_S}s" fill="${odd ? fill : COLORS.white}" stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round" d="${d}"/>`;
          }
        }
        return `<style>.${k}{animation:${k} ${2 * BEAT_S}s step-end infinite}@keyframes ${k}{0%{fill:${COLORS.white}}50%{fill:${fill}}}@media (prefers-reduced-motion:reduce){.${k}{animation:none}}</style>
          <g>${tiles}</g>`;
      }
    },
    {
      key: "b",
      note: "One big lit tile, the bird's own: a thin slab seen from above with a 2u ink front edge, split into three columns by two rows of panels, the splits clear of the legs. Two opposite panels burn white at once and the pair chases round all six on the beat, so any still frame shows two of six lit. Reduced motion holds panels 0 and 3 white.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ fill }) => {
        const k = `dsh-lfb-${hex(fill)}`;
        const back = 62;
        const mid = 69;
        const front = 76;
        const bx = [13, 27, 53, 67];
        const fx = [5, 22, 58, 75];
        const lerp = (a, b, t) => a + (b - a) * t;
        const t = (mid - back) / (front - back);
        const mx = bx.map((b, i) => lerp(b, fx[i], t));
        const quad = (top, ty, bot, by, i) => poly([[top[i], ty], [top[i + 1], ty], [bot[i + 1], by], [bot[i], by]]);
        // Chase order: back row left to right, then front row right to left.
        const panels = [
          quad(bx, back, mx, mid, 0),
          quad(bx, back, mx, mid, 1),
          quad(bx, back, mx, mid, 2),
          quad(mx, mid, fx, front, 2),
          quad(mx, mid, fx, front, 1),
          quad(mx, mid, fx, front, 0)
        ];
        const n = panels.length;
        const slabFront = poly([
          [fx[0], front],
          [fx[3], front],
          [fx[3] - 0.6, front + 2],
          [fx[0] + 0.6, front + 2]
        ]);
        const cells = panels
          .map((d, i) => `<path class="${k}" style="animation-delay:-${((n - i) % n) * BEAT_S}s" fill="${i % 3 === 0 ? COLORS.white : fill}" stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round" d="${d}"/>`)
          .join("");
        // Six beats, lit on beats 0 and 3: panel i shares its phase with i + 3.
        const lit = r2(100 / n);
        const half = r2(50 + 100 / n);
        return `<style>.${k}{animation:${k} ${n * BEAT_S}s step-end infinite}@keyframes ${k}{0%{fill:${COLORS.white}}${lit}%{fill:${fill}}50%{fill:${COLORS.white}}${half}%{fill:${fill}}100%{fill:${fill}}}@media (prefers-reduced-motion:reduce){.${k}{animation:none}}</style>
          <path fill="${COLORS.ink}" stroke="${COLORS.ink}" stroke-width="2" stroke-linejoin="round" d="${slabFront}"/>
          ${cells}`;
      }
    }
  ]
};

// ----------------------------------------------------------- neon flames --

/**
 * One neon flame sign in the fire-emoji silhouette, drawn in local units
 * (dx toward the lean side, up from the base) and scaled sx × sy: a round bulb
 * of radius 5.5 sitting on the base, a main tongue rising from the bulb's
 * lean-side shoulder in an S-curve to a tip 20 up and 3 over, and a short side
 * tongue off the other shoulder to a tip 13 up, its end curled outward. The
 * notch between them sits 11 up, ABOVE the bulb: a split that starts at the
 * base makes two equal spikes, an M glyph (a crown, grass, ice). The uneven
 * tips (20 against 13) are what make it a flame.
 */
const FLAME_H = 20;
const flameOutline = (x, yb, m, sx, sy) => {
  const P = (dx, up) => `${r2(x + m * sx * dx)} ${r2(yb - sy * up)}`;
  const rx = r2(5.5 * sx);
  const ry = r2(5.5 * sy);
  const sweep = m > 0 ? 1 : 0;
  return [
    `M ${P(5.5, 5.5)}`,
    // the bulb: round under, shoulder to shoulder through the base
    `A ${rx} ${ry} 0 0 ${sweep} ${P(0, 0)}`,
    `A ${rx} ${ry} 0 0 ${sweep} ${P(-5.5, 5.5)}`,
    // up the side tongue's outside, pinching in, then flicking out to its curled tip
    `C ${P(-5.5, 8.4)} ${P(-3.6, 10)} ${P(-5.4, 13.2)}`,
    // down its inside into the notch
    `C ${P(-3.2, 12.6)} ${P(-1.6, 11.4)} ${P(-0.5, 11)}`,
    // up the main tongue's inside, an S to the tip
    `C ${P(1.4, 13)} ${P(0.4, 16.8)} ${P(3, FLAME_H)}`,
    // and down its outside, bellying out, into the lean-side shoulder
    `C ${P(4.2, 17.2)} ${P(6.8, 13.2)} ${P(5.5, 5.5)}`,
    "Z"
  ].join(" ");
};

/**
 * The white-hot heart: a SOLID teardrop 4.5 wide and 9 tall on the bulb's
 * centre, its point leaning toward the main tongue, in the same local units.
 */
const flameCore = (x, yb, m, sx, sy) => {
  const P = (dx, up) => `${r2(x + m * sx * dx)} ${r2(yb - sy * up)}`;
  const r = 2.25;
  const cu = 4.2;
  const sweep = m > 0 ? 1 : 0;
  return [
    `M ${P(-r, cu)}`,
    `C ${P(-r, cu + 2.6)} ${P(-0.2, cu + 4.6)} ${P(0.7, cu + 6.6)}`,
    `C ${P(r * 1.05, cu + 4.4)} ${P(r, cu + 2.4)} ${P(r, cu)}`,
    `A ${r2(r * sx)} ${r2(r * sy)} 0 0 ${sweep} ${P(-r, cu)} Z`
  ].join(" ");
};

const FLAME_TUBE = 2.4;
const BIG_TUBE = 2.8; // b's two bigger signs

/**
 * A neon tube: a team stroke with a white-hot core line (team), or one plain
 * white tube (white). `w` is the outer width.
 */
const tube = (d, styleFill, w = FLAME_TUBE) => {
  const open = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  if (styleFill === COLORS.white) return `${open}<path stroke="${COLORS.white}" stroke-width="${w}" d="${d}"/></g>`;
  return `${open}
    <path stroke="${styleFill}" stroke-width="${w}" d="${d}"/>
    <path stroke="${COLORS.white}" stroke-width="${r2(w * 0.42)}" d="${d}"/>
  </g>`;
};

/**
 * A whole flame sign: the outline in neon tube and the solid heart inside it
 * (white in team, team in white, so the heart always shows), grouped so one
 * class animates both.
 */
const neonFlame = ({ x, yb, lean, sx, sy }, styleFill, team, cls = "", w = FLAME_TUBE) => {
  const m = lean < 0 ? -1 : 1;
  const heart = styleFill === COLORS.white ? team : COLORS.white;
  return `<g${cls ? ` class="${cls}"` : ""}>${tube(flameOutline(x, yb, m, sx, sy), styleFill, w)}<path fill="${heart}" d="${flameCore(x, yb, m, sx, sy)}"/></g>`;
};

/** A five-point star of outer radius r, turned rot degrees (upright at 0). */
const starPts = (cx, cy, r, rot, inner = 0.45) => {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * inner;
    pts.push(at(cx, cy, radius, rot - 90 + i * 36));
  }
  return pts;
};

const buzz = (k) =>
  `<style>.${k}{animation:${k} 3s linear infinite}@keyframes ${k}{0%,88%,92%,100%{opacity:1}90%{opacity:.3}95%{opacity:.6}}@media (prefers-reduced-motion:reduce){.${k}{animation:none}}</style>`;

// The neon floor line sits 1.25 under the floor, so its top edge is where the
// feet stand and the flames get the extra height (a stage's top edge is y 55,
// so a sign is at most 18.8 tall off it).
const NEON_FLOOR = 74;
const SIGN_H = 18.8;

const neonFlames = {
  id: "neon-flames",
  slot: "stage",
  name: "Neon flames",
  note: "Neon signs along the floor edge: tubes, never fire. A flame is the fire-emoji silhouette (a round bulb, a tall S-curved tongue and a short curled side tongue split above the bulb, never a flat-based M) with a solid hot heart, in cool team light, because metal owns real flame and ember. Never a row of pointed glyphs on a baseline under the bird: that is a jaw.",
  variants: [
    {
      key: "a",
      note: "Two flame signs standing on a neon floor line, one behind the tail leaning back and one in front of the chest leaning forward, where the bird never covers them: each the fire-emoji outline, 11 wide and 18.8 tall, a round bulb with a tall S-curved main tongue and a short side tongue curled outward, split above the bulb so the tips are uneven, and a solid teardrop heart in the bulb. Team is a 2.4 cyan tube with a white core line and a white heart; white is a plain white tube with a team heart. The back flame buzzes off and on like a tired sign.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const k = `dsh-nfa-${hex(fill)}`;
        const y = NEON_FLOOR;
        const flame = { yb: y, sx: 1, sy: SIGN_H / FLAME_H };
        return `${buzz(k)}${tube(`M -6 ${y} L 86 ${y}`, styleFill)}${neonFlame({ ...flame, x: 6, lean: -1 }, styleFill, fill, k)}${neonFlame({ ...flame, x: 74, lean: 1 }, styleFill, fill)}`;
      }
    },
    {
      key: "b",
      note: "Two different neon signs on one floor tube, so there is never a row: one big flame sign behind the tail (the fire-emoji outline at 14.3 wide and 18.8 tall, leaning back) and a big neon five-point star (17 across) in front of the chest, tipped 16 degrees so it stands jauntily on one lower point on the floor tube and is never upside down. Both are a bolder 2.8 tube; the star is a team tube with a white core and a solid white heart star inside it (team heart in the white style); it ties the stage to disco rather than to metal's fire. They light alternately on the beat: both on the downbeat, then the star alone, both, the flame alone. Reduced motion holds both lit.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: ({ styleFill, fill }) => {
        const k = `dsh-nfb-${hex(fill)}`;
        const y = NEON_FLOOR;
        const heart = styleFill === COLORS.white ? fill : COLORS.white;
        const flame = neonFlame({ x: 8.5, yb: y, lean: -1, sx: 1.3, sy: SIGN_H / FLAME_H }, styleFill, fill, `${k}-f`, BIG_TUBE);
        // The star stands on its lowest point on the floor tube, tipped 16
        // degrees so that point is off-centre (never upside down), its top
        // point kept under the stage's top edge (y 55). No post: a star on a
        // stick read as a wand or a flower.
        const [sr, srot] = [8.6, 16];
        const [scx, scy] = [72, y - 1 - sr * Math.sin(rad(70))];
        const star = `<g class="${k}-s">${tube(poly(starPts(scx, scy, sr, srot)), styleFill, BIG_TUBE)}<path fill="${heart}" d="${poly(starPts(scx, scy, sr * 0.4, srot))}"/></g>`;
        // Four beats: both, star only (flame dim), both, flame only (star dim).
        const dim = ".35";
        const css = `.${k}-f{animation:${k}-f ${4 * BEAT_S}s step-end infinite}@keyframes ${k}-f{0%{opacity:1}25%{opacity:${dim}}50%{opacity:1}}.${k}-s{animation:${k}-s ${4 * BEAT_S}s step-end infinite}@keyframes ${k}-s{0%{opacity:1}75%{opacity:${dim}}}@media (prefers-reduced-motion:reduce){.${k}-f,.${k}-s{animation:none}}`;
        return `<style>${css}</style>${tube(`M -6 ${y} L 86 ${y}`, styleFill)}${flame}${star}`;
      }
    }
  ]
};

export const ITEMS = [mirrorBallEgg, handFan, vinyl, litFloor, neonFlames];
