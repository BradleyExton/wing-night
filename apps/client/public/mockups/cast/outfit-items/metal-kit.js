// metal · kit: the Top, Sleeve, Tail and Boots items of the metal rail
// (docs/research/bird-wardrobe.md §2.2), drawn on the spiky chrome bird.
//
// Chrome (#d9dee6) is the lightest team colour, so ink reads at 13.9:1 and
// white vanishes at 1.35:1 on the body. Two consequences run through every
// drawing here:
//  - on the body, an item lives on its ink (a dark block on a light bird);
//  - OFF the body, against the dark TV, ink vanishes too. Anything that
//    changes the outline out in the air (tail, flames) is drawn in a light
//    colour with an ink edge: chrome for steel, ember for fire.
// On the spiky bird the wing covers most of the body: a Top only shows in a
// strip about 13 units wide (x 50..63, y 38..58), so every Top here puts ONE
// big shape in that strip and nothing thin.
// The contract is at the top of ../outfit-harness.js.
//
// Round 2 (after critic 1): cut every face read (fangs, teeth, eye-pair toe
// caps, ring-and-hole chain links) and every duplicate; the cut slots hold
// new, different solutions under the same keys.
// Round 3 (after critic 2): fixes applied as specified; the five cut variants
// are replaced under the same keys (biker-jacket's keys are now a and b).
// Run 1b (after critic 3): the three fixes applied (biker-jacket a, chain-loop
// a, spiked-boots a); every cut replaced under its key by a different read.
// Two facts the drawings now lean on: a Top may paint over the wing anywhere
// inside the body below head.shoulders (the slung bandolier does), and the
// boots only show below the body's underside, about y 61.
// Polish 1 (after the polish critic): the six fixes applied (bandolier a,
// biker-jacket a and b, flame-sleeve a, spiked-cuff a, lava-tips a), and the
// two cut boots replaced under their keys (combat-boots c, spiked-boots b).
// Where a fix as written failed a measured rule or drew badly, the variant's
// note says what changed and why.
// Polish 2 (after polish critic 2): the six fixes applied as specified
// (battle-vest b, bandolier a, leather-sleeve b, flame-sleeve a, lava-tips a,
// spiked-boots a), and the four cuts replaced under their keys by different
// reads (biker-jacket b, spiked-cuff a, combat-boots c, spiked-boots b).

import { inkStroke, clip } from "../outfit-harness.js";

export const GENRES = ["metal"];

const INK = "#121212";
const EMBER = "#ffb35a";
const MITER = inkStroke(2, "miter");
const ROUND = inkStroke(2, "round");
const EDGE = inkStroke(1.5, "round");
const EDGE_MITER = inkStroke(1.5, "miter");
const THIN = inkStroke(1.2, "round");
const THIN_MITER = inkStroke(1.2, "miter");

const f1 = (n) => (Math.round(n * 100) / 100).toString();
const pt = (p) => `${f1(p.x)} ${f1(p.y)}`;

// ------------------------------------------------------------- the chest --
// The spiky chest that shows: right of the wing's front edge, under the neck,
// inside the body. A Top paints OVER the wing, so a panel that spilled left
// would swallow the wing; every panel starts at this edge instead.

const bez = (a, b, c, d, t) => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y
  };
};

// The wing's front edge (C 51 40 49 46 45 51 from the pivot), pushed 0.8
// forward so a panel clears the wing's ink line.
const WING_FRONT = Array.from({ length: 11 }, (_, i) =>
  bez({ x: 47, y: 35 }, { x: 51, y: 40 }, { x: 49, y: 46 }, { x: 45, y: 51 }, i / 10)
).map((p) => ({ x: p.x + 0.8, y: p.y }));

/** The left edge of a chest panel from y `top` down to the wing's foot. */
const frontEdgeFrom = (top) => {
  const pts = WING_FRONT.filter((p) => p.y > top);
  const first = WING_FRONT.findIndex((p) => p.y > top);
  if (first > 0) {
    const a = WING_FRONT[first - 1];
    const b = WING_FRONT[first];
    const t = (top - a.y) / (b.y - a.y);
    return [{ x: a.x + t * (b.x - a.x), y: top }, ...pts];
  }
  return [{ x: pts[0].x, y: top }, ...pts];
};

/** The x of the wing's front edge (pushed 0.8 forward) at height `y`. */
const wingFrontX = (y) => {
  const i = WING_FRONT.findIndex((p) => p.y >= y);
  if (i <= 0) return WING_FRONT[Math.max(i, 0)].x;
  const a = WING_FRONT[i - 1];
  const b = WING_FRONT[i];
  return a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
};

/** The whole chest, from `top` (≥ head.shoulders) down past the belly. */
const chestPanel = (top) => {
  const edge = frontEdgeFrom(top);
  return `M ${pt(edge[0])} L 72 ${f1(top)} L 72 66 L 43.6 66 L 44.4 56 ${edge
    .slice()
    .reverse()
    .map((p) => `L ${pt(p)}`)
    .join(" ")} Z`;
};

/** A panel clipped to the spiky body, so it can never leave the outline. */
const onBody = (ctx, inner) => {
  const c = clip(ctx.bodyPath);
  return `<defs>${c.def}</defs><g clip-path="${c.url}">${inner}</g>`;
};

