import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/cast/src/**/*.{ts,tsx}",
    "../../packages/surface/src/**/*.{ts,tsx}",
    "../../packages/minigames/*/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      // One display face per genre (docs/team-identity.md, "Typography"). The
      // files are bundled under public/fonts and declared in index.css; the
      // house sans stays the fallback so a name still renders before the face
      // has loaded. `none` uses Tailwind's own `font-sans`.
      fontFamily: {
        "genre-metal": ['"Metal Mania"', "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-punk": ["Bangers", "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-rock": ["Anton", "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-pop": ["Fredoka", "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-country": ["Rye", "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-disco": ["Monoton", "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-hiphop": ['"Permanent Marker"', "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-electronic": ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
        "genre-classical": ['"Playfair Display"', "ui-sans-serif", "system-ui", "sans-serif"],
        // The TV marquee's two faces, by ROLE rather than by genre: the neon
        // kicker is Monoton and the team name is Anton on every game, whatever
        // the team's own face is (DESIGN.md §2.2D). Naming them `genre-disco`
        // and `genre-rock` in the marquee would make a chrome decision look
        // like a team's identity leaking.
        "marquee-title": ["Monoton", "ui-sans-serif", "system-ui", "sans-serif"],
        "marquee-name": ["Anton", "ui-sans-serif", "system-ui", "sans-serif"],
        // The show's scoreboard face: every clock, score and point. Condensed with
        // a plain zero; its figures are tabular only with `tabular-nums`, so the
        // class never appears without it (DESIGN.md §4).
        score: ['"Barlow Condensed"', "ui-sans-serif", "system-ui", "sans-serif"],
        // The show's speaking voice, always italic: an answer revealed, a name
        // called up, a game's title card (DESIGN.md §4).
        voice: ['"Playfair Display"', "ui-serif", "Georgia", "serif"]
      },
      colors: {
        bg: "#121212",
        surface: "#1c1c1c",
        surfaceAlt: "#242424",
        text: "#ffffff",
        muted: "#a3a3a3",
        // Warm-neutral counterparts to `muted`, for label text sitting on the flame-lit
        // stage surfaces where a cool grey reads as wrong against the orange ambient.
        mutedWarm: "#b3a89a",
        mutedWarmDim: "#6b6157",
        ember: "#ffb35a",
        // The hearth's light, as the deck and the lobby glass catch it: `glow` is the warm
        // wash along a lit edge, `glowHot` the near-white nosing where the light is strongest.
        // Light only — a wash, a sheen, an inset highlight — never a fill or a text colour.
        glow: "#ffd6aa",
        glowHot: "#ffecd6",
        // The lobby's warm glass (round cards, the now-playing and status pills), laid over
        // the flame at high alpha so the fire reads through it.
        hearthGlass: "#2e1609",
        // Pure black, for the dark half of light: drop shadows, vignettes, scrims. Never a
        // surface — `bg` is the darkest thing the show paints.
        shade: "#000000",
        primary: "#f97316",
        heat: "#ef4444",
        success: "#22c55e",
        danger: "#dc2626",
        gold: "#fbbf24",
        // The eight identity accents (docs/team-identity.md, "Colour"). They
        // have to separate from EACH OTHER and from the reserved semantics
        // above: a team the room reads as `gold` looks like it is winning,
        // and one it reads as `heat` looks like a warning.
        teamA: "#f97316",
        teamB: "#06b6d4",
        teamC: "#84cc16",
        // Chrome, not a hue: the slot metal defaults to, because metal's own
        // palette is the absence of colour. Also the only accent that can
        // never collide with a hue, which is why it holds the genre that
        // used to sit 15 away from `heat`.
        teamD: "#d9dee6",
        teamE: "#d98324",
        teamF: "#14b8a6",
        teamG: "#60a5fa",
        teamH: "#ec4899"
      }
    }
  },
  plugins: []
};

export default config;
