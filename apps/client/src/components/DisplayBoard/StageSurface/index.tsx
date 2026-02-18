import { Phase, type GameConfigRound, type RoomState } from "@wingnight/shared";
import { useEffect, useState } from "react";

import { displayBoardCopy } from "../copy";
import * as styles from "./styles";

type StageSurfaceProps = {
  roomState: RoomState | null;
  phaseLabel: string;
};

type StageRenderMode = "round_intro" | "eating" | "minigame" | "fallback";

const assertUnreachable = (value: never): never => {
  throw new Error(`Unhandled value: ${String(value)}`);
};

const resolveStageRenderMode = (phase: Phase | null): StageRenderMode => {
  switch (phase) {
    case Phase.ROUND_INTRO:
      return "round_intro";
    case Phase.EATING:
      return "eating";
    case Phase.MINIGAME_INTRO:
    case Phase.MINIGAME_PLAY:
      return "minigame";
    case null:
    case Phase.SETUP:
    case Phase.INTRO:
    case Phase.ROUND_RESULTS:
    case Phase.FINAL_RESULTS:
      return "fallback";
    default:
      return assertUnreachable(phase);
  }
};

export const StageSurface = ({
  roomState,
  phaseLabel
}: StageSurfaceProps): JSX.Element => {
  const [nowTimestampMs, setNowTimestampMs] = useState(() => Date.now());

  const phase = roomState?.phase ?? null;
  const stageMode = resolveStageRenderMode(phase);
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const isMinigamePlayPhase = phase === Phase.MINIGAME_PLAY;
  const isTriviaTurnPhase =
    isMinigamePlayPhase && currentRoundConfig?.minigame === "TRIVIA";

  const activeRoundTeamId = roomState?.activeRoundTeamId ?? null;
  const activeTurnTeamId = roomState?.activeTurnTeamId ?? null;
  const currentTriviaPrompt = roomState?.currentTriviaPrompt ?? null;
  const activeRoundTeamName =
    activeRoundTeamId !== null
      ? (roomState?.teams.find((team) => team.id === activeRoundTeamId)?.name ?? null)
      : null;
  const activeTurnTeamName =
    activeTurnTeamId !== null
      ? (roomState?.teams.find((team) => team.id === activeTurnTeamId)?.name ?? null)
      : null;
  const activeTeamName = activeRoundTeamName ?? activeTurnTeamName;
  const shouldRenderTriviaPrompt = isTriviaTurnPhase && currentTriviaPrompt !== null;

  const eatingTimerSnapshot =
    stageMode === "eating" && roomState?.timer?.phase === Phase.EATING ? roomState.timer : null;
  const fallbackEatingSeconds = roomState?.gameConfig?.timers.eatingSeconds ?? null;
  const liveEatingRemainingSeconds =
    eatingTimerSnapshot !== null
      ? eatingTimerSnapshot.isPaused
        ? Math.max(0, Math.ceil(eatingTimerSnapshot.remainingMs / 1000))
        : Math.max(0, Math.ceil((eatingTimerSnapshot.endsAt - nowTimestampMs) / 1000))
      : fallbackEatingSeconds;

  useEffect(() => {
    if (stageMode !== "eating" || eatingTimerSnapshot === null || eatingTimerSnapshot.isPaused) {
      return;
    }

    const timerId = window.setInterval(() => {
      setNowTimestampMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, [stageMode, eatingTimerSnapshot]);
  const turnNumber =
    roomState && roomState.roundTurnCursor >= 0
      ? roomState.roundTurnCursor + 1
      : null;
  const totalTurns = roomState?.turnOrderTeamIds.length ?? 0;
  const turnProgressLabel =
    turnNumber !== null && totalTurns > 0
      ? displayBoardCopy.turnProgressLabel(turnNumber, totalTurns)
      : null;
  const shouldRenderTeamTurnContext =
    activeTeamName !== null && (stageMode === "eating" || stageMode === "minigame");

  const renderFallback = (): JSX.Element => {
    return (
      <>
        <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
        <p className={styles.fallbackText}>
          {roomState ? displayBoardCopy.roundFallbackLabel : displayBoardCopy.waitingForStateLabel}
        </p>
      </>
    );
  };

  const renderStageBody = (): JSX.Element => {
    switch (stageMode) {
      case "round_intro":
        return currentRoundConfig !== null ? (
          <RoundIntroSurface currentRoundConfig={currentRoundConfig} />
        ) : (
          renderFallback()
        );
      case "eating":
        return liveEatingRemainingSeconds !== null ? (
          <>
            <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
            <p className={styles.fallbackText}>
              {currentRoundConfig
                ? displayBoardCopy.roundSauceSummary(currentRoundConfig.sauce)
                : displayBoardCopy.roundFallbackLabel}
            </p>
            {shouldRenderTeamTurnContext && (
              <TurnMeta activeTeamName={activeTeamName} turnProgressLabel={turnProgressLabel} />
            )}
            <div className={styles.timerWrap}>
              <p className={styles.timerLabel}>{displayBoardCopy.eatingTimerLabel}</p>
              <p className={styles.timerValue}>
                {displayBoardCopy.eatingTimerValue(liveEatingRemainingSeconds)}
              </p>
            </div>
          </>
        ) : (
          renderFallback()
        );
      case "minigame":
        return (
          <>
            <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
            <p className={styles.fallbackText}>
              {currentRoundConfig
                ? displayBoardCopy.roundMinigameSummary(currentRoundConfig.minigame)
                : displayBoardCopy.roundFallbackLabel}
            </p>
            {shouldRenderTeamTurnContext && (
              <TurnMeta activeTeamName={activeTeamName} turnProgressLabel={turnProgressLabel} />
            )}
            {shouldRenderTriviaPrompt && (
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <p className={styles.metaLabel}>{displayBoardCopy.triviaQuestionLabel}</p>
                  <p className={styles.metaValue}>{currentTriviaPrompt.question}</p>
                </div>
              </div>
            )}
            {isTriviaTurnPhase && !shouldRenderTriviaPrompt && (
              <p className={styles.fallbackText}>{displayBoardCopy.triviaTurnTitle}</p>
            )}
          </>
        );
      case "fallback":
        return renderFallback();
      default:
        return assertUnreachable(stageMode);
    }
  };

  return (
    <article className={styles.card}>
      {renderStageBody()}
    </article>
  );
};

type RoundIntroSurfaceProps = {
  currentRoundConfig: GameConfigRound;
};

type TurnMetaProps = {
  activeTeamName: string;
  turnProgressLabel: string | null;
};

const RoundIntroSurface = ({ currentRoundConfig }: RoundIntroSurfaceProps): JSX.Element => {
  return (
    <>
      <h2 className={styles.title}>
        {displayBoardCopy.roundIntroTitle(
          currentRoundConfig.round,
          currentRoundConfig.label
        )}
      </h2>
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>{displayBoardCopy.sauceLabel}</p>
          <p className={styles.metaValue}>{currentRoundConfig.sauce}</p>
        </div>
        <div className={styles.metaItem}>
          <p className={styles.metaLabel}>{displayBoardCopy.minigameLabel}</p>
          <p className={styles.metaValue}>{currentRoundConfig.minigame}</p>
        </div>
      </div>
    </>
  );
};

const TurnMeta = ({ activeTeamName, turnProgressLabel }: TurnMetaProps): JSX.Element => {
  return (
    <div className={styles.turnMeta}>
      <p className={styles.turnLabel}>{displayBoardCopy.activeTeamLabel}</p>
      <p className={styles.turnValue}>{displayBoardCopy.activeTeamValue(activeTeamName)}</p>
      {turnProgressLabel !== null && (
        <>
          <p className={styles.turnLabel}>{displayBoardCopy.turnProgressTitle}</p>
          <p className={styles.turnValue}>{turnProgressLabel}</p>
        </>
      )}
    </div>
  );
};
