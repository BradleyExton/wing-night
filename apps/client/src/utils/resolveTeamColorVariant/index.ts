type TeamColorVariant = {
  borderAccentClassName: string;
  dotAccentClassName: string;
};

const TEAM_COLOR_VARIANTS = [
  {
    borderAccentClassName: "border-l-teamA/85",
    dotAccentClassName: "bg-teamA"
  },
  {
    borderAccentClassName: "border-l-teamB/85",
    dotAccentClassName: "bg-teamB"
  },
  {
    borderAccentClassName: "border-l-teamC/85",
    dotAccentClassName: "bg-teamC"
  },
  {
    borderAccentClassName: "border-l-teamD/85",
    dotAccentClassName: "bg-teamD"
  },
  {
    borderAccentClassName: "border-l-teamE/85",
    dotAccentClassName: "bg-teamE"
  },
  {
    borderAccentClassName: "border-l-teamF/85",
    dotAccentClassName: "bg-teamF"
  },
  {
    borderAccentClassName: "border-l-teamG/85",
    dotAccentClassName: "bg-teamG"
  },
  {
    borderAccentClassName: "border-l-teamH/85",
    dotAccentClassName: "bg-teamH"
  }
] as const satisfies readonly TeamColorVariant[];

const hashTeamId = (teamId: string): number => {
  let hash = 0;

  for (let index = 0; index < teamId.length; index += 1) {
    hash = (hash * 31 + teamId.charCodeAt(index)) >>> 0;
  }

  return hash;
};

export const resolveTeamColorVariant = (teamId: string): TeamColorVariant => {
  if (teamId.length === 0) {
    return TEAM_COLOR_VARIANTS[0];
  }

  const variantIndex = hashTeamId(teamId) % TEAM_COLOR_VARIANTS.length;

  return TEAM_COLOR_VARIANTS[variantIndex];
};
