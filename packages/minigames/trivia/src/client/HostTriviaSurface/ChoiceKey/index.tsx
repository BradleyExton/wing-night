import { choiceKeyCopy } from "./copy.js";
import * as styles from "./styles.js";

type ChoiceKeyProps = {
  choices: readonly string[];
  answer: string;
};

// The host's view of a multiple-choice question's choices: lettered as on the TV, so a team that
// answers "B" can be judged at a glance, and the answer ticked (shape and words, not colour alone).
export const ChoiceKey = ({ choices, answer }: ChoiceKeyProps): JSX.Element => {
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
            </li>
          );
        })}
      </ol>
    </div>
  );
};
