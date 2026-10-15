// The outfit round's harness: the seven-slot wardrobe of
// docs/research/bird-wardrobe.md §2.1, drawn on the shipping hen and measured
// against the slot rules (§2.1) and authoring rules (§2.8) from each item's
// own drawn geometry. Shared by outfit-{metal,pop,country,disco}.html and
// outfit-harness-check.html; the bird itself is apparel-harness.js.
//
// ITEM MODULE CONTRACT — a module under outfit-items/ is plain ESM:
//
//   export const GENRES = ["metal"];          // optional: pages that show it
//                                             // (omit = every page that loads it)
//   export const ITEMS = [{
//     id: "battle-vest",                      // kebab-case, unique across the rail
//     slot: "top",                            // top | sleeve | tail | boots | prop | stage
//     name: "Battle vest",
//     note: "…",                              // optional, the item's intent
//     genres: ["metal"],                      // optional, narrows GENRES per item
//     variants: [{
//       key: "a",                             // a | b | c — genuinely different solutions
//       note: "what this solution tries",
//       styles: ["ink", "white"],             // ink | white | team | gold; first = default;
//                                             // gold is never first (open question)
//       whitePoints: 0,                       // author-counted white points on the chest (≤1)
//       darkCentre: false,                    // a light shape with a dark centre? (must be false)
//       draw: (ctx) => "<path …/>",           // SVG markup in bird units, no <svg> wrapper
//     }]
//   }];
//
// `draw(ctx)` is called once per figure (twice for boots, once per leg, with
// ctx.leg set) and must return the same geometry every call. Every ctx field
// is listed and commented in `makeCtx` below. Rules: no <svg> wrapper, no
// <use> or <text>, no transform on clipPath children; ids via ctx.uid/clip.
// Where each slot paints (back to front): stage · tail item · far boot (dimmed
// 0.7 with the far leg) · near boot · sleeve (over the wing — redraw
// ctx.wingPath to recolour it) · top (over the sleeve) · prop · then neck/head.

/* global document, window, DOMPoint, CSS, Image, location, URLSearchParams, getComputedStyle */

import {
  PALETTE,
  HEADS,
  COSTUME_HEAD_ANCHORS,
  DRAWN_HEAD_ANCHORS,
  DRAWN_HEAD,
  WING_PIVOT,
  LEG_PIVOTS,
  birdMarkup,
  shapesFor,
  thighOutline
} from "./apparel-harness.js";

// ------------------------------------------------------------- constants --

/** Paint order, back to front. */
export const SLOTS = ["stage", "tail", "boots", "sleeve", "top", "prop"];
export const STYLES = ["ink", "white", "team", "gold"];
export const VARIANT_KEYS = ["a", "b", "c"];

/** House tokens, plus gold — which is NOT one: it is on trial as an optional style. */
export const COLORS = {
  ink: "#121212",
  white: "#ffffff",
  ember: "#ffb35a",
  mutedWarm: "#b3a89a",
  gold: "#d4a72c"
};

const STOCK_BIRD = { body: "round", comb: "crest", tail: "fan" };

export const GENRES = {
  metal: {
    key: "metal",
    name: "Molten Metal",
    team: "teamD",
    fill: PALETTE.teamD,
    silhouette: "spiky",
    boots: true,
    voice: "chrome: ink reads, white vanishes (1.35:1)"
  },
  pop: {
    key: "pop",
    name: "Spice Girls",
    team: "teamH",
    fill: PALETTE.teamH,
    silhouette: undefined,
    boots: true,
    voice: "pink, the stock bird: white and ink both read"
  },
  country: {
    key: "country",
    name: "Honky Tonk Heat",
    team: "teamE",
    fill: PALETTE.teamE,
    silhouette: "broody",
    boots: false,
    voice: "orange, broody: ink reads, white only with its outline, no Boots slot"
  },
  disco: {
    key: "disco",
    name: "Disco Inferno",
    team: "teamB",
    fill: PALETTE.teamB,
    silhouette: "preener",
    boots: true,
    voice: "cyan, preener: ink reads, white only with its outline; small chest, big tail"
  }
};

const birdOf = (genre) => ({ ...STOCK_BIRD, silhouette: GENRES[genre].silhouette });

// Read off each wing / tail path: the back-bottom of the wing where a prop is
// held, and the tips of the genre tail (outermost first, low to high).
const WING_GRIP = { stock: { x: 24, y: 55 }, spiky: { x: 24, y: 55 }, broody: { x: 31, y: 51 }, preener: { x: 23, y: 54 } };
const TAIL_TIPS = {
  stock: [{ x: 0, y: 30 }, { x: 2, y: 20 }, { x: 11, y: 10 }],
  spiky: [{ x: 2, y: 46 }, { x: 0, y: 26 }, { x: 7, y: 9 }],
  broody: [{ x: 0, y: 42 }, { x: 2, y: 31 }],
  preener: [{ x: 9, y: 10 }, { x: 17, y: 0 }]
};

/** Every number a rule is measured against. */
export const LIMITS = {
  chin: 32, // no slot above it (tail: only in the head column)
  headColumnX: 34,
  hairY: 37, // costume head: nothing above this …
  hairX: 45, // … right of this
  floor: 72.75, // nothing below (stage exempt)
  sleeveFringe: 7, // sleeve may pass the wing's trailing edge by this much
  tailReach: 10, // tail item within this of the genre tail
  propReach: 10, // prop at most this far past the bird's outline, at rest
  bootReachX: 9, // boots within this of a leg's x …
  bootTop: 52, // … and below this
  stageTop: 55, // a stage stays under the feet: top edge ≥ this
  stageBottom: 80, // … bottom edge ≤ this
  stageSide: 8, // … at most this far past the 80-unit box at either side
  lightNearHead: 16 // advisory: no light point this close to the head centre
};

export const WING_PIVOT_POINT = WING_PIVOT;
export const SWEEP = [
  { angle: -62, label: "flap" },
  { angle: -26, label: "bounce" },
  { angle: 75, label: "ride" },
  { angle: 95, label: "hurt" }
];
export const HEAD_BOX = { x0: 36, x1: 80, y0: -12, y1: 37 };

const FOOT_Y = 71;
const EPS = 0.01;

// ------------------------------------------------------------- utilities --

let seq = 0;
/** A unique id for a clipPath/gradient/filter: every bird shares one document. */
export const uid = (prefix = "o") => `${prefix}-${(seq += 1)}`;

/** The house ink outline as attributes: `stroke="#121212" stroke-width="2" stroke-linejoin="round"`. */
export const inkStroke = (width = 2, join = "round") =>
  `stroke="${COLORS.ink}" stroke-width="${width}" stroke-linejoin="${join}"`;

