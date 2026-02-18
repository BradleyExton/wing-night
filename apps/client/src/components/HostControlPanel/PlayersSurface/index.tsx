import type { Player, Team } from "@wingnight/shared";

import { EatingPlayersSurface } from "./EatingPlayersSurface";
import { SetupPlayersSurface } from "./SetupPlayersSurface";
import * as styles from "./styles";

type PlayersSurfaceBaseProps = {
  players: Player[];
  assignedTeamByPlayerId: Map<string, string>;
};

export type SetupPlayersSurfaceProps = PlayersSurfaceBaseProps & {
  mode: "setup";
  teams: Team[];
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

export const PlayersSurface = (props: PlayersSurfaceProps): JSX.Element => {
  if (props.mode === "setup") {
    return (
      <div className={styles.surfaceRoot}>
        <SetupPlayersSurface {...props} />
      </div>
    );
  }

  return (
    <div className={styles.surfaceRoot}>
      <EatingPlayersSurface {...props} />
    </div>
  );
};
