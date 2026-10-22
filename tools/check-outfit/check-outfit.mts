/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-console --
   a dev-only pixel check, kept as run 3 wrote it: it prints its report and reads the harness untyped. */
// Pixel-check outfit ports: every catalogue item's harness draw(ctx) against the
// cast component's renderToStaticMarkup, case by case (genre body × style ×
// head kind × leg). Geometry must match element for element (tag, geometric
// attributes, d strings exactly, cumulative transform, clip regions); paint is
// compared after mapping both sides to the house tokens.
//
// Usage (from anywhere):
//   packages/cast/node_modules/.bin/tsx --tsconfig tsconfig.tsx-runtime.json tools/check-outfit/check-outfit.mts [filter ...]
// A filter is an item id (battle-vest-a), a harness unit (metal-kit) or a slot
// (top). No filter = every item. Add -v to print every case's diff, not just
// the first per item; --paint-only / --geometry-only to narrow.
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import fs from "node:fs";

const REPO = process.env.WN_REPO ?? path.resolve(import.meta.dirname, "../..");
const CAST = path.join(REPO, "packages/cast");
const OUTFIT = path.join(CAST, "src/Character/Outfit");
const MOCK = path.join(REPO, "apps/client/public/mockups/cast");
const require = createRequire(path.join(CAST, "package.json"));
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const imp = (p: string) => import(pathToFileURL(p).href);
const H = await imp(path.join(MOCK, "apparel-harness.js"));
const O = await imp(path.join(MOCK, "outfit-harness.js"));
const { OUTFIT_ITEMS } = await imp(path.join(REPO, "packages/shared/src/outfit/index.ts"));
const geometry = await imp(path.join(CAST, "src/Character/geometry/index.ts"));
const shapesMod = await imp(path.join(CAST, "src/Character/shapes/index.ts"));

const UNITS = ["metal-kit", "metal-show", "pop-kit", "pop-show", "country-kit", "country-show", "disco-kit", "disco-show", "shared"];
const SILHOUETTE: Record<string, string | undefined> = { metal: "spiky", pop: undefined, country: "broody", disco: "preener" };
// Not exported by outfit-harness.js; copied from it.
const WING_GRIP: Record<string, { x: number; y: number }> = { stock: { x: 24, y: 55 }, spiky: { x: 24, y: 55 }, broody: { x: 31, y: 51 }, preener: { x: 23, y: 54 } };
const TAIL_TIPS: Record<string, { x: number; y: number }[]> = {
  stock: [{ x: 0, y: 30 }, { x: 2, y: 20 }, { x: 11, y: 10 }],
  spiky: [{ x: 2, y: 46 }, { x: 0, y: 26 }, { x: 7, y: 9 }],
  broody: [{ x: 0, y: 42 }, { x: 2, y: 31 }],
  preener: [{ x: 9, y: 10 }, { x: 17, y: 0 }]
};

const args = process.argv.slice(2);
const verbose = args.includes("-v");
const paintOnly = args.includes("--paint-only");
const geometryOnly = args.includes("--geometry-only");
const filters = args.filter((a) => !a.startsWith("-"));

// --------------------------------------------------------------- harness --
type Harness = { unit: string; item: any; variant: any; genres: string[] };
const harnessById = new Map<string, Harness>();
for (const unit of UNITS) {
  const mod = await imp(path.join(MOCK, "outfit-items", `${unit}.js`));
  for (const item of mod.ITEMS) {
    for (const variant of item.variants) {
      harnessById.set(`${item.id}-${variant.key}`, { unit, item, variant, genres: item.genres ?? mod.GENRES });
    }
  }
}

const harnessCtx = (genre: string, headKind: string, style: string, leg: any) => {
  const g = O.GENRES[genre];
  const shapes = H.shapesFor({ body: "round", comb: "crest", tail: "fan", silhouette: g.silhouette });
  const key = g.silhouette ?? "stock";
  const head = headKind === "costume" ? H.COSTUME_HEAD_ANCHORS : H.DRAWN_HEAD_ANCHORS;
  return Object.freeze({
    genre,
    silhouette: g.silhouette,
    fill: g.fill,
    style,
    styleFill: O.styleColor(style, g.fill),
    colors: { ...O.COLORS, team: g.fill },
    headKind,
    head: { ...head },
    shapes: { ...shapes },
    bodyPath: shapes.body,
    wingPath: shapes.wing,
    tailPath: shapes.tail,
    mitered: shapes.mitered,
    wingPivot: { ...H.WING_PIVOT },
    wingGrip: { ...WING_GRIP[key] },
    tailTips: TAIL_TIPS[key].map((p) => ({ ...p })),
    legs: { near: { ...H.LEG_PIVOTS.legNear, far: false }, far: { ...H.LEG_PIVOTS.legFar, far: true } },
    leg: leg ? { ...leg } : undefined,
    footY: 71,
    floorY: O.LIMITS.floor,
    chinY: O.LIMITS.chin,
    inkStroke: O.inkStroke,
    uid: O.uid,
    clip: O.clip,
    starPath: O.starPath
  });
};

