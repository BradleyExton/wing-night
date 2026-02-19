import { Phase, type DisplayRoomStateSnapshot, type MinigameType } from "@wingnight/shared";

import { displayBoardCopy } from "../copy";
import * as styles from "./styles";

type MinigameTakeoverShellProps = {
  roomState: DisplayRoomStateSnapshot | null;
  phaseLabel: string;
};

const resolveMinigameType = (
  roomState: DisplayRoomStateSnapshot | null
): MinigameType | null => {
  return roomState?.minigameDisplayView?.minigame ?? roomState?.currentRoundConfig?.minigame ?? null;
};

const resolveActiveTeamName = (
  roomState: DisplayRoomStateSnapshot | null
): string | null => {
  if (roomState === null) {
    return null;
  }

  const activeTeamId =
    roomState.minigameDisplayView?.activeTurnTeamId ??
    roomState.activeRoundTeamId ??
    roomState.activeTurnTeamId;

  if (activeTeamId === null) {
    return null;
  }

  return roomState.teams.find((team) => team.id === activeTeamId)?.name ?? null;
};

export const MinigameTakeoverShell = ({
  roomState,
  phaseLabel
}: MinigameTakeoverShellProps): JSX.Element => {
  const phase = roomState?.phase ?? null;
  const isMinigamePlayPhase = phase === Phase.MINIGAME_PLAY;
  const minigameType = resolveMinigameType(roomState);
  const activeTeamName = resolveActiveTeamName(roomState);
  const currentTriviaQuestion =
    roomState?.minigameDisplayView?.minigame === "TRIVIA"
      ? (roomState.minigameDisplayView.currentPrompt?.question ?? null)
      : null;
  const fallbackMessage =
    roomState !== null
      ? displayBoardCopy.roundFallbackLabel
      : displayBoardCopy.waitingForStateLabel;

  return (
    <main
      className={styles.container}
      data-display-minigame-takeover={isMinigamePlayPhase ? "play" : "intro"}
    >
      <header className={styles.header}>
        <p className={styles.phaseBadge}>{phaseLabel}</p>
        <h1 className={styles.heading}>{displayBoardCopy.minigameSectionTitle}</h1>
        <p className={styles.subtext}>
          {minigameType !== null
            ? displayBoardCopy.minigameIntroDescription(minigameType)
            : fallbackMessage}
        </p>
      </header>

      <section className={styles.body}>
        {activeTeamName !== null && (
          <div className={styles.contextCard}>
            <p className={styles.contextLabel}>{displayBoardCopy.activeTeamLabel}</p>
            <p className={styles.contextValue}>
              {displayBoardCopy.activeTeamValue(activeTeamName)}
            </p>
          </div>
        )}

        {isMinigamePlayPhase ? (
          currentTriviaQuestion !== null ? (
            <div className={styles.questionCard}>
              <p className={styles.questionLabel}>{displayBoardCopy.triviaQuestionLabel}</p>
              <p className={styles.questionValue}>{currentTriviaQuestion}</p>
            </div>
          ) : (
            <p className={styles.fallbackText}>{fallbackMessage}</p>
          )
        ) : (
          <p className={styles.fallbackText}>
            {minigameType !== null
              ? displayBoardCopy.roundMinigameSummary(minigameType)
              : fallbackMessage}
          </p>
        )}
      </section>
    </main>
  );
};
