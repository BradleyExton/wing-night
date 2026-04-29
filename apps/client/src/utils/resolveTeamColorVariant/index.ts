type TeamColorVariant = {
  borderAccentClassName: string;
  dotAccentClassName: string;
  splitColumnBgClassName: string;
  splitColumnLeadBgClassName: string;
  splitEdgeFullClassName: string;
  splitEdgeMutedClassName: string;
  rowAccentBgClassName: string;
};

const TEAM_COLOR_VARIANTS = [
  {
    borderAccentClassName: "border-l-teamA/85",
    dotAccentClassName: "bg-teamA",
    splitColumnBgClassName: "bg-gradient-to-b from-teamA/15 to-teamA/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamA/30 to-teamA/10",
    splitEdgeFullClassName: "bg-teamA",
    splitEdgeMutedClassName: "bg-teamA/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamA/15 to-transparent"
  },
  {
    borderAccentClassName: "border-l-teamB/85",
    dotAccentClassName: "bg-teamB",
    splitColumnBgClassName: "bg-gradient-to-b from-teamB/15 to-teamB/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamB/30 to-teamB/10",
    splitEdgeFullClassName: "bg-teamB",
    splitEdgeMutedClassName: "bg-teamB/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamB/15 to-transparent"
  },
  {
    borderAccentClassName: "border-l-teamC/85",
    dotAccentClassName: "bg-teamC",
    splitColumnBgClassName: "bg-gradient-to-b from-teamC/15 to-teamC/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamC/30 to-teamC/10",
    splitEdgeFullClassName: "bg-teamC",
    splitEdgeMutedClassName: "bg-teamC/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamC/15 to-transparent"
  },
  {
    borderAccentClassName: "border-l-teamD/85",
    dotAccentClassName: "bg-teamD",
    splitColumnBgClassName: "bg-gradient-to-b from-teamD/15 to-teamD/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamD/30 to-teamD/10",
    splitEdgeFullClassName: "bg-teamD",
    splitEdgeMutedClassName: "bg-teamD/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamD/15 to-transparent"
  },
  {
    borderAccentClassName: "border-l-teamE/85",
    dotAccentClassName: "bg-teamE",
    splitColumnBgClassName: "bg-gradient-to-b from-teamE/15 to-teamE/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamE/30 to-teamE/10",
    splitEdgeFullClassName: "bg-teamE",
    splitEdgeMutedClassName: "bg-teamE/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamE/15 to-transparent"
  },
  {
    borderAccentClassName: "border-l-teamF/85",
    dotAccentClassName: "bg-teamF",
    splitColumnBgClassName: "bg-gradient-to-b from-teamF/15 to-teamF/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamF/30 to-teamF/10",
    splitEdgeFullClassName: "bg-teamF",
    splitEdgeMutedClassName: "bg-teamF/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamF/15 to-transparent"
  },
  {
    borderAccentClassName: "border-l-teamG/85",
    dotAccentClassName: "bg-teamG",
    splitColumnBgClassName: "bg-gradient-to-b from-teamG/15 to-teamG/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamG/30 to-teamG/10",
    splitEdgeFullClassName: "bg-teamG",
    splitEdgeMutedClassName: "bg-teamG/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamG/15 to-transparent"
  },
  {
    borderAccentClassName: "border-l-teamH/85",
    dotAccentClassName: "bg-teamH",
    splitColumnBgClassName: "bg-gradient-to-b from-teamH/15 to-teamH/5",
    splitColumnLeadBgClassName: "bg-gradient-to-b from-teamH/30 to-teamH/10",
    splitEdgeFullClassName: "bg-teamH",
    splitEdgeMutedClassName: "bg-teamH/55",
    rowAccentBgClassName: "bg-gradient-to-r from-teamH/15 to-transparent"
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
