import { useMemo } from "react";
import { Phase, type RoomState } from "@wingnight/shared";

import {
  containerClassName,
  contentClassName,
  emptyStandingsClassName,
  fallbackTextClassName,
  footerClassName,
  footerHeadingClassName,
  headerClassName,
  headerTopRowClassName,
  headingClassName,
  leadingStandingCardClassName,
  mainClassName,
  phaseBadgeClassName,
  roundMetaClassName,
  stageCardClassName,
  stageMetaGridClassName,
  stageMetaItemClassName,
  stageMetaLabelClassName,
  stageMetaValueClassName,
  stageTitleClassName,
  standingCardClassName,
  standingScoreClassName,
  standingsListClassName,
  standingTeamNameClassName,
  subtextClassName,
  timerLabelClassName,
  timerValueClassName,
  timerWrapClassName,
  winnerStandingCardClassName
} from "./styles";
import { displayPlaceholderCopy } from "./copy";

type DisplayPlaceholderProps = {
  roomState: RoomState | null;
};

export const DisplayPlaceholder = ({
  roomState
}: DisplayPlaceholderProps): JSX.Element => {
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
  const currentRoundConfig = roomState?.currentRoundConfig ?? null;
  const eatingSeconds = roomState?.gameConfig?.timers.eatingSeconds ?? null;
  const shouldRenderEatingTimer = isEatingPhase && eatingSeconds !== null;
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
    <main className={containerClassName}>
      <header className={headerClassName}>
        <div className={headerTopRowClassName}>
          <p className={roundMetaClassName}>{roundMetaLabel}</p>
          <p className={phaseBadgeClassName}>{phaseLabel}</p>
        </div>
        <h1 className={headingClassName}>{displayPlaceholderCopy.title}</h1>
        <p className={subtextClassName}>{displayPlaceholderCopy.description}</p>
      </header>

      <section className={mainClassName}>
        <div className={contentClassName}>
          <article className={stageCardClassName}>
            {shouldRenderRoundDetails && (
              <>
                <h2 className={stageTitleClassName}>
                  {displayPlaceholderCopy.roundIntroTitle(
                    currentRoundConfig.round,
                    currentRoundConfig.label
                  )}
                </h2>
                <div className={stageMetaGridClassName}>
                  <div className={stageMetaItemClassName}>
                    <p className={stageMetaLabelClassName}>
                      {displayPlaceholderCopy.sauceLabel}
                    </p>
                    <p className={stageMetaValueClassName}>{currentRoundConfig.sauce}</p>
                  </div>
                  <div className={stageMetaItemClassName}>
                    <p className={stageMetaLabelClassName}>
                      {displayPlaceholderCopy.minigameLabel}
                    </p>
                    <p className={stageMetaValueClassName}>
                      {currentRoundConfig.minigame}
                    </p>
                  </div>
                </div>
              </>
            )}

            {shouldRenderEatingTimer && (
              <>
                <h2 className={stageTitleClassName}>
                  {displayPlaceholderCopy.phaseContextTitle(phaseLabel)}
                </h2>
                <p className={fallbackTextClassName}>
                  {currentRoundConfig
                    ? displayPlaceholderCopy.roundSauceSummary(
                        currentRoundConfig.sauce
                      )
                    : displayPlaceholderCopy.roundFallbackLabel}
                </p>
                <div className={timerWrapClassName}>
                  <p className={timerLabelClassName}>
                    {displayPlaceholderCopy.eatingTimerLabel}
                  </p>
                  <p className={timerValueClassName}>
                    {displayPlaceholderCopy.eatingTimerValue(eatingSeconds)}
                  </p>
                </div>
              </>
            )}

            {!shouldRenderRoundDetails && !shouldRenderEatingTimer && (
              <>
                <h2 className={stageTitleClassName}>
                  {displayPlaceholderCopy.phaseContextTitle(phaseLabel)}
                </h2>
                <p className={fallbackTextClassName}>
                  {roomState
                    ? displayPlaceholderCopy.roundFallbackLabel
                    : displayPlaceholderCopy.waitingForStateLabel}
                </p>
              </>
            )}
          </article>
        </div>
      </section>

      <footer className={footerClassName}>
        <h2 className={footerHeadingClassName}>
          {displayPlaceholderCopy.standingsTitle}
        </h2>
        {standings.length === 0 && (
          <p className={emptyStandingsClassName}>
            {displayPlaceholderCopy.standingsEmptyLabel}
          </p>
        )}
        {standings.length > 0 && (
          <ul className={standingsListClassName}>
            {standings.map((team) => {
              const isLeader = leadingTeamId !== null && team.id === leadingTeamId;
              const isFinalResultsLeader =
                phase === Phase.FINAL_RESULTS && isLeader;
              const standingClassName = isFinalResultsLeader
                ? winnerStandingCardClassName
                : isLeader
                  ? leadingStandingCardClassName
                  : standingCardClassName;

              return (
                <li key={team.id} className={standingClassName}>
                  <p className={standingTeamNameClassName}>{team.name}</p>
                  <p className={standingScoreClassName}>
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
