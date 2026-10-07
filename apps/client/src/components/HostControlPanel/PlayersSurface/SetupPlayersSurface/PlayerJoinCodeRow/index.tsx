import { playerJoinCodeRowCopy } from "./copy";
import * as styles from "./styles";

type PlayerJoinCodeRowProps = {
  disabled: boolean;
  onRotate: () => void;
};

// Prints a new join code on the TV without touching any claim: new phones need
// the new code, phones already holding a face reconnect on their claim secret.
export const PlayerJoinCodeRow = ({ disabled, onRotate }: PlayerJoinCodeRowProps): JSX.Element => {
  return (
    <div className={styles.row}>
      <button type="button" className={styles.button} disabled={disabled} onClick={onRotate}>
        {playerJoinCodeRowCopy.button}
      </button>
      <span className={styles.hint}>{playerJoinCodeRowCopy.hint}</span>
    </div>
  );
};
