import { useEffect, useId, useMemo, useState } from "react";
import { Phase, type RoomState } from "@wingnight/shared";

import { ContentFatalState } from "../ContentFatalState";
import { HostActionBarSurface } from "./HostActionBarSurface";
import { HostTakeoverDock } from "./HostTakeoverDock";
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
import { useGameStartHandoff } from "./useGameStartHandoff";
import { useHostWakeLock } from "./useHostWakeLock";
import * as styles from "./styles";

const EMPTY_TEAMS: RoomState["teams"] = [];

export const HostControlPanel = (): JSX.Element => {
  useHostWakeLock();
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
  // Only MINIGAME_PLAY hands the tablet over; MINIGAME_INTRO is still the host
  // briefing the room, so it keeps the full-bleed CTA bar.
  const isPlayerHeld = hostMode === "minigame_play";
  // INTRO's primary action is Start Game, which arms the room's count-in
  // instead of advancing: the phase waits for the lock screen to finish
  // counting so the first team's briefing and anthem open together.
  const gameStartCountdownSeconds = useGameStartHandoff({
    phase,
    gameStartCountdownEndsAt: roomState?.gameStartCountdownEndsAt ?? null,
    onStartGame: handlers.onStartGame
  });
  const isCountingInGameStart = gameStartCountdownSeconds !== null;
  const primaryAction =
    phase === Phase.INTRO ? handlers.onStartGame : handlers.onNextPhase;
  const nextPhaseDisabled =
    primaryAction === undefined ||
    roomState?.canAdvancePhase !== true ||
    isCountingInGameStart;
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
    gameStartCountdownSeconds !== null
      ? hostControlPanelCopy.startGameCountingInLabel(gameStartCountdownSeconds)
      : phase === null
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

  return (
    <main className={containerClassName}>
      <HostOverridesUiProvider value={overridesUi}>
        <HostPhaseBody />
      </HostOverridesUiProvider>

      {/* During the minigame takeover the tablet is in the players' hands, so
          the full-bleed CTA bar collapses to a discreet corner dock and the
          whole canvas goes to the minigame (DESIGN.md §2.0A). */}
      {isPlayerHeld ? (
        <HostTakeoverDock
          primaryActionLabel={primaryButtonLabel}
          primaryActionDisabled={nextPhaseDisabled}
          onPrimaryAction={primaryAction}
          showOverridesAction={overrideDockContext.isVisible}
          overridesNeedAttention={overrideDockContext.showBadge}
          onOpenOverrides={(): void => {
            setIsOverrideDockOpen(true);
          }}
        />
      ) : (
        <HostActionBarSurface
          onNextPhase={primaryAction}
          nextPhaseDisabled={nextPhaseDisabled}
          primaryButtonLabel={primaryButtonLabel}
        />
      )}

      {overrideDockContext.isVisible && (
        <OverrideDock
          isOpen={isOverrideDockOpen}
          showBadge={overrideDockContext.showBadge}
          showTrigger={false}
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
