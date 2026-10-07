import { choiceTilesCopy } from "./copy.js";
import * as styles from "./styles.js";

type ChoiceTilesProps = {
  choices: readonly string[];
};

// A multiple-choice question's choices on the TV while the team's phones are choosing.
export const ChoiceTiles = ({ choices }: ChoiceTilesProps): JSX.Element => {
  return (
    <ol className={styles.root} data-trivia-choices={choices.length}>
      {choices.map((choice, index) => (
        <li key={choice} className={styles.tile}>
          <span className={styles.letter} aria-hidden="true">
            {choiceTilesCopy.letter(index)}
          </span>
          <span className={styles.text}>{choice}</span>
        </li>
      ))}
    </ol>
  );
};
