// The wardrobe round's page chrome, shared by wardrobe-{metal,pop,country,
// disco}.html so the four rails are judged the same way: the same card, the
// same row order (76px LAST, because it is the only row that counts and the
// eye should land on it having seen what the item was meant to be), the same
// 76px strip at the foot of the page, and the same rules — checked on the
// drawn geometry, not asserted in a note.
//
// Nothing in here draws a bird; `apparel-harness.js` does. An item here is a
// `bodyApparel` function: it paints after the body and the wing and BEFORE
// the neck and head, so a photographed jaw is always over it and it rides the
// body, not the head.

// Unlike apparel-harness.js this module measures, so it touches the DOM.
/* global document, window, DOMPoint, CSS */

import { PALETTE, HEADS, SILHOUETTE_SHAPES, bird } from "./apparel-harness.js";

// ------------------------------------------------------------------ rules --
// docs/guest-portal-team-pick-plan.md, "The wardrobe itself". The geometric
// ones are measured off every item's rendered outline (sampled along each
// shape and mapped back into the 80×72 box); the two about white are counted
// by the item's author, because "a point" is a drawing decision and not a
// coordinate.
export const RULES = [
  { key: "chin", text: "nothing above the chin — no geometry at y < 32 on either head" },
  {
    key: "upperBack",
    text: "nothing right of x≈45 on the upper back — on a costume head, no geometry with y < 37 and x > 45, where a photograph's hair hangs"
  },
  { key: "belly", text: "nothing under the belly, nothing at the feet — no geometry below the body's own underside" },
  { key: "whitePoints", text: "at most one white point on a chest — two read as fangs" },
  { key: "darkCentre", text: "no white shape with a dark centre on the chest — it reads as an eye" }
];

const CHIN = 32;
const COSTUME_SHOULDERS = 37;
const HAIR_X = 45;

// Where each body's underside is, for the belly/feet rule. Measured off the
// path, so the rule moves with the silhouette.
const STOCK_ROUND_BODY =
  "M 16 42 C 16 28 32 22 50 27 C 64 31 67 44 61 55 C 53 65 30 66 21 58 C 16 54 16 48 16 42 Z";

const bodyBottom = (silhouette) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", silhouette ? SILHOUETTE_SHAPES[silhouette].body : STOCK_ROUND_BODY);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const box = path.getBBox();
  svg.remove();
  return box.y + box.height;
};

// Every point on every shape of a `[data-wardrobe]` group, in the bird's own
// units. Strokes are not included: the numbers are the authored geometry, and
// a 2-unit ink stroke paints one more unit on each side of them.
const samplePoints = (svg, group) => {
  const toUser = svg.getScreenCTM().inverse();
  const points = [];
  const sampled = new Set();
  const sample = (el) => {
    if (sampled.has(el)) return;
    sampled.add(el);
    const matrix = toUser.multiply(el.getScreenCTM());
    const length = el.getTotalLength();
    const steps = Math.max(32, Math.ceil(length * 3));
    for (let i = 0; i <= steps; i += 1) {
      const p = el.getPointAtLength((length * i) / steps);
      points.push(new DOMPoint(p.x, p.y).matrixTransform(matrix));
    }
  };
  group.querySelectorAll("path,circle,rect,ellipse,line,polygon,polyline").forEach((el) => {
    if (el.closest("clipPath")) return;
    // A clipped shape (a sequin grid, a plaid) shows no further than its
    // clip, so the clip's outline is the geometry that counts.
    const clipped = el.closest("[clip-path]");
    if (clipped && clipped !== group && group.contains(clipped)) {
      const id = clipped.getAttribute("clip-path").match(/#([^)]+)/)?.[1];
      const clip = id && svg.querySelector(`#${CSS.escape(id)}`);
      if (clip) {
        clip.querySelectorAll("path,circle,rect,ellipse,polygon").forEach(sample);
        return;
      }
    }
    sample(el);
  });
  return points;
};

// Sampling and the inverse CTM leave a sub-thousandth of float on an edge
// authored exactly on a line; an item hung on y=32 is on the chin, not over it.
const EPS = 0.01;

const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);

/**
 * Measure one card: the item on the drawn figure and on the costume figure,
 * at the 304px row (any row gives the same units; the biggest is the least
 * affected by rounding).
 */
