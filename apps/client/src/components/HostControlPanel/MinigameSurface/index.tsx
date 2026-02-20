import { type MinigameHostView, type MinigameType } from "@wingnight/shared";

import { resolveMinigameRendererBundle } from "../../Minigames/registry";
import type { MinigameSurfacePhase } from "../../Minigames/types";
import { hostControlPanelCopy } from "../copy";
import * as styles from "./styles";

type MinigameSurfaceProps = {
  phase: MinigameSurfacePhase;
  minigameType: MinigameType | null;
  minigameHostView: MinigameHostView | null;
  activeTeamName: string | null;
  teamNameByTeamId: Map<string, string>;
  triviaAttemptDisabled: boolean;
  onRecordTriviaAttempt: (isCorrect: boolean) => void;
};

export const MinigameSurface = ({
  phase,
  minigameType,
  minigameHostView,
  activeTeamName,
  teamNameByTeamId,
  triviaAttemptDisabled,
  onRecordTriviaAttempt
}: MinigameSurfaceProps): JSX.Element => {
  if (minigameType === null) {
    return (
      <section className={styles.shellCard}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.waitingStateLabel}
        </p>
      </section>
    );
  }

  const minigameRendererBundle = resolveMinigameRendererBundle(minigameType);

  if (minigameRendererBundle === null) {
    return (
      <section className={styles.shellCard}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.minigameRendererUnavailableLabel(minigameType)}
        </p>
      </section>
    );
  }

  if (phase === "play" && minigameType === "TRIVIA" && minigameHostView === null) {
    return (
      <section className={styles.shellCard}>
        <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
        <p className={styles.sectionDescription}>
          {hostControlPanelCopy.minigameWaitingForViewLabel}
        </p>
      </section>
    );
  }

  return (
    <section className={styles.shellCard}>
      <h2 className={styles.sectionHeading}>{hostControlPanelCopy.minigameSectionTitle}</h2>
      <p className={styles.sectionDescription}>
        {phase === "intro"
          ? hostControlPanelCopy.minigameIntroDescription(minigameType)
          : hostControlPanelCopy.minigamePlayDescription(minigameType)}
      </p>
      <div className={styles.shellBody}>
        <minigameRendererBundle.HostSurface
          phase={phase}
          minigameType={minigameType}
          minigameHostView={minigameHostView}
          activeTeamName={activeTeamName}
          teamNameByTeamId={teamNameByTeamId}
          triviaAttemptDisabled={triviaAttemptDisabled}
          onRecordTriviaAttempt={onRecordTriviaAttempt}
        />
      </div>
    </section>
  );
};