/** A clipPath for `d`: `{ def, url }` — put `def` in your markup, use `url` in clip-path. */
export const clip = (d) => {
  const id = uid("oclip");
  return { def: `<clipPath id="${id}"><path d="${d}"/></clipPath>`, url: `url(#${id})` };
};

/** A five-point star, radius `r`, centred on (cx, cy). */
export const starPath = (cx, cy, r) => {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `M ${points.join(" L ")} Z`;
};

/** WCAG relative luminance contrast between two #rrggbb colours. */
export const contrast = (a, b) => {
  const lum = (hex) => {
    const n = hex.replace("#", "");
    const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
    const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** The base colour a style paints. */
export const styleColor = (style, fill) => (style === "team" ? fill : COLORS[style] ?? COLORS.ink);

const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);
const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ------------------------------------------------------------------- ctx --

/**
 * What `draw(ctx)` receives. Everything is in bird units (the 80×72 box,
 * y down, facing right).
 */
const makeCtx = ({ genre, headKind, style, leg }) => {
  const g = GENRES[genre];
  const shapes = shapesFor(birdOf(genre));
  const key = g.silhouette ?? "stock";
  const head = headKind === "costume" ? COSTUME_HEAD_ANCHORS : DRAWN_HEAD_ANCHORS;
  return Object.freeze({
    genre, // "metal" | "pop" | "country" | "disco"
    silhouette: g.silhouette, // "spiky" | undefined (pop, stock) | "broody" | "preener"
    fill: g.fill, // the team colour
    style, // the style in effect: "ink" | "white" | "team" | "gold"
    styleFill: styleColor(style, g.fill), // the base colour that style paints
    colors: { ...COLORS, team: g.fill }, // ink, white, ember, mutedWarm, gold, team
    headKind, // "drawn" | "costume"
    head: { ...head }, // { cx, top, eyeY, chin, shoulders } — drawn: top 8, shoulders 32;
    //                    costume: top -12, shoulders 37
    shapes: { ...shapes }, // { body, belly, tail, wing, comb, neck, mitered } path strings
    bodyPath: shapes.body,
    wingPath: shapes.wing,
    tailPath: shapes.tail,
    mitered: shapes.mitered, // spiky draws its outline mitered; use inkStroke(2, "miter") to match
    wingPivot: { ...WING_PIVOT }, // (47,35): the wing — and every prop — rotates about this
    wingGrip: { ...WING_GRIP[key] }, // back-bottom of the wing, where a prop is held
    tailTips: TAIL_TIPS[key].map((p) => ({ ...p })),
    legs: { near: { ...LEG_PIVOTS.legNear, far: false }, far: { ...LEG_PIVOTS.legFar, far: true } },
    leg: leg ? { ...leg } : undefined, // boots only: the leg being drawn { x, y, far }
    footY: FOOT_Y, // the toes sit on y 71
    floorY: LIMITS.floor, // nothing below 72.75 (except a stage)
    chinY: LIMITS.chin,
    inkStroke,
    uid,
    clip,
    starPath
  });
};

// --------------------------------------------------------------- compose --

const LEGS = { far: { ...LEG_PIVOTS.legFar, far: true }, near: { ...LEG_PIVOTS.legNear, far: false } };

/**
 * birdMarkup hooks for a worn outfit. `outfit[slot] = { item, variant, style }`
 * where item and variant are the module objects.
 */
const hooksFor = (genre, outfit, headKind) => {
  const paint = (slot, leg) => {
    const worn = outfit[slot];
    if (!worn) return "";
    const ctx = makeCtx({ genre, headKind, style: worn.style, leg });
    const markup = worn.variant.draw(ctx);
    if (typeof markup !== "string") throw new Error(`${worn.item.id}/${worn.variant.key}: draw() returned ${typeof markup}, not a string`);
    return `<g data-outfit-slot="${slot}" data-outfit-item="${esc(worn.item.id)}" data-outfit-variant="${esc(worn.variant.key)}"${leg ? ` data-leg="${leg.far ? "far" : "near"}"` : ""}>${markup}</g>`;
  };
  const hooks = {};
  if (outfit.stage) hooks.stage = () => paint("stage");
  if (outfit.tail) hooks.tailItem = () => paint("tail");
  if (outfit.boots) {
    hooks.farBoot = () => paint("boots", LEGS.far);
    hooks.nearBoot = () => paint("boots", LEGS.near);
  }
  if (outfit.sleeve) hooks.sleeve = () => paint("sleeve");
  if (outfit.top) hooks.bodyApparel = () => paint("top");
  if (outfit.prop) hooks.prop = () => paint("prop");
  return hooks;
};

const svgOf = (markup, h, extraClass = "") =>
  `<svg class="${extraClass}" viewBox="0 0 80 72" height="${h}" width="${(h * 80) / 72}" style="overflow:visible;display:block">${markup}</svg>`;

const birdFor = (genre, outfit, { avatarSrc, extra = {} } = {}) =>
  birdMarkup({
    fill: GENRES[genre].fill,
    ...birdOf(genre),
    avatarSrc,
    ...hooksFor(genre, outfit, avatarSrc ? "costume" : "drawn"),
    ...extra
  });

// ------------------------------------------------------------- measuring --

let measureRoot;
const measureSvg = () => {
  if (measureRoot) return measureRoot;
  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.style.cssText =
    "position:fixed;left:0;top:0;width:800px;height:720px;visibility:hidden;pointer-events:none;z-index:-1;overflow:hidden";
  holder.innerHTML = `<svg viewBox="0 0 80 72" width="800" height="720"></svg><svg viewBox="0 0 80 72" width="800" height="720"></svg>`;
  document.body.appendChild(holder);
  const [figure, regions] = holder.querySelectorAll("svg");
  measureRoot = { figure, regions };
  return measureRoot;
};

const SHAPE_SELECTOR = "path,circle,rect,ellipse,line,polygon,polyline";
const isWhite = (c) => /^rgba?\(\s*255,\s*255,\s*255(\s*,\s*(1|0?\.[5-9]\d*))?\s*\)$/.test(c);

/**
 * Every point along every shape of the given groups, in bird units. A clipped
 * shape is measured by what shows: its own outline where it lies inside the
 * clip, plus the clip's outline where that lies inside the shape (filled
 * shapes only). clipPath children must not carry their own transform.
 */
const samplePoints = (svg, groups) => {
  const toUser = svg.getScreenCTM().inverse();
  const points = [];
  const alongPath = (el, matrix) => {
    let length = 0;
    try {
      length = el.getTotalLength();
    } catch {
      return [];
    }
    const steps = Math.max(32, Math.ceil(length * 3));
    const out = [];
    for (let i = 0; i <= steps; i += 1) {
      const p = el.getPointAtLength((length * i) / steps);
      out.push({ local: p, user: new DOMPoint(p.x, p.y).matrixTransform(matrix) });
    }
    return out;
  };
  groups.forEach((group) => {
    group.querySelectorAll(SHAPE_SELECTOR).forEach((el) => {
      if (el.closest("clipPath,mask,defs,pattern,marker,symbol")) return;
      const style = getComputedStyle(el);
      if (style.display === "none") return;
      const fillOn = style.fill !== "none" && Number(style.fillOpacity) > 0.4;
      const strokeOn = style.stroke !== "none" && Number(style.strokeOpacity) > 0.4;
      const white = (fillOn && isWhite(style.fill)) || (strokeOn && !fillOn && isWhite(style.stroke));
      const elMatrix = toUser.multiply(el.getScreenCTM());
      const own = alongPath(el, elMatrix);
      const clipped = el.closest("[clip-path]");
      const id = clipped && group.contains(clipped) ? clipped.getAttribute("clip-path").match(/#([^)]+)/)?.[1] : null;
      const clipEl = id && svg.querySelector(`#${CSS.escape(id)}`);
      if (!clipEl) {
        own.forEach(({ user }) => points.push({ x: user.x, y: user.y, white }));
        return;
      }
      const clipShapes = [...clipEl.querySelectorAll(SHAPE_SELECTOR)];
      const clipMatrix = toUser.multiply(clipped.getScreenCTM());
      const toClip = clipMatrix.inverse();
      const toEl = elMatrix.inverse();
      const inClip = (user) => {
        const q = new DOMPoint(user.x, user.y).matrixTransform(toClip);
        return clipShapes.some((c) => c.isPointInFill(q));
      };
      own.forEach(({ user }) => {
        if (inClip(user)) points.push({ x: user.x, y: user.y, white });
      });
      if (fillOn) {
        clipShapes.forEach((c) =>
          alongPath(c, clipMatrix).forEach(({ user }) => {
            const q = new DOMPoint(user.x, user.y).matrixTransform(toEl);
            if (el.isPointInFill(q)) points.push({ x: user.x, y: user.y, white });
          })
        );
      }
    });
  });
  return points;
};

/** Render an outfit into the measuring svg and sample its slot groups. */
const measureOutfit = (genre, outfit, headKind) => {
  const { figure } = measureSvg();
  figure.innerHTML = birdFor(genre, outfit, { avatarSrc: headKind === "costume" ? HEADS.rosi : undefined });
  const groups = [...figure.querySelectorAll("[data-outfit-item]")];
  const points = samplePoints(figure, groups);
  figure.innerHTML = "";
  return points;
};

// Region geometry per genre: the bird's own shapes, filled for "inside" tests
// and sampled densely for distances.
const regionCache = new Map();
const regionsFor = (genre) => {
  if (regionCache.has(genre)) return regionCache.get(genre);
  const { regions } = measureSvg();
  const shapes = shapesFor(birdOf(genre));
  const mk = (d) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", d);
    regions.appendChild(el);
    return el;
  };
  const headD = `M ${DRAWN_HEAD.cx - DRAWN_HEAD.r} ${DRAWN_HEAD.cy} a ${DRAWN_HEAD.r} ${DRAWN_HEAD.r} 0 1 0 ${2 * DRAWN_HEAD.r} 0 a ${DRAWN_HEAD.r} ${DRAWN_HEAD.r} 0 1 0 ${-2 * DRAWN_HEAD.r} 0 Z`;
  const els = {
    body: mk(shapes.body),
    wing: mk(shapes.wing),
    tail: mk(shapes.tail),
    neck: mk(shapes.neck),
    thigh: mk(thighOutline(LEG_PIVOTS.legNear)),
    head: mk(headD)
  };
  const outline = (el) => {
    const len = el.getTotalLength();
    const steps = Math.ceil(len * 4);
    const out = [];
    for (let i = 0; i <= steps; i += 1) {
      const p = el.getPointAtLength((len * i) / steps);
      out.push({ x: p.x, y: p.y });
    }
    return out;
  };
  const outlines = Object.fromEntries(Object.entries(els).map(([k, el]) => [k, outline(el)]));
  const inFill = (k, p) => els[k].isPointInFill(new DOMPoint(p.x, p.y));
  const dist = (k, p) => {
    let best = Infinity;
    for (const q of outlines[k]) {
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  };
  // The legs are 3.5-wide strokes: segments with a 1.75 radius.
  const legSegments = [LEG_PIVOTS.legFar, LEG_PIVOTS.legNear].flatMap(({ x, y }) => [
    [x, y, x - 1, y + 11],
    [x - 1, y + 11, x - 7, y + 13.5],
    [x - 1, y + 11, x, y + 14],
    [x - 1, y + 11, x + 6, y + 13.5]
  ]);
  const segDist = (p, [x1, y1, x2, y2]) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (x1 + t * dx), p.y - (y1 + t * dy));
  };
  const legDist = (p) => Math.min(...legSegments.map((s) => segDist(p, s))) - 1.75;
  const UNION = ["body", "wing", "tail", "neck", "thigh", "head"];
  /** Distance outside the drawn bird's outline (0 inside). */
  const outside = (p) => {
    if (UNION.some((k) => inFill(k, p)) || legDist(p) <= 0) return 0;
    return Math.max(0, Math.min(legDist(p), ...UNION.map((k) => dist(k, p))));
  };
  // The wing's trailing edge: its outline below the line from the pivot to
  // the back tip.
  const backTip = outlines.wing.reduce((a, b) => (b.x < a.x ? b : a));
  const lineY = (x) => WING_PIVOT.y + ((backTip.y - WING_PIVOT.y) * (x - WING_PIVOT.x)) / (backTip.x - WING_PIVOT.x);
  const trailing = outlines.wing.filter((q) => q.y >= lineY(q.x) - EPS);
  const trailingDist = (p) => {
    let best = Infinity;
    for (const q of trailing) best = Math.min(best, (q.x - p.x) ** 2 + (q.y - p.y) ** 2);
    return Math.sqrt(best);
  };
  const r = { inFill, dist, outside, lineY, trailingDist, backTip };
  regionCache.set(genre, r);
  return r;
};

