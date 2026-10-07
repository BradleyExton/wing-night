import type { ClimbHold } from "../../useHeldClimb/index.js";
import { beatCalloutCopy } from "./copy.js";
import * as styles from "./styles.js";

type BeatCalloutProps = {
  hold: ClimbHold;
  /** Who takes the tablet next; only read when the hold hands it on. */
  nextName: string | null;
};

const Handoff = ({ nextName, isMain }: { nextName: string | null; isMain: boolean }): JSX.Element =>
  isMain ? (
    <>
      <span className={styles.lead}>{beatCalloutCopy.handoffLead}</span>
      <p className={styles.line} data-mount-handoff-callout="display">
        {beatCalloutCopy.handoffName(nextName)}
      </p>
    </>
  ) : (
    <span className={styles.handoffAfter} data-mount-handoff-callout="display">
      <span className={styles.lead}>{beatCalloutCopy.handoffLead}</span>
      <span className={styles.handoffAfterName}>{beatCalloutCopy.handoffName(nextName)}</span>
    </span>
  );

// The words over a climb's ending on the wall (spec §0.5): *Mounted!* in gold with the points the
// climb banked, *Stuck!* with how far of the way it got, and — whenever the tablet is changing
// hands — who takes it. A skipped climb has no ending to show, only who is next.
export const BeatCallout = ({ hold, nextName }: BeatCalloutProps): JSX.Element | null => {
  const handsOn = hold.kind === "handoff";

  if (hold.outcome === "skipped") {
    return handsOn ? (
      <div className={styles.overlay} data-mount-beat-callout="skipped">
        <Handoff nextName={nextName} isMain />
      </div>
    ) : null;
  }

  const isMounted = hold.outcome === "mounted";

  return (
    <div className={styles.overlay} data-mount-beat-callout={hold.outcome}>
      <span className={styles.result}>
        <p className={isMounted ? styles.lineMounted : styles.line}>
          {isMounted ? beatCalloutCopy.mountedLine : beatCalloutCopy.stuckLine}
        </p>
        <span className={styles.points} data-mount-beat-points={hold.points}>
          {beatCalloutCopy.points(hold.points)}
        </span>
      </span>
      {!isMounted && <span className={styles.share}>{beatCalloutCopy.share(hold.share)}</span>}
      {handsOn && <Handoff nextName={nextName} isMain={false} />}
    </div>
  );
};
