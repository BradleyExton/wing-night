import { Phase, type RoomState } from "@wingnight/shared";
import { useEffect, useMemo, useState } from "react";

import * as styles from "./styles";
import { displayPlaceholderCopy } from "./copy";
import { MinigameSurface } from "./MinigameSurface";

type DisplayPlaceholderProps = {
  roomState: RoomState | null;
};

export const DisplayPlaceholder = ({
  roomState
}: DisplayPlaceholderProps): JSX.Element => {
  const [nowTimestampMs, setNowTimestampMs] = useState(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowTimestampMs(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const standings = useMemo(() => {
    if (!roomState) {
      return [];
    }

    return [...roomState.teams].sort((firstTeam, secondTeam) => {
      if (firstTeam.totalScore === secondTeam.totalScore) {
        return firstTeam.name.localeCompare(secondTeam.name);
      }

      return secondTeam.totalScore - firstTeam.totalScore;
    });
  }, [roomState]);

  const phase = roomState?.phase ?? null;
  const isRoundIntroPhase = roomState?.phase === Phase.ROUND_INTRO;
  const isEatingPhase = roomState?.phase === Phase.EATING;
  const isMinigamePhase =
    roomState?.phase === Phase.MINIGAME_INTRO ||
    roomState?.phase === Phase.MINIGAME_PLAY;
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const minigameDisplayView = roomState?.minigameDisplayView ?? null;
  const activeTurnTeamId = minigameDisplayView?.activeTurnTeamId ?? null;
  const timer = roomState?.timer;
  const eatingTimerRemainingSeconds =
    timer?.phase === Phase.EATING
      ? Math.max(0, Math.ceil((timer.endsAt - nowTimestampMs) / 1000))
      : null;
  const shouldRenderEatingTimer =
    isEatingPhase && eatingTimerRemainingSeconds !== null;
  const activeTurnTeamName =
    activeTurnTeamId !== null
      ? (roomState?.teams.find((team) => team.id === activeTurnTeamId)?.name ??
        null)
      : null;
  const leadingTeamId = standings[0]?.id ?? null;

  const roundMetaLabel = roomState
    ? displayPlaceholderCopy.currentRoundLabel(
        roomState.currentRound,
        roomState.totalRounds
      )
    : displayPlaceholderCopy.waitingForStateLabel;

  const phaseLabel =
    phase === null
      ? displayPlaceholderCopy.waitingPhaseLabel
      : displayPlaceholderCopy.phaseLabel(phase);

  const shouldRenderRoundDetails = isRoundIntroPhase && currentRoundConfig !== null;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTopRow}>
          <p className={styles.roundMeta}>{roundMetaLabel}</p>
          <p className={styles.phaseBadge}>{phaseLabel}</p>
        </div>
        <h1 className={styles.heading}>{displayPlaceholderCopy.title}</h1>
        <p className={styles.subtext}>{displayPlaceholderCopy.description}</p>
      </header>

      <section className={styles.main}>
        <div className={styles.content}>
          <article className={styles.stageCard}>
            {shouldRenderRoundDetails && (
              <>
                <h2 className={styles.stageTitle}>
                  {displayPlaceholderCopy.roundIntroTitle(
                    currentRoundConfig.round,
                    currentRoundConfig.label
                  )}
                </h2>
                <div className={styles.stageMetaGrid}>
                  <div className={styles.stageMetaItem}>
                    <p className={styles.stageMetaLabel}>
                      {displayPlaceholderCopy.sauceLabel}
                    </p>
                    <p className={styles.stageMetaValue}>{currentRoundConfig.sauce}</p>
                  </div>
                  <div className={styles.stageMetaItem}>
                    <p className={styles.stageMetaLabel}>
                      {displayPlaceholderCopy.minigameLabel}
                    </p>
                    <p className={styles.stageMetaValue}>
                      {currentRoundConfig.minigame}
                    </p>
                  </div>
                </div>
              </>
            )}

            {shouldRenderEatingTimer && (
              <>
                <h2 className={styles.stageTitle}>
                  {displayPlaceholderCopy.phaseContextTitle(phaseLabel)}
                </h2>
                <p className={styles.fallbackText}>
                  {currentRoundConfig
                    ? displayPlaceholderCopy.roundSauceSummary(
                        currentRoundConfig.sauce
                      )
                    : displayPlaceholderCopy.roundFallbackLabel}
                </p>
                <div className={styles.timerWrap}>
                  <p className={styles.timerLabel}>
                    {displayPlaceholderCopy.eatingTimerLabel}
                  </p>
                  <p className={styles.timerValue}>
                    {displayPlaceholderCopy.eatingTimerValue(
                      eatingTimerRemainingSeconds
                    )}
                  </p>
                </div>
              </>
            )}

            {isMinigamePhase && phase !== null && (
              <MinigameSurface
                phase={phase}
                minigameType={currentRoundConfig?.minigame ?? null}
                minigameDisplayView={minigameDisplayView}
                activeTurnTeamName={activeTurnTeamName}
              />
            )}

            {!shouldRenderRoundDetails &&
              !shouldRenderEatingTimer &&
              !isMinigamePhase && (
              <>
                <h2 className={styles.stageTitle}>
                  {displayPlaceholderCopy.phaseContextTitle(phaseLabel)}
                </h2>
                <p className={styles.fallbackText}>
                  {roomState
                    ? displayPlaceholderCopy.roundFallbackLabel
                    : displayPlaceholderCopy.waitingForStateLabel}
                </p>
              </>
            )}
          </article>
        </div>
      </section>

      <footer className={styles.footer}>
        <h2 className={styles.footerHeading}>
          {displayPlaceholderCopy.standingsTitle}
        </h2>
        {standings.length === 0 && (
          <p className={styles.emptyStandings}>
            {displayPlaceholderCopy.standingsEmptyLabel}
          </p>
        )}
        {standings.length > 0 && (
          <ul className={styles.standingsList}>
            {standings.map((team) => {
              const isLeader = leadingTeamId !== null && team.id === leadingTeamId;
              const isFinalResultsLeader =
                phase === Phase.FINAL_RESULTS && isLeader;
              const standingCard = isFinalResultsLeader
                ? styles.winnerStandingCard
                : isLeader
                  ? styles.leadingStandingCard
                  : styles.standingCard;

              return (
                <li key={team.id} className={standingCard}>
                  <p className={styles.standingTeamName}>{team.name}</p>
                  <p className={styles.standingScore}>
                    {displayPlaceholderCopy.standingScoreLabel(team.totalScore)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </footer>
    </main>
  );
};