// The hot-rod vest's flame patch: one big flame, 11 wide and 15.6 tall, its
// main tongue up to y 39.2 (under the costume shoulders; the drawn neck hides
// about 3 units of it) and one side tongue, solid ember with nothing dark
// inside it, so it is a flame and never a face. Its base sits at y 54.8, so
// about 6 units of black vest show under it, clear of the orange legs.
const VEST_FLAME =
  "M 56.6 54.8 C 52.2 54.8 50.6 51.57 51.2 48.68 C 51.6 46.47 53.4 45.11 53.4 42.56 C 55.4 43.58 56.2 45.28 56 46.81 C 57.4 44.77 57.6 41.88 56.4 39.16 C 59.8 40.69 62.6 44.09 62.8 47.83 C 63 51.91 60.6 54.8 56.6 54.8 Z";

// ------------------------------------------------------------------- TOP --

const BOLT = "M 56 39.4 L 62.2 39.4 L 58.8 45.4 L 62.8 45.4 L 51.4 57.8 L 54.4 49.6 L 50.4 49.6 Z";

const battleVest = {
  id: "battle-vest",
  slot: "top",
  name: "Battle vest",
  note: "Round one's survivor: the denim/leather cut-off in ink, with ONE back-patch-sized team patch. Kept big and flat so it reads as a dark block with a light mark.",
  variants: [
    {
      key: "a",
      note: "Ink vest, one fat chrome lightning-bolt patch (18 units tall, 12 wide) cut into it, no outline to thin it. The bolt is the team colour showing through: the most metal 13-unit shape that is not a face.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) =>
        onBody(ctx, `<path fill="${ctx.styleFill}" d="${chestPanel(ctx.head.shoulders)}"/><path fill="${ctx.fill}" d="${BOLT}"/>`)
    },
    {
      key: "b",
      note: "Run 1b, replaces the laced vest (a light squiggle on black, the same read as a): the hot-rod vest. ONE big ember flame patch fills the open chest, 11 wide and 15.6 tall, a main tongue and a side tongue, solid with nothing dark inside. Polish 2: lifted 3.4 units so about 6 units of black vest show under it; set on the hem it smeared into the orange legs and read as a belly patch or an egg. A flame rising from the hem was tried first and read as an orange belly: the chest strip is too short for tongues, so the flame is the patch. a is a cold silver bolt, this is a warm fire.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) =>
        onBody(ctx, `<path fill="${ctx.styleFill}" d="${chestPanel(ctx.head.shoulders)}"/><path fill="${EMBER}" ${EDGE} d="${VEST_FLAME}"/>`)
    }
  ]
};

// A bandolier strap is a band of half-width `half` along the line from → to.
const strapFrame = ({ from, to }) => {
  const l = Math.hypot(to.x - from.x, to.y - from.y);
  const u = { x: (to.x - from.x) / l, y: (to.y - from.y) / l };
  return { u, n: { x: -u.y, y: u.x } };
};
// The slung belt: from under the chin (62,39) down over the wing to the lower
// back (22,57), 4.6 either side of that line; the body clip ends it.
const SLUNG = { from: { x: 62, y: 39 }, to: { x: 22, y: 57.5 }, half: 3.2 };
// A long cartridge, 9.6 × 3.6, pointed end (2) out along +x: longer than the
// slung strap is wide, so tip and base stand proud of it and read as bullets.
const LONG_CARTRIDGE = "M -4.8 -1.8 L 2.8 -1.8 L 4.8 0 L 2.8 1.8 L -4.8 1.8 Z";
// The crossing strap for the crossed pair: from the back of the shoulder
// (40,37) down over the wing to the belly's front (66,61). It crosses SLUNG at
// about (49.6,45.4), on the wing's front edge.
const CROSS = { from: { x: 40, y: 37 }, to: { x: 66, y: 61 }, half: 3.2 };
/** A long strap `s`, run 12 past each end and cut level at `top`; the body clip ends it. */
const longStrapPath = (s, top) => {
  const { u, n } = strapFrame(s);
  const a = { x: s.from.x + u.x * -12, y: s.from.y + u.y * -12 };
  const b = { x: s.to.x + u.x * 12, y: s.to.y + u.y * 12 };
  const h = s.half;
  const quad = [
    { x: a.x + n.x * h, y: a.y + n.y * h },
    { x: b.x + n.x * h, y: b.y + n.y * h },
    { x: b.x - n.x * h, y: b.y - n.y * h },
    { x: a.x - n.x * h, y: a.y - n.y * h }
  ];
  // cut level at `top`: nothing of a Top rises above head.shoulders
  const out = [];
  quad.forEach((p, i) => {
    const q = quad[(i + 1) % quad.length];
    if (p.y >= top) out.push(p);
    if (p.y >= top !== q.y >= top) {
      const t = (top - p.y) / (q.y - p.y);
      out.push({ x: p.x + t * (q.x - p.x), y: top });
    }
  });
  return `M ${out.map(pt).join(" L ")} Z`;
};

/** Long cartridges at fractions `ts` of strap `s`, tips out along its upward normal. */
const strapBullets = (s, ts, brass) => {
  let { n } = strapFrame(s);
  if (n.y > 0) n = { x: -n.x, y: -n.y };
  const rot = (Math.atan2(n.y, n.x) * 180) / Math.PI;
  return ts
    .map((t) => {
      const p = { x: s.from.x + (s.to.x - s.from.x) * t, y: s.from.y + (s.to.y - s.from.y) * t };
      return `<path fill="${brass}" ${inkStroke(1, "miter")} transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(rot)})" d="${LONG_CARTRIDGE}"/>`;
    })
    .join("");
};

