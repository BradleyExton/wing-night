/* global document */
// The pack's real schedule for the 2026-09-24 night, and two kinds of art every
// direction draws from: SCENES (a small painted moment of each game, 240x240,
// the subject kept inside the middle 170x100 so a wide band or a portrait crop
// both hold it) and GLYPHS (one-line symbols, 64x64, stroke only).
export const ROUNDS = [
  { n: 1, label: "Warm Up", sauce: "Frank's", game: "Dunlop Dash", id: "schlonic", heat: 2 },
  { n: 2, label: "Second Heat", sauce: "Classic Buffalo", game: "Geo", id: "geo", heat: 3 },
  { n: 3, label: "Getting Spicy", sauce: "Mango Habanero", game: "Emoji Charades", id: "emoji-charades", heat: 3 },
  { n: 4, label: "Slow Burn", sauce: "Smoked Habanero", game: "Who's That Song", id: "song-guess", heat: 3 },
  { n: 5, label: "Full Sweat", sauce: "Scotch Bonnet", game: "Drawing", id: "drawing", heat: 4 },
  { n: 6, label: "Danger Zone", sauce: "Ghost Pepper", game: "Fappy Bird", id: "fappy", heat: 4 },
  { n: 7, label: "Flight Risk", sauce: "Trinidad Scorpion", game: "Forgery Studio", id: "recreate", heat: 5 },
  { n: 8, label: "Final Fire", sauce: "Carolina Reaper", game: "Slingshlong", id: "joust", heat: 5 }
];

// One tagline per game, in the show's voice: what you do, not what it is.
export const TAGLINES = {
  schlonic: "Run the bay. Keep the wings.",
  geo: "Where on earth was this?",
  "emoji-charades": "Say it in emoji.",
  "song-guess": "Name it before they do.",
  drawing: "Draw it. Badly. Fast.",
  fappy: "Flap to the far cliff.",
  recreate: "Fake the masterpiece.",
  joust: "Knock the tower down."
};

const INK = "#1a0e07";
const S = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

// The house hen, reduced: body, head, comb, beak, wing, legs. `pose` moves the
// wing and the legs; facing right like the cast.
function hen(x, y, s = 1, pose = "run", body = "#f97316") {
  const wing = pose === "flapUp" ? `<path d="M-6 -4 L-22 -26 L4 -10 Z" fill="#ffb35a" ${S}/>`
    : pose === "flapDown" ? `<path d="M-6 0 L-20 16 L4 4 Z" fill="#ffb35a" ${S}/>`
    : `<path d="M-10 -2 Q-2 -12 8 -2 Q0 6 -10 -2 Z" fill="#ffb35a" ${S}/>`;
  const legs = pose === "run" ? `<path d="M-2 12 L-10 24 M4 12 L12 22" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>`
    : `<path d="M-2 12 L-4 20 M4 12 L6 20" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">${legs}
    <path d="M-18 -6 L-26 -14 L-22 -2 Z" fill="${body}" ${S}/>
    <ellipse cx="0" cy="0" rx="18" ry="14" fill="${body}" ${S}/>
    <path d="M12 -26 q3 -7 6 -1 q3 -6 5 1 q3 -3 3 3 Z" fill="#ef4444" ${S}/>
    <circle cx="16" cy="-14" r="10" fill="${body}" ${S}/>
    <path d="M25 -16 L34 -12 L25 -9 Z" fill="#fbbf24" ${S}/>
    <circle cx="19" cy="-16" r="2.2" fill="${INK}"/>${wing}</g>`;
}

function drumette(x, y, r = 0, s = 1) {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})">
    <path d="M4 -2 L13 -9" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M4 -2 L13 -9" stroke="#f6ead6" stroke-width="3" stroke-linecap="round"/>
    <circle cx="14" cy="-11" r="2.6" fill="#f6ead6" ${S} stroke-width="1.5"/><circle cx="15.5" cy="-7.5" r="2.6" fill="#f6ead6" ${S} stroke-width="1.5"/>
    <ellipse cx="0" cy="0" rx="8" ry="6.5" transform="rotate(-35)" fill="#c2611f" ${S}/>
    <path d="M-4 -2 q3 -3 6 -2" stroke="#f0a15a" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`;
}

const pin = (x, y, fill, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 C0 0 -12 -14 -12 -22 A12 12 0 0 1 12 -22 C12 -14 0 0 0 0 Z" fill="${fill}" ${S}/><circle cx="0" cy="-22" r="4.5" fill="${INK}"/></g>`;

