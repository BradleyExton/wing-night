import type { TriviaChoiceReveal } from "@wingnight/shared";

import { choiceSpreadCopy } from "./copy.js";
import * as styles from "./styles.js";

type ChoiceSpreadProps = {
  reveal: TriviaChoiceReveal;
};

// How the team's phones split across a locked question's choices: one bar per choice, one pip in
// it per seated phone, lit for each phone that chose it — so a bar reads as "2 of the 3 phones"
// at TV distance — with the count at its end. Counts only: never who chose what.
export const ChoiceSpread = ({ reveal }: ChoiceSpreadProps): JSX.Element => {
  const pipCount = Math.max(1, reveal.seatedCount);

  return (
    <ol className={styles.root} data-trivia-spread={reveal.promptId}>
      {reveal.choices.map((choice, index) => {
        const count = reveal.choiceCounts[index] ?? 0;
        const isAnswer = index === reveal.correctIndex;

        return (
          <li
            key={choice}
            className={styles.row}
            data-trivia-spread-choice={index}
            data-trivia-spread-count={count}
            data-trivia-spread-answer={isAnswer}
          >
            <span className={styles.name}>
              <span className={styles.letter}>{choiceSpreadCopy.letter(index)}</span>
              <span>{choice}</span>
              {isAnswer && <span className={styles.answerTag}>{choiceSpreadCopy.answerTag}</span>}
            </span>
            <span className={styles.track} aria-hidden="true">
              {Array.from({ length: pipCount }, (_, pipIndex) => (
                <span
                  key={pipIndex}
                  className={pipIndex < count ? (isAnswer ? styles.pipAnswer : styles.pipLit) : styles.pip}
                />
              ))}
            </span>
            <span className={styles.count}>{choiceSpreadCopy.count(count)}</span>
          </li>
        );
      })}
    </ol>
  );
};