// ------------------------------------------------------------------ rules --

export const RULES = [
  {
    key: "chin",
    text: "Chin (§2.8 rule 1): no geometry above y 32. A Tail item is held to that only in the head column (x > 34), so it may rise with the genre tail out at the back."
  },
  {
    key: "hair",
    text: "Hair (rule 1): on a costume head, no geometry with y < 37 and x > 45, where a photograph's hair hangs. The shipping wing itself reaches y 31 at x 47–51, so a Sleeve is held to chin and hair only where it leaves the wing."
  },
  { key: "floor", text: "Floor: nothing below y 72.75, the foot/deck line. A Stage is exempt and has its own band." },
  {
    key: "region",
    text:
      "Region (rule 6). Top: inside the body outline (1-unit tolerance for the ink edge) and from head.shoulders down. Sleeve: inside the wing, or within 7 units of its trailing edge on the trailing side. Tail: within 10 units of the genre tail. Boots: within 9 units of a leg's x, between y 52 and the floor. Prop: see sweep. Stage: under the feet, y 55..80, x −8..88."
  },
  {
    key: "sweep",
    text:
      "Prop sweep (rule 5): rotated about the wing pivot (47,35) by −62° flap, −26° bounce, +75° ride and +95° hurt, no point enters the head box (x 36..80, y −12..37) and none drops below 72.75. At rest it reaches at most 10 units past the drawn bird's outline."
  },
  { key: "whitePoints", text: "White points (rule 4): at most one on the chest — counted by the author, printed here." },
  { key: "darkCentre", text: "Dark centre (rule 4): no light ring or disc with a dark centre — it reads as an eye. Declared by the author." },
  {
    key: "lightNearHead",
    text: "Advisory (rule 4): no light point within ~16 units of the head centre ((58,20) drawn, (58,10) costume). Measured from white fills/strokes; amber, not a fail."
  },
  { key: "contrast", text: "Contrast (rule 3): each style's base colour against the team colour, ≥ 3:1 unless the shape lives on its outline (white, team). Info." }
];