// ------------------------------------------------------------------ cast --
const pascal = (id: string) => id.split("-").map((w) => w[0]!.toUpperCase() + w.slice(1)).join("");
const castComponent = async (id: string, slot: string) => {
  const file = path.join(OUTFIT, slot, pascal(id), "index.tsx");
  if (!fs.existsSync(file)) return undefined;
  const mod = await imp(file);
  return mod[pascal(id)];
};

// ----------------------------------------------------------------- paint --
const TOKENS: Record<string, string> = {
  bg: "ink",
  text: "white",
  current: "team",
  currentColor: "team",
  wardrobeGold: "gold",
  ember: "ember",
  mutedWarm: "mutedWarm",
  none: "none",
  transparent: "none"
};
const hexName = (hex: string, team: string): string => {
  const h = hex.toLowerCase();
  if (h === team.toLowerCase()) return "team";
  const map: Record<string, string> = { "#121212": "ink", "#ffffff": "white", "#fff": "white", "#ffb35a": "ember", "#b3a89a": "mutedWarm", "#d4a72c": "gold" };
  return map[h] ?? h;
};
const TOKEN_HEX: Record<string, string> = { text: "#ffffff", bg: "#121212", ember: "#ffb35a", mutedWarm: "#b3a89a", wardrobeGold: "#d4a72c" };
let currentTeam = "#000000";
const castColor = (v: string): string => {
  const mix = v.match(/^color-mix\(in srgb,\s*theme\(colors\.([a-zA-Z]+)\)\s+([\d.]+)%,\s*theme\(colors\.([a-zA-Z]+)\)\)$/);
  if (mix) {
    const [a, b] = [TOKEN_HEX[mix[1]!], TOKEN_HEX[mix[3]!]];
    if (!a || !b) return `RAW(${v})`;
    const p = Number(mix[2]) / 100;
    const hex = [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * p + parseInt(b.slice(i, i + 2), 16) * (1 - p)).toString(16).padStart(2, "0")).join("");
    return hexName(`#${hex}`, currentTeam);
  }
  const theme = v.match(/^theme\(colors\.([a-zA-Z]+)\)$/);
  if (theme) return TOKENS[theme[1]!] ?? `RAW(${v})`;
  if (v.startsWith("url(")) return v;
  if (v.startsWith("#")) return `HEX!(${v})`;
  return TOKENS[v] ?? `RAW(${v})`;
};
const PAINT_PROPS = ["fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "fill-rule", "clip-rule", "fill-opacity", "stroke-opacity", "stroke-dasharray", "paint-order", "stop-color", "stop-opacity", "offset", "style"];
const NUMERIC = new Set(["stroke-width", "fill-opacity", "stroke-opacity", "stop-opacity", "offset", "opacity"]);

const tailwind = (cls: string, out: Record<string, string>, unknown: string[]) => {
  if (cls === "motion-reduce:[animation:none]") return void (out.motionReduce = "none");
  const animation = cls.match(/^\[animation:(.+)\]$/);
  if (animation) return void (out.animation = describeAnimation(animation[1]!.replace(/_/g, " "), CAST_CSS.keyframes, "cast", currentTeam));
  const arb = cls.match(/^\[([a-z-]+):(.+)\]$/);
  if (arb) {
    const [, prop, raw] = arb;
    const value = raw!.replace(/_/g, " ");
    out[prop!] = prop === "fill" || prop === "stroke" || prop === "stop-color" ? castColor(value) : value;
    return;
  }
  let m;
  if ((m = cls.match(/^fill-(.+)$/))) {
    if (m[1]!.startsWith("[")) out.fill = castColor(m[1]!.slice(1, -1));
    else out.fill = TOKENS[m[1]!] ?? `RAW(${cls})`;
    return;
  }
  if ((m = cls.match(/^stroke-(\d+(?:\.\d+)?)$/))) return void (out["stroke-width"] = m[1]!);
  if ((m = cls.match(/^stroke-(.+)$/))) return void (out.stroke = TOKENS[m[1]!] ?? `RAW(${cls})`);
  if ((m = cls.match(/^opacity-(\d+)$/))) return void (out.opacity = String(Number(m[1]) / 100));
  if (cls === "pointer-events-none") return;
  unknown.push(cls);
};

// ------------------------------------------------------------- animation --
// Flat CSS rules, @keyframes and the reduced-motion @media, brace-matched.
type Css = { anims: Map<string, string>; keyframes: Map<string, string>; reduced: Set<string> };
const blocks = (css: string): [string, string][] => {
  const out: [string, string][] = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    out.push([css.slice(i, open).trim(), css.slice(open + 1, j - 1)]);
    i = j;
  }
  return out;
};
const parseCss = (raw: string, into: Css = { anims: new Map(), keyframes: new Map(), reduced: new Set() }, reduced = false): Css => {
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [selector, body] of blocks(css)) {
    if (selector.startsWith("@keyframes")) into.keyframes.set(selector.split(/\s+/)[1]!, body);
    else if (selector.startsWith("@media")) {
      if (/prefers-reduced-motion:\s*reduce/.test(selector)) parseCss(body, into, true);
    } else {
      const anim = body.match(/animation:\s*([^;}]+)/)?.[1]?.trim();
      for (const cls of selector.split(",").map((x) => x.trim().replace(/^\./, ""))) {
        if (reduced && anim === "none") into.reduced.add(cls);
        else if (anim) into.anims.set(cls, anim);
      }
    }
  }
  return into;
};
const normaliseKeyframes = (body: string, side: "harness" | "cast", team: string): string =>
  body
    .replace(/\s+/g, "")
    .replace(/;}/g, "}")
    .replace(/(^|[^\d])\.(\d)/g, "$10.$2")
    .replace(/#[0-9a-fA-F]{6}/g, (h) => hexName(h, team))
    .replace(/theme\(colors\.([a-zA-Z]+)\)/g, (_, t) => TOKENS[t] ?? `RAW(${t})`)
    .replace(/currentColor/g, "team")
    .replace(/(\d+\.\d{2})\d+%/g, "$1%");
const seconds = (t: string) => `${Number(t.replace(/s$/, "")) || 0}s`;
// An animation shorthand (name first) and a separate delay, as one comparable string.
const describeAnimation = (shorthand: string, keyframes: Map<string, string>, side: "harness" | "cast", team: string, delay?: string): string => {
  const [name, ...rest] = shorthand.trim().split(/\s+/);
  const times = rest.filter((t) => /^-?[\d.]+m?s$/.test(t));
  const others = rest.filter((t) => !/^-?[\d.]+m?s$/.test(t));
  const kf = keyframes.get(name!);
  return `${seconds(times[0] ?? "0s")} ${others.join(" ")} delay=${seconds(times[1] ?? delay ?? "0s")} keyframes=${kf === undefined ? `MISSING(${name})` : normaliseKeyframes(kf, side, team)}`;
};
const CAST_CSS = parseCss(fs.readFileSync(path.join(REPO, "apps/client/src/index.css"), "utf8"));

// ---------------------------------------------------------------- parser --
type Matrix = [number, number, number, number, number, number];
const I: Matrix = [1, 0, 0, 1, 0, 0];
const mul = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5]
];
const parseTransform = (t: string | undefined): Matrix => {
  if (!t) return I;
  let m = I;
  for (const [, fn, raw] of t.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const n = raw!.split(/[\s,]+/).filter(Boolean).map(Number);
    let k: Matrix = I;
    const r = ((n[0] ?? 0) * Math.PI) / 180;
    if (fn === "translate") k = [1, 0, 0, 1, n[0] ?? 0, n[1] ?? 0];
    else if (fn === "scale") k = [n[0]!, 0, 0, n[1] ?? n[0]!, 0, 0];
    else if (fn === "matrix") k = n as Matrix;
    else if (fn === "rotate") {
      const rot: Matrix = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
      k = n.length === 3 ? mul(mul([1, 0, 0, 1, n[1]!, n[2]!], rot), [1, 0, 0, 1, -n[1]!, -n[2]!]) : rot;
    } else if (fn === "skewX") k = [1, 0, Math.tan(r), 1, 0, 0];
    else if (fn === "skewY") k = [1, Math.tan(r), 0, 1, 0, 0];
    else throw new Error(`transform ${fn}`);
    m = mul(m, k);
  }
  return m;
};
const r4 = (n: number) => (Math.abs(n) < 5e-5 ? 0 : Math.round(n * 1e4) / 1e4);

