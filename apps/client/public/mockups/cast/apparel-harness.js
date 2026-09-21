// The shipping hen, in plain SVG, so an apparel prototype is drawn on exactly
// the bird the TV draws and four genre pages stay comparable with each other.
//
// Every path and anchor here is transcribed from packages/cast/src/Character —
// CharacterFigure/index.tsx for the body, geometry/index.ts for the anchors,
// Apparel/index.tsx for the four props that ship today. Change nothing in this
// file from a prototype page: add your candidates in your own page and pass
// them to `bird({ apparel })`.

export const PALETTE = {
  bg: "#121212",
  surface: "#1c1c1c",
  text: "#ffffff",
  muted: "#a3a3a3",
  mutedWarm: "#b3a89a",
  primary: "#f97316",
  // The eight identity accents. teamD is chrome — the slot metal defaults to.
  teamA: "#f97316",
  teamB: "#06b6d4",
  teamC: "#84cc16",
  teamD: "#d9dee6",
  teamE: "#d98324",
  teamF: "#14b8a6",
  teamG: "#60a5fa",
  teamH: "#ec4899"
};

const BG = PALETTE.bg;
const S = `stroke="${BG}" stroke-width="2" stroke-linejoin="round"`;

// ---------------------------------------------------------------- anchors --
// geometry/index.ts. A drawn head is a 12-unit circle at (58,20); a costume
// head is a 44-unit photo whose chin lands in the same place, with hanging
// props dropped 5 further so they clear a jaw.

export const DRAWN_HEAD = { cx: 58, cy: 20, r: 12 };
export const COSTUME_HEAD_HEIGHT = 44;

export const DRAWN_HEAD_ANCHORS = {
  cx: 58,
  top: 8,
  eyeY: 18,
  chin: 32,
  shoulders: 32
};

export const COSTUME_HEAD_ANCHORS = {
  cx: 58,
  top: 32 - COSTUME_HEAD_HEIGHT,
  eyeY: 32 - COSTUME_HEAD_HEIGHT + Math.round(COSTUME_HEAD_HEIGHT * 0.42),
  chin: 32,
  shoulders: 37
};

// A shape drawn with its base on y=13 centred on x=56 (comb, hat), moved to
// sit on `baseY` centred on `cx`.
export const perchTransform = (cx, baseY) => `translate(${cx - 56} ${baseY - 13})`;

// ------------------------------------------------------------------- bird --

const TAIL_PATHS = {
  fan: "M 22 46 C 10 47 2 41 0 30 C 6 39 14 42 26 41 Z M 22 41 C 11 40 3 33 2 20 C 9 31 15 36 25 36 Z M 24 36 C 14 32 8 24 11 10 C 14 25 19 30 28 31 Z",
  plume: "M 24 36 C 10 30 2 16 12 2 C 9 19 17 28 30 32 Z M 22 43 C 8 41 0 28 6 16 C 9 31 17 37 28 38 Z"
};

const BODY_PATHS = {
  round: "M 16 42 C 16 28 32 22 50 27 C 64 31 67 44 61 55 C 53 65 30 66 21 58 C 16 54 16 48 16 42 Z",
  tall: "M 19 42 C 17 24 33 19 50 25 C 63 30 63 47 58 57 C 52 66 30 66 23 59 C 19 55 19 49 19 42 Z",
  wide: "M 11 45 C 11 30 30 24 52 28 C 66 32 69 45 63 55 C 55 65 26 67 16 59 C 11 55 11 50 11 45 Z"
};

const BELLY_SHADE_PATHS = {
  round: "M 22 56 C 30 64 52 64 60 54 C 56 66 30 68 22 56 Z",
  tall: "M 24 57 C 32 64 50 64 57 56 C 52 67 30 67 24 57 Z",
  wide: "M 17 57 C 28 66 54 66 62 54 C 56 67 26 69 17 57 Z"
};

const COMB_PATHS = {
  crest: "M 47 13 C 46 5 52 3 54 9 C 55 2 61 2 62 8 C 63 4 68 5 66 13 Z",
  mohawk: "M 50 13 C 51 4 58 -2 68 2 C 61 3 62 9 64 13 Z"
};

const NECK_PATH = "M 45 33 C 47 24 52 17 60 15 L 68 25 C 63 28 60 34 60 40 Z";

const WING_PATH =
  "M 47 35 C 38 29 24 33 20 44 C 19 49 21 53 24 55 Q 28 50 31 54 Q 35 49 38 53 Q 42 48 45 51 C 49 46 51 40 47 35 Z";

const PIVOTS = { legFar: { x: 44, y: 57 }, legNear: { x: 32, y: 57 } };

const legPath = ({ x, y }) =>
  `M ${x} ${y} L ${x - 1} ${y + 11} M ${x - 1} ${y + 11} L ${x - 7} ${y + 13.5} M ${x - 1} ${y + 11} L ${x} ${y + 14} M ${x - 1} ${y + 11} L ${x + 6} ${y + 13.5}`;