const ruleLine = (key, ok, text, level) => ({ key, level: level ?? (ok === null ? "info" : ok ? "ok" : "fail"), text });

/** Measure one variant against every rule. Returns { rules, extension, sweep }. */
const judgeVariant = (genre, item, variant) => {
  const style = variant.styles[0];
  const outfit = { [item.slot]: { item, variant, style } };
  const drawn = measureOutfit(genre, outfit, "drawn");
  const costume = measureOutfit(genre, outfit, "costume");
  const all = [...drawn, ...costume];
  if (all.length === 0) return { rules: [ruleLine("unmeasured", false, "nothing drawn — no shapes found in the slot group")], extension: null, sweep: null };
  const R = regionsFor(genre);
  const rules = [];
  const slot = item.slot;
  const minY = (pts) => (pts.length ? Math.min(...pts.map((p) => p.y)) : Infinity);
  const maxY = (pts) => (pts.length ? Math.max(...pts.map((p) => p.y)) : -Infinity);
  // The shipping wing itself reaches y 31–35 at x 47–51, so a Sleeve that
  // redraws it is held to the chin and hair rules only where it leaves the wing.
  const offWing = (p) => !(R.inFill("wing", p) || R.dist("wing", p) <= 1 + EPS);
  const chinPts = slot === "sleeve" ? all.filter(offWing) : all;
  const drawnChin = slot === "sleeve" ? drawn.filter(offWing) : drawn;
  const costumeChin = slot === "sleeve" ? costume.filter(offWing) : costume;
  const wingNote = slot === "sleeve" ? " — off the wing" : "";

  // chin
  if (slot === "tail") {
    const over = all.filter((p) => p.x > LIMITS.headColumnX + EPS && p.y < LIMITS.chin - EPS);
    rules.push(
      ruleLine(
        "chin",
        over.length === 0,
        over.length === 0
          ? `chin: nothing above y 32 in the head column (tail rises to y=${fmt(minY(all))} out at the back)`
          : `chin: ${over.length} points above y 32 at x > 34 (to x=${fmt(Math.max(...over.map((p) => p.x)))}, y=${fmt(minY(over))})`
      )
    );
  } else {
    const ok = minY(chinPts) >= LIMITS.chin - EPS;
    const top = (pts) => (pts.length ? fmt(minY(pts)) : "–");
    rules.push(ruleLine("chin", ok, `chin${wingNote}: top edge y=${top(drawnChin)} drawn / ${top(costumeChin)} costume (needs ≥ 32)`));
  }

  // hair
  const hair = costumeChin.filter((p) => p.y < LIMITS.hairY - EPS && p.x > LIMITS.hairX + EPS);
  rules.push(
    ruleLine(
      "hair",
      hair.length === 0,
      hair.length === 0
        ? `hair${wingNote}: nothing at x > 45 above y 37 on the costume head`
        : `hair: ${hair.length} points at x > 45, y < 37 (to x=${fmt(Math.max(...hair.map((p) => p.x)))}, y=${fmt(minY(hair))})`
    )
  );

  // floor
  if (slot !== "stage") {
    const ok = maxY(all) <= LIMITS.floor + EPS;
    rules.push(ruleLine("floor", ok, `floor: bottom edge y=${fmt(maxY(all))} (needs ≤ 72.75)`));
  }

  // region
  let extension = null;
  let sweep = null;
  if (slot === "top") {
    const per = (pts, kind) => {
      const s = kind === "drawn" ? DRAWN_HEAD_ANCHORS.shoulders : COSTUME_HEAD_ANCHORS.shoulders;
      const out = pts.filter((p) => !R.inFill("body", p) && R.dist("body", p) > 1 + EPS);
      const high = pts.filter((p) => p.y < s - EPS);
      return { out, high, s, worst: out.length ? Math.max(...out.map((p) => R.dist("body", p))) : 0 };
    };
    const d = per(drawn, "drawn");
    const c = per(costume, "costume");
    const ok = d.out.length + c.out.length + d.high.length + c.high.length === 0;
    rules.push(
      ruleLine(
        "region",
        ok,
        `top: ${d.out.length + c.out.length} points outside the body${d.out.length + c.out.length ? ` (worst ${fmt(Math.max(d.worst, c.worst))}u out)` : ""}; ${d.high.length + c.high.length} above head.shoulders (drawn 32 / costume 37)`
      )
    );
  } else if (slot === "sleeve") {
    const bad = all.filter((p) => {
      if (R.inFill("wing", p) || R.dist("wing", p) <= 1 + EPS) return false;
      const trailingSide = p.y >= R.lineY(p.x) - EPS;
      return !(trailingSide && R.trailingDist(p) <= LIMITS.sleeveFringe + EPS);
    });
    const reach = Math.max(0, ...all.filter((p) => !R.inFill("wing", p)).map((p) => R.dist("wing", p)));
    rules.push(
      ruleLine(
        "region",
        bad.length === 0,
        `sleeve: ${bad.length} points off the wing (beyond its 7-unit trailing fringe); reaches ${fmt(reach)}u past the wing outline`
      )
    );
  } else if (slot === "tail") {
    const reachOf = (p) => (R.inFill("tail", p) ? 0 : R.dist("tail", p));
    const reach = Math.max(...all.map(reachOf));
    rules.push(ruleLine("region", reach <= LIMITS.tailReach + EPS, `tail: reaches ${fmt(reach)}u from the genre tail (limit 10)`));
  } else if (slot === "boots") {
    const legsX = [LEG_PIVOTS.legNear.x, LEG_PIVOTS.legFar.x];
    const bad = all.filter(
      (p) => p.y < LIMITS.bootTop - EPS || !legsX.some((x) => Math.abs(p.x - x) <= LIMITS.bootReachX + EPS)
    );
    rules.push(ruleLine("region", bad.length === 0, `boots: ${bad.length} points away from the legs (top edge y=${fmt(minY(all))}, needs ≥ 52)`));
  } else if (slot === "stage") {
    const x0 = Math.min(...all.map((p) => p.x));
    const x1 = Math.max(...all.map((p) => p.x));
    const ok =
      minY(all) >= LIMITS.stageTop - EPS &&
      maxY(all) <= LIMITS.stageBottom + EPS &&
      x0 >= -LIMITS.stageSide - EPS &&
      x1 <= 80 + LIMITS.stageSide + EPS;
    rules.push(ruleLine("region", ok, `stage: y ${fmt(minY(all))}..${fmt(maxY(all))} (needs 55..80), x ${fmt(x0)}..${fmt(x1)} (needs −8..88)`));
  } else if (slot === "prop") {
    extension = Math.max(...drawn.map((p) => R.outside(p)));
    rules.push(ruleLine("region", extension <= LIMITS.propReach + EPS, `prop: reaches ${fmt(extension)}u past the bird's outline at rest (limit 10)`));
    const rot = (p, deg) => {
      const a = (deg * Math.PI) / 180;
      const dx = p.x - WING_PIVOT.x;
      const dy = p.y - WING_PIVOT.y;
      return { x: WING_PIVOT.x + dx * Math.cos(a) - dy * Math.sin(a), y: WING_PIVOT.y + dx * Math.sin(a) + dy * Math.cos(a) };
    };
    sweep = SWEEP.map(({ angle, label }) => {
      const pts = all.map((p) => rot(p, angle));
      const inHead = pts.filter((p) => p.x >= HEAD_BOX.x0 && p.x <= HEAD_BOX.x1 && p.y >= HEAD_BOX.y0 && p.y <= HEAD_BOX.y1);
      const below = pts.filter((p) => p.y > LIMITS.floor + EPS);
      return {
        angle,
        label,
        ok: inHead.length === 0 && below.length === 0,
        headPoints: inHead.length,
        floorPoints: below.length,
        minY: Math.round(minY(pts) * 10) / 10,
        maxY: Math.round(maxY(pts) * 10) / 10,
        maxX: Math.round(Math.max(...pts.map((p) => p.x)) * 10) / 10
      };
    });
    const sweepOk = sweep.every((s) => s.ok);
    rules.push(
      ruleLine(
        "sweep",
        sweepOk,
        `sweep: ${sweep
          .map((s) => `${s.label} ${s.angle > 0 ? "+" : ""}${s.angle}° ${s.ok ? "clear" : `${s.headPoints ? `head ×${s.headPoints}` : ""}${s.headPoints && s.floorPoints ? " " : ""}${s.floorPoints ? `floor ×${s.floorPoints} (y ${fmt(s.maxY)})` : ""}`}`)
          .join(" · ")}`
      )
    );
  }

  // declared
  const wp = variant.whitePoints;
  rules.push(
    ruleLine(
      "whitePoints",
      typeof wp === "number" ? wp <= 1 : false,
      typeof wp === "number" ? `white points on the chest: ${wp} (declared)` : "white points: not declared",
      typeof wp === "number" ? undefined : "fail"
    )
  );
  const dc = variant.darkCentre;
  rules.push(
    ruleLine(
      "darkCentre",
      dc === false,
      dc === false ? "light shape with a dark centre: none (declared)" : dc === true ? "light shape with a dark centre: YES (declared)" : "dark centre: not declared"
    )
  );

  // advisory: light near the head
  const near = [
    ...drawn.filter((p) => p.white && Math.hypot(p.x - 58, p.y - 20) < LIMITS.lightNearHead),
    ...costume.filter((p) => p.white && Math.hypot(p.x - 58, p.y - 10) < LIMITS.lightNearHead)
  ];
  if (near.length) {
    const closest = Math.min(
      ...drawn.filter((p) => p.white).map((p) => Math.hypot(p.x - 58, p.y - 20)),
      ...costume.filter((p) => p.white).map((p) => Math.hypot(p.x - 58, p.y - 10))
    );
    rules.push(ruleLine("lightNearHead", false, `light within 16u of the head centre: ${near.length} points, closest ${fmt(closest)}u`, "warn"));
  } else {
    rules.push(ruleLine("lightNearHead", true, "no light point within 16u of the head centre"));
  }

  // contrast info
  const fill = GENRES[genre].fill;
  rules.push(
    ruleLine(
      "contrast",
      null,
      `styles on ${GENRES[genre].team}: ${variant.styles
        .map((s) => {
          const r = contrast(styleColor(s, fill), fill);
          return `${s} ${r.toFixed(2)}:1${r < 3 ? " (outline only)" : ""}`;
        })
        .join(" · ")}`
    )
  );
  return { rules, extension, sweep };
};

