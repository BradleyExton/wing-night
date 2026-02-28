import type { MinigameHostRendererProps } from "../index.js";

type ResolveUnsupportedActiveTeamNameOptions = Pick<
  MinigameHostRendererProps,
  "activeTeamName" | "minigameHostView" | "teamNameByTeamId"
> & {
  fallbackLabel: string;
};

export const resolveUnsupportedActiveTeamName = ({
  activeTeamName,
  minigameHostView,
  teamNameByTeamId,
  fallbackLabel
}: ResolveUnsupportedActiveTeamNameOptions): string => {
  const activeTurnTeamId = minigameHostView?.activeTurnTeamId;

  if (activeTurnTeamId !== null && activeTurnTeamId !== undefined) {
    return teamNameByTeamId.get(activeTurnTeamId) ?? fallbackLabel;
  }

  return activeTeamName ?? fallbackLabel;
};
