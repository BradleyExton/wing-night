import { useState } from "react";

import { OverrideConfirmDialog } from "../../HostControlPanel/OverrideConfirmDialog";
import { quickPlayLauncherCopy } from "../copy";
import * as styles from "./styles";

type InProgressNoticeProps = {
  onResetGame?: () => void;
};

// The launcher only starts from SETUP. A room mid-night gets the same reset
// the override dock offers, behind the same two taps.
export const InProgressNotice = ({ onResetGame }: InProgressNoticeProps): JSX.Element => {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  return (
    <section className={styles.notice} data-quick-play-in-progress>
      <h2 className={styles.title}>{quickPlayLauncherCopy.inProgressTitle}</h2>
      <p className={styles.description}>{quickPlayLauncherCopy.inProgressDescription}</p>
      <div className={styles.actions}>
        <a className={styles.hostLink} href={quickPlayLauncherCopy.hostLinkHref}>
          {quickPlayLauncherCopy.hostLinkLabel}
        </a>
        <button
          type="button"
          className={styles.resetButton}
          disabled={onResetGame === undefined || isConfirmingReset}
          onClick={(): void => {
            setIsConfirmingReset(true);
          }}
        >
          {quickPlayLauncherCopy.resetRoomButtonLabel}
        </button>
      </div>
      {isConfirmingReset && (
        <OverrideConfirmDialog
          title={quickPlayLauncherCopy.resetRoomButtonLabel}
          description={quickPlayLauncherCopy.resetRoomConfirmDescription}
          confirmButtonLabel={quickPlayLauncherCopy.resetRoomConfirmLabel}
          cancelButtonLabel={quickPlayLauncherCopy.resetRoomCancelLabel}
          onConfirm={(): void => {
            onResetGame?.();
            setIsConfirmingReset(false);
          }}
          onCancel={(): void => {
            setIsConfirmingReset(false);
          }}
        />
      )}
    </section>
  );
};