// ------------------------------------------------------------- validation --

const validateItem = (item, moduleName) => {
  const problems = [];
  if (!item || typeof item !== "object") return ["not an object"];
  if (typeof item.id !== "string" || !/^[a-z0-9-]+$/.test(item.id)) problems.push(`id ${JSON.stringify(item.id)} is not kebab-case`);
  if (!SLOTS.includes(item.slot)) problems.push(`slot ${JSON.stringify(item.slot)} is not one of ${SLOTS.join(", ")}`);
  if (typeof item.name !== "string") problems.push("name missing");
  if (!Array.isArray(item.variants) || item.variants.length === 0) problems.push("variants missing or empty");
  return problems.map((p) => `${moduleName}/${item?.id ?? "?"}: ${p}`);
};

const validateVariant = (variant) => {
  const problems = [];
  if (!variant || typeof variant !== "object") return ["not an object"];
  if (!VARIANT_KEYS.includes(variant.key)) problems.push(`key ${JSON.stringify(variant.key)} is not a, b or c`);
  if (!Array.isArray(variant.styles) || variant.styles.length === 0) problems.push("styles missing or empty");
  else {
    const bad = variant.styles.filter((s) => !STYLES.includes(s));
    if (bad.length) problems.push(`unknown styles ${bad.join(", ")} (allowed: ${STYLES.join(", ")})`);
    if (variant.styles[0] === "gold") problems.push("gold is the default style — gold is on trial and may never be first");
  }
  if (typeof variant.draw !== "function") problems.push("draw is not a function");
  return problems;
};

// ------------------------------------------------------------------ page --

const SCALE_LABEL = {
  304: "304px · intent",
  152: "152px",
  130: "130px · blurred 1px · the parade from the sofa",
  76: "76px · actual size on a 1080p TV"
};

