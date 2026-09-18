/* global document */
// Shared data for the team-identity mockups: the genre vocabulary from
// docs/team-identity.md, the font candidates, the emblem drawings and the hen
// used by the lineup. Fonts load from Google Fonts here because this is a
// decision page viewed at a desk; the shipped kit bundles woff2 files.

export const TOKENS = {
  teamA: "#f97316", teamB: "#06b6d4", teamC: "#84cc16", teamD: "#f43f5e",
  teamE: "#facc15", teamF: "#14b8a6", teamG: "#60a5fa", teamH: "#fb7185"
};
export const BG = "#121212";
export const PRIMARY = "#f97316";
export const GOLD = "#fbbf24";

// One entry per canonical genre key. `fonts` is the candidate list, leading
// pick first; `treatment`, `emblem`, `texture` and `entrance` are the CSS
// class / drawing ids the kit uses.
export const GENRES = {
  metal: {
    label: "Metal", token: "teamD", apparel: "collar",
    fonts: ["Metal Mania", "Pirata One", "New Rocker"],
    treatment: "chrome", emblem: "skull-hen", texture: "lightning", entrance: "slam"
  },
  pop: {
    label: "Pop", token: "teamH", apparel: "shades",
    fonts: ["Fredoka", "Lilita One", "Bubblegum Sans"],
    treatment: "candy", emblem: "star-mic", texture: "confetti", entrance: "bounce"
  },
  country: {
    label: "Country", token: "teamE", apparel: "hat",
    fonts: ["Rye", "Alfa Slab One", "Sancreek"],
    treatment: "rope", emblem: "hat-horseshoe", texture: "woodgrain", entrance: "swing"
  },
  disco: {
    label: "Disco", token: "teamB", apparel: "lapels",
    fonts: ["Monoton", "Shrikhand", "Righteous"],
    treatment: "neon", emblem: "mirrorball", texture: "lightdots", entrance: "spin"
  },
  punk: {
    label: "Punk", token: "teamD", apparel: "collar",
    fonts: ["Bangers", "Anton"],
    treatment: "torn", emblem: "safety-pin", texture: "torn", entrance: "rip"
  },
  rock: {
    label: "Rock", token: "teamA", apparel: "collar",
    fonts: ["Anton", "Bebas Neue"],
    treatment: "torn", emblem: "pick", texture: "torn", entrance: "rip"
  },
  hiphop: {
    label: "Hip hop", token: "teamG", apparel: undefined,
    fonts: ["Permanent Marker", "Rubik Spray Paint"],
    treatment: "drip", emblem: "boombox", texture: "spray", entrance: "drop"
  },
  electronic: {
    label: "Electronic", token: "teamF", apparel: undefined,
    fonts: ["Orbitron", "Audiowide"],
    treatment: "scanline", emblem: "waveform", texture: "grid", entrance: "glitch"
  },
  classical: {
    label: "Classical", token: "teamC", apparel: undefined,
    fonts: ["Playfair Display", "Abril Fatface"],
    treatment: "plain", emblem: "keys", texture: null, entrance: "beat"
  },
  none: {
    label: "No genre", token: "teamA", apparel: undefined,
    fonts: ["ui-sans-serif"],
    treatment: "plain", emblem: null, texture: null, entrance: "beat"
  }
};

// The four teams in the night pack, plus a sample name for every other key.
export const PACK_TEAMS = [
  { name: "Molten Metal", genre: "metal", players: ["Rob", "Dan", "Kris"] },
  { name: "Spice Girls", genre: "pop", players: ["Rosie", "Jen", "Mel"] },
  { name: "Honky Tonk Heat", genre: "country", players: ["Brad", "Casey"] },
  { name: "Disco Inferno", genre: "disco", players: ["Sam", "Alex", "Jordan"] }
];
export const EXTRA_TEAMS = [
  { name: "Safety Pins", genre: "punk", players: ["Vic", "Lou"] },
  { name: "Wing Zeppelin", genre: "rock", players: ["Jimmy", "Bonzo"] },
  { name: "Hot Sauce Crew", genre: "hiphop", players: ["Q", "Dre"] },
  { name: "Volt Birds", genre: "electronic", players: ["Ada", "Neo"] },
  { name: "Fowl Play", genre: "classical", players: ["Wolfgang", "Clara"] },
  { name: "Team Heat", genre: "none", players: ["Pat", "Sky"] }
];