export const SCENES = {
  schlonic: `<defs><linearGradient id="sk-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7fd0"/><stop offset="1" stop-color="#8fd3f4"/></linearGradient>
      <pattern id="chk" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#9a4f1d"/><rect width="10" height="10" fill="#c26a2a"/><rect x="10" y="10" width="10" height="10" fill="#c26a2a"/></pattern></defs>
    <rect width="240" height="240" fill="url(#sk-s)"/>
    <path d="M0 132 Q30 120 60 130 T120 128 T180 124 T240 130 V160 H0 Z" fill="#3d7a3a" opacity=".55"/>
    <rect y="148" width="240" height="18" fill="#1d6fb0"/><path d="M14 156 h18 M70 153 h26 M140 158 h20 M196 154 h24" stroke="#bde4ff" stroke-width="2" stroke-linecap="round"/>
    <rect y="166" width="240" height="74" fill="url(#chk)"/><path d="M0 166 H240" ${S}/>
    <path d="M0 162 Q20 154 40 163 T80 162 T120 161 T160 163 T200 160 T240 163 V170 H0 Z" fill="#5fbf3f" ${S}/>
    <path d="M40 124 h26 M34 134 h22 M44 144 h18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
    ${hen(100, 140, 1.25, "run")}
    ${drumette(142, 108, -10)}${drumette(162, 96, 0)}${drumette(184, 92, 10)}${drumette(204, 98, 20)}`,

  geo: `<rect width="240" height="240" fill="#13171b"/>
    <path d="M150 0 C140 50 176 70 170 120 C164 170 200 190 196 240 H240 V0 Z" fill="#0d2536"/>
    <rect x="30" y="170" width="50" height="40" rx="6" fill="#152a1a"/>
    <g stroke="#2b333d" stroke-width="5" fill="none"><path d="M0 60 H240 M0 118 H160 M0 190 H240 M60 0 V240 M120 0 V240"/><path d="M0 240 L150 30" stroke-width="7" stroke="#39414c"/></g>
    <g stroke="#1f252c" stroke-width="2"><path d="M0 88 H150 M0 150 H175 M30 0 V240 M90 0 V240"/></g>
    <g transform="translate(38 70) rotate(-7)"><rect width="74" height="80" fill="#f4ead8" ${S}/><rect x="6" y="6" width="62" height="54" fill="#6fb2d9"/>
      <path d="M6 48 L26 30 L38 40 L50 26 L68 44 V60 H6 Z" fill="#3d7a3a"/><circle cx="54" cy="16" r="5" fill="#fbbf24"/><rect x="6" y="6" width="62" height="54" fill="none" ${S}/></g>
    <path d="M150 104 L188 138" stroke="#fbbf24" stroke-width="2.5" stroke-dasharray="4 5"/>
    ${pin(150, 112, "#f97316", 1.15)}${pin(190, 146, "#fbbf24", 1)}
    <text x="176" y="112" font-family="Barlow Condensed" font-weight="800" font-size="15" fill="#fbbf24" letter-spacing=".5">2.4 KM</text>`,

  "emoji-charades": `<defs><radialGradient id="ec-sp" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#5a2a12"/><stop offset="1" stop-color="#140a06"/></radialGradient></defs>
    <rect width="240" height="240" fill="url(#ec-sp)"/>
    <path d="M90 0 L20 240 H220 L150 0 Z" fill="#ffd6aa" opacity=".07"/>
    <g font-size="34" text-anchor="middle">
      <g transform="translate(58 118) rotate(-6)"><rect x="-27" y="-27" width="54" height="54" rx="10" fill="#2e1609" ${S}/><text y="12">🐔</text></g>
      <g transform="translate(120 112)"><rect x="-27" y="-27" width="54" height="54" rx="10" fill="#2e1609" ${S}/><text y="12">🎤</text></g>
      <g transform="translate(182 118) rotate(6)"><rect x="-27" y="-27" width="54" height="54" rx="10" fill="#2e1609" ${S}/><text y="12">🔥</text></g></g>
    <g stroke="#ffb35a" stroke-width="3" stroke-linecap="round"><path d="M44 164 h12 M62 164 h12 M80 164 h12 M106 164 h12 M124 164 h12 M150 164 h12 M168 164 h12 M186 164 h12"/></g>
    <text x="120" y="78" text-anchor="middle" font-family="Playfair Display" font-style="italic" font-weight="700" font-size="22" fill="#fbbf24">?</text>`,

  "song-guess": `<defs><radialGradient id="sg-bg" cx=".3" cy=".5" r=".8"><stop offset="0" stop-color="#3a1030"/><stop offset="1" stop-color="#120812"/></radialGradient></defs>
    <rect width="240" height="240" fill="url(#sg-bg)"/>
    <path d="M200 0 L120 240 H240 V0 Z" fill="#06b6d4" opacity=".08"/><path d="M0 0 L80 240 H0 Z" fill="#ec4899" opacity=".1"/>
    <g transform="translate(88 124)"><circle r="50" fill="#0b0b0b" ${S}/>
      <g fill="none" stroke="#2a2a2a" stroke-width="1.5"><circle r="42"/><circle r="35"/><circle r="28"/></g>
      <path d="M-30 -30 A42 42 0 0 1 20 -38" stroke="#ffffff" stroke-opacity=".25" stroke-width="3" fill="none"/>
      <circle r="16" fill="#f97316" ${S}/><circle r="3" fill="${INK}"/></g>
    <path d="M150 64 L132 112" stroke="#d9dee6" stroke-width="4" stroke-linecap="round"/><circle cx="150" cy="64" r="6" fill="#d9dee6" ${S}/>
    <g ${S}><rect x="160" y="122" width="10" height="46" fill="#fbbf24"/><rect x="174" y="100" width="10" height="68" fill="#f97316"/><rect x="188" y="134" width="10" height="34" fill="#fbbf24"/><rect x="202" y="112" width="10" height="56" fill="#ef4444"/></g>
    <g fill="#ec4899" ${S} stroke-width="2"><ellipse cx="44" cy="70" rx="7" ry="5.5"/><path d="M50 70 V46 L62 50" fill="none" stroke="#ec4899" stroke-width="3"/></g>
    <text x="196" y="88" text-anchor="middle" font-family="Playfair Display" font-style="italic" font-weight="700" font-size="34" fill="#06b6d4">?</text>`,

  drawing: `<rect width="240" height="240" fill="#1d130c"/>
    <path d="M0 0 H240 V240 H0 Z" fill="none"/>
    <g transform="translate(120 122) rotate(-3)"><rect x="-86" y="-58" width="172" height="116" rx="3" fill="#f4ead8" ${S}/>
      <g fill="none" stroke="#1a1a1a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-40 10 C-46 -14 -20 -30 6 -22 C26 -16 34 4 22 18 C10 30 -30 32 -40 10 Z"/>
        <path d="M6 -22 C4 -38 26 -44 30 -28"/><path d="M28 -30 L40 -26 L28 -22"/><circle cx="20" cy="-30" r="1.5" fill="#1a1a1a"/>
        <path d="M-12 30 L-16 44 M4 30 L6 44"/></g>
      <path d="M12 -44 q4 -10 8 -2 q4 -8 7 2" stroke="#ef4444" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M-30 -2 q10 -8 20 2" stroke="#f97316" stroke-width="3.5" fill="none" stroke-linecap="round"/></g>
    <g transform="translate(176 170) rotate(-40)"><rect x="-6" y="-38" width="12" height="54" rx="3" fill="#06b6d4" ${S}/><path d="M-6 16 L0 28 L6 16 Z" fill="#f4ead8" ${S}/><path d="M-2 24 L0 28 L2 24 Z" fill="#1a1a1a"/></g>
    <g ${S} stroke-width="2"><circle cx="44" cy="190" r="7" fill="#ef4444"/><circle cx="62" cy="190" r="7" fill="#fbbf24"/><circle cx="80" cy="190" r="7" fill="#06b6d4"/><circle cx="98" cy="190" r="7" fill="#1a1a1a"/></g>`,

  fappy: `<defs><linearGradient id="fp-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1740"/><stop offset=".65" stop-color="#b8472a"/><stop offset="1" stop-color="#f6a04d"/></linearGradient></defs>
    <rect width="240" height="240" fill="url(#fp-s)"/>
    <circle cx="120" cy="196" r="34" fill="#fbbf24" opacity=".5"/>
    <path d="M0 150 L30 144 L48 156 L56 240 H0 Z" fill="#2a1a14" ${S}/>
    <path d="M240 138 L204 132 L186 148 L180 240 H240 Z" fill="#2a1a14" ${S}/>
    <path d="M214 132 V108" stroke="${INK}" stroke-width="2.5"/><path d="M214 108 L230 114 L214 120 Z" fill="#84cc16" ${S}/>
    <path d="M34 142 Q64 70 104 104" fill="none" stroke="#ffd6aa" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/>
    ${hen(120, 112, 1.05, "flapUp", "#84cc16")}
    <g transform="translate(186 70) scale(1.1)"><path d="M-22 -2 Q-10 -12 0 -2 Q10 -12 22 -2 Q10 -4 4 2 L0 8 L-4 2 Q-10 -4 -22 -2 Z" fill="#1a0e07"/><path d="M-2 4 L0 10 L2 4 Z" fill="#fbbf24"/></g>`,

  recreate: `<rect width="240" height="240" fill="#2b0f10"/>
    <path d="M0 0 H240 V240 H0 Z" fill="none"/>
    <g stroke="#3a1718" stroke-width="1"><path d="M20 0 V240 M60 0 V240 M100 0 V240 M140 0 V240 M180 0 V240 M220 0 V240"/></g>
    <path d="M52 0 L20 170 H104 L72 0 Z" fill="#ffd6aa" opacity=".08"/><path d="M168 0 L136 170 H220 L188 0 Z" fill="#ffd6aa" opacity=".08"/>
    <g transform="translate(62 118) rotate(-2)"><rect x="-44" y="-44" width="88" height="80" fill="#c9962b" ${S}/><rect x="-35" y="-35" width="70" height="62" fill="#8fd3f4"/>
      <path d="M-35 14 L-14 -6 L0 6 L14 -10 L35 10 V27 H-35 Z" fill="#3d7a3a"/><circle cx="16" cy="-20" r="7" fill="#fbbf24"/><rect x="-35" y="-35" width="70" height="62" fill="none" ${S}/></g>
    <g transform="translate(178 120) rotate(4)"><rect x="-44" y="-44" width="88" height="80" fill="#c9962b" ${S}/><rect x="-35" y="-35" width="70" height="62" fill="#b38be0"/>
      <path d="M-35 16 L-16 -2 L-2 10 L16 -14 L35 12 V27 H-35 Z" fill="#5a9a35"/><circle cx="-14" cy="-20" r="8" fill="#ef4444"/><path d="M-6 6 q4 -4 10 0" stroke="#fff" stroke-width="2" fill="none"/><rect x="-35" y="-35" width="70" height="62" fill="none" ${S}/></g>
    <g font-family="Barlow Condensed" font-weight="800" font-size="11" letter-spacing="1.5" text-anchor="middle"><rect x="40" y="166" width="44" height="14" fill="#f4ead8" ${S} stroke-width="1.5"/><text x="62" y="177" fill="${INK}">REAL</text>
      <rect x="156" y="168" width="44" height="14" fill="#f4ead8" ${S} stroke-width="1.5"/><text x="178" y="179" fill="${INK}">FAKE</text></g>`,

  joust: `<defs><linearGradient id="js-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb35a"/><stop offset="1" stop-color="#ef7b45"/></linearGradient></defs>
    <rect width="240" height="240" fill="url(#js-s)"/>
    <rect y="150" width="240" height="16" fill="#1d8fb0"/><path d="M20 158 h20 M90 156 h24 M170 160 h18" stroke="#bde4ff" stroke-width="2" stroke-linecap="round"/>
    <path d="M0 166 Q60 158 120 166 T240 164 V240 H0 Z" fill="#e8b86a" ${S}/>
    <g ${S}><path d="M44 176 L50 132 M50 132 L40 110 M50 132 L60 110" stroke="#7a4217" stroke-width="7" fill="none"/></g>
    <path d="M40 112 Q46 128 60 112" fill="none" stroke="#ef4444" stroke-width="3"/>
    <path d="M58 108 Q96 44 132 72" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="3 6" stroke-linecap="round"/>
    ${hen(140, 82, 0.9, "flapDown", "#ec4899")}
    <g ${S}><rect x="166" y="150" width="46" height="10" fill="#b8742f"/><rect x="170" y="118" width="8" height="32" fill="#c98a45"/><rect x="200" y="118" width="8" height="32" fill="#c98a45"/>
      <rect x="164" y="110" width="50" height="8" fill="#b8742f"/><rect x="178" y="84" width="7" height="26" fill="#c98a45"/><rect x="194" y="84" width="7" height="26" fill="#c98a45"/><rect x="174" y="76" width="30" height="8" fill="#b8742f"/></g>
    ${hen(190, 62, 0.62, "stand", "#06b6d4")}`
};

