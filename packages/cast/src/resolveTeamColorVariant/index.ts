import {
  TEAM_COLOR_TOKENS,
  type TeamColorToken,
  type TeamColorVariant
} from "@wingnight/shared";

const buildVariant = (token: TeamColorToken): TeamColorVariant => ({
  borderAccentClassName: `border-l-${token}/85`,
  dotAccentClassName: `bg-${token}`,
  characterFillClassName: `text-${token}`,
  splitColumnBgClassName: `bg-gradient-to-b from-${token}/15 to-${token}/5`,
  splitColumnLeadBgClassName: `bg-gradient-to-b from-${token}/30 to-${token}/10`,
  splitEdgeFullClassName: `bg-${token}`,
  splitEdgeMutedClassName: `bg-${token}/55`,
  rowAccentBgClassName: `bg-gradient-to-r from-${token}/15 to-transparent`,
  tintClassName: `[--tint:theme(colors.${token})]`
});

// Written out in full rather than built from `buildVariant` at module scope:
// Tailwind scans source for class LITERALS, so an interpolated fragment is never
// generated. `buildVariant` is the checked shape; this table is the truth.
const TEAM_COLOR_VARIANT_BY_TOKEN = {
  teamA: {
    borderAccentClassName: "border-l-teamA/85",
    dotAccentClassName: "bg-teamA",
    characterFillClassName: "text-teamA",
    splitColumnBgClassName: "bg-gradient-to-b from-teamA/15 to-teamA/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamA/30 to-teamA/10",
    splitEdgeFullClassName: "bg-teamA",
    splitEdgeMutedClassName: "bg-teamA/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamA/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamA)]"
  },
  teamB: {
    borderAccentClassName: "border-l-teamB/85",
    dotAccentClassName: "bg-teamB",
    characterFillClassName: "text-teamB",
    splitColumnBgClassName: "bg-gradient-to-b from-teamB/15 to-teamB/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamB/30 to-teamB/10",
    splitEdgeFullClassName: "bg-teamB",
    splitEdgeMutedClassName: "bg-teamB/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamB/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamB)]"
  },
  teamC: {
    borderAccentClassName: "border-l-teamC/85",
    dotAccentClassName: "bg-teamC",
    characterFillClassName: "text-teamC",
    splitColumnBgClassName: "bg-gradient-to-b from-teamC/15 to-teamC/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamC/30 to-teamC/10",
    splitEdgeFullClassName: "bg-teamC",
    splitEdgeMutedClassName: "bg-teamC/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamC/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamC)]"
  },
  teamD: {
    borderAccentClassName: "border-l-teamD/85",
    dotAccentClassName: "bg-teamD",
    characterFillClassName: "text-teamD",
    splitColumnBgClassName: "bg-gradient-to-b from-teamD/15 to-teamD/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamD/30 to-teamD/10",
    splitEdgeFullClassName: "bg-teamD",
    splitEdgeMutedClassName: "bg-teamD/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamD/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamD)]"
  },
  teamE: {
    borderAccentClassName: "border-l-teamE/85",
    dotAccentClassName: "bg-teamE",
    characterFillClassName: "text-teamE",
    splitColumnBgClassName: "bg-gradient-to-b from-teamE/15 to-teamE/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamE/30 to-teamE/10",
    splitEdgeFullClassName: "bg-teamE",
    splitEdgeMutedClassName: "bg-teamE/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamE/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamE)]"
  },
  teamF: {
    borderAccentClassName: "border-l-teamF/85",
    dotAccentClassName: "bg-teamF",
    characterFillClassName: "text-teamF",
    splitColumnBgClassName: "bg-gradient-to-b from-teamF/15 to-teamF/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamF/30 to-teamF/10",
    splitEdgeFullClassName: "bg-teamF",
    splitEdgeMutedClassName: "bg-teamF/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamF/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamF)]"
  },
  teamG: {
    borderAccentClassName: "border-l-teamG/85",
    dotAccentClassName: "bg-teamG",
    characterFillClassName: "text-teamG",
    splitColumnBgClassName: "bg-gradient-to-b from-teamG/15 to-teamG/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamG/30 to-teamG/10",
    splitEdgeFullClassName: "bg-teamG",
    splitEdgeMutedClassName: "bg-teamG/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamG/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamG)]"
  },
  teamH: {
    borderAccentClassName: "border-l-teamH/85",
    dotAccentClassName: "bg-teamH",
    characterFillClassName: "text-teamH",
    splitColumnBgClassName: "bg-gradient-to-b from-teamH/15 to-teamH/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamH/30 to-teamH/10",
    splitEdgeFullClassName: "bg-teamH",
    splitEdgeMutedClassName: "bg-teamH/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamH/15 to-transparent",
    tintClassName: "[--tint:theme(colors.teamH)]"
  }
} as const satisfies Record<TeamColorToken, TeamColorVariant>;

/** The class bundle for one authored or resolved token. */
export const resolveTeamColorVariantByToken = (token: TeamColorToken): TeamColorVariant => {
  return TEAM_COLOR_VARIANT_BY_TOKEN[token];
};

/** Guards the literal table above against drifting from the one shape the type describes. */
export const buildTeamColorVariantForTest = buildVariant;

const hashTeamId = (teamId: string): number => {
  let hash = 0;

  for (let index = 0; index < teamId.length; index += 1) {
    hash = (hash * 31 + teamId.charCodeAt(index)) >>> 0;
  }

  return hash;
};

/**
 * The token a team id hashes to — the last resort in the theme's colour
 * precedence (docs/team-identity.md), and the whole story for surfaces that
 * have not moved onto the theme yet.
 */
export const resolveHashedTeamColorToken = (teamId: string): TeamColorToken => {
  if (teamId.length === 0) {
    return TEAM_COLOR_TOKENS[0];
  }

  return TEAM_COLOR_TOKENS[hashTeamId(teamId) % TEAM_COLOR_TOKENS.length];
};

export const resolveTeamColorVariant = (teamId: string): TeamColorVariant => {
  return TEAM_COLOR_VARIANT_BY_TOKEN[resolveHashedTeamColorToken(teamId)];
};

/** A player with no seat is not any team's colour; the cast's warm neutral is theirs. */
export const UNSEATED_CHARACTER_FILL_CLASS_NAME = "text-mutedWarm";

/**
 * The `text-*` class a bird takes to be painted in its team's colour — the same index its
 * standings dot and row edge use, because it comes off the same table. Surfaces that draw a bird
 * for a player who may not be seated (JOUST's lane racks up whoever is in the room) want this
 * rather than the whole variant.
 */
export const resolveCharacterFillClassName = (teamId: string | null): string => {
  if (teamId === null || teamId.length === 0) {
    return UNSEATED_CHARACTER_FILL_CLASS_NAME;
  }

  return resolveTeamColorVariant(teamId).characterFillClassName;
};
