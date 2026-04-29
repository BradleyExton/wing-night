import type { FormEvent } from "react";
import type { Player, RoomState, Team } from "@wingnight/shared";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { PlayersSurface } from "../../PlayersSurface";
import { TeamSetupSurface } from "../../TeamSetupSurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import * as styles from "./styles";

type SetupStageProps = {
  isLocked: boolean;
  roomState: RoomState | null;
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  nextTeamName: string;
  setupMutationsDisabled: boolean;
  autoAssignDisabled: boolean;
  assignmentDisabled: boolean;
  addPlayerDisabled: boolean;
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
  onNextTeamNameChange: (nextTeamName: string) => void;
  onCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAddPlayer: (name: string) => void;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
  onAutoAssignRemainingPlayers: () => void;
};

export const SetupStage = ({
  isLocked,
  roomState,
  players,
  teams,
  assignedTeamByPlayerId,
  teamNameByTeamId,
  nextTeamName,
  setupMutationsDisabled,
  autoAssignDisabled,
  assignmentDisabled,
  addPlayerDisabled,
  showOverridesButton,
  overridesShowBadge,
  onOpenOverrides,
  onNextTeamNameChange,
  onCreateTeamSubmit,
  onAddPlayer,
  onAssignPlayer,
  onAutoAssignRemainingPlayers
}: SetupStageProps): JSX.Element => {
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);
  const totalPlayers = players.length;
  const assignedPlayers = players.filter((player) => {
    return assignedTeamByPlayerId.has(player.id);
  }).length;
  const unassignedPlayers = totalPlayers - assignedPlayers;

  return (
    <>
      <StageHero roomState={roomState} teamNameByTeamId={teamNameByTeamId}>
        {isLocked && (
          <span className={styles.lockBadge}>
            {hostControlPanelCopy.setupLockedNoticeLabel}
          </span>
        )}
        <span className={styles.eyebrow}>{headerContext.phaseTitle}</span>
        <h1 className={styles.headline}>
          Build the <span className={styles.headlineAccent}>lineup.</span>
        </h1>
        <p className={styles.meta}>
          {totalPlayers === 0 ? (
            hostControlPanelCopy.teamSetupDescription
          ) : (
            <>
              <span className={styles.metaStrong}>{assignedPlayers}</span>
              {" of "}
              <span className={styles.metaStrong}>{totalPlayers}</span>
              {" players assigned. "}
              {unassignedPlayers > 0 && (
                <>
                  <span className={styles.metaStrong}>{unassignedPlayers}</span>
                  {" still need a home."}
                </>
              )}
            </>
          )}
        </p>
        {!isLocked && unassignedPlayers > 0 && (
          <div className={styles.heroActionRow}>
            <button
              type="button"
              className={styles.actionButton}
              disabled={autoAssignDisabled}
              onClick={onAutoAssignRemainingPlayers}
            >
              {hostControlPanelCopy.autoAssignRemainingPlayersButtonLabel}
            </button>
          </div>
        )}
      </StageHero>
      <ControlDeck
        showOverridesButton={showOverridesButton}
        overridesShowBadge={overridesShowBadge}
        onOpenOverrides={onOpenOverrides}
      >
        <TeamSetupSurface
          nextTeamName={nextTeamName}
          setupMutationsDisabled={setupMutationsDisabled}
          teams={teams}
          onNextTeamNameChange={onNextTeamNameChange}
          onCreateTeamSubmit={onCreateTeamSubmit}
        />
        <PlayersSurface
          mode="setup"
          players={players}
          teams={teams}
          assignedTeamByPlayerId={assignedTeamByPlayerId}
          assignmentDisabled={assignmentDisabled}
          addPlayerDisabled={addPlayerDisabled}
          onAssignPlayer={onAssignPlayer}
          onAddPlayer={onAddPlayer}
        />
      </ControlDeck>
    </>
  );
};
