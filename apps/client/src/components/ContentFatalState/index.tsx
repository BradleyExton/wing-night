import type { RoomFatalError } from "@wingnight/shared";

import { contentFatalStateCopy } from "./copy";
import * as styles from "./styles";

type ContentFatalStateProps = {
  fatalError: RoomFatalError;
};

export const ContentFatalState = ({
  fatalError
}: ContentFatalStateProps): JSX.Element => {
  return (
    <main className={styles.container}>
      <section className={styles.panel}>
        <h1 className={styles.heading}>{contentFatalStateCopy.title}</h1>
        <p className={styles.description}>{contentFatalStateCopy.description}</p>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>{contentFatalStateCopy.codeLabel}</p>
            <p className={styles.metaValue}>{fatalError.code}</p>
          </div>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>{contentFatalStateCopy.messageLabel}</p>
            <p className={styles.metaValue}>{fatalError.message}</p>
          </div>
        </div>
      </section>
    </main>
  );
};
