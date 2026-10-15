import { appErrorBoundaryCopy, type AppCrashSurface } from "../copy";
import * as styles from "./styles";

type CrashNoticeProps = {
  surface: AppCrashSurface;
  isRecoveryReloadScheduled: boolean;
  onReload: () => void;
};

// The only thing the room sees when the app has crashed. Mirrors the
// RouteNotFound atmosphere on purpose: a dead screen that still looks like Wing
// Night reads as a hiccup, and a bare browser error reads as the night being
// over.
export const CrashNotice = ({
  surface,
  isRecoveryReloadScheduled,
  onReload
}: CrashNoticeProps): JSX.Element => {
  const copy = appErrorBoundaryCopy[surface];
  const isDisplay = surface === "DISPLAY";

  return (
    <main className={isDisplay ? styles.displayContainer : styles.controlContainer}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlowHeat} aria-hidden />
      <div>
        <p className={styles.kicker}>{copy.kicker}</p>
        <h1 className={isDisplay ? styles.displayHeading : styles.controlHeading}>
          {copy.title}
        </h1>
        <p className={isDisplay ? styles.displaySubtext : styles.controlSubtext}>
          {isRecoveryReloadScheduled
            ? copy.recoveringDescription
            : copy.manualDescription}
        </p>
        <button className={styles.reloadButton} type="button" onClick={onReload}>
          {copy.reloadButtonLabel}
        </button>
      </div>
    </main>
  );
};