export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "Metal+Mania", "Pirata+One", "New+Rocker", "Bangers", "Anton", "Bebas+Neue",
    "Fredoka:wght@700", "Lilita+One", "Bubblegum+Sans", "Rye", "Alfa+Slab+One", "Sancreek",
    "Monoton", "Shrikhand", "Righteous", "Permanent+Marker", "Rubik+Spray+Paint",
    "Orbitron:wght@800", "Audiowide", "Playfair+Display:wght@900", "Abril+Fatface"
  ].map((f) => `family=${f}`).join("&") + "&display=block";

export const loadFonts = () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
};

// ---- Emblems -------------------------------------------------------------
// 64×64 boxes, flat fills from the cast palette: team colour (currentColor),
// white, and a 2-unit bg stroke so they sit on the flame the way the hens do.
const S = `stroke="${BG}" stroke-width="2" stroke-linejoin="round"`;
const EMBLEMS = {
  "skull-hen": `
    <path fill="currentColor" ${S} d="M 6 34 L 16 22 L 12 34 L 20 30 L 14 44 Z"/>
    <path fill="currentColor" ${S} d="M 58 34 L 48 22 L 52 34 L 44 30 L 50 44 Z"/>
    <path fill="currentColor" ${S} d="M 26 12 L 29 4 L 32 10 L 35 2 L 38 10 L 41 5 L 42 13 Z"/>
    <circle fill="#fff" ${S} cx="32" cy="30" r="17"/>
    <rect fill="#fff" ${S} x="22" y="40" width="20" height="14" rx="3"/>
    <rect fill="${BG}" x="26" y="44" width="2.5" height="8"/><rect fill="${BG}" x="31" y="44" width="2.5" height="8"/><rect fill="${BG}" x="36" y="44" width="2.5" height="8"/>
    <circle fill="${BG}" cx="25" cy="29" r="5"/><circle fill="${BG}" cx="39" cy="29" r="5"/>
    <path fill="${PRIMARY}" ${S} d="M 30 34 L 34 34 L 32 40 Z"/>`,
  "star-mic": `
    <path fill="#fff" ${S} d="M 32 2 L 39 20 L 58 22 L 44 34 L 48 53 L 32 43 L 16 53 L 20 34 L 6 22 L 25 20 Z"/>
    <rect fill="currentColor" ${S} x="24" y="14" width="16" height="24" rx="8"/>
    <path fill="none" stroke="${BG}" stroke-width="1.5" d="M 26 21 H 38 M 26 26 H 38 M 26 31 H 38"/>
    <path fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" d="M 20 32 C 20 46 44 46 44 32"/>
    <rect fill="currentColor" ${S} x="29" y="42" width="6" height="18" rx="2"/>`,
  "hat-horseshoe": `
    <path fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" d="M 16 36 C 12 52 24 60 32 60 C 40 60 52 52 48 36"/>
    <path fill="none" stroke="${BG}" stroke-width="1.5" d="M 20 44 l 3 -1 M 44 44 l -3 -1 M 24 54 l 2 -3 M 40 54 l -2 -3"/>
    <path fill="#fff" ${S} d="M 6 34 Q 32 44 58 34 Q 52 28 46 28 L 42 8 Q 32 4 22 8 L 18 28 Q 12 28 6 34 Z"/>
    <rect fill="currentColor" ${S} x="20" y="24" width="24" height="6"/>`,
  "mirrorball": `
    <rect fill="#fff" ${S} x="30" y="0" width="4" height="8"/>
    <circle fill="currentColor" ${S} cx="32" cy="34" r="24"/>
    <path fill="none" stroke="${BG}" stroke-width="1.5" d="M 8 34 H 56 M 12 22 H 52 M 12 46 H 52 M 32 10 V 58 M 20 12 V 56 M 44 12 V 56"/>
    <rect fill="#fff" x="26" y="16" width="6" height="6"/><rect fill="#fff" x="38" y="28" width="6" height="6"/><rect fill="#fff" x="20" y="40" width="6" height="6"/><rect fill="#fff" x="32" y="46" width="6" height="6"/>
    <path fill="#fff" d="M 56 8 l 1.5 4 l 4 1.5 l -4 1.5 l -1.5 4 l -1.5 -4 l -4 -1.5 l 4 -1.5 Z"/>`,
  "safety-pin": `
    <path fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" d="M 14 50 L 50 14"/>
    <path fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" d="M 14 50 C 6 44 10 32 20 30"/>
    <circle fill="currentColor" ${S} cx="50" cy="14" r="8"/>
    <path fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" d="M 20 30 L 46 22"/>`,
  "pick": `
    <path fill="currentColor" ${S} d="M 32 60 C 14 44 6 30 8 16 C 10 6 22 4 32 8 C 42 4 54 6 56 16 C 58 30 50 44 32 60 Z"/>
    <path fill="#fff" d="M 24 16 C 20 20 20 28 24 34 C 20 26 22 20 24 16 Z"/>`,
  "boombox": `
    <rect fill="currentColor" ${S} x="4" y="20" width="56" height="34" rx="4"/>
    <path fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" d="M 20 20 V 12 H 44 V 20"/>
    <circle fill="#fff" ${S} cx="18" cy="38" r="9"/><circle fill="#fff" ${S} cx="46" cy="38" r="9"/>
    <circle fill="${BG}" cx="18" cy="38" r="3"/><circle fill="${BG}" cx="46" cy="38" r="3"/>
    <rect fill="#fff" x="28" y="28" width="8" height="4"/><rect fill="#fff" x="28" y="36" width="8" height="12"/>`,
  "waveform": `
    <path fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" d="M 6 32 H 12 L 18 14 L 26 50 L 34 20 L 42 44 L 48 32 H 58"/>
    <path fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" d="M 6 32 H 12 L 18 14 L 26 50 L 34 20 L 42 44 L 48 32 H 58"/>`,
  "keys": `
    <rect fill="#fff" ${S} x="4" y="14" width="56" height="36" rx="2"/>
    <path fill="none" stroke="${BG}" stroke-width="1.5" d="M 14 14 V 50 M 24 14 V 50 M 34 14 V 50 M 44 14 V 50 M 54 14 V 50"/>
    <rect fill="currentColor" x="10" y="14" width="7" height="22"/><rect fill="currentColor" x="20" y="14" width="7" height="22"/>
    <rect fill="currentColor" x="40" y="14" width="7" height="22"/><rect fill="currentColor" x="50" y="14" width="7" height="22"/>`
};