const SHAPES = new Set(["path", "rect", "circle", "ellipse", "line", "polygon", "polyline"]);
const GEOM: Record<string, string[]> = {
  rect: ["x", "y", "width", "height", "rx", "ry"],
  circle: ["cx", "cy", "r"],
  ellipse: ["cx", "cy", "rx", "ry"],
  line: ["x1", "y1", "x2", "y2"],
  polygon: ["points"],
  polyline: ["points"]
};

type Shape = { geom: string; transform: string; clips: string[]; paint: Record<string, string>; unknown: string[] };
type Parsed = { shapes: Shape[]; styles: string[]; classes: string[] };

const attrsOf = (raw: string): Record<string, string> => {
  const out: Record<string, string> = {};
  // A repeated attribute keeps its FIRST value, as the browser's parser does
  // (the harness's `${inkStroke(1.2)} stroke-linejoin="miter"` renders round).
  for (const [, k, v] of raw.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) if (!(k! in out)) out[k!] = v!.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  return out;
};

const parse = (markup: string, side: "harness" | "cast", team: string): Parsed => {
  const styles: string[] = [];
  const classes: string[] = [];
  const body = markup.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => {
    styles.push(css);
    return "";
  });
  const harnessCss = parseCss(styles.join(""));
  type Frame = { tag: string; attrs: Record<string, string>; matrix: Matrix; paint: Record<string, string>; opacity: number; clips: string[]; inClip?: string; inGradient?: string; unknown: string[] };
  const stack: Frame[] = [{ tag: "#root", attrs: {}, matrix: I, paint: {}, opacity: 1, clips: [], unknown: [] }];
  const clipDefs = new Map<string, string[]>();
  const gradients = new Map<string, string[]>();
  const shapes: (Shape & { clipIds: string[] })[] = [];
  const paintOf = (attrs: Record<string, string>, parent: Record<string, string>, unknown: string[]) => {
    const p: Record<string, string> = {};
    for (const k of ["fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "fill-rule", "clip-rule", "fill-opacity", "stroke-opacity", "stroke-dasharray", "paint-order", "animation", "motionReduce"]) if (parent[k] !== undefined) p[k] = parent[k]!;
    for (const k of PAINT_PROPS.concat("opacity")) {
      const v = attrs[k];
      if (v === undefined) continue;
      if (k === "fill" || k === "stroke" || k === "stop-color") p[k] = v.startsWith("url(") ? v : side === "harness" ? hexName(v, team) : v.startsWith("#") ? `HEX!(${v})` : castColor(v);
      else if (k === "style") p.style = v.replace(/\s+/g, "").replace(/;$/, "");
      else p[k] = v;
    }
    if (side === "cast" && attrs.class) for (const c of attrs.class.split(/\s+/).filter(Boolean)) tailwind(c, p, unknown);
    if (side === "harness" && attrs.class) {
      classes.push(attrs.class);
      for (const c of attrs.class.split(/\s+/)) {
        const anim = harnessCss.anims.get(c);
        if (!anim) continue;
        const delay = attrs.style?.match(/animation-delay:\s*(-?[\d.]+s)/)?.[1];
        p.animation = describeAnimation(anim, harnessCss.keyframes, "harness", team, delay);
        if (harnessCss.reduced.has(c)) p.motionReduce = "none";
        if (p.style !== undefined && /^animation-delay:[^;]+$/.test(p.style)) delete p.style;
      }
    }
    return p;
  };
  for (const [, close, tag, raw, selfClose] of body.matchAll(/<(\/?)([a-zA-Z]+)((?:\s+[a-zA-Z:-]+="[^"]*")*)\s*(\/?)>/g)) {
    if (close) {
      stack.pop();
      continue;
    }
    const attrs = attrsOf(raw!);
    const parent = stack[stack.length - 1]!;
    const unknown: string[] = [];
    const paint = paintOf(attrs, parent.paint, unknown);
    const opacity = parent.opacity * (paint.opacity !== undefined ? Number(paint.opacity) : 1);
    delete paint.opacity;
    const matrix = mul(parent.matrix, parseTransform(attrs.transform));
    const clips = attrs["clip-path"] ? [...parent.clips, attrs["clip-path"]] : parent.clips;
    const frame: Frame = { tag: tag!, attrs, matrix, paint, opacity, clips, inClip: tag === "clipPath" ? attrs.id : parent.inClip, inGradient: tag === "radialGradient" || tag === "linearGradient" ? attrs.id : parent.inGradient, unknown };
    if (tag === "radialGradient" || tag === "linearGradient") gradients.set(attrs.id!, [`${tag} ${["cx", "cy", "r", "fx", "fy", "gradientUnits", "gradientTransform"].map((k) => attrs[k] ?? "").join(",")}`]);
    if (tag === "stop" && frame.inGradient) {
      gradients.get(frame.inGradient)!.push(`stop ${paint.offset ?? attrs.offset} ${paint["stop-color"]} ${paint["stop-opacity"] ?? 1}`);
    }
    if (SHAPES.has(tag!)) {
      const geom =
        tag === "path"
          ? `path ${(attrs.d ?? "").replace(/\s+/g, " ").trim()}`
          : `${tag} ${GEOM[tag!]!.map((k) => (attrs[k] === undefined ? "-" : k === "points" ? attrs[k] : String(r4(Number(attrs[k]))))).join(" ")}`;
      const transform = matrix.map(r4).join(",");
      if (frame.inClip) {
        const list = clipDefs.get(frame.inClip) ?? [];
        list.push(`${geom} @${transform}`);
        clipDefs.set(frame.inClip, list);
      } else {
        const shown: Record<string, string> = { ...paint };
        if (opacity !== 1) shown.opacity = String(r4(opacity));
        for (const k of Object.keys(shown)) if (NUMERIC.has(k)) shown[k] = String(r4(Number(shown[k])));
        shapes.push({ geom, transform, clips: [], clipIds: clips, paint: shown, unknown: [...stack.flatMap((f) => f.unknown), ...unknown] });
      }
    }
    if (!selfClose && !(side === "cast" && false)) stack.push(frame);
    if (selfClose) {
      /* not pushed */
    }
  }
  const resolveUrl = (ref: string, map: Map<string, string[]>) => {
    const id = ref.match(/url\(#([^)]+)\)/)?.[1];
    return id && map.has(id) ? map.get(id)!.join(" | ") : `UNRESOLVED(${ref})`;
  };
  for (const s of shapes) {
    s.clips = s.clipIds.map((ref) => resolveUrl(ref, clipDefs));
    for (const k of ["fill", "stroke"]) if (s.paint[k]?.startsWith("url(")) s.paint[k] = `gradient[${resolveUrl(s.paint[k]!, gradients)}]`;
  }
  return { shapes: shapes.map(({ clipIds, ...rest }) => rest), styles, classes };
};

// The harness emits self-closing tags; React renders <path ...></path>, which the
// tokenizer sees as an open tag followed by a close — balanced either way.

const geomKey = (s: Shape) => `${s.geom} @${s.transform}${s.clips.length ? ` clip[${s.clips.join(" ; ")}]` : ""}`;
const paintKey = (s: Shape) =>
  Object.keys(s.paint)
    .filter((k) => s.paint[k] !== undefined)
    .sort()
    .map((k) => `${k}=${s.paint[k]}`)
    .join(" ");

// ------------------------------------------------------------------- run --
const items = OUTFIT_ITEMS.filter((it: any) => it.slot !== "move");
const selected = items.filter((it: any) => {
  if (filters.length === 0) return true;
  const h = harnessById.get(it.id);
  return filters.some((f) => f === it.id || f === it.slot || f === h?.unit);
});

let pass = 0;
const failures: string[] = [];
const missing: string[] = [];
const notes: string[] = [];
for (const it of selected) {
  const h = harnessById.get(it.id);
  if (!h) {
    failures.push(`${it.id}: no harness variant`);
    continue;
  }
  const Comp = await castComponent(it.id, it.slot);
  if (!Comp) {
    missing.push(it.id);
    continue;
  }
  const genres = it.genre === "shared" ? ["metal", "pop", "country", "disco"] : h.genres;
  const legs = it.slot === "boots" ? [{ ...H.LEG_PIVOTS.legFar, far: true }, { ...H.LEG_PIVOTS.legNear, far: false }] : [undefined];
  let cases = 0;
  let bad = 0;
  const itemNotes = new Set<string>();
  for (const genre of genres) {
    const silhouette = SILHOUETTE[genre];
    const castShapes = shapesMod.resolveCharacterShapes({ body: "round", comb: "crest", tail: "fan", silhouette });
    for (const style of it.styles) {
      for (const headKind of ["drawn", "costume"]) {
        for (const leg of legs) {
          cases++;
          const team = O.GENRES[genre].fill;
          currentTeam = team;
          let hMarkup: string;
          try {
            hMarkup = h.variant.draw(harnessCtx(genre, headKind, style, leg));
          } catch (e: any) {
            failures.push(`${it.id} [${genre} ${style} ${headKind}${leg ? (leg.far ? " far" : " near") : ""}]: harness threw ${e.message}`);
            bad++;
            continue;
          }
          let cMarkup: string;
          try {
            const head = headKind === "costume" ? geometry.COSTUME_HEAD_ANCHORS : geometry.DRAWN_HEAD_ANCHORS;
            const castLeg = leg ? { x: leg.x, y: leg.y, far: leg.far } : undefined;
            cMarkup = renderToStaticMarkup(React.createElement("svg", null, React.createElement(Comp, { context: { shapes: castShapes, head, style, leg: castLeg, silhouette } })));
          } catch (e: any) {
            failures.push(`${it.id} [${genre} ${style} ${headKind}]: cast threw ${e.message}`);
            bad++;
            continue;
          }
          const hp = parse(hMarkup, "harness", team);
          const cp = parse(cMarkup, "cast", team);
          if (hp.styles.length) itemNotes.add(`animates: compared timing, delay, reduced motion and keyframes`);
          const label = `${it.id} [${genre} ${style} ${headKind}${leg ? (leg.far ? " far" : " near") : ""}]`;
          const diffs: string[] = [];
          const unknown = [...new Set(cp.shapes.flatMap((s) => s.unknown))];
          if (unknown.length) diffs.push(`  unknown cast classes: ${unknown.join(" ")}`);
          const hex = cp.shapes.flatMap((s) => Object.values(s.paint)).filter((v) => /HEX!|RAW\(/.test(v));
          if (hex.length) diffs.push(`  cast paint not a house token: ${[...new Set(hex)].join(" ")}`);
          if (!paintOnly) {
            const hg = hp.shapes.map(geomKey);
            const cg = cp.shapes.map(geomKey);
            if (hg.length !== cg.length) diffs.push(`  geometry: harness ${hg.length} shapes, cast ${cg.length}`);
            const n = Math.max(hg.length, cg.length);
            for (let i = 0; i < n; i++) {
              if (hg[i] !== cg[i]) {
                diffs.push(`  geometry #${i}:\n    harness ${hg[i]}\n    cast    ${cg[i]}`);
                if (!verbose) break;
              }
            }
          }
          if (!geometryOnly && hp.shapes.length === cp.shapes.length) {
            for (let i = 0; i < hp.shapes.length; i++) {
              const a = paintKey(hp.shapes[i]!);
              const b = paintKey(cp.shapes[i]!);
              if (a !== b) {
                diffs.push(`  paint #${i} (${hp.shapes[i]!.geom.slice(0, 40)}):\n    harness ${a}\n    cast    ${b}`);
                if (!verbose) break;
              }
            }
          }
          if (diffs.length) {
            bad++;
            if (bad === 1 || verbose) failures.push(`${label}\n${diffs.join("\n")}`);
          }
        }
      }
    }
  }
  if (bad === 0) pass++;
  else failures.push(`${it.id}: ${bad}/${cases} cases differ`);
  for (const n of itemNotes) notes.push(`${it.id}: ${n}`);
  if (bad === 0) console.log(`ok   ${it.id} (${cases} cases)`);
}
for (const f of failures) console.log(`FAIL ${f}`);
for (const n of notes) console.log(`NOTE ${n}`);
console.log(`\n${pass} ok, ${selected.length - pass - missing.length} failing, ${missing.length} not ported${missing.length && missing.length < 40 ? `: ${missing.join(" ")}` : ""}`);
process.exitCode = selected.length - pass - missing.length > 0 ? 1 : 0;