const bandolier = {
  id: "bandolier",
  slot: "top",
  name: "Bullet belt",
  note: "Bullet belts worn over everything: wide ink straps that cross the chest strip and the wing diagonally, with long brass cartridges standing proud of both edges.",
  variants: [
    {
      key: "a",
      note: "Polish 2, the critic's fix: the crossed pair, Pancho Villa's or Lemmy's X, which no other variant has. b's slung strap from under the chin to the lower back, and over it a second strap from the back of the shoulder (40,37) down to the belly's front, both 6.4 wide, crossing at about (49.6,45.4) on the wing's front edge. Five long cartridges (9.6 × 3.6, tips out on each strap's upward normal), three on the slung strap and two on the cross, and none within 5 units of the crossing, so the middle is a clean black X. At 76 it is a big black X with brass bars, a different silhouette from b's single sash. The short chest strap it replaces read as a striped badge (hazard tape, a bee). Default bullets are ember, a house token at about 11:1 on the ink; the gold style is the open-question-4 trial.",
      styles: ["ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const brass = ctx.style === "gold" ? ctx.colors.gold : EMBER;
        const top = Math.max(ctx.head.shoulders, 37);
        return onBody(
          ctx,
          `<path fill="${INK}" d="${longStrapPath(SLUNG, top)}"/><path fill="${INK}" d="${longStrapPath(CROSS, top)}"/>${strapBullets(SLUNG, [0.18, 0.62, 0.84], brass)}${strapBullets(CROSS, [0.66, 0.86], brass)}`
        );
      }
    },
    {
      key: "b",
      note: "Run 1b, replaces the hot-sauce bottle (it read as a cowbell): the slung belt. One long bullet belt worn across the whole bird, from under the chin down over the wing to the lower back, 40 units long where a is a 20-unit chest strap, carrying four long cartridges that stand proud of the strap on both sides. It paints over the sleeve as a real bandolier sits over the arm, so on the leather sleeve the brass still reads (11:1).",
      styles: ["ink", "gold"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const brass = ctx.style === "gold" ? ctx.colors.gold : EMBER;
        const top = Math.max(ctx.head.shoulders, 37);
        return onBody(ctx, `<path fill="${INK}" d="${longStrapPath(SLUNG, top)}"/>${strapBullets(SLUNG, [0.18, 0.4, 0.62, 0.84], brass)}`);
      }
    }
  ]
};

// The jacket is a VALUE change of the whole visible body: everything on the
// body that is not wing turns ink (body minus wing, evenodd), cut level at
// head.shoulders. The chest, the belly under the wing and the rump go black
// and the wing, or whatever sleeve is worn, shows through as a silver arm:
// the inverse of leather-sleeve a, and a whole jacket where the battle vest
// is only a front panel.
const jacketBody = (ctx) => {
  const s = ctx.head.shoulders;
  const c = clip(`M 0 ${s} L 80 ${s} L 80 80 L 0 80 Z`);
  return `<defs>${c.def}</defs><g clip-path="${c.url}"><path fill="${ctx.styleFill}" fill-rule="evenodd" d="${ctx.bodyPath} ${ctx.wingPath}"/></g>`;
};

const bikerJacket = {
  id: "biker-jacket",
  slot: "top",
  name: "Biker jacket",
  note: "The Perfecto: the whole body in ink with the wing left silver as the sleeve, one big lapel point, an off-centre zip. The full-body value change is what says 'jacket' and not 'vest'.",
  variants: [
    {
      key: "a",
      note: "Polish 1, the critic's fix: the jacket is the whole body, not a chest panel. Body minus wing goes ink from head.shoulders down (chest, belly, rump), so the bird is black with a silver wing; the yoke is gone, the chrome wing against the black body is the shoulder line. A 3-unit chrome zip runs from under the collar to the hem and ONE 13-unit chrome lapel point folds back from the collar. A black bird with a silver arm, the inverse of leather-sleeve a; the battle vest is a front panel only.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const lapel = "M 53.6 37.6 L 64.4 38.6 L 59.6 46.4 L 62.4 51.6 L 54.6 50.2 Z";
        return onBody(
          ctx,
          `${jacketBody(ctx)}<path fill="none" stroke="${ctx.fill}" stroke-width="3" stroke-linecap="butt" d="M 61.4 39.6 L 51.8 57.4"/><path fill="${ctx.fill}" ${EDGE_MITER} d="${lapel}"/>`
        );
      }
    },
    {
      key: "b",
      note: "Polish 2, replaces the open Ramones jacket (it duplicated a at 76 and its thin white wedge read as a tuxedo front): the club jacket. The same whole-body ink jacket, closed, crossed by ONE wide ember band, 6.8 tall, from the wing's front edge to the chest's front: the black-and-orange of a biker club's leathers. Where a's chrome zip and lapel run diagonally and cold, this is one warm horizontal bar, ember on ink at about 11:1, no white anywhere, nothing thin. A black bird with a silver arm and an orange chest stripe.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const band = `M ${f1(wingFrontX(42.6))} 42.6 L 72 42.6 L 72 49.4 L ${f1(wingFrontX(49.4))} 49.4 Z`;
        return onBody(ctx, `${jacketBody(ctx)}<path fill="${EMBER}" ${EDGE_MITER} d="${band}"/>`);
      }
    }
  ]
};

// ---------------------------------------------------------------- SLEEVE --

// The spiky wing with its trailing edge redrawn as a bat's: three points
// (21,57.4) (30.6,59.4) (39.8,58.6), each within the 7-unit fringe and ending
// ON the chrome body (an ink point off the body vanishes on the dark TV), with
// deep arches between them, each about 9.6 wide and rising to an apex near
// y 44, so a real block of chrome shows through. The arch controls lean to +x,
// so each point's back side is steep and its front side sweeps: the points
// rake back like finger tips instead of hanging straight down.
const BATWING =
  "M 47 35 C 38 29 24 33 20 44 C 19.4 48 19.8 53 21 57.4 C 23.6 39.5 29.4 41 30.6 59.4 C 32.8 39.5 38.6 41 39.8 58.6 C 40.6 52 42.4 50.4 45 51 C 49 46 51 40 47 35 Z";

