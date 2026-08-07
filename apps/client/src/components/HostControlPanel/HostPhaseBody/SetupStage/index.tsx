import { useState } from "react";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { PlayersSurface } from "../../PlayersSurface";
import { TeamSetupSurface } from "../../TeamSetupSurface";
import { hostControlPanelCopy } from "../../copy";
import { selectHeaderContext } from "../../HostMiniRail/selectHeaderContext";
import { selectHostTeamMaps } from "../../selectHostTeamMaps";
import { createSetupHandlers } from "../../setupHandlers";
import { useHostHandlers } from "../../../../context/HostHandlersContext";
import { useHostRoomState } from "../../../../context/RoomStateContext";
import * as styles from "./styles";

type SetupStageProps = {
  isLocked: boolean;
};

export const SetupStage = ({ isLocked }: SetupStageProps): JSX.Element => {
  const roomState = useHostRoomState();
  const handlers = useHostHandlers();
  const [nextTeamName, setNextTeamName] = useState("");
  const { assignedTeamByPlayerId, teamNameByTeamId } = selectHostTeamMaps(roomState);
  const players = roomState?.players ?? [];
  const teams = roomState?.teams ?? [];
  const setupMutationsDisabled = handlers.onCreateTeam === undefined || isLocked;
  const addPlayerDisabled = handlers.onAddPlayer === undefined || isLocked;
  const assignmentDisabled = handlers.onAssignPlayer === undefined || isLocked;
  const autoAssignDisabled =
    handlers.onAutoAssignRemainingPlayers === undefined || isLocked;
  const {
    handleCreateTeamSubmit,
    handleAssignmentChange,
    handleAddPlayer,
    handleAutoAssignRemainingPlayers
  } = createSetupHandlers({
    hostMode: isLocked ? "setup_locked" : "setup",
    nextTeamName,
    onCreateTeam: handlers.onCreateTeam,
    onAddPlayer: handlers.onAddPlayer,
    onAssignPlayer: handlers.onAssignPlayer,
    onAutoAssignRemainingPlayers: handlers.onAutoAssignRemainingPlayers,
    setNextTeamName
  });
  const headerContext = selectHeaderContext(roomState, teamNameByTeamId);
  const totalPlayers = players.length;
  const assignedPlayers = players.filter((player) => {
    return assignedTeamByPlayerId.has(player.id);
  }).length;
  const unassignedPlayers = totalPlayers - assignedPlayers;

  return (
    <>
      <StageHero>
        {isLocked && (
          <span className={styles.lockBadge}>
            {hostControlPanelCopy.setupLockedNoticeLabel}
          </span>
        )}
        <span className={styles.eyebrow}>{headerContext.phaseTitle}</span>
        <h1 className={styles.headline}>
          {hostControlPanelCopy.setupHeadlineLead}{" "}
          <span className={styles.headlineAccent}>
            {hostControlPanelCopy.setupHeadlineAccent}
          </span>
        </h1>
        <p className={styles.meta}>
          {totalPlayers === 0 ? (
            hostControlPanelCopy.teamSetupDescription
          ) : (
            <>
              <span className={styles.metaStrong}>{assignedPlayers}</span>
              {hostControlPanelCopy.setupAssignedOfLabel}
              <span className={styles.metaStrong}>{totalPlayers}</span>
              {hostControlPanelCopy.setupPlayersAssignedLabel}
              {unassignedPlayers > 0 && (
                <>
                  <span className={styles.metaStrong}>{unassignedPlayers}</span>
                  {hostControlPanelCopy.setupUnassignedRemainderLabel}
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
              onClick={handleAutoAssignRemainingPlayers}
            >
              {hostControlPanelCopy.autoAssignRemainingPlayersButtonLabel}
            </button>
          </div>
        )}
      </StageHero>
      <ControlDeck>
        <TeamSetupSurface
          nextTeamName={nextTeamName}
          setupMutationsDisabled={setupMutationsDisabled}
          teams={teams}
          onNextTeamNameChange={setNextTeamName}
          onCreateTeamSubmit={handleCreateTeamSubmit}
        />
        <PlayersSurface
          mode="setup"
          players={players}
          teams={teams}
          assignedTeamByPlayerId={assignedTeamByPlayerId}
          assignmentDisabled={assignmentDisabled}
          addPlayerDisabled={addPlayerDisabled}
          onAssignPlayer={handleAssignmentChange}
          onAddPlayer={handleAddPlayer}
        />
      </ControlDeck>
    </>
  );
};