export const emblemSvg = (id, px, color) =>
  id === null
    ? ""
    : `<svg viewBox="0 0 64 64" width="${px}" height="${px}" style="color:${color}" aria-hidden="true">${EMBLEMS[id]}</svg>`;

// ---- The hen, from mockups/cast/birds.html, with the four apparels -------
const eyes = (cx, cy) => `<circle fill="#fff" cx="${cx - 4}" cy="${cy}" r="3"/><circle fill="#fff" cx="${cx + 4}" cy="${cy}" r="3"/><circle fill="${BG}" cx="${cx - 3}" cy="${cy}" r="1.4"/><circle fill="${BG}" cx="${cx + 5}" cy="${cy}" r="1.4"/>`;
const crest = (f, cx, baseY) => `<path fill="${f}" ${S} transform="translate(${cx - 56} ${baseY - 13})" d="M 46 13 L 49 3 L 53 10 L 57 1 L 61 9 L 65 4 L 66 13 Z"/>`;
const beak = (baseX, cy) => `<path fill="${PRIMARY}" ${S} d="M ${baseX} ${cy - 5} L ${baseX + 11} ${cy} L ${baseX} ${cy + 5} Z"/>`;
const wattle = (x, y) => `<path fill="${PRIMARY}" ${S} d="M ${x} ${y} C ${x + 5} ${y} ${x + 5} ${y + 8} ${x} ${y + 7} Z"/>`;
const APPAREL = {
  hat: (h, f) => `<path fill="#fff" ${S} transform="translate(${h.cx - 56} ${h.top - 12 + 4})" d="M 38 12 Q 56 18 74 12 Q 70 9 66 9 L 64 1 Q 56 -2 48 1 L 46 9 Q 42 9 38 12 Z"/><rect fill="${f}" x="${h.cx - 9}" y="${h.top - 2}" width="18" height="3"/>`,
  collar: (h) => `<path fill="${BG}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" d="M ${h.cx - 12} ${h.chin - 1} L ${h.cx - 9} ${h.chin - 6} L ${h.cx - 5} ${h.chin - 1} L ${h.cx - 1} ${h.chin - 6} L ${h.cx + 3} ${h.chin - 1} L ${h.cx + 7} ${h.chin - 6} L ${h.cx + 11} ${h.chin - 1} L ${h.cx + 11} ${h.chin + 4} L ${h.cx - 12} ${h.chin + 4} Z"/>`,
  shades: (h) => `<path fill="#fff" ${S} d="M ${h.cx - 12} ${h.cy - 2} l 3.5 -5 l 3.5 5 l 2 -3 l 2 3 l 3.5 -5 l 3.5 5 l -3 6 h -5 l -1 -2 l -1 2 h -5 Z"/>`,
  lapels: (h) => `<path fill="#fff" ${S} d="M ${h.cx - 10} ${h.chin - 2} L ${h.cx - 2} ${h.chin + 10} L ${h.cx - 8} ${h.chin + 12} Z M ${h.cx + 10} ${h.chin - 2} L ${h.cx + 2} ${h.chin + 10} L ${h.cx + 8} ${h.chin + 12} Z"/>`
};