// The flame wing: a wing made of fire, its flames rising up and back out of
// the leather. The spiky wing's front edge and its top edge as far as
// (29.5,33.9) are kept; from there the top-back edge is three tongues, each
// with a long front side sweeping up and back to a sharp tip and a short,
// steep back side, like a hot-rod flame stood on end. The first two tips sit
// ON the old outline with a notch cut down and forward behind each (the
// chrome body shows in it: the batwing's trick, pointed the way fire goes).
// The sleeve fringe only exists below the line from the wing pivot through
// the back tip, so the third tongue, the only one that leaves the wing,
// streams straight back off the back tip. The bottom is one smooth edge:
// nothing hangs toward the legs.
const FLAME_WING =
  "M 47 35 C 41.87 31.58 35.12 31.41 29.52 33.93 C 30 36.4 29.6 39 30.4 41.6 C 28.4 40 25.4 40.6 22.23 39.8 C 22.8 42 22.6 44 23.6 46.2 C 21 46.9 17 48.8 13.6 50.4 C 16.6 51.2 19.4 52.4 21.8 53.8 C 24 55.6 28 56.4 32 56 C 38 55.6 42 54 45 51 C 49 46 51 40 47 35 Z";
// The leather the fire burns out of: the whole front and bottom of the wing in
// ink, its edge running from the first tongue's tip down and BACK to the
// wing's bottom at x 33.4, so the ember above it is one back-leaning flame
// whose tips are the three tongues, like fire streaming off a moving wing.
// Every flame points one way, up and back; nothing licks forward (forward
// licks gave the ember lobes in every direction, a maple leaf). Light into
// dark only: no dark shape is ever enclosed by ember.
const INK_SHOULDER = "M 28 28 L 29.52 33.93 C 33.4 35.4 36.6 37.4 37.4 41.4 C 38 45.6 36.4 51 33.4 57 L 52 57 L 52 28 Z";

/**
 * The stock wing painted out in the body colour, outline and all, so a sleeve
 * that redraws the trailing edge higher (the batwing's arches, the flame's
 * valleys) shows the body there and not the old wing's zigzag.
 */
const eraseWing = (ctx) =>
  `<path fill="${ctx.fill}" stroke="${ctx.fill}" stroke-width="3.2" stroke-linejoin="round" d="${ctx.wingPath}"/>`;

const leatherSleeve = {
  id: "leather-sleeve",
  slot: "sleeve",
  name: "Leather sleeve",
  note: "The whole wing in ink: the strongest read in the render test. A 507-square-unit dark shape on a chrome bird.",
  variants: [
    {
      key: "a",
      note: "Plain ink wing, mitered like the body. Nothing else: the value change is the item.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => `<path fill="${ctx.styleFill}" ${MITER} d="${ctx.wingPath}"/>`
    },
    {
      key: "b",
      note: "Run 1b, replaces the chrome wristband (a two-tone stripe): the batwing. The ink sleeve's trailing feathers become three long points with deep scalloped arches between them, so the chrome body shows through each arch; every point ends on the chrome body, where ink reads. Polish 2: the arches are cut about 5 units deeper (apex near y 44, about 9.6 wide by 14 tall of chrome) and lean back, so the points rake back like a bat's finger tips; at y 49 they were 2-px bumps that read as a ragged hem, and the points hung like drips. Goth leather by outline alone, inside the 7-unit fringe; a is the plain wing.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => `${eraseWing(ctx)}<path fill="${ctx.styleFill}" ${MITER} d="${BATWING}"/>`
    }
  ]
};

const flameSleeve = {
  id: "flame-sleeve",
  slot: "sleeve",
  name: "Flame sleeve",
  note: "The ink wing on fire. Ember is a house token and light, so a flame reads against the dark TV where an ink spike would vanish.",
  variants: [
    {
      key: "a",
      note: "Polish 1, the critic's fix, adapted: fire points up and back. The wing keeps its smooth bottom (nothing hangs toward the legs), the leather is the front of the wing in ink, and the fire rises out of it: the top-back edge becomes three ember tongues, each a long front side sweeping up and back to a sharp tip and a short steep back side, with a notch cut down behind each where the chrome body shows. Polish 2: the two forward licks are gone and the ink now covers the whole front and bottom of the wing, its edge sweeping from the first tongue's tip down and back, so the ember is ONE back-leaning flame whose tips are the three tongues; with licks pointing forward too, the ember had lobes in every direction and read as a maple leaf. The fix as written (tips out at (13.6,37.6) and (13.2,43.4), above the back tip) fails the sleeve rule: the 7-unit fringe only exists below the line from the wing pivot through the back tip, which falls 0.45 a unit per unit back, so no tongue may leave the wing upward. The tips therefore sit ON the old outline, and only the third tongue leaves the wing, straight back off the back tip, light against the dark TV. Every tongue is light into dark, so no mouth can open. b is a decal on an ink wing; this is a wing made of fire.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = clip(FLAME_WING);
        return `${eraseWing(ctx)}<defs>${c.def}</defs><path fill="${EMBER}" d="${FLAME_WING}"/><g clip-path="${c.url}"><path fill="${ctx.styleFill}" d="${INK_SHOULDER}"/></g><path fill="none" ${MITER} d="${FLAME_WING}"/>`;
      }
    },
    {
      key: "b",
      note: "Hot-rod decal: ember flames painted ON the ink wing, starting at the shoulder and licking back in three tongues to the wing's tip. Surface, not outline, but one 20-unit flat shape at 9:1 against the ink.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const c = clip(ctx.wingPath);
        const decal =
          "M 50 37 C 45 35.6 39 35.4 31.6 35.8 C 36 37.4 38.6 38.6 40.4 39.8 C 34 39.8 27.6 41 21.4 44.6 C 28.6 43.8 34.6 43.8 39.6 44.6 C 35 46 31 48.4 28 52 C 34.6 49 41.6 47.6 50 47.6 Z";
        return `<defs>${c.def}</defs><path fill="${ctx.styleFill}" d="${ctx.wingPath}"/><g clip-path="${c.url}"><path fill="${EMBER}" ${ROUND} d="${decal}"/></g><path fill="none" ${MITER} d="${ctx.wingPath}"/>`;
      }
    }
  ]
};

