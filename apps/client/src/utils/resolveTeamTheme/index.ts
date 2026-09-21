import {
  resolveHashedTeamColorToken,
  resolveTeamApparel,
  resolveTeamColorVariantByToken,
  resolveTeamDance,
  resolveTeamSilhouette
} from "@wingnight/cast";
import {
  resolveGenreKey,
  TEAM_COLOR_TOKENS,
  type EmblemId,
  type EntranceId,
  type GenreKey,
  type Team,
  type TeamColorToken,
  type TeamTheme,
  type TextureId,
  type WordmarkTreatment
} from "@wingnight/shared";

// The kit each genre key expands to (docs/team-identity.md, "The kit"). Colour
// is a DEFAULT here, not the answer: an authored `color` on the team wins, and
// the collision pass below can move it. Apparel is not in this table because
// the cast already owns it (`resolveTeamApparel`, keyed off the same
// vocabulary); the theme folds it in.
type GenreKit = {
  defaultColorToken: TeamColorToken | null;
  fontClassName: string;
  fontSrc: string | null;
  wordmark: WordmarkTreatment;
  emblem: EmblemId | null;
  texture: TextureId | null;
  entrance: EntranceId;
};

const GENRE_KITS: Record<GenreKey, GenreKit> = {
  metal: {
    defaultColorToken: "teamD",
    fontClassName: "font-genre-metal",
    fontSrc: "/fonts/metal-mania/metal-mania-latin.woff2",
    wordmark: "chrome",
    emblem: "skull-hen",
    texture: "lightning",
    entrance: "slam"
  },
  punk: {
    // Not `teamD` any more: that slot is chrome, and a punk team inheriting
    // metal's silver by default put the two genres most likely to share a
    // party on one colour before the collision pass ever ran. Neon lime is
    // punk's own.
    defaultColorToken: "teamC",
    fontClassName: "font-genre-punk",
    fontSrc: "/fonts/bangers/bangers-latin.woff2",
    wordmark: "torn",
    emblem: "safety-pin",
    texture: "torn",
    entrance: "rip"
  },
  rock: {
    defaultColorToken: "teamA",
    fontClassName: "font-genre-rock",
    fontSrc: "/fonts/anton/anton-latin.woff2",
    wordmark: "torn",
    emblem: "pick",
    texture: "torn",
    entrance: "rip"
  },
  pop: {
    defaultColorToken: "teamH",
    fontClassName: "font-genre-pop",
    fontSrc: "/fonts/fredoka/fredoka-700-latin.woff2",
    wordmark: "candy",
    emblem: "star-mic",
    texture: "confetti",
    entrance: "bounce"
  },
  country: {
    defaultColorToken: "teamE",
    fontClassName: "font-genre-country",
    fontSrc: "/fonts/rye/rye-latin.woff2",
    wordmark: "rope",
    emblem: "hat-horseshoe",
    texture: "woodgrain",
    entrance: "swing"
  },
  disco: {
    defaultColorToken: "teamB",
    fontClassName: "font-genre-disco",
    fontSrc: "/fonts/monoton/monoton-latin.woff2",
    wordmark: "neon",
    emblem: "mirrorball",
    texture: "lightdots",
    entrance: "spin"
  },
  hiphop: {
    defaultColorToken: "teamG",
    fontClassName: "font-genre-hiphop",
    fontSrc: "/fonts/permanent-marker/permanent-marker-latin.woff2",
    wordmark: "drip",
    emblem: "boombox",
    texture: "spray",
    entrance: "drop"
  },
  electronic: {
    defaultColorToken: "teamF",
    fontClassName: "font-genre-electronic",
    fontSrc: "/fonts/orbitron/orbitron-800-latin.woff2",
    wordmark: "scanline",
    emblem: "waveform",
    texture: "grid",
    entrance: "glitch"
  },
  classical: {
    // Displaced from `teamC` by punk. Nine genres over eight tokens means one
    // pair shares a default, and rock-plus-classical is the pair least likely
    // to sit in one room; the collision pass parts them if it happens.
    defaultColorToken: "teamA",
    fontClassName: "font-genre-classical",
    fontSrc: "/fonts/playfair-display/playfair-display-900-latin.woff2",
    wordmark: "plain",
    emblem: "keys",
    texture: null,
    entrance: "beat"
  },
  // A real kit, not an error: house sans, no emblem, no texture, the existing
  // reveal — a team with no genre renders exactly what it renders today.
  none: {
    defaultColorToken: null,
    fontClassName: "font-sans",
    fontSrc: null,
    wordmark: "plain",
    emblem: null,
    texture: null,
    entrance: "beat"
  }
};

