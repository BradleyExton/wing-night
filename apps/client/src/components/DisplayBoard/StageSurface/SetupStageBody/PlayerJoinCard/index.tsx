import { QrCode } from "@wingnight/surface";

import { playerJoinCardCopy } from "./copy";
import * as styles from "./styles";

type PlayerJoinCardProps = {
  joinUrl: string;
  claimedCount: number;
  playerCount: number;
};

// The QR the guests' phones scan to join, on the TV's SETUP screen only. The
// URL carries the join token — which only the laptop's display is ever handed
// — so a display opened anywhere else never draws one. The count is the room's
// feedback that it worked: a face tapped on a phone moves it on the TV.
export const PlayerJoinCard = ({ joinUrl, claimedCount, playerCount }: PlayerJoinCardProps): JSX.Element => {
  return (
    <aside className={styles.card} data-player-join-url={joinUrl}>
      <span className={styles.plate}>
        <QrCode value={joinUrl} quietZone={4} />
      </span>
      <span className={styles.text}>
        <span className={styles.kicker}>{playerJoinCardCopy.kicker}</span>
        <span className={styles.instruction}>{playerJoinCardCopy.instruction}</span>
        {playerCount > 0 && (
          <span className={styles.count} data-player-join-count={claimedCount}>
            {playerJoinCardCopy.formatJoinedCount(claimedCount, playerCount)}
          </span>
        )}
      </span>
    </aside>
  );
};