// ------------------------------------------------------------------ TAIL --
// The spiky tail's three blades, tip first: (2,46) (0,26) (7,9). The body
// covers the roots from x ≈ 18–29, so what shows is the outer two-thirds.

/** Points every `step` units along a cubic Bézier, by arc length. */
const alongCubic = (a, b, c, d, step) => {
  const samples = Array.from({ length: 241 }, (_, i) => bez(a, b, c, d, i / 240));
  const out = [samples[0]];
  let acc = 0;
  for (let i = 1; i < samples.length; i += 1) {
    acc += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
    if (acc >= step) {
      out.push(samples[i]);
      acc = 0;
    }
  }
  return out;
};

/** A flat link: a long chrome stadium (aspect 2.2+, so never a bead) with only an ink slit along its long axis. */
const flatLink = (m, ang, fill, len = 7.6, wid = 3.4, edge = THIN) => {
  const tf = `translate(${f1(m.x)} ${f1(m.y)}) rotate(${f1(ang)})`;
  const slit = len * 0.5; // a slit, never a round hole: the link reads as steel, not a ring or a "0"
  return `<g transform="${tf}"><rect fill="${fill}" ${edge} x="${f1(-len / 2)}" y="${f1(-wid / 2)}" width="${f1(len)}" height="${f1(wid)}" rx="${f1(wid / 2)}"/><rect fill="${INK}" x="${f1(-slit / 2)}" y="-0.4" width="${f1(slit)}" height="0.8" rx="0.4"/></g>`;
};

/** An edge-on link: a solid chrome bar. */
const barLink = (m, ang, fill, len = 6, wid = 1.8, edge = THIN) =>
  `<rect fill="${fill}" ${edge} transform="translate(${f1(m.x)} ${f1(m.y)}) rotate(${f1(ang)})" x="${f1(-len / 2)}" y="${f1(-wid / 2)}" width="${f1(len)}" height="${f1(wid)}" rx="${f1(wid / 2)}"/>`;

/**
 * Links on every segment of `points`, edge-on bars under flat links. `size`
 * sets the flat link, the bar and the edge: { flat: [len, wid], bar: [len, wid], edge }.
 */
const chain = (points, fill, size = { flat: [7.6, 3.4], bar: [6, 1.8], edge: THIN }) => {
  const bars = [];
  const flats = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (i % 2 === 0) flats.push(flatLink(m, ang, fill, ...size.flat, size.edge));
    else bars.push(barLink(m, ang, fill, ...size.bar, size.edge));
  }
  return bars.join("") + flats.join("");
};

/**
 * A spiked ball as ONE outline: arcs of the disc between six fat cones, so
 * the spikes are chrome with a single ink edge, never ink slivers.
 */
const spikeBall = (c, r, spike, fill, count = 6, half = (23 * Math.PI) / 180) => {
  const at = (a, rad) => `${f1(c.x + rad * Math.cos(a))} ${f1(c.y + rad * Math.sin(a))}`;
  const step = (2 * Math.PI) / count;
  let d = "";
  for (let i = 0; i < count; i += 1) {
    const a = i * step;
    d += `${i === 0 ? "M" : "L"} ${at(a - half, r)} L ${at(a, r + spike)} L ${at(a + half, r)} A ${f1(r)} ${f1(r)} 0 0 1 ${at(a + step - half, r)} `;
  }
  return `<path fill="${fill}" ${THIN_MITER} d="${d}Z"/>`;
};

const chainLoop = {
  id: "chain-loop",
  slot: "tail",
  name: "Chain loop",
  note: "Steel chain on the tail. Drawn in the team colour with an ink edge, because chrome IS steel and an ink chain off the body vanishes on the dark TV. No link is a ring round a dark hole: flat links carry only a thin slit, the rest are edge-on bars.",
  variants: [
    {
      key: "a",
      note: "Run 1b, the critic's fix: a fat, continuous chain. Flat links 10 × 5 and edge-on bars 9 × 3.6, edged 1.5, stepped 7 apart so every link overlaps the next by 2.5 and no dark gap opens between them (the gaps were what made the old swag a dash-dot line). The critic asked for 9 × 4.4 and 7.5 × 2.6 at 7.5: drawn, the 2.6 bars still left a light core of about 1 unit, so the swag still dashed; they are fattened until it reads as one rope of steel. It hangs lower and clear of the blades, sagging under the bottom blade instead of tracing its tip.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) =>
        chain(alongCubic({ x: 18.5, y: 17.5 }, { x: 4, y: 20 }, { x: -3, y: 46 }, { x: 14, y: 54 }, 7), ctx.styleFill, {
          flat: [10, 5],
          bar: [9, 3.6],
          edge: EDGE
        })
    },
    {
      key: "b",
      note: "Round 3: the morning-star flail, now a studded ball and not a star. A solid chrome ball (r 4.8) with eight short studs (2.4 long, narrow) hangs off the middle blade on a visible three-link chain (flat, bar, flat, the long links of a), so it spans about 8 units of chain above the ball and reads as hanging steel. It fills the gap between the lower two blades.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const links =
          barLink({ x: 5.8, y: 32 }, 105, ctx.styleFill) +
          flatLink({ x: 6.6, y: 28.6 }, 105, ctx.styleFill) +
          flatLink({ x: 5, y: 35.4 }, 105, ctx.styleFill);
        return `${links}${spikeBall({ x: 4.2, y: 40.4 }, 4.8, 2.4, ctx.styleFill, 8, (14 * Math.PI) / 180)}`;
      }
    }
  ]
};