const judge = (card, item, bottom) => {
  const stage = card.querySelector(".stage[data-size='304']");
  const figures = [...stage.querySelectorAll("figure[data-head]")];
  const results = [];
  const read = (headKind) => {
    const figure = figures.find((f) => f.dataset.head === headKind && f.dataset.wears === "item");
    if (!figure) return null;
    const svg = figure.querySelector("svg");
    const group = svg.querySelector("[data-wardrobe]");
    if (!group) return null;
    const points = samplePoints(svg, group);
    if (points.length === 0) return null;
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const hairBreach = points.filter((p) => p.y < COSTUME_SHOULDERS - EPS && p.x > HAIR_X + EPS);
    return { minY, maxY, hairBreach };
  };
  const drawn = read("drawn");
  const costume = read("costume");
  if (!drawn || !costume) return [{ key: "unmeasured", ok: null, text: "nothing drawn" }];

  const chinOk = drawn.minY >= CHIN - EPS && costume.minY >= CHIN - EPS;
  results.push({
    key: "chin",
    ok: chinOk,
    text: `chin: top edge at y=${fmt(drawn.minY)} drawn / ${fmt(costume.minY)} costume (needs ≥ ${CHIN})`
  });

  const breach = costume.hairBreach;
  results.push({
    key: "upperBack",
    ok: breach.length === 0,
    text:
      breach.length === 0
        ? `upper back: nothing right of x=${HAIR_X} above y=${COSTUME_SHOULDERS} on the costume head`
        : `upper back: ${breach.length} sampled points at x>${HAIR_X}, y<${COSTUME_SHOULDERS} on the costume head (as far as x=${fmt(Math.max(...breach.map((p) => p.x)))}, y=${fmt(Math.min(...breach.map((p) => p.y)))})`
  });

  const bellyOk = drawn.maxY <= bottom + EPS && costume.maxY <= bottom + EPS;
  results.push({
    key: "belly",
    ok: bellyOk,
    text: `belly/feet: bottom edge at y=${fmt(drawn.maxY)} drawn / ${fmt(costume.maxY)} costume (body underside y=${fmt(bottom)})`
  });

  const whitePoints = item.whitePoints ?? 0;
  results.push({
    key: "whitePoints",
    ok: whitePoints <= 1,
    text: `white points on the chest: ${whitePoints}${item.whitePointsNote ? ` — ${item.whitePointsNote}` : ""}`
  });
  const dark = item.darkCentre ?? false;
  results.push({
    key: "darkCentre",
    ok: !dark,
    text: dark
      ? `white shape with a dark centre: yes — ${item.darkCentreNote ?? "see the note"}`
      : "white shape with a dark centre: none"
  });
  return results;
};

// -------------------------------------------------------------------- page --

const SIZES = [304, 152, 76];

const figure = (options, h, { head, wears, caption }) =>
  `<figure data-head="${head}" data-wears="${wears}">${bird(options, h)}<figcaption>${caption}</figcaption></figure>`;

/**
 * A row of four: the bare silhouette, the item on a drawn head, the item on
 * two costume heads.
 */
const row = ({ fill, silhouette, item, heads }, h) => {
  const base = { fill, silhouette, body: "round", comb: "crest", tail: "fan" };
  const worn = item ? { bodyApparel: item.draw } : {};
  return [
    figure(base, h, { head: "drawn", wears: "nothing", caption: "nothing" }),
    figure({ ...base, ...worn }, h, { head: "drawn", wears: "item", caption: "drawn head" }),
    figure({ ...base, ...worn, avatarSrc: heads[0].src }, h, {
      head: "costume",
      wears: "item",
      caption: `costume · ${heads[0].name}`
    }),
    figure({ ...base, ...worn, avatarSrc: heads[1].src }, h, {
      head: "costume2",
      wears: "item",
      caption: `costume · ${heads[1].name}`
    })
  ].join("");
};

const card = (page, item) => `
  <section class="cell" data-card="${item.key}">
    <h2>${item.title} <span class="slot">${item.slot}</span></h2>
    <p class="note">${item.note}</p>
    ${SIZES.map(
      (h) => `<div class="stage" data-size="${h}"><div class="sizes">${row({ ...page, item }, h)}</div><span class="scale">${
        h === 76 ? "76px · actual size on a 1080p TV" : `${h}px`
      }</span></div>`
    ).join("")}
    <p class="rules" data-rules="${item.key}">measuring…</p>
  </section>`;