const henBack = (f) => `<path fill="${f}" ${S} d="M 20 42 C 8 40 0 26 6 12 C 8 26 14 34 26 36 Z M 22 46 C 6 48 0 36 2 24 C 8 36 16 40 28 40 Z"/>
  <path fill="none" stroke="${PRIMARY}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" d="M 32 60 L 30 69 M 30 69 L 24 71 M 30 69 L 36 71 M 46 60 L 45 69 M 45 69 L 39 71 M 45 69 L 51 71"/>
  <path fill="${f}" ${S} d="M 14 46 C 14 28 30 20 50 26 C 64 30 66 44 60 54 C 52 64 30 66 20 58 C 15 54 14 50 14 46 Z"/>
  <path fill="${f}" ${S} d="M 48 30 L 54 20 L 64 24 L 62 36 Z"/>
  <path fill="${f}" ${S} d="M 26 42 C 34 34 48 36 52 46 C 44 54 32 54 26 46 Z"/>`;

export const henSvg = (px, color, apparel) => {
  const h = { cx: 58, cy: 20, r: 12, chin: 32, top: 8 };
  const inner = `${henBack(color)}<circle fill="${color}" ${S} cx="${h.cx}" cy="${h.cy}" r="${h.r}"/>${beak(h.cx + h.r - 1, h.cy)}${wattle(h.cx + h.r - 4, h.cy + 5)}${eyes(h.cx, h.cy - 2)}${crest(color, h.cx, h.top + 4)}${apparel && APPAREL[apparel] ? APPAREL[apparel](h, color) : ""}`;
  return `<svg viewBox="0 0 80 72" width="${Math.round((px * 80) / 72)}" height="${px}" aria-hidden="true">${inner}</svg>`;
};

export const fontFamily = (name) =>
  name === "ui-sans-serif" ? "ui-sans-serif, system-ui, sans-serif" : `'${name}', ui-sans-serif, sans-serif`;
