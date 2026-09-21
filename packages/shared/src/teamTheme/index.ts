// The team identity kit's vocabulary (docs/team-identity.md). The TYPES live
// here so a theme can cross the package boundary — the client resolves it, the
// minigame contract will carry it — while the resolver, the fonts and the
// drawings stay in the client and the cast.

/** The eight identity accents, in the order the collision pass walks them. */
export const TEAM_COLOR_TOKENS = [
  "teamA",
  "teamB",
  "teamC",
  "teamD",
  "teamE",
  "teamF",
  "teamG",
  "teamH"
] as const;
export type TeamColorToken = (typeof TEAM_COLOR_TOKENS)[number];

export const isTeamColorToken = (value: unknown): value is TeamColorToken => {
  return (
    typeof value === "string" &&
    (TEAM_COLOR_TOKENS as readonly string[]).includes(value)
  );
};

/**
 * The class bundle a team token expands to. One row per token, authored in the
 * cast so Tailwind sees every class literally; a surface picks the key it needs
 * (dot, edge, column fill, bird fill) and never composes a class from a token.
 */
export type TeamColorVariant = {
  borderAccentClassName: string;
  dotAccentClassName: string;
  characterFillClassName: string;
  splitColumnBgClassName: string;
  splitColumnLeadBgClassName: string;
  splitEdgeFullClassName: string;
  splitEdgeMutedClassName: string;
  rowAccentBgClassName: string;
  /** Sets `--tint` to the token's colour, which every wordmark and texture rule keys off. */
  tintClassName: string;
};

/** What a team's birds wear on top of their colour; drawn by the cast's `Apparel`. */
// `collar` was removed 2026-09-21: a dark band slung under a chin with studs on
// it read as a necklace rather than as metal, and metal is shaped now, not
// dressed (`resolveTeamSilhouette`).
export const CHARACTER_APPARELS = ["hat", "shades", "medallion"] as const;
export type CharacterApparel = (typeof CHARACTER_APPARELS)[number];

/**
 * The shape a genre gives the bird ITSELF, which is the genre's primary carrier
 * — a prop is a few pixels of a 76px bird, but a silhouette is the first thing
 * the room reads. The three sit on one axis, spiky at one end and squat at the
 * other, so a new genre is placed on it rather than drawn from scratch:
 *
 * - `spiky`    jagged comb, pointed tail, cut feather edges, dorsal ridge
 * - `broody`   a hen settled low, belly near the floor, legs all but gone
 * - `preener`  tall and chesty, high sweeping sickle tail, long legs
 *
 * A genre with no entry keeps the stock bird, whose body, comb and tail are
 * hashed from the player's own name. Pop is deliberately one of those: "smooth,
 * round, upright" describes the bird already shipping, so pop is the ORIGIN of
 * the axis rather than a point on it, and it carries its genre in motion
 * (`TeamTheme.dance`) instead.
 */
export const CHARACTER_SILHOUETTES = ["spiky", "broody", "preener"] as const;
export type CharacterSilhouette = (typeof CHARACTER_SILHOUETTES)[number];

/** How a team's birds move on the beat, when the genre — not the player — picks. */
export const CHARACTER_DANCES = ["bounce", "headbang", "flap", "shuffle"] as const;
export type CharacterDance = (typeof CHARACTER_DANCES)[number];

export const GENRE_KEYS = [
  "metal",
  "punk",
  "rock",
  "pop",
  "country",
  "disco",
  "hiphop",
  "electronic",
  "classical",
  "none"
] as const;
export type GenreKey = (typeof GENRE_KEYS)[number];

export const WORDMARK_TREATMENTS = [
  "chrome",
  "candy",
  "rope",
  "neon",
  "torn",
  "drip",
  "scanline",
  "plain"
] as const;
export type WordmarkTreatment = (typeof WORDMARK_TREATMENTS)[number];

export const EMBLEM_IDS = [
  "skull-hen",
  "star-mic",
  "hat-horseshoe",
  "mirrorball",
  "safety-pin",
  "pick",
  "boombox",
  "waveform",
  "keys"
] as const;
export type EmblemId = (typeof EMBLEM_IDS)[number];

export const TEXTURE_IDS = [
  "lightning",
  "confetti",
  "woodgrain",
  "lightdots",
  "torn",
  "spray",
  "grid"
] as const;
export type TextureId = (typeof TEXTURE_IDS)[number];

export const ENTRANCE_IDS = [
  "slam",
  "bounce",
  "swing",
  "spin",
  "rip",
  "drop",
  "glitch",
  "beat"
] as const;
export type EntranceId = (typeof ENTRANCE_IDS)[number];

/** Everything a surface needs to render one team as its genre. Pure data, no DOM. */
export type TeamTheme = {
  genre: GenreKey;
  colorToken: TeamColorToken;
  colorVariant: TeamColorVariant;
  /** A Tailwind font token, e.g. `font-genre-metal`. */
  fontClassName: string;
  wordmark: WordmarkTreatment;
  emblem: EmblemId | null;
  texture: TextureId | null;
  entrance: EntranceId;
  apparel: CharacterApparel | undefined;
  /** The bird's own shape; `undefined` keeps the stock, player-hashed bird. */
  silhouette: CharacterSilhouette | undefined;
  /** Overrides the player's own hashed dance; `undefined` leaves it to them. */
  dance: CharacterDance | undefined;
};

// `genre` stays free text in teams.json; this is the one place it becomes a
// key. Case-insensitive keyword containment, first match wins, in this order —
// `punk` sits before `rock` so "punk rock" is punk. Anything unmatched, or no
// genre at all, is the real `none` kit rather than an error.
const GENRE_KEYWORDS: ReadonlyArray<readonly [GenreKey, readonly string[]]> = [
  ["metal", ["metal"]],
  ["punk", ["punk"]],
  ["rock", ["rock", "grunge"]],
  ["pop", ["pop"]],
  ["country", ["country", "folk", "bluegrass"]],
  ["disco", ["disco", "funk"]],
  ["hiphop", ["hip hop", "hip-hop", "hiphop", "rap"]],
  ["electronic", ["electronic", "edm", "techno", "house", "synth"]],
  ["classical", ["classical", "jazz", "opera"]]
];

export const resolveGenreKey = (genre: string | undefined): GenreKey => {
  const normalizedGenre = genre?.trim().toLowerCase() ?? "";

  if (normalizedGenre === "") {
    return "none";
  }

  const match = GENRE_KEYWORDS.find(([, keywords]) =>
    keywords.some((keyword) => normalizedGenre.includes(keyword))
  );

  return match?.[0] ?? "none";
};
