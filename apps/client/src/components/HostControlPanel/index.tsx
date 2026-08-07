import { useEffect, useId, useMemo, useState } from "react";
import { type RoomState } from "@wingnight/shared";

import { ContentFatalState } from "../ContentFatalState";
import {
  ConfigSetupPrototypeLab,
  resolveConfigSetupPrototypeVariant
} from "./ConfigSetupPrototype";
import { HostActionBarSurface } from "./HostActionBarSurface";
import { OverrideActionsSurface } from "./OverrideActionsSurface";
import { OverrideDock } from "./OverrideDock";
import { hostControlPanelCopy } from "./copy";
import { HostPhaseBody } from "./HostPhaseBody";
import { resolveHostRenderMode } from "./resolveHostRenderMode";
import { resolveOrderedTeams } from "./roomTeamSelectors";
import { ScoreOverrideSurface } from "./ScoreOverrideSurface";
import { selectOverrideDockContext } from "./selectOverrideDockContext";
import { TurnOrderSurface } from "./TurnOrderSurface";
import { useHostHandlers } from "../../context/HostHandlersContext";
import { HostOverridesUiProvider } from "../../context/HostOverridesUiContext";
import type { HostOverridesUi } from "../../context/HostOverridesUiContext";
import { useHostRoomState } from "../../context/RoomStateContext";
import { useHostWakeLock } from "./useHostWakeLock";
import * as styles from "./styles";

const EMPTY_TEAMS: RoomState["teams"] = [];

export const HostControlPanel = (): JSX.Element => {
  useHostWakeLock();
  // This panel also renders without a DOM (the unit tests render it to a string), where
  // neither `window` nor Vite's `import.meta.env` exists — so the lab is only consulted in
  // a browser. Goes away with the lab itself in WN-11.
  const configSetupPrototypeVariant =
    typeof window === "undefined"
      ? null
      : resolveConfigSetupPrototypeVariant(window.location.search);
  const roomState = useHostRoomState();
  const handlers = useHostHandlers();
  const [isOverrideDockOpen, setIsOverrideDockOpen] = useState(false);
  const overrideDockPanelId = useId();
  const teams = roomState?.teams ?? EMPTY_TEAMS;
  const phase = roomState?.phase ?? null;
  const fatalError = roomState?.fatalError ?? null;
  const hostMode = resolveHostRenderMode(phase);
  const isMinigameTakeover =
    hostMode === "minigame_intro" || hostMode === "minigame_play";
  const nextPhaseDisabled =
    handlers.onNextPhase === undefined || roomState?.canAdvancePhase !== true;
  const orderedTeams = useMemo(() => resolveOrderedTeams(roomState), [roomState]);
  const overrideDockContext = useMemo(() => {
    return selectOverrideDockContext(roomState);
  }, [roomState]);
  const hasNextRoundTurn =
    roomState !== null &&
    roomState.roundTurnCursor + 1 < roomState.turnOrderTeamIds.length;
  const hasAdditionalRounds =
    roomState !== null && roomState.currentRound < roomState.totalRounds;
  const primaryButtonLabel =
    phase === null
      ? hostControlPanelCopy.nextPhaseButtonLabel
      : hostControlPanelCopy.primaryActionLabel(phase, {
          hasNextRoundTurn,
          hasAdditionalRounds
        });
  const containerClassName = isMinigameTakeover
    ? styles.takeoverContainer
    : styles.container;
  useEffect(() => {
    if (!overrideDockContext.isVisible && isOverrideDockOpen) {
      setIsOverrideDockOpen(false);
    }
  }, [isOverrideDockOpen, overrideDockContext.isVisible]);
  const overridesUi = useMemo<HostOverridesUi>(() => {
    return {
      showOverridesButton: overrideDockContext.isVisible,
      overridesShowBadge: overrideDockContext.showBadge,
      onOpenOverrides: (): void => {
        setIsOverrideDockOpen(true);
      }
    };
  }, [overrideDockContext.isVisible, overrideDockContext.showBadge]);
  if (fatalError !== null) {
    return <ContentFatalState fatalError={fatalError} />;
  }

  // PROTOTYPE gate (throwaway, dev-only): /host?variant=A|B|C renders the
  // config-setup lab instead of the phase body. Delete with ConfigSetupPrototype/.
  if (configSetupPrototypeVariant !== null) {
    return <ConfigSetupPrototypeLab variant={configSetupPrototypeVariant} />;
  }

  return (
    <main className={containerClassName}>
      <HostOverridesUiProvider value={overridesUi}>
        <HostPhaseBody />
      </HostOverridesUiProvider>

      <HostActionBarSurface
        onNextPhase={handlers.onNextPhase}
        nextPhaseDisabled={nextPhaseDisabled}
        primaryButtonLabel={primaryButtonLabel}
      />

      {overrideDockContext.isVisible && (
        <OverrideDock
          isOpen={isOverrideDockOpen}
          showBadge={overrideDockContext.showBadge}
          showTrigger={hostMode === "minigame_play"}
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
              onSkipTurnBoundary={handlers.onSkipTurnBoundary}
              showSkipTurnBoundaryAction={overrideDockContext.showSkipTurnBoundaryAction}
              onRedoLastMutation={handlers.onRedoLastMutation}
              showRedoLastMutationAction={overrideDockContext.showRedoLastMutationAction}
              onResetGame={handlers.onResetGame}
              showResetGameAction={overrideDockContext.showResetGameAction}
            />
            <TurnOrderSurface
              orderedTeams={orderedTeams}
              isEditable={overrideDockContext.isTurnOrderEditable}
              onReorderTurnOrder={handlers.onReorderTurnOrder}
            />
            <ScoreOverrideSurface
              teams={teams}
              onAdjustTeamScore={handlers.onAdjustTeamScore}
            />
          </div>
        </OverrideDock>
      )}
    </main>
  );
};
