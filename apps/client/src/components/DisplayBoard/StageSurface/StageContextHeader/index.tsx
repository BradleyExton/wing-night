import { commonCopy } from "../../../../copy/common";
import * as styles from "./styles";

export const StageContextHeader = (): JSX.Element => {
  return (
    <div className={styles.root}>
      <div className={styles.brandCluster}>
        <img
          className={styles.brandMark}
          src={commonCopy.brandMarkPath}
          alt={commonCopy.brandMarkAlt}
        />
        <p className={styles.brandLabel}>{commonCopy.brandLabel}</p>
      </div>
    </div>
  );
};