const fig = (inner, caption, attrs = "") => `<figure ${attrs}>${inner}<figcaption>${caption}</figcaption></figure>`;

/** The figures for one variant in one style at one height: drawn + the costume heads. */
const trio = (genre, item, variant, style, h, heads, { blur = false } = {}) => {
  const outfit = { [item.slot]: { item, variant, style } };
  return [
    fig(svgOf(birdFor(genre, outfit), h), `drawn · ${style}`),
    ...heads.map((hd) => fig(svgOf(birdFor(genre, outfit, { avatarSrc: hd.src }), h), `${hd.name} · ${style}`))
  ].join("");
};

/** The prop sweep diagram: the prop at rest plus a ghost at each angle, the head box and the floor. */
const sweepFigure = (genre, item, variant, h) => {
  const style = variant.styles[0];
  const ctx = makeCtx({ genre, headKind: "drawn", style });
  const ghosts = SWEEP.map(
    ({ angle }) => `<g opacity="0.45" transform="rotate(${angle} ${WING_PIVOT.x} ${WING_PIVOT.y})">${variant.draw(ctx)}</g>`
  ).join("");
  const overlay = () => `
    <rect x="${HEAD_BOX.x0}" y="${HEAD_BOX.y0}" width="${HEAD_BOX.x1 - HEAD_BOX.x0}" height="${HEAD_BOX.y1 - HEAD_BOX.y0}"
          fill="#fda4af" fill-opacity="0.12" stroke="#fda4af" stroke-width="0.6" stroke-dasharray="2 1.5"/>
    <line x1="-8" x2="88" y1="${LIMITS.floor}" y2="${LIMITS.floor}" stroke="#fda4af" stroke-width="0.6" stroke-dasharray="2 1.5"/>
    <circle cx="${WING_PIVOT.x}" cy="${WING_PIVOT.y}" r="1.2" fill="#fda4af"/>
    ${ghosts}`;
  const outfit = { [item.slot]: { item, variant, style } };
  return fig(svgOf(birdFor(genre, outfit, { extra: { apparel: overlay } }), h), "sweep · −62 −26 +75 +95 · head box, floor", 'class="sweep-fig"');
};

const stageRow = (h, inner, attrs = "", cls = "") =>
  `<div class="stage ${cls}" data-size="${h}" ${attrs}><div class="sizes">${inner}</div><span class="scale">${SCALE_LABEL[h] ?? `${h}px`}</span></div>`;

const captureName = (multi, genre, ...parts) => (multi ? [genre, ...parts] : parts).join("--");

const variantCard = (genre, mod, item, variant, heads, multi) => {
  const def = variant.styles[0];
  const gold = variant.styles.includes("gold");
  const name = captureName(multi, genre, item.id, variant.key);
  const bare = fig(svgOf(birdFor(genre, {}), 76), "bare");
  const styles = variant.styles;
  const judge = styles
    .map((s) => {
      const outfit = { [item.slot]: { item, variant, style: s } };
      return `<div class="judge-group"><span class="judge-style">${s}${s === "gold" ? " · trial" : ""}</span><div class="judge-figs">
        ${fig(svgOf(birdFor(genre, outfit), 76), "76 · drawn")}
        ${fig(svgOf(birdFor(genre, outfit, { avatarSrc: heads[0].src }), 76), `76 · ${heads[0].name}`)}
        ${fig(`<div class="blur">${svgOf(birdFor(genre, outfit, { avatarSrc: heads[0].src }), 130)}</div>`, `130 blurred · ${heads[0].name}`)}
      </div></div>`;
    })
    .join("");
  return `
  <section class="cell outfit-card" data-card="${esc(`${genre}:${item.id}:${variant.key}`)}" data-genre="${genre}" data-item="${esc(item.id)}" data-variant="${esc(variant.key)}">
    <h2>${esc(item.name)} <span class="tag">${item.slot}</span><span class="tag">variant ${esc(variant.key)}</span><span class="tag dim">${esc(mod)}</span>${
      gold ? '<span class="tag gold">gold · not a house token, on trial</span>' : ""
    }</h2>
    ${item.note ? `<p class="note"><strong>${esc(item.name)}.</strong> ${esc(item.note)}</p>` : ""}
    <p class="note"><strong>Variant ${esc(variant.key)}.</strong> ${esc(variant.note ?? "")} <span class="dim">Styles: ${styles.join(", ")} (default ${def}).</span></p>
    ${stageRow(304, trio(genre, item, variant, def, 304, heads), `data-capture-304="${esc(name)}"`)}
    ${stageRow(152, trio(genre, item, variant, def, 152, heads) + (item.slot === "prop" ? sweepFigure(genre, item, variant, 152) : ""))}
    ${stageRow(130, styles.map((s) => trio(genre, item, variant, s, 130, heads)).join(""), "", "blur")}
    ${stageRow(76, bare + styles.map((s) => trio(genre, item, variant, s, 76, heads)).join(""))}
    <p class="rules" data-rules>measuring…</p>
    <div class="stage judge" data-capture="${esc(name)}"><div class="judge-row">${judge}</div><span class="scale">judge strip · 76 drawn · 76 costume · 130 blurred</span></div>
  </section>`;
};

const errorCard = (title, detail) => `
  <section class="cell error-card">
    <h2>${esc(title)}</h2>
    <pre>${esc(detail)}</pre>
  </section>`;

const rulesCard = () => `
  <section class="cell rules-list">
    <h2>the rules every card is measured on</h2>
    <ol>${RULES.map((r) => `<li>${esc(r.text)}</li>`).join("")}</ol>
    <p class="note">Measured on the default style from the item's drawn outline (every shape sampled along its length, strokes excluded, a clipped shape measured by the part of it that shows) on the drawn head and on a costume head, in the bird's 80×72 units. Green passes, red fails, amber is advisory. A fail is reported, not fixed: Brad cuts at Gate 1. Rows run 304 → 152 → 130 blurred → 76, and the 76 row is the one that counts. Paint order, back to front: stage · tail · tail item · far leg + far boot · body · near leg + near boot · wing · sleeve · top · prop · neck · head.</p>
  </section>`;

// --------------------------------------------------------------- looks --