export const GLYPHS = {
  schlonic: `<path d="M20 44 C8 36 14 16 30 18 C44 20 46 34 38 40 C32 45 26 47 20 44 Z"/><path d="M38 40 L47 49"/><circle cx="50" cy="47" r="3.2"/><circle cx="46" cy="53" r="3.2"/><path d="M3 22 H12 M1 30 H10 M5 38 H12"/>`,
  geo: `<path d="M32 54 C32 54 15 36 15 25 A17 17 0 0 1 49 25 C49 36 32 54 32 54 Z"/><circle cx="32" cy="25" r="6"/><path d="M18 60 H46"/>`,
  "emoji-charades": `<path d="M12 10 H52 A5 5 0 0 1 57 15 V38 A5 5 0 0 1 52 43 H28 L17 53 V43 H12 A5 5 0 0 1 7 38 V15 A5 5 0 0 1 12 10 Z"/><path d="M23 22 V24 M41 22 V24"/><path d="M22 31 Q32 39 42 31"/>`,
  "song-guess": `<circle cx="26" cy="36" r="20"/><circle cx="26" cy="36" r="6"/><path d="M26 22 A14 14 0 0 1 38 30"/><path d="M52 40 V10 L60 14"/><ellipse cx="48" cy="42" rx="5" ry="4"/>`,
  drawing: `<path d="M16 50 L44 22 L50 28 L22 56 Z"/><path d="M16 50 L12 60 L22 56"/><path d="M40 26 L46 32"/><path d="M6 18 C12 8 18 22 24 12 C28 6 32 14 34 10"/>`,
  fappy: `<circle cx="32" cy="36" r="10"/><path d="M28 32 L16 14 L36 27"/><path d="M42 34 L50 36 L42 39"/><path d="M4 60 Q12 44 20 46" stroke-dasharray="2 4"/>`,
  recreate: `<rect x="7" y="9" width="44" height="38"/><rect x="13" y="15" width="32" height="26"/><path d="M15 38 L24 28 L30 33 L36 26 L43 36"/><path d="M42 48 L57 60"/><path d="M40 46 L44 50"/>`,
  joust: `<path d="M32 60 V36 M32 36 L20 12 M32 36 L44 12"/><path d="M20 14 Q32 32 44 14"/><circle cx="32" cy="24" r="4"/>`
};