const thighPath = ({ x, y }) =>
  `M ${x - 5} ${y - 4} C ${x - 6} ${y + 3} ${x - 1} ${y + 6} ${x + 3} ${y + 2} C ${x + 4} ${y - 2} ${x} ${y - 6} ${x - 5} ${y - 4} Z`;

const DRAWN_BEAK = { x: DRAWN_HEAD.cx + DRAWN_HEAD.r - 1, y: DRAWN_HEAD.cy };

const beakAndWattle = () => `
  <path fill="${PALETTE.primary}" ${S} d="M ${DRAWN_BEAK.x} ${DRAWN_BEAK.y - 4} L ${DRAWN_BEAK.x + 12} ${DRAWN_BEAK.y} L ${DRAWN_BEAK.x} ${DRAWN_BEAK.y + 1} Z"/>
  <path fill="${PALETTE.primary}" ${S} d="M ${DRAWN_BEAK.x} ${DRAWN_BEAK.y + 1} L ${DRAWN_BEAK.x + 10} ${DRAWN_BEAK.y + 1} L ${DRAWN_BEAK.x} ${DRAWN_BEAK.y + 5} Z"/>
  <path fill="${PALETTE.primary}" ${S} d="M ${DRAWN_BEAK.x - 3} ${DRAWN_BEAK.y + 5} C ${DRAWN_BEAK.x + 2} ${DRAWN_BEAK.y + 5} ${DRAWN_BEAK.x + 2} ${DRAWN_BEAK.y + 13} ${DRAWN_BEAK.x - 3} ${DRAWN_BEAK.y + 12} Z"/>`;

const drawnHead = (fill, head) => `
  <circle fill="${fill}" ${S} cx="${DRAWN_HEAD.cx}" cy="${DRAWN_HEAD.cy}" r="${DRAWN_HEAD.r}"/>
  ${beakAndWattle()}
  <circle fill="${PALETTE.text}" cx="${head.cx - 4}" cy="${head.eyeY}" r="3"/>
  <circle fill="${PALETTE.text}" cx="${head.cx + 4}" cy="${head.eyeY}" r="3"/>
  <circle fill="${BG}" cx="${head.cx - 3}" cy="${head.eyeY}" r="1.4"/>
  <circle fill="${BG}" cx="${head.cx + 5}" cy="${head.eyeY}" r="1.4"/>`;

let uid = 0;

const costumeHead = (avatarSrc, head) => {
  const id = `halo${(uid += 1)}`;
  return `
  <filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" primitiveUnits="userSpaceOnUse">
    <feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="halo"/>
    <feFlood flood-color="${BG}" result="ink"/>
    <feComposite in="ink" in2="halo" operator="in" result="outline"/>
    <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <image href="${avatarSrc}" x="${head.cx - COSTUME_HEAD_HEIGHT / 2}" y="${head.top}"
         width="${COSTUME_HEAD_HEIGHT}" height="${COSTUME_HEAD_HEIGHT}"
         preserveAspectRatio="xMidYMax meet" filter="url(#${id})"/>`;
};

/**
 * One hen in an 80×72 box, facing right.
 *
 * @param {object} o
 * @param {string} o.fill          the team colour (PALETTE.teamX)
 * @param {"round"|"tall"|"wide"} [o.body]
 * @param {"none"|"crest"|"mohawk"} [o.comb]
 * @param {"fan"|"plume"} [o.tail]
 * @param {string} [o.avatarSrc]   a costume head; omit for the drawn head
 * @param {(head: object, fill: string) => string} [o.apparel]
 *        your candidate: given the head anchors and the team colour, return
 *        SVG. It is drawn LAST, over the head. Set `fn.crossesTheFace = true`
 *        on it if it lands on the face, and a costume head will drop it the
 *        way `CharacterFigure` does.
 * @returns {string} the inner SVG markup
 */
export const birdMarkup = ({ fill, body = "round", comb = "crest", tail = "fan", avatarSrc, apparel }) => {
  const head = avatarSrc ? COSTUME_HEAD_ANCHORS : DRAWN_HEAD_ANCHORS;
  // `apparelCrossesTheFace` (Character/Apparel/index.tsx): a player's own face
  // is not a place to put a hat, so a costume head wears only what hangs below
  // it. The harness has to honour this or a prototype page shows the team
  // wearing something the TV will never draw — which is the whole trap this
  // round is about.
  const worn = apparel && !(avatarSrc && apparel.crossesTheFace) ? apparel : undefined;
  return `
  <path fill="${fill}" ${S} d="${TAIL_PATHS[tail]}"/>
  <g opacity="0.7"><path fill="none" stroke="${PALETTE.primary}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" d="${legPath(PIVOTS.legFar)}"/></g>
  <path fill="${fill}" ${S} d="${BODY_PATHS[body]}"/>
  <path fill="${BG}" fill-opacity="0.2" d="${BELLY_SHADE_PATHS[body]}"/>
  <path fill="${fill}" ${S} d="${thighPath(PIVOTS.legNear)}"/>
  <path fill="none" stroke="${PALETTE.primary}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" d="${legPath(PIVOTS.legNear)}"/>
  <path fill="${fill}" ${S} d="${WING_PATH}"/>
  <path fill="${fill}" ${S} d="${NECK_PATH}"/>
  ${avatarSrc ? costumeHead(avatarSrc, head) : drawnHead(fill, head)}
  ${!avatarSrc && comb !== "none" ? `<path fill="${fill}" ${S} transform="${perchTransform(head.cx, head.top + 4)}" d="${COMB_PATHS[comb]}"/>` : ""}
  ${worn ? worn(head, fill) : ""}`;
};