const resolveLook = (genre, look, catalogue) => {
  const outfit = {};
  const missing = [];
  const warnings = [];
  const worn = [];
  for (const [slot, pick] of Object.entries(look.outfit ?? {})) {
    if (!SLOTS.includes(slot)) {
      warnings.push(`${slot}: not a slot`);
      continue;
    }
    if (slot === "boots" && !GENRES[genre].boots) {
      warnings.push(`boots: ${GENRES[genre].name} has no Boots slot`);
      continue;
    }
    const item = catalogue.get(pick.item);
    if (!item) {
      missing.push(pick.item);
      continue;
    }
    if (item.slot !== slot) {
      warnings.push(`${pick.item} is a ${item.slot}, listed as ${slot}`);
      continue;
    }
    let variant = item.variants.find((v) => v.key === (pick.variant ?? "a") && v.ok);
    if (!variant) {
      variant = item.variants.find((v) => v.ok);
      if (!variant) {
        missing.push(`${pick.item} (no working variant)`);
        continue;
      }
      warnings.push(`${pick.item}: variant ${pick.variant} missing, showing ${variant.key}`);
    }
    let style = pick.style ?? variant.styles[0];
    if (!variant.styles.includes(style)) {
      warnings.push(`${pick.item}/${variant.key}: no ${style} style, showing ${variant.styles[0]}`);
      style = variant.styles[0];
    }
    outfit[slot] = { item, variant, style };
    worn.push({ slot, item: item.id, variant: variant.key, style });
  }
  // Rule 8: a prop's style contrasts with the sleeve it is held against; and
  // neighbours on the body differ in value.
  const fill = GENRES[genre].fill;
  const col = (slot) => styleColor(outfit[slot].style, fill);
  const pairs = [];
  if (outfit.prop && outfit.sleeve) {
    const r = contrast(col("prop"), col("sleeve"));
    pairs.push({ a: "prop", b: "sleeve", ratio: r, ok: r >= 3, level: r >= 3 ? "ok" : "fail" });
  }
  for (const [a, b] of [["top", "sleeve"], ["top", "prop"]]) {
    if (outfit[a] && outfit[b]) {
      const r = contrast(col(a), col(b));
      pairs.push({ a, b, ratio: r, ok: r >= 1.5, level: r >= 1.5 ? "ok" : "warn" });
    }
  }
  return { outfit, worn, missing, warnings, pairs };
};

const lookBlock = (genre, look, resolved, heads, multi) => {
  const { outfit } = resolved;
  return `<div class="look" data-look="${esc(`${genre}:${look.name}`)}">
    <div class="look-name">${multi ? `${GENRES[genre].key} · ` : ""}${esc(look.name)}${look.test ? ' <span class="dim">· density test, not a shipping Look</span>' : ""}</div>
    <div class="look-figs">
      ${fig(svgOf(birdFor(genre, outfit), 76), "76 · drawn")}
      ${heads.map((hd) => fig(svgOf(birdFor(genre, outfit, { avatarSrc: hd.src }), 76), `76 · ${hd.name}`)).join("")}
      ${fig(`<div class="blur">${svgOf(birdFor(genre, outfit, { avatarSrc: heads[0].src }), 130)}</div>`, `130 blurred · ${heads[0].name}`)}
    </div>
    <div class="look-worn">${resolved.worn.map((w) => `${w.slot}: ${esc(w.item)}/${w.variant} ${w.style}`).join(" · ") || "nothing drawn yet"}</div>
    ${resolved.missing.length ? `<div class="look-missing">not drawn yet: ${resolved.missing.map(esc).join(", ")}</div>` : ""}
  </div>`;
};

// ------------------------------------------------------------------ main --

