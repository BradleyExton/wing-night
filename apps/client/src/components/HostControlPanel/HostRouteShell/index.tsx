import { useEffect, useId, useMemo, useState } from "react";
import { type RoomState } from "@wingnight/shared";

import { HostControlPanel, type HostControlPanelProps } from "../index";
import { OverrideActionsSurface } from "../OverrideActionsSurface";
import { OverrideDock } from "../OverrideDock";
import { resolveOrderedTeams } from "../roomTeamSelectors";
import { ScoreOverrideSurface } from "../ScoreOverrideSurface";
import { selectOverrideDockContext } from "../selectOverrideDockContext";
import { TurnOrderSurface } from "../TurnOrderSurface";
import * as styles from "./styles";

export type HostRouteShellProps = HostControlPanelProps & {
  onReorderTurnOrder?: (teamIds: string[]) => void;
  onSkipTurnBoundary?: () => void;
  onAdjustTeamScore?: (teamId: string, delta: number) => void;
  onResetGame?: () => void;
  onRedoLastMutation?: () => void;
};

const EMPTY_TEAMS: RoomState["teams"] = [];

export const HostRouteShell = ({
  roomState,
  onNextPhase,
  onCreateTeam,
  onAssignPlayer,
  onSetWingParticipation,
  onRecordTriviaAttempt,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer,
  onReorderTurnOrder,
  onSkipTurnBoundary,
  onAdjustTeamScore,
  onResetGame,
  onRedoLastMutation
}: HostRouteShellProps): JSX.Element => {
  const [isOverrideDockOpen, setIsOverrideDockOpen] = useState(false);
  const overrideDockPanelId = useId();
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const orderedTeams = useMemo(() => resolveOrderedTeams(roomState), [roomState]);
  const overrideDockContext = useMemo(() => {
    return selectOverrideDockContext(roomState);
  }, [roomState]);

  useEffect(() => {
    if (!overrideDockContext.isVisible && isOverrideDockOpen) {
      setIsOverrideDockOpen(false);
    }
  }, [isOverrideDockOpen, overrideDockContext.isVisible]);

  return (
    <>
      <HostControlPanel
        roomState={roomState}
        onNextPhase={onNextPhase}
        onCreateTeam={onCreateTeam}
        onAssignPlayer={onAssignPlayer}
        onSetWingParticipation={onSetWingParticipation}
        onRecordTriviaAttempt={onRecordTriviaAttempt}
        onPauseTimer={onPauseTimer}
        onResumeTimer={onResumeTimer}
        onExtendTimer={onExtendTimer}
      />

      {overrideDockContext.isVisible && (
        <OverrideDock
          isOpen={isOverrideDockOpen}
          showBadge={overrideDockContext.showBadge}
          panelId={overrideDockPanelId}
          onOpen={(): void => {
            setIsOverrideDockOpen(true);
          }}
          onClose={(): void => {
            setIsOverrideDockOpen(false);
          }}
        >
          <div className={styles.overridePanelContent}>
            <OverrideActionsSurface
              onSkipTurnBoundary={onSkipTurnBoundary}
              showSkipTurnBoundaryAction={overrideDockContext.showSkipTurnBoundaryAction}
              onRedoLastMutation={onRedoLastMutation}
              showRedoLastMutationAction={overrideDockContext.showRedoLastMutationAction}
              onResetGame={onResetGame}
              showResetGameAction={overrideDockContext.showResetGameAction}
            />
            <TurnOrderSurface
              orderedTeams={orderedTeams}
              isEditable={overrideDockContext.isTurnOrderEditable}
              onReorderTurnOrder={onReorderTurnOrder}
            />
            <ScoreOverrideSurface teams={teams} onAdjustTeamScore={onAdjustTeamScore} />
          </div>
        </OverrideDock>
      )}
    </>
  );
};