const strip = (page, items) => `
  <section class="cell" id="strip-76">
    <h2>the 76px row · every candidate, actual TV size</h2>
    <p class="note">${page.stripNote ?? "Each pair is the item on the drawn silhouette and on a costume head. This is the row the round is judged on."}</p>
    <div class="stage" data-size="76"><div class="sizes strip">
      ${[{ key: "nothing", short: "nothing", draw: undefined }, ...items]
        .map((item) => {
          const base = { fill: page.fill, silhouette: page.silhouette, body: "round", comb: "crest", tail: "fan" };
          const worn = item.draw ? { bodyApparel: item.draw } : {};
          return `<div class="pair" data-strip="${item.key}">
            <figure>${bird({ ...base, ...worn }, 76)}<figcaption>${item.short} · drawn</figcaption></figure>
            <figure>${bird({ ...base, ...worn, avatarSrc: page.heads[0].src }, 76)}<figcaption>${item.short} · ${page.heads[0].name}</figcaption></figure>
          </div>`;
        })
        .join("")}
    </div><span class="scale">76px · actual size on a 1080p TV</span></div>
  </section>`;

const rulesList = () => `
  <section class="cell rules-list">
    <h2>the rules this round is judged on</h2>
    <ol>${RULES.map((r) => `<li>${r.text}</li>`).join("")}</ol>
    <p class="note">The first three are measured on every card below, from the item's drawn outline mapped back into the bird's 80×72 box; the last two are counted by hand and printed. A ✗ is reported, not fixed: an item that cannot meet a rule is still drawn so Brad can cut it.</p>
  </section>`;

/**
 * Render a wardrobe page.
 * @param {object} page
 * @param {string} page.fill            the team colour
 * @param {string} [page.silhouette]    "spiky" | "broody" | "preener"; omit for pop
 * @param {Array<{src:string,name:string}>} page.heads  two costume heads
 * @param {Array<object>} page.items    the eight candidates + the pair, in order
 * @param {string} [page.verdict]       HTML for the closing card
 */
export const renderWardrobe = (page) => {
  const root = document.getElementById("root");
  root.innerHTML =
    rulesList() + page.items.map((item) => card(page, item)).join("") + (page.verdict ?? "") + strip(page, page.items);

  const bottom = bodyBottom(page.silhouette);
  const summary = [];
  page.items.forEach((item) => {
    const cell = root.querySelector(`[data-card="${item.key}"]`);
    const results = judge(cell, item, bottom);
    const node = cell.querySelector(`[data-rules="${item.key}"]`);
    node.innerHTML = results
      .map((r) => `<span class="${r.ok === null ? "" : r.ok ? "ok" : "fail"}">${r.ok === null ? "·" : r.ok ? "✓" : "✗"} ${r.text}</span>`)
      .join("<br>");
    const fails = results.filter((r) => r.ok === false).map((r) => r.key);
    summary.push({ key: item.key, fails });
    cell.dataset.fails = fails.join(" ");
  });
  root.dataset.measured = "true";
  // For the screenshot script and anyone reading the console.
  window.WARDROBE_RESULTS = summary;
  return summary;
};

export { PALETTE, HEADS };

// ------------------------------------------------------- shared drawings --

/** A five-point star, `r` tall, centred on (cx, cy). */
export const starPath = (cx, cy, r) => {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `M ${points.join(" L ")} Z`;
};

let clipSeq = 0;
/** A unique clipPath id per drawing, since every bird on the page shares one document. */
export const clipId = (prefix) => `${prefix}-${(clipSeq += 1)}`;

/**
 * A staggered grid of dots inside a box — sequins, chain-mail rings — as one
 * string of circles, to be clipped to the garment by the caller.
 */
export const dotGrid = ({ x0, y0, x1, y1, step, r, fill }) => {
  const out = [];
  let rowIndex = 0;
  for (let y = y0; y <= y1; y += step * 0.87) {
    const offset = rowIndex % 2 === 0 ? 0 : step / 2;
    for (let x = x0 + offset; x <= x1; x += step) {
      out.push(`<circle fill="${fill}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`);
    }
    rowIndex += 1;
  }
  return out.join("");
};

/** The same grid as open rings; the caller's <g> sets the stroke. */
export const ringGrid = ({ x0, y0, x1, y1, step, r }) => {
  const out = [];
  let rowIndex = 0;
  for (let y = y0; y <= y1; y += step * 0.87) {
    const offset = rowIndex % 2 === 0 ? 0 : step / 2;
    for (let x = x0 + offset; x <= x1; x += step) {
      out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`);
    }
    rowIndex += 1;
  }
  return out.join("");
};