// The spiky tail's blades, top to bottom: tip t and base corners a, b.
const TAIL_BLADES = [
  { t: { x: 7, y: 9 }, a: { x: 29, y: 34 }, b: { x: 31, y: 27 } },
  { t: { x: 0, y: 26 }, a: { x: 28, y: 42 }, b: { x: 29, y: 33 } },
  { t: { x: 2, y: 46 }, a: { x: 30, y: 48 }, b: { x: 28, y: 40 } }
];

/**
 * A blade's frame: at(f, w) is the point a fraction f of the way from the
 * base's midpoint to the tip, w units off the axis. Positive w is the side
 * that faces up/forward (screen up for every blade here).
 */
const bladeFrame = ({ t, a, b }) => {
  const base = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const len = Math.hypot(t.x - base.x, t.y - base.y);
  const u = { x: (t.x - base.x) / len, y: (t.y - base.y) / len };
  // the normal whose y is negative: "up"
  let n = { x: -u.y, y: u.x };
  if (n.y > 0) n = { x: -n.x, y: -n.y };
  const half = (f) => (Math.hypot(a.x - b.x, a.y - b.y) / 2) * (1 - f); // the blade's half-width at f
  return { len, half, at: (f, w) => ({ x: base.x + u.x * f * len + n.x * w, y: base.y + u.y * f * len + n.y * w }) };
};

const spikedCuff = {
  id: "spiked-cuff",
  slot: "tail",
  name: "Spiked cuff",
  note: "Steel round the tail, with real spikes: it must change the tail's outline, not tint it.",
  variants: [
    {
      key: "a",
      note: "Polish 2, replaces the ink collar (it vanished against the dark TV and its spikes merged into the blades): the studded wristband worn round the tail. ONE leather band, 5.8 wide, arcs across all three blades 15.6 to 21.4 out from the tail root (31,36), ink with a 2-unit chrome rim on both edges and a thin ink line outside the rim. Over the blades the black core reads on chrome; over the dark gaps the chrome rims read on the TV, so the band holds as one strap where the old ink-only collar broke into holes. Two chrome spikes, 6.4 at the base and 8.5 proud, stand off its outer rim in the two gaps between the blades. A black leather cuff on a chrome tail: b caps each tip with a spearhead, and chain-loop a is light links swinging out past the tips.",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const C = { x: 31, y: 36 };
        const at = (deg, r) => ({ x: C.x + r * Math.cos((deg * Math.PI) / 180), y: C.y + r * Math.sin((deg * Math.PI) / 180) });
        const [a0, a1] = [236, 156];
        const [ri, ro] = [15.6, 21.4];
        const band = `M ${pt(at(a0, ro))} A ${ro} ${ro} 0 0 0 ${pt(at(a1, ro))} L ${pt(at(a1, ri))} A ${ri} ${ri} 0 0 1 ${pt(at(a0, ri))} Z`;
        const da = (3.2 / ro) * (180 / Math.PI); // a 6.4-unit spike base on the outer edge
        const spike = (deg) => `M ${pt(at(deg + da, ro))} L ${pt(at(deg, ro + 8.5))} L ${pt(at(deg - da, ro))} Z`;
        // seen from (31,36) the blade tips sit at 228, 198 and 161 degrees: the spikes go in the gaps
        const spikes = [213, 180].map((d) => `<path fill="${ctx.styleFill}" ${EDGE_MITER} d="${spike(d)}"/>`).join("");
        // the rim: an ink stroke 6 wide, a chrome one 4 wide over it, then the ink core on top,
        // so 2 units of chrome show outside the core with 1 unit of ink beyond
        return `${spikes}<path fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round" d="${band}"/><path fill="none" stroke="${ctx.styleFill}" stroke-width="4" stroke-linejoin="round" d="${band}"/><path fill="${INK}" d="${band}"/>`;
      }
    },
    {
      key: "b",
      note: "Steel spearheads capping each blade: three chrome points 6 units longer than the blade, ringed by an ink collar. The tail gets longer and sharper; the collar is the cuff. (Run 1b: the white style is dropped, it was 1.35:1 on chrome, the same as team.)",
      styles: ["team"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        // Each blade: tip t, and its two base corners a/b; the spearhead sits
        // on the outer quarter and runs past the tip along the blade's axis.
        const blades = [
          { t: { x: 2, y: 46 }, a: { x: 30, y: 48 }, b: { x: 28, y: 40 } },
          { t: { x: 0, y: 26 }, a: { x: 28, y: 42 }, b: { x: 29, y: 33 } },
          { t: { x: 7, y: 9 }, a: { x: 29, y: 34 }, b: { x: 31, y: 27 } }
        ];
        return blades
          .map(({ t, a, b }) => {
            const base = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            const len = Math.hypot(t.x - base.x, t.y - base.y);
            const u = { x: (t.x - base.x) / len, y: (t.y - base.y) / len };
            const n = { x: -u.y, y: u.x };
            const at = (d, w) => ({ x: t.x - u.x * d + n.x * w, y: t.y - u.y * d + n.y * w });
            const tip = at(-5.6, 0);
            const head = `M ${pt(at(6, 3.4))} L ${pt(tip)} L ${pt(at(6, -3.4))} Z`;
            const collar = `M ${pt(at(8.6, 3.2))} L ${pt(at(5.4, 3.2))} L ${pt(at(5.4, -3.2))} L ${pt(at(8.6, -3.2))} Z`;
            return `<path fill="${ctx.styleFill}" ${MITER} d="${head}"/><path fill="${INK}" ${MITER} d="${collar}"/>`;
          })
          .join("");
      }
    }
  ]
};

