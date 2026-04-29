import type { FormEvent } from "react";
import type { SerializableValue } from "@wingnight/minigames-core";
import {
  type MinigameHostView,
  type MinigameType,
  type Player,
  type RoomState,
  type Team
} from "@wingnight/shared";

import { CompactStage } from "./CompactStage";
import { EatingStage } from "./EatingStage";
import { MinigameIntroStage } from "./MinigameIntroStage";
import { MinigamePlayTakeover } from "./MinigamePlayTakeover";
import { SetupStage } from "./SetupStage";
import { WaitingStage } from "./WaitingStage";
import type { HostRenderMode } from "../resolveHostRenderMode";
import * as styles from "./styles";

type HostPhaseBodyProps = {
  hostMode: HostRenderMode;
  roomState: RoomState | null;
  players: Player[];
  teams: Team[];
  assignedTeamByPlayerId: Map<string, string>;
  teamNameByTeamId: Map<string, string>;
  wingParticipationByPlayerId: Record<string, boolean>;
  activeRoundTeamId: string | null;
  activeRoundTeamName: string;
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  nextTeamName: string;
  setupMutationsDisabled: boolean;
  autoAssignDisabled: boolean;
  assignmentDisabled: boolean;
  addPlayerDisabled: boolean;
  participationDisabled: boolean;
  canDispatchMinigameAction: boolean;
  sortedStandings: Team[];
  timer: RoomState["timer"];
  showOverridesButton: boolean;
  overridesShowBadge: boolean;
  onOpenOverrides: () => void;
  onNextTeamNameChange: (nextTeamName: string) => void;
  onCreateTeamSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAddPlayer: (name: string) => void;
  onAssignPlayer: (playerId: string, selectedTeamId: string) => void;
  onAutoAssignRemainingPlayers: () => void;
  onSetWingParticipation: (playerId: string, didEat: boolean) => void;
  onPauseTimer?: () => void;
  onResumeTimer?: () => void;
  onExtendTimer?: (additionalSeconds: number) => void;
  onDispatchMinigameAction: (
    actionType: string,
    actionPayload: SerializableValue
  ) => void;
};

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

export const HostPhaseBody = (props: HostPhaseBodyProps): JSX.Element | null => {
  switch (props.hostMode) {
    case "waiting":
      return (
        <div className={styles.mainSplit}>
          <WaitingStage
            roomState={props.roomState}
            teamNameByTeamId={props.teamNameByTeamId}
            showOverridesButton={props.showOverridesButton}
            overridesShowBadge={props.overridesShowBadge}
            onOpenOverrides={props.onOpenOverrides}
          />
        </div>
      );

    case "setup":
    case "setup_locked":
      return (
        <div className={styles.mainSplit}>
          <SetupStage
            isLocked={props.hostMode === "setup_locked"}
            roomState={props.roomState}
            players={props.players}
            teams={props.teams}
            assignedTeamByPlayerId={props.assignedTeamByPlayerId}
            teamNameByTeamId={props.teamNameByTeamId}
            nextTeamName={props.nextTeamName}
            setupMutationsDisabled={props.setupMutationsDisabled}
            autoAssignDisabled={props.autoAssignDisabled}
            assignmentDisabled={props.assignmentDisabled}
            addPlayerDisabled={props.addPlayerDisabled}
            showOverridesButton={props.showOverridesButton}
            overridesShowBadge={props.overridesShowBadge}
            onOpenOverrides={props.onOpenOverrides}
            onNextTeamNameChange={props.onNextTeamNameChange}
            onCreateTeamSubmit={props.onCreateTeamSubmit}
            onAddPlayer={props.onAddPlayer}
            onAssignPlayer={props.onAssignPlayer}
            onAutoAssignRemainingPlayers={props.onAutoAssignRemainingPlayers}
          />
        </div>
      );

    case "eating":
      return (
        <div className={styles.mainSplit}>
          <EatingStage
            roomState={props.roomState}
            players={props.players}
            assignedTeamByPlayerId={props.assignedTeamByPlayerId}
            teamNameByTeamId={props.teamNameByTeamId}
            wingParticipationByPlayerId={props.wingParticipationByPlayerId}
            activeRoundTeamId={props.activeRoundTeamId}
            activeRoundTeamName={props.activeRoundTeamName}
            participationDisabled={props.participationDisabled}
            timer={props.timer}
            showOverridesButton={props.showOverridesButton}
            overridesShowBadge={props.overridesShowBadge}
            onOpenOverrides={props.onOpenOverrides}
            onSetWingParticipation={props.onSetWingParticipation}
            onPauseTimer={props.onPauseTimer}
            onResumeTimer={props.onResumeTimer}
            onExtendTimer={props.onExtendTimer}
          />
        </div>
      );

    case "minigame_intro":
      return (
        <div className={styles.mainSplit}>
          <MinigameIntroStage
            roomState={props.roomState}
            teamNameByTeamId={props.teamNameByTeamId}
            minigameType={props.minigameType}
            minigameHostView={props.minigameHostView}
            activeRoundTeamId={props.activeRoundTeamId}
            activeRoundTeamName={props.activeRoundTeamName}
            canDispatchMinigameAction={props.canDispatchMinigameAction}
            showOverridesButton={props.showOverridesButton}
            overridesShowBadge={props.overridesShowBadge}
            onOpenOverrides={props.onOpenOverrides}
            onDispatchMinigameAction={props.onDispatchMinigameAction}
          />
        </div>
      );

    case "minigame_play":
      return (
        <div className={styles.takeoverMain}>
          <MinigamePlayTakeover
            minigameType={props.minigameType}
            minigameHostView={props.minigameHostView}
            activeRoundTeamId={props.activeRoundTeamId}
            activeRoundTeamName={props.activeRoundTeamName}
            teamNameByTeamId={props.teamNameByTeamId}
            canDispatchMinigameAction={props.canDispatchMinigameAction}
            onDispatchMinigameAction={props.onDispatchMinigameAction}
          />
        </div>
      );

    case "compact":
      if (props.roomState === null) {
        return null;
      }

      return (
        <div className={styles.mainSplit}>
          <CompactStage
            roomState={props.roomState}
            teamNameByTeamId={props.teamNameByTeamId}
            players={props.players}
            sortedStandings={props.sortedStandings}
            showOverridesButton={props.showOverridesButton}
            overridesShowBadge={props.overridesShowBadge}
            onOpenOverrides={props.onOpenOverrides}
          />
        </div>
      );

    default:
      return assertUnreachable(props.hostMode);
  }
};
