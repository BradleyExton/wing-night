import { MUSIC_VOLUME_DEFAULT, Phase } from "@wingnight/shared";
import { useState } from "react";

import { ControlDeck } from "../ControlDeck";
import { StageHero } from "../StageHero";
import { MusicControlsSurface } from "../../MusicControlsSurface";
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
  const { assignedTeamByPlayerId, teamNameByTeamId, teamThemeByTeamId } =
    selectHostTeamMaps(roomState);
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
        {/* One kicker: the lock is the news, so it replaces the phase title
            rather than stacking a pill over it. */}
        <span className={styles.eyebrow}>
          {isLocked ? hostControlPanelCopy.setupLockedNoticeLabel : headerContext.phaseTitle}
        </span>
        <h1 className={styles.headline}>
          {isLocked
            ? hostControlPanelCopy.setupLockedHeadlineLead
            : hostControlPanelCopy.setupHeadlineLead}{" "}
          <span className={styles.headlineAccent}>
            {isLocked
              ? hostControlPanelCopy.setupLockedHeadlineAccent
              : hostControlPanelCopy.setupHeadlineAccent}
          </span>
        </h1>
        <p className={styles.meta}>
          {isLocked ? (
            hostControlPanelCopy.headerPhaseDescription(Phase.INTRO)
          ) : totalPlayers === 0 ? (
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
        {!isLocked && (
          <div className={styles.heroActionRow}>
            {unassignedPlayers > 0 && (
              <button
                type="button"
                className={styles.actionButton}
                disabled={autoAssignDisabled}
                onClick={handleAutoAssignRemainingPlayers}
              >
                {hostControlPanelCopy.autoAssignRemainingPlayersButtonLabel}
              </button>
            )}
            {/* The night's other exit. A link rather than a phase action: the
                launcher is its own page, and nothing here mutates the room. */}
            <a className={styles.quickPlayLink} href={hostControlPanelCopy.quickPlayLinkHref}>
              {hostControlPanelCopy.quickPlayLinkLabel}
            </a>
          </div>
        )}
      </StageHero>
      <ControlDeck>
        <TeamSetupSurface
          nextTeamName={nextTeamName}
          setupMutationsDisabled={setupMutationsDisabled}
          teams={teams}
          teamThemeByTeamId={teamThemeByTeamId}
          onNextTeamNameChange={setNextTeamName}
          onCreateTeamSubmit={handleCreateTeamSubmit}
        />
        <PlayersSurface
          mode="setup"
          players={players}
          teams={teams}
          assignedTeamByPlayerId={assignedTeamByPlayerId}
          teamThemeByTeamId={teamThemeByTeamId}
          assignmentDisabled={assignmentDisabled}
          addPlayerDisabled={addPlayerDisabled}
          onAssignPlayer={handleAssignmentChange}
          onAddPlayer={handleAddPlayer}
        />
        {/* SETUP is where the lobby playlist plays, so this is where the host
            reaches for it — while people are arriving and the deck is not yet
            busy with a live round. */}
        <MusicControlsSurface
          musicPlayback={roomState?.musicPlayback ?? null}
          musicVolume={roomState?.musicVolume ?? MUSIC_VOLUME_DEFAULT}
          onPauseMusic={handlers.onPauseMusic}
          onResumeMusic={handlers.onResumeMusic}
          onSkipMusicTrack={handlers.onSkipMusicTrack}
          onPreviousMusicTrack={handlers.onPreviousMusicTrack}
          onSetMusicVolume={handlers.onSetMusicVolume}
        />
      </ControlDeck>
    </>
  );
};
