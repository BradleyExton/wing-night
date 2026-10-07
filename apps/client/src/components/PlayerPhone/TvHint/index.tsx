import * as shellStyles from "../../PortalShell/styles";
import * as styles from "./styles";

type TvHintProps = {
  text: string;
};

// A TV drawn in a line beside the sentence that points at it, so "look up"
// needs no reading: the TV is where the night happens.
export const TvHint = ({ text }: TvHintProps): JSX.Element => {
  return (
    <div className={styles.row}>
      <span className={styles.screen} aria-hidden />
      <p className={shellStyles.voice}>{text}</p>
    </div>
  );
};
