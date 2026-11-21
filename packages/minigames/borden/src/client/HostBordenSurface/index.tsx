import * as styles from "./styles.js";

// PLACEHOLDER: renders one marker and nothing else, so the client registry typechecks before the
// surfaces exist. The phone surface step (spec §0.7 step 6) replaces this file wholesale.
export const HostBordenSurface = (): JSX.Element => {
  return <div className={styles.placeholder} data-borden-placeholder="host" />;
};