const errors = [];
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => errors.push(`error: ${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener("unhandledrejection", (e) => errors.push(`unhandledrejection: ${e.reason?.stack ?? e.reason}`));
}

const loadModule = async (spec) => {
  if (spec.items) return { name: spec.name, ok: true, items: spec.items, genres: spec.genres };
  try {
    const url = new URL(spec.url, location.href);
    url.searchParams.set("v", String(Date.now()));
    const mod = await import(url.href);
    if (!Array.isArray(mod.ITEMS)) throw new Error("the module exports no ITEMS array");
    return { name: spec.name, ok: true, items: mod.ITEMS, genres: mod.GENRES };
  } catch (e) {
    return { name: spec.name, ok: false, error: String(e?.stack ?? e) };
  }
};

const preload = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

/**
 * Render an outfit page.
 * @param {object} page
 * @param {string[]} page.genres     e.g. ["metal"]; several make a section each
 * @param {Array<{name:string,url?:string,items?:object[],genres?:string[]}>} page.modules
 *        item modules by URL (relative to the page) or inline
 * @param {object|string} [page.looks]  looks.js's LOOKS ({ genre: [{ name, test?, outfit }], shared: [...] })
 *        or its URL relative to the page, imported in a try/catch
 */
export const renderOutfitPage = async ({ genres, modules, looks = {} }) => {
  const root = document.getElementById("root");
  const params = new URLSearchParams(location.search);
  const only = params.get("only");
  const multi = genres.length > 1;
  const heads = [
    { src: HEADS.rosi, name: "rosi" },
    { src: HEADS.rob, name: "rob" }
  ];
  await Promise.all(heads.map((h) => preload(h.src)));

  const results = { page: location.pathname, only, genres, modules: [], items: [], looks: [], errors };
  window.OUTFIT_RESULTS = results;
  let looksError = null;
  if (typeof looks === "string") {
    try {
      const url = new URL(looks, location.href);
      url.searchParams.set("v", String(Date.now()));
      const mod = await import(url.href);
      looks = mod.LOOKS ?? mod.default ?? {};
    } catch (e) {
      looksError = String(e?.stack ?? e);
      looks = {};
    }
  }

  const loaded = await Promise.all(modules.map(loadModule));
  const moduleNames = new Set(loaded.map((m) => m.name));
  const html = [rulesCard()];
  if (looksError) html.push(errorCard("looks.js failed to load", looksError));
  results.looksError = looksError;
  const pending = []; // [cardKey, genre, item, variant, mod]

  for (const m of loaded) {
    const inScope = !only || only === m.name || !moduleNames.has(only);
    results.modules.push({ name: m.name, ok: m.ok, error: m.error ?? null, items: m.ok ? m.items.length : 0, inScope });
    if (!m.ok && (!only || only === m.name)) html.push(errorCard(`module ${m.name} failed to load`, m.error));
  }

  const catalogues = {};
  for (const genre of genres) {
    const g = GENRES[genre];
    const catalogue = new Map();
    catalogues[genre] = catalogue;
    if (multi) html.push(`<h2 class="genre-head">${esc(g.name)} · ${genre} · ${g.silhouette ?? "stock"} · ${g.team}</h2>`);
    for (const m of loaded) {
      if (!m.ok) continue;
      if (Array.isArray(m.genres) && !m.genres.includes(genre)) continue;
      const showModule = !only || only === m.name || !moduleNames.has(only);
      const cards = [];
      for (const item of m.items) {
        const problems = validateItem(item, m.name);
        if (Array.isArray(item?.genres) && !item.genres.includes(genre)) continue;
        const showItem = showModule && (!only || moduleNames.has(only) || only === item?.id);
        if (problems.length) {
          if (showItem) {
            cards.push(errorCard(`${m.name}: item ${item?.id ?? "?"} is malformed`, problems.join("\n")));
            results.items.push({ genre, module: m.name, item: item?.id ?? null, error: problems.join("; "), fails: ["malformed"] });
          }
          continue;
        }
        if (item.slot === "boots" && !g.boots) {
          if (showItem) cards.push(errorCard(`${item.id}: ${g.name} has no Boots slot`, "Broody shows a 2.3-unit shank; country gets an extra Top instead (§2.1)."));
          continue;
        }
        if (catalogue.has(item.id)) {
          if (showItem) cards.push(errorCard(`${m.name}: duplicate item id ${item.id}`, "Another loaded module already defines it; the first one wins."));
          continue;
        }
        const variants = [];
        for (const variant of item.variants) {
          const vp = validateVariant(variant);
          let err = vp.length ? vp.join("\n") : null;
          if (!err) {
            // Dry run every style on both heads (and both legs for boots) so a
            // throwing draw becomes an error card, not a broken page.
            try {
              for (const style of variant.styles)
                for (const headKind of ["drawn", "costume"]) {
                  const legs = item.slot === "boots" ? [LEGS.far, LEGS.near] : [undefined];
                  for (const leg of legs) {
                    const out = variant.draw(makeCtx({ genre, headKind, style, leg }));
                    if (typeof out !== "string") throw new Error(`draw() returned ${typeof out}, not a string (style ${style}, ${headKind})`);
                  }
                }
            } catch (e) {
              err = String(e?.stack ?? e);
            }
          }
          variants.push({ ...variant, ok: !err, error: err });
          if (!showItem) continue;
          if (err) {
            cards.push(errorCard(`${item.name} · variant ${variant?.key ?? "?"} — ${m.name}`, err));
            results.items.push({ genre, module: m.name, item: item.id, slot: item.slot, name: item.name, variant: variant?.key ?? null, error: err, fails: ["error"] });
          } else {
            const v = variants[variants.length - 1];
            let card;
            try {
              card = variantCard(genre, m.name, item, v, heads, multi);
            } catch (e) {
              cards.push(errorCard(`${item.name} · variant ${v.key} — ${m.name} (failed while rendering)`, String(e?.stack ?? e)));
              results.items.push({ genre, module: m.name, item: item.id, slot: item.slot, name: item.name, variant: v.key, error: String(e), fails: ["error"] });
              continue;
            }
            cards.push(card);
            pending.push({ key: `${genre}:${item.id}:${v.key}`, genre, item, variant: v, module: m.name, capture: captureName(multi, genre, item.id, v.key) });
          }
        }
        catalogue.set(item.id, { ...item, variants });
      }
      if (cards.length) {
        html.push(`<div class="module-head"><span>${esc(m.name)}</span><span class="dim">${multi ? `${genre} · ` : ""}${cards.length} card${cards.length === 1 ? "" : "s"}</span></div>`);
        html.push(...cards);
      }
    }
  }

  // The full kit: every Look, the density test.
  const lookHtml = [];
  for (const genre of genres) {
    for (const look of [...(looks[genre] ?? []), ...(looks.shared ?? [])]) {
      const resolved = resolveLook(genre, look, catalogues[genre]);
      lookHtml.push(lookBlock(genre, look, resolved, heads, multi));
      results.looks.push({
        genre,
        name: look.name,
        test: Boolean(look.test),
        worn: resolved.worn,
        missing: resolved.missing,
        warnings: resolved.warnings,
        pairs: resolved.pairs.map((p) => ({ ...p, ratio: Math.round(p.ratio * 100) / 100 }))
      });
    }
  }
  const lookRules = results.looks
    .map((l) => {
      const bits = [
        ...l.pairs.map((p) => `<span class="${p.level}">${p.level === "ok" ? "✓" : p.level === "warn" ? "!" : "✗"} ${p.a}/${p.b} ${p.ratio.toFixed(2)}:1</span>`),
        ...l.warnings.map((w) => `<span class="warn">! ${esc(w)}</span>`)
      ];
      return `<span class="dim">${multi ? `${l.genre} · ` : ""}${esc(l.name)}:</span> ${bits.join(" ") || '<span class="dim">no neighbouring pairs yet</span>'}`;
    })
    .join("<br>");
  html.push(`
  <section class="cell" id="full-kit">
    <h2>full kit · every Look at 76px and blurred 130px</h2>
    <p class="note">The density test (§2.1): each Look's items together, at actual TV size and blurred as the parade is seen from the sofa. Items not drawn yet are skipped and listed. Rule 8 below each: a Prop's style must clear 3:1 against the Sleeve behind it (✗); a Top that shares a value with its Sleeve or Prop is flagged amber (on purpose only where the merged shape is the point, like metal's leather).</p>
    <div class="stage looks" data-capture-looks="looks-76"><div class="look-grid">${lookHtml.join("") || '<p class="note">No Looks for this page.</p>'}</div><span class="scale">76px · actual size on a 1080p TV · and 130 blurred</span></div>
    <p class="rules">${lookRules}</p>
  </section>`);

  if (only && pending.length === 0) html.splice(1, 0, errorCard(`--only ${only} matched nothing`, "No module or item with that name rendered a card."));
  root.innerHTML = html.join("");

  // Measure.
  for (const p of pending) {
    const cell = root.querySelector(`[data-card="${CSS.escape(p.key)}"]`);
    let judged;
    try {
      judged = judgeVariant(p.genre, p.item, p.variant);
    } catch (e) {
      judged = { rules: [ruleLine("measure", false, `measuring threw: ${e?.message ?? e}`)], extension: null, sweep: null };
    }
    const node = cell?.querySelector("[data-rules]");
    if (node)
      node.innerHTML = judged.rules
        .map((r) => `<span class="${r.level}">${r.level === "ok" ? "✓" : r.level === "fail" ? "✗" : r.level === "warn" ? "!" : "·"} ${esc(r.text)}</span>`)
        .join("<br>");
    const fails = judged.rules.filter((r) => r.level === "fail").map((r) => r.key);
    const warns = judged.rules.filter((r) => r.level === "warn").map((r) => r.key);
    if (cell) cell.dataset.fails = fails.join(" ");
    results.items.push({
      genre: p.genre,
      module: p.module,
      item: p.item.id,
      slot: p.item.slot,
      name: p.item.name,
      variant: p.variant.key,
      styles: p.variant.styles,
      capture: p.capture,
      ok: fails.length === 0,
      fails,
      warns,
      rules: judged.rules,
      extension: judged.extension === null ? null : Math.round(judged.extension * 10) / 10,
      sweep: judged.sweep,
      error: null
    });
  }
  root.dataset.measured = "true";
  window.OUTFIT_DONE = true;
  return results;
};

export { PALETTE, HEADS };
