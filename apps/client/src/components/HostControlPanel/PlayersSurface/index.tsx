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
  addPlayerDisabled: boolean;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
  onAddPlayer: (name: string) => void;
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

// The deck-group shell is shared by both modes, so it lives here rather than being
// duplicated in each variant; the variants render the head and rows for their mode.
export const PlayersSurface = (props: PlayersSurfaceProps): JSX.Element => {
  return (
    <section className={styles.group}>
      {props.mode === "setup" ? (
        <SetupPlayersSurface {...props} />
      ) : (
        <EatingPlayersSurface {...props} />
      )}
    </section>
  );
};