// Colour precedence, first hit wins: the authored `color`, the genre default,
// the id hash every surface used before the kit existed.
const resolvePreferredColorToken = (team: Team): TeamColorToken => {
  return (
    team.color ??
    GENRE_KITS[resolveGenreKey(team.genre)].defaultColorToken ??
    resolveHashedTeamColorToken(team.id)
  );
};

// The collision pass: a token an earlier team already holds moves this team to
// the next free one in A–H order, wrapping, so two teams never share a colour
// while eight or fewer exist. Past eight there is nothing free and the
// preferred token stands.
const claimColorToken = (
  preferred: TeamColorToken,
  taken: ReadonlySet<TeamColorToken>
): TeamColorToken => {
  if (!taken.has(preferred)) {
    return preferred;
  }

  const start = TEAM_COLOR_TOKENS.indexOf(preferred);

  for (let step = 1; step < TEAM_COLOR_TOKENS.length; step += 1) {
    const candidate = TEAM_COLOR_TOKENS[(start + step) % TEAM_COLOR_TOKENS.length];

    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  return preferred;
};

const buildTeamTheme = (team: Team, colorToken: TeamColorToken): TeamTheme => {
  const genre = resolveGenreKey(team.genre);
  const kit = GENRE_KITS[genre];

  return {
    genre,
    colorToken,
    colorVariant: resolveTeamColorVariantByToken(colorToken),
    fontClassName: kit.fontClassName,
    wordmark: kit.wordmark,
    emblem: kit.emblem,
    texture: kit.texture,
    entrance: kit.entrance,
    apparel: resolveTeamApparel(team),
    silhouette: resolveTeamSilhouette(team),
    dance: resolveTeamDance(team)
  };
};

/**
 * One theme per team, keyed by id, resolved in seating order so the colour
 * collision pass is deterministic. This is the map every surface reads
 * (`teamThemeById`); no surface calls the resolver on its own.
 */
export const resolveTeamThemeById = (teams: readonly Team[]): Map<string, TeamTheme> => {
  const taken = new Set<TeamColorToken>();
  const themeById = new Map<string, TeamTheme>();

  for (const team of teams) {
    const colorToken = claimColorToken(resolvePreferredColorToken(team), taken);
    taken.add(colorToken);
    themeById.set(team.id, buildTeamTheme(team, colorToken));
  }

  return themeById;
};

/**
 * The theme for one team among its seating. A team not in the list is themed
 * on its own, which is the right answer for a fixture or a preview and the
 * wrong one for a live surface — those read the map.
 */
export const resolveTeamTheme = (
  team: Team,
  teamsInSeatingOrder: readonly Team[] = []
): TeamTheme => {
  return (
    resolveTeamThemeById(teamsInSeatingOrder).get(team.id) ??
    buildTeamTheme(team, resolvePreferredColorToken(team))
  );
};

/**
 * The font files a roster will draw with, deduplicated, for `DisplayBoard` to
 * preload — a face that arrives after the headline is painted flashes the TV.
 */
export const resolveGenreFontSrcs = (teams: ReadonlyArray<Pick<Team, "genre">>): string[] => {
  const fontSrcs = new Set<string>();

  for (const team of teams) {
    const fontSrc = GENRE_KITS[resolveGenreKey(team.genre)].fontSrc;

    if (fontSrc !== null) {
      fontSrcs.add(fontSrc);
    }
  }

  return [...fontSrcs];
};
