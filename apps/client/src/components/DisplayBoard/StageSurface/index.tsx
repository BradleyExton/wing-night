import { Phase, type GameConfigRound, type RoomState } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import * as styles from "./styles";

type StageSurfaceProps = {
  roomState: RoomState | null;
  phaseLabel: string;
};

export const StageSurface = ({
  roomState,
  phaseLabel
}: StageSurfaceProps): JSX.Element => {
  const phase = roomState?.phase ?? null;
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const isRoundIntroPhase = phase === Phase.ROUND_INTRO;
  const isEatingPhase = phase === Phase.EATING;
  const isTriviaTurnPhase =
    phase === Phase.MINIGAME_PLAY && currentRoundConfig?.minigame === "TRIVIA";

  const activeTurnTeamId = roomState?.activeTurnTeamId ?? null;
  const currentTriviaPrompt = roomState?.currentTriviaPrompt ?? null;
  const activeTurnTeamName =
    activeTurnTeamId !== null
      ? (roomState?.teams.find((team) => team.id === activeTurnTeamId)?.name ?? null)
      : null;
  const shouldRenderTriviaTurn =
    isTriviaTurnPhase && currentTriviaPrompt !== null && activeTurnTeamName !== null;

  const eatingSeconds = roomState?.gameConfig?.timers.eatingSeconds ?? null;
  const shouldRenderEatingTimer = isEatingPhase && eatingSeconds !== null;
  const shouldRenderRoundDetails = isRoundIntroPhase && currentRoundConfig !== null;

  return (
    <article className={styles.card}>
      {shouldRenderRoundDetails && (
        <RoundIntroSurface currentRoundConfig={currentRoundConfig} />
      )}

      {shouldRenderEatingTimer && (
        <>
          <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
          <p className={styles.fallbackText}>
            {currentRoundConfig
              ? displayBoardCopy.roundSauceSummary(currentRoundConfig.sauce)
              : displayBoardCopy.roundFallbackLabel}
          </p>
          <div className={styles.timerWrap}>
            <p className={styles.timerLabel}>{displayBoardCopy.eatingTimerLabel}</p>
            <p className={styles.timerValue}>
              {displayBoardCopy.eatingTimerValue(eatingSeconds)}
            </p>
          </div>
        </>
      )}

      {shouldRenderTriviaTurn && (
        <>
          <h2 className={styles.title}>{displayBoardCopy.triviaTurnTitle}</h2>
          <p className={styles.fallbackText}>
            {displayBoardCopy.activeTeamLabel(activeTurnTeamName)}
          </p>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <p className={styles.metaLabel}>{displayBoardCopy.triviaQuestionLabel}</p>
              <p className={styles.metaValue}>{currentTriviaPrompt.question}</p>
            </div>
          </div>
        </>
      )}

      {!shouldRenderRoundDetails && !shouldRenderEatingTimer && !shouldRenderTriviaTurn && (
        <>
          <h2 className={styles.title}>{displayBoardCopy.phaseContextTitle(phaseLabel)}</h2>
          <p className={styles.fallbackText}>
            {roomState
              ? displayBoardCopy.roundFallbackLabel
              : displayBoardCopy.waitingForStateLabel}
          </p>
        </>
      )}
    </article>
  );
};

type RoundIntroSurfaceProps = {
  currentRoundConfig: GameConfigRound;
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
