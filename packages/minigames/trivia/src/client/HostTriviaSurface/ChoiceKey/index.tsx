import { choiceKeyCopy } from "./copy.js";
import * as styles from "./styles.js";

type ChoiceKeyProps = {
  choices: readonly string[];
  answer: string;
  // How many of the team's phones chose each choice, once the host has locked the question.
  choiceCounts: readonly number[] | null;
};

// The host's view of a multiple-choice question's choices: lettered as on the TV and the phones,
// the answer ticked (shape and words, not colour alone), and on the reveal the count beside each.
export const ChoiceKey = ({ choices, answer, choiceCounts }: ChoiceKeyProps): JSX.Element => {
  return (
    <div className={styles.root} data-trivia-host-choices>
      <p className={styles.label}>{choiceKeyCopy.label}</p>
      <ol className={styles.list}>
        {choices.map((choice, index) => {
          const isAnswer = choice === answer;

          return (
            <li key={choice} className={isAnswer ? styles.itemAnswer : styles.item}>
              <span className={styles.letter} aria-hidden="true">
                {choiceKeyCopy.letter(index)}
              </span>
              <span className={styles.text}>{choice}</span>
              {isAnswer && (
                <span className={styles.mark} aria-hidden="true">
                  {choiceKeyCopy.answerMark}
                </span>
              )}
              {choiceCounts !== null && (
                <span className={styles.count}>{choiceKeyCopy.count(choiceCounts[index] ?? 0)}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
