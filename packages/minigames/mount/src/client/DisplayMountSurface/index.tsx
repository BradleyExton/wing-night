import * as styles from "./styles.js";

// PLACEHOLDER: renders one marker and nothing else, so the client registry typechecks before the
// surfaces exist. The surfaces step (spec §0.2 step 6) replaces this file wholesale.
export const DisplayMountSurface = (): JSX.Element => {
  return <div className={styles.placeholder} data-mount-placeholder="display" />;
};
