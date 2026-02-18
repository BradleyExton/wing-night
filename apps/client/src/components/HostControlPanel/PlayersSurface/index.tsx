import type { Player, Team } from "@wingnight/shared";

import { EatingPlayersSurface } from "./EatingPlayersSurface";
import { SetupPlayersSurface } from "./SetupPlayersSurface";
import * as styles from "./styles";

type PlayersSurfaceBaseProps = {
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
};

export type SetupPlayersSurfaceProps = PlayersSurfaceBaseProps & {
  mode: "setup";
  assignmentDisabled: boolean;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
};

export type EatingPlayersSurfaceProps = PlayersSurfaceBaseProps & {
  mode: "eating";
  teamNameByTeamId: Map<string, string>;
  wingParticipationByPlayerId: Record<string, boolean>;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  participationDisabled: boolean;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
};

type PlayersSurfaceProps = SetupPlayersSurfaceProps | EatingPlayersSurfaceProps;

void styles;

export const PlayersSurface = (props: PlayersSurfaceProps): JSX.Element => {
  if (props.mode === "setup") {
    return <SetupPlayersSurface {...props} />;
  }

  return <EatingPlayersSurface {...props} />;
};
