import type { ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";

import { displayTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const TriviaMarquee = ({
  activeTeamName,
  attemptsRemaining,
  clock
}: {
  activeTeamName: string | null;
  clock: ReactNode;
  // Host-paced: the TV has no clock to run out, so the spent question budget is
  // the room's only sign that the turn is over and the last question on screen
  // is nobody's to answer.
  attemptsRemaining: number;
}): JSX.Element => {
  const isTurnComplete = attemptsRemaining === 0;

  // A `<div>`, the way EMOJI_CHARADES's marquee is one, not the `<header>` the
  // other five reach for: `page.locator("header")` is the e2e suite's strict
  // handle on the host's mini-rail, and the dev sandbox renders the host and
  // the display previews on one page. A second `<header>` naming the same team
  // there turns `header >> text=Molten Metal` from one match into two.
  return (
    <div className={styles.marquee}>
      <span className={styles.marqueeBulbs} aria-hidden="true" />
      <h2 className={styles.marqueeTeamName}>{activeTeamName ?? ""}</h2>
      <span className={styles.marqueeTitle}>{displayTriviaSurfaceCopy.showTitle}</span>
      <div className={styles.marqueeMeta}>
        <span
          className={
            isTurnComplete ? styles.marqueeCounterComplete : styles.marqueeCounter
          }
        >
          {isTurnComplete
            ? displayTriviaSurfaceCopy.turnCompleteLabel
            : displayTriviaSurfaceCopy.questionsToGoLabel(attemptsRemaining)}
        </span>
        {clock}
      </div>
    </div>
  );
};

export const DisplayTriviaSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock
}: MinigameDisplayRendererProps): JSX.Element => {
  const triviaDisplayView =
    minigameDisplayView?.minigame === "TRIVIA" ? minigameDisplayView : null;
  const isPlayPhase = phase === "play";

  if (!isPlayPhase) {
    return (
      <div className={styles.introContainer}>
        <p className={styles.introText}>{displayTriviaSurfaceCopy.introMessage}</p>
      </div>
    );
  }

  if (triviaDisplayView === null || triviaDisplayView.currentPrompt === null) {
    return (
      <div className={styles.introContainer}>
        <p className={styles.fallbackTitle}>{displayTriviaSurfaceCopy.waitingMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <TriviaMarquee
        activeTeamName={activeTeamName}
        attemptsRemaining={triviaDisplayView.attemptsRemaining}
        clock={clock}
      />
      {/* The team used to be named again under the question, as "On the clock:
          MOLTEN METAL". The marquee's left cell is where the other eight
          displays say it, so the line below the rule was a second reading of
          the same fact and went with the marquee's arrival. */}
      <div className={styles.container}>
        <p className={styles.question}>{triviaDisplayView.currentPrompt.question}</p>
        <span className={styles.underline} aria-hidden="true" />
      </div>
    </div>
  );
};
