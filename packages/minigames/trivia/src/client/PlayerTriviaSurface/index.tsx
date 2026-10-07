import type { MinigamePlayerRendererProps } from "@wingnight/minigames-core";
import type { TriviaMinigamePlayerView } from "@wingnight/shared";

import { playerTriviaSurfaceCopy } from "./copy.js";
import * as styles from "./styles.js";

// The question and its choices, one column, the phone's own pick lit. Tapping another moves it.
const OpenCard = ({
  view,
  choices,
  onChoose
}: {
  view: TriviaMinigamePlayerView;
  choices: string[];
  onChoose: (choiceIndex: number) => void;
}): JSX.Element => (
  <section
    className={styles.cardHot}
    data-phone-answer="TRIVIA"
    data-phone-answer-status="open"
    data-phone-answer-choice={view.choiceIndex ?? "none"}
  >
    <p className={styles.eyebrow}>{playerTriviaSurfaceCopy.eyebrow}</p>
    <p className={styles.question}>{view.question}</p>
    <div className={styles.choices}>
      {choices.map((choice, index) => {
        const isOn = view.choiceIndex === index;

        return (
          <button
            key={choice}
            type="button"
            className={isOn ? styles.choiceOn : styles.choice}
            aria-pressed={isOn}
            data-phone-answer-option={index}
            onClick={(): void => {
              onChoose(index);
            }}
          >
            <span className={isOn ? styles.letterOn : styles.letter} aria-hidden="true">
              {playerTriviaSurfaceCopy.letter(index)}
            </span>
            {choice}
          </button>
        );
      })}
    </div>
    <p className={styles.voice}>{playerTriviaSurfaceCopy.openVoice(view.choiceIndex !== null)}</p>
  </section>
);

// Locked: the phone's own pick and, once the host reveals it, whether it was the answer.
const LockedCard = ({ view, choices }: { view: TriviaMinigamePlayerView; choices: string[] }): JSX.Element => {
  const pick = view.choiceIndex === null ? null : (choices[view.choiceIndex] ?? null);

  return (
    <section
      className={view.isCorrect === true ? styles.cardHot : styles.card}
      data-phone-answer="TRIVIA"
      data-phone-answer-status="locked"
      data-phone-answer-result={view.isCorrect === null ? "none" : view.isCorrect ? "right" : "wrong"}
    >
      <p className={styles.eyebrow}>{playerTriviaSurfaceCopy.lockedEyebrow}</p>
      {view.isCorrect !== null && (
        <p className={view.isCorrect ? styles.stampWon : styles.stampLost}>
          {view.isCorrect ? playerTriviaSurfaceCopy.wonStamp : playerTriviaSurfaceCopy.lostStamp}
        </p>
      )}
      <p className={styles.bigTitle}>
        {pick ?? (view.isCorrect === null ? playerTriviaSurfaceCopy.lockedTitle : playerTriviaSurfaceCopy.noAnswerTitle)}
      </p>
      {pick === null && <p className={styles.voice}>{playerTriviaSurfaceCopy.noAnswerVoice}</p>}
      <p className={styles.voice}>{playerTriviaSurfaceCopy.watchTheTv}</p>
    </section>
  );
};

// A playing-team phone answering a TRIVIA question: ONE choice on screen at a time, changeable
// until the host locks it; then the phone's own verdict and a pointer at the TV, where the spread
// is. A question the pack wrote without choices is judged aloud, and the phone only says so.
export const PlayerTriviaSurface = ({ minigamePlayerView, onDispatchAction }: MinigamePlayerRendererProps): JSX.Element => {
  if (minigamePlayerView.minigame !== "TRIVIA") {
    return <></>;
  }

  const view = minigamePlayerView;

  if (view.choices === null) {
    return (
      <section className={styles.card} data-phone-answer="TRIVIA" data-phone-answer-status="spoken">
        <p className={styles.eyebrow}>{playerTriviaSurfaceCopy.spokenEyebrow}</p>
        <p className={styles.question}>{view.question}</p>
        <p className={styles.bigTitle}>{playerTriviaSurfaceCopy.spokenTitle}</p>
        <p className={styles.voice}>{playerTriviaSurfaceCopy.spokenVoice}</p>
      </section>
    );
  }

  if (view.status === "locked") {
    return <LockedCard view={view} choices={view.choices} />;
  }

  return (
    <OpenCard
      view={view}
      choices={view.choices}
      onChoose={(choiceIndex): void => {
        onDispatchAction("chooseAnswer", { choiceIndex });
      }}
    />
  );
};