const lavaTips = {
  id: "lava-tips",
  slot: "tail",
  name: "Lava tips",
  note: "The sketch's tinted tips were invisible at 76px. Fixed by making the fire LEAVE the blades: ember flames that add to the tail's outline.",
  variants: [
    {
      key: "a",
      note: "Polish 2, the critic's fix: a tail of red-hot steel. Every blade's outer 58% is ember, from a wavy heat line (a 3-unit wave at 0.42 of the blade) out to a tip run 2 units past the blade's own, all three blades the same, so the tail ends in three long, even, glowing points. A 4-wide ink underlay edges each one. The stalactites are gone: a round drop beside a pointed tip read as a thumb beside a finger, an orange glove, and nothing hangs now that could become a finger. b is fire behind a chrome tail; this is the tail's own steel glowing.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: () => {
        const dips = TAIL_BLADES.map((blade) => {
          const { at, len, half } = bladeFrame(blade);
          const fb = 0.42; // the heat line: ember covers the outer 58% of the blade
          const h = half(fb) + 0.4;
          const wob = 3 / len; // the heat line's wave, along the blade
          return `M ${pt(at(fb, h))} L ${pt(at(1 + 2 / len, 0))} L ${pt(at(fb, -h))} Q ${pt(at(fb - wob, -h / 2))} ${pt(at(fb, 0))} Q ${pt(at(fb + wob, h / 2))} ${pt(at(fb, h))} Z`;
        });
        // the outline first, 4 wide so 2 shows outside, then the fill over it
        return `<path fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round" d="${dips.join(" ")}"/>${dips.map((d) => `<path fill="${EMBER}" d="${d}"/>`).join("")}`;
      }
    },
    {
      key: "b",
      note: "The whole tail burning: one big ember flame mass behind all three blades (the tail is redrawn on top in its own chrome, so the slot adds to the tail and never replaces it). An aura of fire, read as one silhouette.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const fire =
          "M 26 50.6 C 18 53 9 53 2 49.4 C 4 49 5 48.2 5.6 47.4 C -0.6 46.4 -3.4 42.8 -2.6 37.6 C -1 39.6 0.8 40.4 2.6 40 C -1.6 35 -2.6 29 -1.2 23 C -0.6 25.6 1.4 27.2 3.6 27.6 C 1.4 21.6 2.6 15 6.4 10 C 6.4 6.6 5.6 3.6 3.6 1.2 C 8.8 1.6 12.6 5 13.8 10.2 C 14.8 7.8 16.4 6.8 18.6 6.4 C 17 9.8 17.8 14 20.4 18.4 L 30 30 Z";
        return `<path fill="${EMBER}" ${ROUND} d="${fire}"/><path fill="${ctx.fill}" ${MITER} d="${ctx.tailPath}"/>`;
      }
    }
  ]
};

// ----------------------------------------------------------------- BOOTS --
// Drawn once per leg (ctx.leg). The leg runs hip (x,57) → ankle (x−1,68),
// toes back to x−7 and forward to x+6 at y ≈ 70.5–71, stroked 3.5 wide, so
// the foot reaches x−8.75..x+7.75. A boot covers all of it; its sole stops
// at 72.2, above the 72.75 floor. The far leg's top (y < ~60) is behind the
// body, so anything that must read on the far boot sits below y 60.

const SOLE_Y = 72.2;

const combatBoot = (ax, top = 60) =>
  `M ${ax - 5} ${top} L ${ax + 3.4} ${top} L ${ax + 3.4} 64.6 C ${ax + 7} 64.6 ${ax + 9.6} 66.4 ${ax + 9.6} 69.4 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} L ${ax - 7.8} 68.8 L ${ax - 5} 67.6 Z`;