export const scene = (id, cls = "", aspect = "xMidYMid slice") =>
  `<svg class="${cls}" viewBox="0 0 240 240" preserveAspectRatio="${aspect}" aria-hidden="true">${SCENES[id]}</svg>`;
export const glyph = (id, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[id]}</svg>`;
export const pad = (n) => String(n).padStart(2, "0");
export const metaLine = (r) => `<p class="meta"><span class="num">${pad(r.n)}</span><span class="dot"></span><span class="label">${r.label}</span></p>`;

// Builds the stage around the cards; a direction supplies only renderCard.
export function mount(renderCard, { hint = "" } = {}) {
  document.body.insertAdjacentHTML("afterbegin", `<div class="tv"><section class="stage">
      <div class="ambient"></div><div class="flame"><i></i><i></i><i></i></div><div class="vignette"></div>
      <div class="header"><div class="eyebrow-row"><i></i><span class="eyebrow">Tonight</span><i></i></div><h1 class="wordmark">Wing Night</h1></div>
      <div class="rounds">${ROUNDS.map((r, i) => renderCard(r, i).replace("<article", `<article style="--d:${360 + i * 60}ms"`)).join("")}</div>
      <div class="floor"><span>the cast parades here</span></div>
    </section><div class="deck"></div></div>${hint ? `<p class="hint">${hint}</p>` : ""}`);
}
