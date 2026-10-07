import type { ReactNode } from "react";
import type { MinigameDisplayRendererProps } from "@wingnight/minigames-core";
import type { PhoneAnswerTally } from "@wingnight/shared";
import { NeonMarquee, ResultPlaque } from "@wingnight/surface";

import { ChoiceSpread } from "./ChoiceSpread/index.js";
import { choiceSpreadCopy } from "./ChoiceSpread/copy.js";
import { ChoiceTiles } from "./ChoiceTiles/index.js";
import { displayTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

const TriviaMarquee = ({
  activeTeamName,
  attemptsRemaining,
  phoneAnswers,
  clock,
  clockLine
}: {
  activeTeamName: string | null;
  clock: ReactNode;
  clockLine: ReactNode;
  // Host-paced: the TV has no clock to run out, so the spent question budget is
  // the room's only sign that the turn is over and the last question on screen
  // is nobody's to answer.
  attemptsRemaining: number;
  // The team's phones choosing on the open question: how many are in, never which.
  phoneAnswers: PhoneAnswerTally | null;
}): JSX.Element => {
  const isTurnComplete = attemptsRemaining === 0;

  return (
    <NeonMarquee
      title={displayTriviaSurfaceCopy.title}
      teamName={activeTeamName}
      readout={
        isTurnComplete ? (
          <span className={styles.marqueeCounterComplete}>
            {displayTriviaSurfaceCopy.turnCompleteLabel}
          </span>
        ) : phoneAnswers === null ? (
          displayTriviaSurfaceCopy.questionsToGoLabel(attemptsRemaining)
        ) : (
          <span data-trivia-phone-tally={`${phoneAnswers.answeredCount}/${phoneAnswers.seatedCount}`}>
            {displayTriviaSurfaceCopy.phoneTallyLabel(
              phoneAnswers.answeredCount,
              phoneAnswers.seatedCount,
              attemptsRemaining
            )}
          </span>
        )
      }
      clock={clock}
      clockLine={clockLine}
    />
  );
};

export const DisplayTriviaSurface = ({
  phase,
  minigameDisplayView,
  activeTeamName,
  clock,
  clockLine
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

  const currentPrompt = triviaDisplayView.currentPrompt;
  const reveal = triviaDisplayView.reveal?.promptId === currentPrompt.id ? triviaDisplayView.reveal : null;

  return (
    <div className={styles.stage}>
      <TriviaMarquee
        activeTeamName={activeTeamName}
        attemptsRemaining={triviaDisplayView.attemptsRemaining}
        phoneAnswers={triviaDisplayView.phoneAnswers}
        clock={clock}
        clockLine={clockLine}
      />
      {/* The team used to be named again under the question, as "On the clock:
          MOLTEN METAL". The marquee's left cell is where the other eight
          displays say it, so the line below the rule was a second reading of
          the same fact and went with the marquee's arrival. */}
      {reveal === null ? (
        <div className={styles.container}>
          <p className={currentPrompt.choices === null ? styles.question : styles.questionWithChoices}>
            {currentPrompt.question}
          </p>
          <span className={styles.underline} aria-hidden="true" />
          {currentPrompt.choices !== null && <ChoiceTiles choices={currentPrompt.choices} />}
        </div>
      ) : (
        // The locked question's spread: the question smaller over the bars, and the verdict card.
        <div className={styles.revealContainer}>
          <p className={styles.revealQuestion}>{currentPrompt.question}</p>
          <ChoiceSpread reveal={reveal} />
          <div data-trivia-result>
            <ResultPlaque
              tone={reveal.pointsAwarded > 0 ? "hit" : "miss"}
              kicker={choiceSpreadCopy.kicker(reveal.correctCount, reveal.seatedCount)}
              title={reveal.choices[reveal.correctIndex] ?? ""}
              points={choiceSpreadCopy.pointsValue(reveal.pointsAwarded)}
              pointsCaption={choiceSpreadCopy.pointsCaption}
            />
          </div>
        </div>
      )}
    </div>
  );
};