const combatBoots = {
  id: "combat-boots",
  slot: "boots",
  name: "Combat boots",
  note: "Chunky ink boots round the leg, covering the toes, the sole at 72.2. Down by the floor the TV's glow is behind them, which is where ink still reads off the body.",
  variants: [
    {
      key: "a",
      note: "Round 3: the shaft now runs up to the thigh (y 56, as c) so no orange shin shows under it. A big round toe and a 3.2-unit lug sole in the contrasting value (team chrome under ink, ink under white) so the boot stands on the floor instead of melting into it.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const sole = ctx.style === "white" ? INK : ctx.fill;
        return `<path fill="${ctx.styleFill}" ${ROUND} d="${combatBoot(ax, 56)}"/><path fill="${sole}" ${ROUND} d="M ${ax - 7.8} 69 L ${ax + 9.6} 69 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} Z"/>`;
      }
    },
    {
      key: "b",
      note: "Round 3, replaces the greave (it read as a white sock): platform stompers. The ink upper sits on a slab of a sole, 5.8 units deep, squared at both ends and left as one unbroken light block (a tread line split it into stripes, a trainer read), so the bird stands on two light slabs. The silhouette change is the sole; a is the plain boot, c the knee-high one with a cuff.",
      styles: ["ink", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const slab = ctx.style === "white" ? INK : ctx.fill;
        const upper = `M ${ax - 5} 56 L ${ax + 3.4} 56 L ${ax + 3.4} 62 C ${ax + 7} 62 ${ax + 9.6} 63.6 ${ax + 9.6} 66.6 L ${ax - 7} 66.6 L ${ax - 5} 64 Z`;
        const sole = `M ${ax - 7.8} 66.4 L ${ax + 9.6} 66.4 L ${ax + 9.6} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} Z`;
        return `<path fill="${ctx.styleFill}" ${ROUND} d="${upper}"/><path fill="${slab}" ${ROUND} d="${sole}"/>`;
      }
    },
    {
      key: "c",
      note: "Polish 2, replaces the chrome sabatons (chrome under a chrome belly made grey wellies): steel caps, the New Rock boot. An ink boot with an angular toe and two bare-steel caps, a toe cap 7.2 long that runs from the instep down the sloped toe, and a heel plate 4.4 wide, both chrome with a thin ink edge. The ink shaft keeps the boot dark under the belly, and the light shows only down at the floor, at both ends of the foot. a is the plain boot on a thin light sole, b the platform slab; this is a dark boot with steel ends. Ink only: in white the caps turned into a white sock over a black shoe.",
      styles: ["ink"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const boot = `M ${ax - 5} 56 L ${ax + 3.4} 56 L ${ax + 3.4} 63.6 L ${ax + 5.4} 63.6 L ${ax + 9.8} 67 L ${ax + 9.8} ${SOLE_Y} L ${ax - 7.8} ${SOLE_Y} L ${ax - 7.8} 67.6 L ${ax - 5} 66.6 Z`;
        const toe = `M ${ax + 2.6} 63.6 L ${ax + 5.4} 63.6 L ${ax + 9.8} 67 L ${ax + 9.8} 70.4 L ${ax + 2.6} 70.4 Z`;
        const heel = `M ${ax - 7.8} 67.6 L ${ax - 3.4} 66.2 L ${ax - 3.4} 70.4 L ${ax - 7.8} 70.4 Z`;
        return `<path fill="${ctx.styleFill}" ${MITER} d="${boot}"/><path fill="${ctx.fill}" ${THIN_MITER} d="${toe}"/><path fill="${ctx.fill}" ${THIN_MITER} d="${heel}"/>`;
      }
    }
  ]
};

const spikedBoots = {
  id: "spiked-boots",
  slot: "boots",
  name: "Spiked boots",
  note: "An ink boot carrying steel spikes, in chrome so they read over the dark floor. The boots band is the limit: the boot shows only below the belly (about y 61), and a boot that covers the whole foot leaves about a unit past the toe or heel, so the spikes stand out from the shin and the ankle. If neither variant survives Gate 1, this item folds into Combat boots.",
  variants: [
    {
      key: "a",
      note: "Polish 2, the critic's fix: ONE big chrome horn, 14 long and 5.2 tall at the base, set lower (y 62.6 to 67.8) so all of it shows under the belly: its base sits on the ink shaft (chrome on ink, 13.9:1) and its point runs out over the dark floor above the toe cap to the edge of the boots band (leg.x + 9). At y 61 the belly hid its top and only a 6-unit tick showed. The white style is a white horn on ink.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const spike = `M ${ax - 4} 62.6 L ${ax + 10} 64.8 L ${ax - 4} 67.8 Z`;
        return `<path fill="${INK}" ${ROUND} d="${combatBoot(ax, 56)}"/><path fill="${ctx.styleFill}" ${THIN_MITER} d="${spike}"/>`;
      }
    },
    {
      key: "b",
      note: "Polish 2, replaces the fur wrap (it read as feathered chicken legs or Uggs, and had no spike): the spiked strap. A chrome strap 4.4 tall buckled round the ankle of the ink boot, wider than the shaft, sharpened to a point at each end: forward to the edge of the boots band (leg.x + 9) and back to the band's other edge (leg.x − 9). A light double-ended bar across the black boot, where a is one big horn jutting forward off the shin; it sits just under the belly (y 60.4 to 64.8), so all of it shows. The boots band leaves no room for a second cone, so this is the profile of a Demonia strap rather than another horn. The white style is a white strap on ink.",
      styles: ["team", "white"],
      whitePoints: 0,
      darkCentre: false,
      draw: (ctx) => {
        const ax = ctx.leg.x - 1;
        const strap = `M ${ax - 5.6} 60.4 L ${ax + 4} 60.4 L ${ax + 10} 62.6 L ${ax + 4} 64.8 L ${ax - 5.6} 64.8 L ${ax - 8} 62.6 Z`;
        return `<path fill="${INK}" ${ROUND} d="${combatBoot(ax, 56)}"/><path fill="${ctx.styleFill}" ${THIN_MITER} d="${strap}"/>`;
      }
    }
  ]
};

export const ITEMS = [
  battleVest,
  bandolier,
  bikerJacket,
  leatherSleeve,
  flameSleeve,
  chainLoop,
  spikedCuff,
  lavaTips,
  combatBoots,
  spikedBoots
];
