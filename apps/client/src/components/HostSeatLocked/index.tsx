import { hostSeatLockedCopy } from "./copy";
import * as styles from "./styles";

// What a host page shows when the server refused it the host seat: it is not
// the laptop and holds no current host control token. One instruction and no
// button — there is nothing to press here; the fix is a scan.
export const HostSeatLocked = (): JSX.Element => {
  return (
    <main className={styles.container} data-host-seat-locked>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlowPrimary} aria-hidden />
      <div>
        <p className={styles.kicker}>{hostSeatLockedCopy.kicker}</p>
        <h1 className={styles.heading}>{hostSeatLockedCopy.title}</h1>
        <p className={styles.subtext}>{hostSeatLockedCopy.description}</p>
        <p className={styles.hint}>{hostSeatLockedCopy.hint}</p>
      </div>
    </main>
  );
};
