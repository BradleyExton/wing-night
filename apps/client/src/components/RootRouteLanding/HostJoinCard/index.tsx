import { hostJoinCardCopy } from "./copy";
import { QrCode } from "./QrCode";
import * as styles from "./styles";
import { useHostJoinUrl } from "./useHostJoinUrl";

// The way onto the host tablet: a QR code for the host page at an address the
// tablet can reach, so nobody has to find the laptop's IP and type it in. On
// the root page rather than the TV so it is in front of the host, not the room.
export const HostJoinCard = (): JSX.Element | null => {
  const hostJoinUrl = useHostJoinUrl();

  if (hostJoinUrl === null) {
    return null;
  }

  return (
    <aside className={styles.card} data-host-join-url={hostJoinUrl}>
      <span className={styles.plate}>
        <QrCode value={hostJoinUrl} />
      </span>
      <span className={styles.text}>
        <span className={styles.kicker}>{hostJoinCardCopy.kicker}</span>
        <span className={styles.instruction}>{hostJoinCardCopy.instruction}</span>
        <span className={styles.address}>{hostJoinCardCopy.formatAddress(hostJoinUrl)}</span>
      </span>
    </aside>
  );
};