/** `birdMarkup` wrapped in an <svg> of the given pixel height. */
export const bird = (o, heightPx) =>
  `<svg viewBox="0 0 80 72" height="${heightPx}" style="overflow:visible;display:block">${birdMarkup(o)}</svg>`;

// -------------------------------------------------------- shipping apparel --
// Apparel/index.tsx, as it looks on the TV tonight. Use these as the "before"
// column on your page; do not edit them.

const starPath = (cx, cy, r) => {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `M ${points.join(" L ")} Z`;
};

const LIGHT = `fill="${PALETTE.text}" stroke="${BG}" stroke-width="2" stroke-linejoin="round"`;

const COLLAR_HALF_WIDTH = 11.5;
const studCentre = ({ cx, shoulders }, t) => ({
  x: cx + COLLAR_HALF_WIDTH * (2 * t - 1) * 0.86,
  y: shoulders + 1.5 + 16 * t * (1 - t)
});

export const SHIPPING_APPAREL = {
  // country
  hat: (head, fill) => `
    <g data-apparel="hat">
      <path ${LIGHT} transform="${perchTransform(head.cx, head.top + 4)}" d="M 38 12 Q 56 18 74 12 Q 70 9 66 9 L 64 1 Q 56 -2 48 1 L 46 9 Q 42 9 38 12 Z"/>
      <rect fill="${fill}" x="${head.cx - 9}" y="${head.top - 2}" width="18" height="3"/>
    </g>`,
  // metal / punk / rock — the studded collar, the prop being replaced
  collar: (head) => {
    const { cx, shoulders } = head;
    const band = [
      `M ${cx - COLLAR_HALF_WIDTH} ${shoulders - 2}`,
      `Q ${cx} ${shoulders + 8} ${cx + COLLAR_HALF_WIDTH} ${shoulders - 2}`,
      `L ${cx + COLLAR_HALF_WIDTH} ${shoulders + 5}`,
      `Q ${cx} ${shoulders + 15} ${cx - COLLAR_HALF_WIDTH} ${shoulders + 5}`,
      "Z"
    ].join(" ");
    const studs = [0.18, 0.34, 0.5, 0.66, 0.82]
      .map((t) => studCentre(head, t))
      .map(({ x, y }) => `<circle fill="${PALETTE.text}" cx="${x}" cy="${y}" r="1.7"/>`)
      .join("");
    return `<g data-apparel="collar"><path fill="${BG}" d="${band}"/>${studs}</g>`;
  },
  // pop
  shades: (head) => `
    <g data-apparel="shades">
      <path ${LIGHT} d="${starPath(head.cx - 5, head.eyeY, 5.5)}"/>
      <path ${LIGHT} d="${starPath(head.cx + 5, head.eyeY, 5.5)}"/>
    </g>`,
  // disco
  medallion: (head) => {
    const { cx, shoulders } = head;
    return `
    <g data-apparel="medallion">
      <path fill="none" stroke="${PALETTE.text}" stroke-width="2" stroke-linecap="round"
            d="M ${cx - 9} ${shoulders - 1} Q ${cx} ${shoulders + 12} ${cx + 9} ${shoulders - 1}"/>
      <circle ${LIGHT} cx="${cx}" cy="${shoulders + 9}" r="4.6"/>
    </g>`;
  }
};

// The two props that land on the face. A costume head drops them, which is
// why the pop and country teams wear NOTHING on a real night.
SHIPPING_APPAREL.hat.crossesTheFace = true;
SHIPPING_APPAREL.shades.crossesTheFace = true;

// The four heads copied into apps/client/public/local-assets/avatars/ (gitignored).
export const HEADS = {
  rob: "/local-assets/avatars/rob-barnes.png",
  rosi: "/local-assets/avatars/rosi.png",
  sara: "/local-assets/avatars/sara.png",
  kenny: "/local-assets/avatars/kenny.png"
};

// ------------------------------------------------------------ page chrome --

/**
 * One candidate: a labelled card with a row of birds at TV size, 2× and 4×.
 * @param {object} o
 * @param {string} o.title
 * @param {string} o.note
 * @param {Array<object>} o.birds   `birdMarkup` options, one per figure
 */
export const candidateCard = ({ title, note, birds }) => `
  <section class="cell">
    <h2>${title}</h2>
    <p class="note">${note}</p>
    ${[76, 152, 304]
      .map(
        (h) => `<div class="stage"><div class="sizes">${birds
          .map((b) => `<figure>${bird(b, h)}<figcaption>${b.caption ?? ""}</figcaption></figure>`)
          .join("")}</div><span class="scale">${h === 76 ? "76px · actual size on a 1080p TV" : `${h}px`}</span></div>`
      )
      .join("")}
  </section>`;
